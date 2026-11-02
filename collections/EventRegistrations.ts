import type { CollectionConfig } from 'payload'
import { isStaff, staffWrite } from './access'

// Inscripciones de miembros a eventos. El cupo ocupado de un evento es el conteo de estas.
export const EventRegistrations: CollectionConfig = {
  slug: 'event-registrations',
  labels: { singular: 'Inscripción', plural: 'Inscripciones' },
  admin: { defaultColumns: ['event', 'member', 'createdAt'], group: 'Eventos' },
  access: { read: isStaff, ...staffWrite },
  indexes: [{ fields: ['event', 'member'], unique: true }],
  fields: [
    { name: 'event', type: 'relationship', relationTo: 'events', required: true, index: true },
    { name: 'member', type: 'relationship', relationTo: 'members', required: true, index: true },
  ],
}
