import type { CollectionConfig } from 'payload'
import { staffWrite } from './access'

// Integrantes de cada proyecto (su "equipo"). Público para mostrar el equipo.
export const ProjectMembers: CollectionConfig = {
  slug: 'project-members',
  labels: { singular: 'Integrante', plural: 'Integrantes' },
  admin: { defaultColumns: ['project', 'member', 'role', 'title'], group: 'Proyectos' },
  access: { read: () => true, ...staffWrite },
  indexes: [{ fields: ['project', 'member'], unique: true }],
  fields: [
    { name: 'project', type: 'relationship', relationTo: 'projects', required: true, index: true },
    { name: 'member', type: 'relationship', relationTo: 'members', required: true, index: true },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'member',
      options: [
        { label: 'Dueño', value: 'owner' },
        { label: 'Integrante', value: 'member' },
      ],
    },
    { name: 'title', type: 'text', label: 'Qué hace en el proyecto' },
  ],
}
