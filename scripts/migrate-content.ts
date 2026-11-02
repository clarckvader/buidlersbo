// Importa los valores y stats del inicio (content/site.yaml) al global `site` de Payload.
// Eventos, equipos y proyectos de content/ eran de prueba: no se importan.
// Uso: npm run migrate:content
import fs from 'fs/promises'
import path from 'path'
import { getPayload } from 'payload'
import { parse } from 'yaml'
import config from '@payload-config'

const CONTENT = path.resolve(process.cwd(), 'content')

type Raw = Record<string, unknown>

const payload = await getPayload({ config })

const site = parse(await fs.readFile(path.join(CONTENT, 'site.yaml'), 'utf8')) as Raw
await payload.updateGlobal({ slug: 'site', data: { values: site.values, stats: site.stats } as never })
payload.logger.info('actualizado global site')

process.exit(0)
