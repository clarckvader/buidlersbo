import type { CollectionConfig } from 'payload'
import { isStaff, staffWrite } from './access'

// Invitaciones personales a un proyecto (por @usuario o correo). No se envían emails.
export const ProjectInvites: CollectionConfig = {
  slug: 'project-invites',
  labels: { singular: 'Invitación', plural: 'Invitaciones' },
  admin: { defaultColumns: ['project', 'member', 'email', 'status'], group: 'Proyectos' },
  access: { read: isStaff, ...staffWrite },
  fields: [
    { name: 'project', type: 'relationship', relationTo: 'projects', required: true, index: true },
    { name: 'invitedBy', type: 'relationship', relationTo: 'members', required: true },
    // Uno de los dos: el miembro (si existe) o el correo normalizado (si todavía no es miembro).
    { name: 'member', type: 'relationship', relationTo: 'members', index: true },
    { name: 'email', type: 'text', index: true },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pendiente', value: 'pending' },
        { label: 'Aceptada', value: 'accepted' },
        { label: 'Rechazada', value: 'declined' },
        { label: 'Revocada', value: 'revoked' },
      ],
    },
  ],
}
