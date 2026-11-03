import type { CollectionConfig } from 'payload'
import { isStaff, staffWrite } from './access'
import { memberHandler } from '../lib/session'
import { cancelRegistration, registerForEvent } from '../lib/services/events'

import { ServiceError } from '../lib/services/projects'

// Solo ids enteros; cualquier otra cosa es 404.
const eventId = (req: { routeParams?: Record<string, unknown> }) => {
  const value = String(req.routeParams?.eventId ?? '')
  if (!/^\d+$/.test(value)) throw new ServiceError(404, 'Evento no encontrado')
  return value
}

// Inscripciones de miembros a eventos. El cupo ocupado de un evento es el conteo de estas.
export const EventRegistrations: CollectionConfig = {
  slug: 'event-registrations',
  labels: { singular: 'Inscripción', plural: 'Inscripciones' },
  admin: { defaultColumns: ['event', 'member', 'createdAt'], group: 'Eventos' },
  access: { read: isStaff, ...staffWrite },
  indexes: [{ fields: ['event', 'member'], unique: true }],
  endpoints: [
    { path: '/event/:eventId', method: 'post', handler: memberHandler((req, m) => registerForEvent(req.payload, m, eventId(req))) },
    { path: '/event/:eventId', method: 'delete', handler: memberHandler((req, m) => cancelRegistration(req.payload, m, eventId(req))) },
  ],
  fields: [
    { name: 'event', type: 'relationship', relationTo: 'events', required: true, index: true },
    { name: 'member', type: 'relationship', relationTo: 'members', required: true, index: true },
  ],
}
