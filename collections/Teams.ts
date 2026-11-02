import type { CollectionConfig } from 'payload'
import { staffWrite } from './access'
import { slugField } from './fields/slug'

export const Teams: CollectionConfig = {
  slug: 'teams',
  labels: { singular: 'Equipo', plural: 'Equipos' },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'city', 'members', 'open'] },
  access: { read: () => true, ...staffWrite },
  fields: [
    { name: 'name', type: 'text', label: 'Nombre', required: true },
    slugField('name'),
    { name: 'focus', type: 'text', label: 'Enfoque' },
    { name: 'city', type: 'text', label: 'Ciudad' },
    { name: 'members', type: 'number', label: 'Miembros', defaultValue: 1 },
    { name: 'open', type: 'number', label: 'Posiciones abiertas', defaultValue: 0 },
    {
      name: 'stack',
      type: 'array',
      label: 'Stack',
      fields: [{ name: 'value', type: 'text', label: 'Tech', required: true }],
    },
    { name: 'lead', type: 'text', label: 'Lead' },
  ],
}
