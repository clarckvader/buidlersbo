import { getPayload } from 'payload'
import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import config from '@payload-config'
import type { Event as EventDoc, Post as PostDoc, Team as TeamDoc } from '@/payload-types'
import type { Post, CoffeeEvent, Team, Project, Value, Stat } from '@/lib/types'
import { countRegistrations } from '@/lib/services/events'

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

function docToEvent(doc: EventDoc, taken: number): CoffeeEvent {
  const iso = toIsoDay(doc.date)
  const [, m, d] = iso.split('-')
  return {
    slug:  doc.slug,
    name:  doc.name,
    d:     iso ? String(parseInt(d, 10)) : '',
    mo:    iso ? ES_MONTHS_UP[parseInt(m, 10) - 1] : '',
    type:  doc.type,
    city:  doc.city ?? '',
    place: doc.place ?? '',
    cap:   doc.cap ?? 0,
    taken,
    tag:   doc.tag ?? '',
    desc:  doc.desc ?? '',
  }
}

export async function getEvents(): Promise<CoffeeEvent[]> {
  const p = await payload()
  const { docs } = await p.find({ collection: 'events', limit: 0, sort: 'date', depth: 0 })
  const counts = await countRegistrations(p, docs.map((d) => d.id))
  return docs.map((doc) => docToEvent(doc, counts.get(String(doc.id)) ?? 0))
}

export async function getEvent(slug: string): Promise<(CoffeeEvent & { contentHtml: string }) | null> {
  const p = await payload()
  const { docs } = await p.find({ collection: 'events', where: { slug: { equals: slug } }, limit: 1, depth: 1 })
  const doc = docs[0]
  if (!doc) return null
  const taken = (await countRegistrations(p, [doc.id])).get(String(doc.id)) ?? 0
  return { ...docToEvent(doc, taken), contentHtml: richTextToHtml(doc.content) }
}

function docToTeam(doc: TeamDoc): Team {
  return {
    slug:    doc.slug,
    name:    doc.name,
    focus:   doc.focus ?? '',
    city:    doc.city ?? '',
    members: doc.members ?? 0,
    open:    doc.open ?? 0,
    stack:   (doc.stack ?? []).map((s) => s.value).filter(Boolean),
    lead:    doc.lead ?? '',
  }
}

export async function getTeams(): Promise<Team[]> {
  const { docs } = await (await payload()).find({ collection: 'teams', limit: 0, sort: 'createdAt', depth: 0 })
  return docs.map(docToTeam)
}

export async function getTeam(slug: string): Promise<Team | null> {
  const { docs } = await (await payload()).find({ collection: 'teams', where: { slug: { equals: slug } }, limit: 1, depth: 0 })
  const doc = docs[0]
  if (!doc) return null
  return docToTeam(doc)
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

export async function getSiteData(): Promise<{ values: Value[]; stats: Stat[] }> {
  const site = await (await payload()).findGlobal({ slug: 'site', depth: 0 })
  return {
    values: (site.values ?? []).map((v) => ({ k: v.k ?? '', v: v.v ?? '' })),
    stats:  (site.stats  ?? []).map((s) => ({ n: s.n ?? '', l: s.l ?? '', src: s.src ?? '' })),
  }
}
