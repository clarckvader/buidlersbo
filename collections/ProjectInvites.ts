import type { CollectionConfig } from 'payload'
import type { Member, Project } from '../payload-types'
import { isStaff, staffWrite } from './access'
import { memberHandler, readBody } from '../lib/session'
import { respondToInvite, revokeInvite } from '../lib/services/projects'

// Invitaciones personales a un proyecto (por @usuario o correo). No se envían emails.
export const ProjectInvites: CollectionConfig = {
  slug: 'project-invites',
  labels: { singular: 'Invitación', plural: 'Invitaciones' },
  admin: { defaultColumns: ['project', 'member', 'email', 'status'], group: 'Proyectos' },
  access: { read: isStaff, ...staffWrite },
  endpoints: [
    {
      // Invitaciones pendientes del miembro de la sesión.
      path: '/mine',
      method: 'get',
      handler: memberHandler(async (req, member) => {
        const { docs } = await req.payload.find({
          collection: 'project-invites',
          where: { member: { equals: member.id }, status: { equals: 'pending' } },
          depth: 1,
          limit: 50,
          overrideAccess: true,
        })
        return {
          invites: docs.map((invite) => {
            const project = invite.project as Project
            const by = invite.invitedBy as Member
            return {
              id: invite.id,
              project: { id: project.id, name: project.name, slug: project.slug, tagline: project.tagline ?? null },
              invitedBy: { name: by?.name ?? null, username: by?.username ?? null },
            }
          }),
        }
      }),
    },
    {
      path: '/:id/respond',
      method: 'post',
      handler: memberHandler(async (req, member) =>
        respondToInvite(req.payload, member, String(req.routeParams?.id ?? ''), (await readBody(req)).accept === true),
      ),
    },
    {
      path: '/:id/revoke',
      method: 'post',
      handler: memberHandler((req, member) => revokeInvite(req.payload, member, String(req.routeParams?.id ?? ''))),
    },
  ],
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
