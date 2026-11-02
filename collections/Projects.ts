import type { CollectionConfig } from 'payload'
import { adminWrite } from './access'
import { slugField } from './fields/slug'

export const Projects: CollectionConfig = {
  slug: 'projects',
  labels: { singular: 'Proyecto', plural: 'Proyectos' },
  admin: { useAsTitle: 'name', defaultColumns: ['rank', 'name', 'cat', 'builder'] },
  access: { read: () => true, ...adminWrite },
  defaultSort: 'rank',
  fields: [
    { name: 'name', type: 'text', label: 'Nombre', required: true },
    slugField('name'),
    { name: 'rank', type: 'number', label: 'Ranking', defaultValue: 1 },
    { name: 'cat', type: 'text', label: 'Categoría' },
    { name: 'builder', type: 'text', label: 'Equipo' },
    { name: 'loc', type: 'text', label: 'Ciudad' },
    { name: 'metric', type: 'text', label: 'Métrica' },
    { name: 'metricL', type: 'text', label: 'Label métrica' },
    { name: 'delta', type: 'text', label: 'Delta', defaultValue: '+0' },
    {
      name: 'tags',
      type: 'array',
      label: 'Tags',
      fields: [{ name: 'value', type: 'text', label: 'Tag', required: true }],
    },
    { name: 'blurb', type: 'textarea', label: 'Descripción' },
    { name: 'funding', type: 'text', label: 'Funding' },
    { name: 'year', type: 'text', label: 'Año' },
  ],
}
