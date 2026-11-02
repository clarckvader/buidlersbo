// Importa el contenido que vivía en Keystatic (content/) a Payload.
// Idempotente: actualiza por slug si el documento ya existe.
// Uso: npm run migrate:content
import fs from 'fs/promises'
import path from 'path'
import { getPayload } from 'payload'
import { parse } from 'yaml'
import config from '@payload-config'

const CONTENT = path.resolve(process.cwd(), 'content')

type Raw = Record<string, unknown>

async function readEntries(dir: string, ext: '.yaml' | '.mdoc'): Promise<{ slug: string; data: Raw }[]> {
  const files = (await fs.readdir(path.join(CONTENT, dir))).filter((f) => f.endsWith(ext))
  return Promise.all(
    files.map(async (file) => {
      const text = await fs.readFile(path.join(CONTENT, dir, file), 'utf8')
      // Los .mdoc tienen frontmatter YAML entre `---`; los eventos no tienen cuerpo.
      const yamlText = ext === '.mdoc' ? (text.split(/^---$/m)[1] ?? '') : text
      return { slug: path.basename(file, ext), data: (parse(yamlText) ?? {}) as Raw }
    }),
  )
}

const day = (v: unknown) => (typeof v === 'string' && v ? `${v}T12:00:00.000Z` : undefined)
const list = (v: unknown) => (Array.isArray(v) ? v.filter(Boolean).map((value) => ({ value: String(value) })) : [])

const payload = await getPayload({ config })

async function upsert(collection: 'events' | 'teams' | 'projects', slug: string, data: Raw) {
  const { docs } = await payload.find({ collection, where: { slug: { equals: slug } }, limit: 1, depth: 0 })
  if (docs[0]) {
    await payload.update({ collection, id: docs[0].id, data: { ...data, slug } as never })
    payload.logger.info(`actualizado ${collection}/${slug}`)
  } else {
    await payload.create({ collection, data: { ...data, slug } as never })
    payload.logger.info(`creado ${collection}/${slug}`)
  }
}

for (const { slug, data } of await readEntries('events', '.mdoc')) {
  await upsert('events', slug, { ...data, date: day(data.date) })
}

for (const { slug, data } of await readEntries('teams', '.yaml')) {
  await upsert('teams', slug, { ...data, stack: list(data.stack) })
}

for (const { slug, data } of await readEntries('projects', '.yaml')) {
  await upsert('projects', slug, { ...data, tags: list(data.tags) })
}

const site = parse(await fs.readFile(path.join(CONTENT, 'site.yaml'), 'utf8')) as Raw
await payload.updateGlobal({ slug: 'site', data: { values: site.values, stats: site.stats } as never })
payload.logger.info('actualizado global site')

process.exit(0)
