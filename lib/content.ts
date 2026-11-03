import { getPayload, type Where } from 'payload'
import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import config from '@payload-config'
import type { Event as EventDoc, Member, Post as PostDoc, Project as ProjectDoc } from '@/payload-types'
import type { Post, CoffeeEvent, Project, Value, Stat, ProjectCard, ProjectPage, TeamMember, ParticipantData } from '@/lib/types'
import { countRegistrations, memberEventIds, todayIso } from '@/lib/services/events'

const payload = () => getPayload({ config })

const ES_MONTHS_SHORT = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
const ES_MONTHS_UP    = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC']

// Payload guarda fechas como timestamp ISO; solo nos interesa YYYY-MM-DD.
const toIsoDay = (date: string | null | undefined) => (date ? date.slice(0, 10) : '')

function isoToSpanish(iso: string): string {
  const [, m, d] = iso.split('-')
  const mo = ES_MONTHS_SHORT[parseInt(m, 10) - 1]
  return `${parseInt(d, 10)} ${mo} ${iso.split('-')[0]}`
}

function richTextToHtml(data: unknown): string {
  if (!data) return ''
  return convertLexicalToHTML({ data: data as SerializedEditorState, disableContainer: true })
}

function docToPost(doc: PostDoc): Post {
  const iso = toIsoDay(doc.date)
  return {
    slug:    doc.slug,
    title:   doc.title,
    author:  doc.author ?? '',
    date:    iso ? isoToSpanish(iso) : '',
    cat:     doc.cat,
    read:    doc.read ?? '',
    excerpt: doc.excerpt ?? '',
    feat:    doc.feat ?? false,
  }
}

export async function getPosts(): Promise<Post[]> {
  const { docs } = await (await payload()).find({ collection: 'posts', limit: 0, sort: '-date', depth: 0 })
  return docs.map(docToPost)
}

export async function getPost(slug: string): Promise<(Post & { contentHtml: string }) | null> {
  const { docs } = await (await payload()).find({ collection: 'posts', where: { slug: { equals: slug } }, limit: 1, depth: 1 })
  const doc = docs[0]
  if (!doc) return null
  return { ...docToPost(doc), contentHtml: richTextToHtml(doc.content) }
}

function docToEvent(doc: EventDoc, taken: number, registered: boolean): CoffeeEvent {
  const iso = toIsoDay(doc.date)
  const [, m, d] = iso.split('-')
  return {
    id:    doc.id,
    slug:  doc.slug,
    name:  doc.name,
    d:     iso ? String(parseInt(d, 10)) : '',
    mo:    iso ? ES_MONTHS_UP[parseInt(m, 10) - 1] : '',
    type:  doc.type,
    city:  doc.city ?? '',
    place: doc.place ?? '',
    cap:   doc.cap ?? 0,
    taken,
    registered,
    tag:   doc.tag ?? '',
    desc:  doc.desc ?? '',
  }
}

// Por defecto, eventos de hoy en adelante (o sin fecha). `viewer`: para marcar en cuáles está inscrito.
export async function getEvents(viewer: Member | null = null, where?: Where, viewerEventIds?: Set<string>): Promise<CoffeeEvent[]> {
  const p = await payload()
  const upcoming: Where = { or: [{ date: { greater_than_equal: `${todayIso()}T00:00:00.000Z` } }, { date: { exists: false } }] }
  const { docs } = await p.find({ collection: 'events', where: where ?? upcoming, limit: 0, sort: 'date', depth: 0 })
  const counts = await countRegistrations(p, docs.map((d) => d.id))
  const mine = viewerEventIds ?? (viewer ? await memberEventIds(p, viewer.id) : new Set<string>())
  return docs.map((doc) => docToEvent(doc, counts.get(String(doc.id)) ?? 0, mine.has(String(doc.id))))
}

export async function getEvent(slug: string, viewer: Member | null = null): Promise<(CoffeeEvent & { contentHtml: string }) | null> {
  const p = await payload()
  const { docs } = await p.find({ collection: 'events', where: { slug: { equals: slug } }, limit: 1, depth: 1 })
  const doc = docs[0]
  if (!doc) return null
  const taken = (await countRegistrations(p, [doc.id])).get(String(doc.id)) ?? 0
  const registered = viewer ? (await memberEventIds(p, viewer.id)).has(String(doc.id)) : false
  return { ...docToEvent(doc, taken, registered), contentHtml: richTextToHtml(doc.content) }
}

// Ranking: proyectos que los organizadores marcan como destacados.
export async function getProjects(): Promise<Project[]> {
  const { docs } = await (await payload()).find({
    collection: 'projects',
    where: { featured: { equals: true } },
    limit: 0,
    sort: 'rank',
    depth: 1,
  })
  return docs.map((doc) => {
    const owner = typeof doc.owner === 'object' ? doc.owner : null
    return {
      name:    doc.name,
      rank:    doc.rank ?? 0,
      cat:     doc.category ?? '',
      builder: owner?.username ? `@${owner.username}` : owner?.name ?? '',
      loc:     doc.city ?? '',
      metric:  doc.metric ?? '',
      metricL: doc.metricLabel ?? '',
      delta:   doc.delta ?? '',
      tags:    doc.stack ?? [],
      blurb:   doc.tagline ?? '',
      funding: doc.funding ?? '',
      year:    doc.year ?? '',
    }
  })
}

