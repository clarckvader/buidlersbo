import { createReader } from '@keystatic/core/reader'
import Markdoc from '@markdoc/markdoc'
import keystaticConfig from '@/keystatic.config'
import type { Post, CoffeeEvent, Team, Project, Value, Stat } from '@/lib/types'

const reader = createReader(process.cwd(), keystaticConfig)

const ES_MONTHS_SHORT = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
const ES_MONTHS_UP    = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC']

function isoToSpanish(iso: string): string {
  const [, m, d] = iso.split('-')
  const mo = ES_MONTHS_SHORT[parseInt(m, 10) - 1]
  return `${parseInt(d, 10)} ${mo} ${iso.split('-')[0]}`
}

export async function getPosts(): Promise<Post[]> {
  const entries = await reader.collections.posts.all()
  return entries.map(({ entry }) => ({
    title:   entry.title,
    author:  entry.author ?? '',
    date:    entry.date ? isoToSpanish(entry.date) : '',
    cat:     entry.cat,
    read:    entry.read,
    excerpt: entry.excerpt ?? '',
    feat:    entry.feat ?? false,
  }))
}

export async function getPost(slug: string): Promise<(Post & { slug: string; contentHtml: string }) | null> {
  const entry = await reader.collections.posts.read(slug)
  if (!entry) return null
  const { node } = await entry.content()
  const contentHtml = Markdoc.renderers.html(Markdoc.transform(node))
  return {
    slug,
    title:       entry.title,
    author:      entry.author ?? '',
    date:        entry.date ? isoToSpanish(entry.date) : '',
    cat:         entry.cat,
    read:        entry.read,
    excerpt:     entry.excerpt ?? '',
    feat:        entry.feat ?? false,
    contentHtml,
  }
}

export async function getPostSlugs(): Promise<string[]> {
  const entries = await reader.collections.posts.all()
  return entries.map((e) => e.slug)
}

function entryToEvent(entry: { date: string | null; name: string; type: 'Meetup' | 'Hackathon' | 'Taller' | 'Conferencia'; city: string | null; place: string | null; cap: number | null; taken: number | null; tag: string | null; desc: string | null }): CoffeeEvent & { _iso: string } {
  const iso = entry.date ?? ''
  const [, m, d] = iso.split('-')
  return {
    _iso:  iso,
    name:  entry.name,
    d:     iso ? String(parseInt(d, 10)) : '',
    mo:    iso ? ES_MONTHS_UP[parseInt(m, 10) - 1] : '',
    type:  entry.type,
    city:  entry.city ?? '',
    place: entry.place ?? '',
    cap:   entry.cap ?? 0,
    taken: entry.taken ?? 0,
    tag:   entry.tag ?? '',
    desc:  entry.desc ?? '',
  }
}

export async function getEvents(): Promise<CoffeeEvent[]> {
  const entries = await reader.collections.events.all()
  return entries
    .map(({ entry }) => entryToEvent(entry))
    .sort((a, b) => a._iso.localeCompare(b._iso))
    .map(({ _iso: _unused, ...rest }) => rest)
}

export async function getEvent(slug: string): Promise<(CoffeeEvent & { slug: string; contentHtml: string }) | null> {
  const entry = await reader.collections.events.read(slug)
  if (!entry) return null
  const { node } = await entry.content()
  const contentHtml = Markdoc.renderers.html(Markdoc.transform(node))
  const { _iso: _unused, ...ev } = entryToEvent(entry)
  return { slug, ...ev, contentHtml }
}

export async function getEventSlugs(): Promise<string[]> {
  const entries = await reader.collections.events.all()
  return entries.map((e) => e.slug)
}

export async function getTeams(): Promise<Team[]> {
  const entries = await reader.collections.teams.all()
  return entries.map(({ entry }) => ({
    name:    entry.name,
    focus:   entry.focus ?? '',
    city:    entry.city ?? '',
    members: entry.members ?? 0,
    open:    entry.open ?? 0,
    stack:   (entry.stack ?? []).filter(Boolean) as string[],
    lead:    entry.lead ?? '',
  }))
}

export async function getTeam(slug: string): Promise<(Team & { slug: string }) | null> {
  const entries = await reader.collections.teams.all()
  const found = entries.find((e) => e.slug === slug)
  if (!found) return null
  const { entry } = found
  return {
    slug,
    name:    entry.name,
    focus:   entry.focus ?? '',
    city:    entry.city ?? '',
    members: entry.members ?? 0,
    open:    entry.open ?? 0,
    stack:   (entry.stack ?? []).filter(Boolean) as string[],
    lead:    entry.lead ?? '',
  }
}

export async function getTeamSlugs(): Promise<string[]> {
  const entries = await reader.collections.teams.all()
  return entries.map((e) => e.slug)
}

export async function getProjects(): Promise<Project[]> {
  const entries = await reader.collections.projects.all()
  return entries
    .map(({ entry }) => ({
      name:    entry.name,
      rank:    entry.rank ?? 0,
      cat:     entry.cat ?? '',
      builder: entry.builder ?? '',
      loc:     entry.loc ?? '',
      metric:  entry.metric ?? '',
      metricL: entry.metricL ?? '',
      delta:   entry.delta ?? '+0',
      tags:    (entry.tags ?? []).filter(Boolean) as string[],
      blurb:   entry.blurb ?? '',
      funding: entry.funding ?? '',
      year:    entry.year ?? '',
    }))
    .sort((a, b) => a.rank - b.rank)
}

export async function getSiteData(): Promise<{ values: Value[]; stats: Stat[] }> {
  const site = await reader.singletons.site.read()
  if (!site) return { values: [], stats: [] }
  return {
    values: (site.values ?? []).map((v) => ({ k: v.k ?? '', v: v.v ?? '' })),
    stats:  (site.stats  ?? []).map((s) => ({ n: s.n ?? '', l: s.l ?? '', src: s.src ?? '' })),
  }
}
