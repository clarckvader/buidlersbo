import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Members } from './collections/Members'
import { Media } from './collections/Media'
import { Posts } from './collections/Posts'
import { Events } from './collections/Events'
import { EventRegistrations } from './collections/EventRegistrations'
import { Projects } from './collections/Projects'
import { ProjectMembers } from './collections/ProjectMembers'
import { ProjectInvites } from './collections/ProjectInvites'
import { Site } from './globals/Site'
import { migrations } from './migrations'

const dirname = path.dirname(fileURLToPath(import.meta.url))

// POSTGRES_CONNECTION_URL = base de producción (Render). Si no está, la local de docker-compose.
const databaseUrl = process.env.POSTGRES_CONNECTION_URL || process.env.DATABASE_URL || ''

export default buildConfig({
  admin: {
    user: Members.slug,
    meta: { titleSuffix: ' — buidlers_ bolivia' },
    importMap: { baseDir: path.resolve(dirname) },
  },
  collections: [Posts, Events, EventRegistrations, Projects, ProjectMembers, ProjectInvites, Members, Media],
  globals: [Site],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: {
      connectionString: databaseUrl,
      // La URL externa de Render exige SSL; la interna (dentro de Render) y la local no.
      ssl: databaseUrl.includes('.render.com') ? true : undefined,
    },
    // Contra la base de producción nunca se sincroniza el esquema en caliente: solo migraciones.
    push: !process.env.POSTGRES_CONNECTION_URL,
    // En producción las migraciones se aplican al arrancar.
    prodMigrations: migrations,
  }),
  sharp,
})