// Equipo de varios proyectos de una vez: dueño primero, luego por antigüedad.
async function teamsFor(projectIds: (number | string)[]): Promise<Map<string, TeamMember[]>> {
  const teams = new Map<string, TeamMember[]>(projectIds.map((id) => [String(id), []]))
  if (!projectIds.length) return teams
  const { docs } = await (await payload()).find({
    collection: 'project-members',
    where: { project: { in: projectIds } },
    sort: 'createdAt',
    limit: 0,
    depth: 1,
  })
  for (const row of docs) {
    const m = typeof row.member === 'object' ? row.member : null
    const projectId = String(typeof row.project === 'object' ? row.project.id : row.project)
    teams.get(projectId)?.push({
      memberId: m?.id ?? (row.member as number),
      username: m?.username ?? null,
      name: m?.name ?? null,
      avatar: m?.avatar ?? null,
      role: row.role,
      title: row.title ?? null,
    })
  }
  for (const team of teams.values()) team.sort((a, b) => Number(b.role === 'owner') - Number(a.role === 'owner'))
  return teams
}

function docToCard(doc: ProjectDoc, team: TeamMember[]): ProjectCard {
  return {
    id:         doc.id,
    slug:       doc.slug,
    name:       doc.name,
    tagline:    doc.tagline ?? '',
    city:       doc.city ?? '',
    status:     doc.status,
    stack:      doc.stack ?? [],
    lookingFor: doc.lookingFor ?? [],
    team,
  }
}

export async function getProjectDirectory(): Promise<ProjectCard[]> {
  const { docs } = await (await payload()).find({ collection: 'projects', limit: 0, sort: '-createdAt', depth: 0 })
  const teams = await teamsFor(docs.map((d) => d.id))
  return docs.map((doc) => docToCard(doc, teams.get(String(doc.id)) ?? []))
}

// `viewer`: el miembro de la sesión (o null), para saber si es dueño o integrante.
export async function getProjectPage(slug: string, viewer: Member | null): Promise<ProjectPage | null> {
  const { docs } = await (await payload()).find({ collection: 'projects', where: { slug: { equals: slug } }, limit: 1, depth: 0 })
  const doc = docs[0]
  if (!doc) return null
  const team = (await teamsFor([doc.id])).get(String(doc.id)) ?? []
  const ownerId = typeof doc.owner === 'object' ? doc.owner.id : doc.owner
  return {
    ...docToCard(doc, team),
    description: doc.description ?? '',
    category:    doc.category ?? '',
    links:       doc.links ?? [],
    isOwner:     !!viewer && String(viewer.id) === String(ownerId),
    isMember:    !!viewer && team.some((m) => String(m.memberId) === String(viewer.id)),
  }
}

// Lo que ve un miembro en /participante.
export async function getParticipantData(member: Member): Promise<ParticipantData> {
  const p = await payload()
  const memberships = await p.find({ collection: 'project-members', where: { member: { equals: member.id } }, limit: 0, depth: 0 })
  const projectIds = memberships.docs.map((m) => (typeof m.project === 'object' ? m.project.id : m.project))
  const projectDocs = projectIds.length
    ? (await p.find({ collection: 'projects', where: { id: { in: projectIds } }, limit: 0, sort: '-createdAt', depth: 0 })).docs
    : []
  const teams = await teamsFor(projectDocs.map((d) => d.id))

  const invites = await p.find({
    collection: 'project-invites',
    where: { member: { equals: member.id }, status: { equals: 'pending' } },
    limit: 50,
    depth: 1,
    overrideAccess: true,
  })

  const registered = await memberEventIds(p, member.id)
  const eventIds = [...registered]
  return {
    projects: projectDocs.map((doc) => docToCard(doc, teams.get(String(doc.id)) ?? [])),
    invites: invites.docs.map((invite) => {
      const project = invite.project as ProjectDoc
      const by = typeof invite.invitedBy === 'object' ? invite.invitedBy : null
      return {
        id: invite.id,
        project: { name: project.name, slug: project.slug, tagline: project.tagline ?? '' },
        invitedBy: by?.username ? `@${by.username}` : by?.name ?? '',
      }
    }),
    events: eventIds.length ? await getEvents(member, { id: { in: eventIds } }, registered) : [],
  }
}

export async function getSiteData(): Promise<{ values: Value[]; stats: Stat[] }> {
  const site = await (await payload()).findGlobal({ slug: 'site', depth: 0 })
  return {
    values: (site.values ?? []).map((v) => ({ k: v.k ?? '', v: v.v ?? '' })),
    stats:  (site.stats  ?? []).map((s) => ({ n: s.n ?? '', l: s.l ?? '', src: s.src ?? '' })),
  }
}
