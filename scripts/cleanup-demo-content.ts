// Borra el contenido de prueba heredado del diseño (eventos y proyectos). Idempotente.
// Conserva miembros y el global `site`. Uso: npm run cleanup:demo
import { getPayload } from 'payload'
import config from '@payload-config'

const payload = await getPayload({ config })

for (const collection of ['events', 'projects'] as const) {
  // Los hooks beforeDelete limpian inscripciones, integrantes e invitaciones relacionadas.
  const { docs } = await payload.delete({ collection, where: { id: { exists: true } }, overrideAccess: true })
  payload.logger.info(`${collection}: ${docs.length} borrados`)
}

for (const collection of ['events', 'projects', 'members'] as const) {
  const { totalDocs } = await payload.count({ collection, overrideAccess: true })
  payload.logger.info(`${collection}: ${totalDocs} restantes`)
}

process.exit(0)
