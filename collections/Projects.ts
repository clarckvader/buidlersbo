import type { CollectionConfig, Field } from 'payload'
import { isStaffField, staffWrite } from './access'
import { slugField } from './fields/slug'

export const PROJECT_STATUS = ['idea', 'construyendo', 'lanzado'] as const
export type ProjectStatus = (typeof PROJECT_STATUS)[number]

// Campos de curaduría (Ranking): solo staff los escribe.
const staffOnly = (field: Field): Field => ({
  ...field,
  access: { create: isStaffField, update: isStaffField },
} as Field)

// Proyectos creados por miembros. Los miembros escriben solo vía endpoints propios (lib/services/projects).
export const Projects: CollectionConfig = {
  slug: 'projects',
  labels: { singular: 'Proyecto', plural: 'Proyectos' },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'owner', 'status', 'featured', 'rank'] },
  access: { read: () => true, ...staffWrite },
  defaultSort: '-createdAt',
  fields: [
    { name: 'name', type: 'text', label: 'Nombre', required: true },
    slugField('name'),
    { name: 'tagline', type: 'text', label: 'En una línea' },
    { name: 'description', type: 'textarea', label: 'Descripción' },
    { name: 'category', type: 'text', label: 'Categoría' },
    { name: 'city', type: 'text', label: 'Ciudad' },
    {
      name: 'status',
      type: 'select',
      label: 'Estado',
      required: true,
      defaultValue: 'idea',
      options: [
        { label: 'Idea', value: 'idea' },
        { label: 'Construyendo', value: 'construyendo' },
        { label: 'Lanzado', value: 'lanzado' },
      ],
    },
    { name: 'stack', type: 'text', label: 'Stack', hasMany: true },
    { name: 'lookingFor', type: 'text', label: 'Buscan', hasMany: true },
    { name: 'links', type: 'text', label: 'Links', hasMany: true },
    { name: 'owner', type: 'relationship', relationTo: 'members', label: 'Dueño', required: true },
    {
      type: 'collapsible',
      label: 'Ranking (curaduría)',
      fields: [
        staffOnly({ name: 'featured', type: 'checkbox', label: 'Destacado en Ranking', defaultValue: false }),
        staffOnly({ name: 'rank', type: 'number', label: 'Orden' }),
        staffOnly({ name: 'metric', type: 'text', label: 'Métrica' }),
        staffOnly({ name: 'metricLabel', type: 'text', label: 'Label métrica' }),
        staffOnly({ name: 'delta', type: 'text', label: 'Delta' }),
        staffOnly({ name: 'funding', type: 'text', label: 'Funding' }),
        staffOnly({ name: 'year', type: 'text', label: 'Año' }),
      ],
    },
    {
      // Token del enlace de invitación: nunca legible salvo con overrideAccess (servicio).
      name: 'inviteToken',
      type: 'text',
      index: true,
      access: { read: () => false, create: () => false, update: () => false },
      admin: { hidden: true },
    },
  ],
}
