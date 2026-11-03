import type { CollectionConfig, Field, PayloadRequest } from 'payload'
import type { Project } from '../payload-types'
import { isStaffField, staffWrite } from './access'
import { slugField } from './fields/slug'
import { memberHandler, readBody } from '../lib/session'
import {
  ServiceError,
  createProject,
  deleteProject,
  getInviteToken,
  inviteMember,
  joinByToken,
  leaveProject,
  listProjectInvites,
  regenerateInviteToken,
  removeMember,
  syncOwnerMembership,
  updateProject,
  type ProjectInput,
} from '../lib/services/projects'

// Nunca devolver el token del enlace en respuestas de proyecto.
const publicProject = ({ inviteToken: _token, ...project }: Project) => project
// Ids de la URL: solo enteros; cualquier otra cosa es un 404 (no un error de base de datos).
const param = (req: PayloadRequest, name: string) => {
  const value = String(req.routeParams?.[name] ?? '')
  if (!/^\d+$/.test(value)) throw new ServiceError(404, 'No encontrado')
  return value
}

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
  hooks: {
    // Al borrar un proyecto (dueño o staff desde el panel) se va su equipo y sus invitaciones.
    afterChange: [
      async ({ doc, previousDoc, operation, req }) => {
        const idOf = (v: unknown) => (v && typeof v === 'object' ? (v as { id: number }).id : (v as number | null))
        const ownerId = idOf(doc.owner)
        if (ownerId == null) return
        await syncOwnerMembership(req.payload, doc.id, ownerId, operation === 'update' ? idOf(previousDoc?.owner) : null, req)
      },
    ],
    beforeDelete: [
      async ({ req, id }) => {
        const where = { project: { equals: id } }
        await req.payload.delete({ collection: 'project-invites', where, req, overrideAccess: true })
        await req.payload.delete({ collection: 'project-members', where, req, overrideAccess: true })
      },
    ],
  },
  endpoints: [
    {
      path: '/create',
      method: 'post',
      handler: memberHandler(async (req, member) => ({
        project: publicProject(await createProject(req.payload, member, (await readBody(req)) as ProjectInput)),
      })),
    },
    {
      path: '/join',
      method: 'post',
      handler: memberHandler(async (req, member) => ({
        project: publicProject(await joinByToken(req.payload, member, String((await readBody(req)).token ?? ''))),
      })),
    },
    {
      path: '/:id/edit',
      method: 'patch',
      handler: memberHandler(async (req, member) => ({
        project: publicProject(await updateProject(req.payload, member, param(req, 'id'), await readBody(req))),
      })),
    },
    {
      path: '/:id/remove',
      method: 'delete',
      handler: memberHandler((req, member) => deleteProject(req.payload, member, param(req, 'id'))),
    },
    {
      path: '/:id/invite-link',
      method: 'get',
      handler: memberHandler(async (req, member) => ({ token: await getInviteToken(req.payload, member, param(req, 'id')) })),
    },
    {
      // Regenera el enlace: el anterior deja de servir.
      path: '/:id/invite-link',
      method: 'post',
      handler: memberHandler(async (req, member) => ({ token: await regenerateInviteToken(req.payload, member, param(req, 'id')) })),
    },
    {
      path: '/:id/invite',
      method: 'post',
      handler: memberHandler(async (req, member) => ({
        invite: await inviteMember(req.payload, member, param(req, 'id'), String((await readBody(req)).identifier ?? '')),
      })),
    },
    {
      path: '/:id/invites',
      method: 'get',
      handler: memberHandler(async (req, member) => ({ invites: await listProjectInvites(req.payload, member, param(req, 'id')) })),
    },
    {
      path: '/:id/leave',
      method: 'post',
      handler: memberHandler((req, member) => leaveProject(req.payload, member, param(req, 'id'))),
    },
    {
      path: '/:id/members/:memberId',
      method: 'delete',
      handler: memberHandler((req, member) => removeMember(req.payload, member, param(req, 'id'), param(req, 'memberId'))),
    },
  ],
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
