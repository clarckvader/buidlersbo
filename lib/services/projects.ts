// Reglas de proyectos e invitaciones. Toda escritura de miembros pasa por aquí (con overrideAccess),
// así que cada función valida quién actúa.
import { randomBytes } from 'crypto'
import type { Payload, RequiredDataFromCollectionSlug, Where } from 'payload'
import type { Member, Project, ProjectInvite } from '../../payload-types'
import { PROJECT_STATUS, type ProjectStatus } from '../../collections/Projects'
import { LIMITS, cleanLinks, cleanList } from '../profile'
import { slugify } from '../slugify'

export class ServiceError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

export type ProjectInput = {
  name: string
  tagline?: string
  description?: string
  category?: string
  city?: string
  status?: ProjectStatus
  stack?: string[]
  lookingFor?: string[]
  links?: string[]
}

type ID = number | string
const sameId = (a: unknown, b: unknown) => a != null && b != null && String(a) === String(b)
const idOf = (v: unknown): ID | null =>
  v && typeof v === 'object' ? ((v as { id: ID }).id ?? null) : ((v as ID | null | undefined) ?? null)
const normalizeEmail = (e: string) => e.trim().toLowerCase()
const newToken = () => randomBytes(24).toString('base64url')
const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : undefined)

function sanitize(input: Partial<ProjectInput>): Partial<ProjectInput> {
  const out: Partial<ProjectInput> = {}
  if ('name' in input) {
    const name = text(input.name, LIMITS.name)
    if (!name) throw new ServiceError(400, 'El proyecto necesita un nombre')
    out.name = name
  }
  if ('tagline' in input) out.tagline = text(input.tagline, LIMITS.tagline) ?? ''
  if ('description' in input) out.description = text(input.description, LIMITS.description) ?? ''
  if ('category' in input) out.category = text(input.category, LIMITS.item) ?? ''
  if ('city' in input) out.city = text(input.city, LIMITS.item) ?? ''
  if ('status' in input) {
    if (!PROJECT_STATUS.includes(input.status as ProjectStatus)) throw new ServiceError(400, 'Estado inválido')
    out.status = input.status
  }
  if ('stack' in input) out.stack = cleanList(input.stack, LIMITS.stack) ?? []
  if ('lookingFor' in input) out.lookingFor = cleanList(input.lookingFor, LIMITS.lookingFor) ?? []
  if ('links' in input) out.links = cleanLinks(input.links)
  return out
}

async function getProjectOr404(payload: Payload, projectId: ID): Promise<Project> {
  const project = await payload.findByID({ collection: 'projects', id: projectId, depth: 0, overrideAccess: true, disableErrors: true })
  if (!project) throw new ServiceError(404, 'Proyecto no encontrado')
  return project
}

async function getOwnedProject(payload: Payload, actor: Member, projectId: ID): Promise<Project> {
  const project = await getProjectOr404(payload, projectId)
  if (!sameId(idOf(project.owner), actor.id)) throw new ServiceError(403, 'Solo el dueño del proyecto puede hacer esto')
  return project
}

async function uniqueSlug(payload: Payload, name: string): Promise<string> {
  const base = slugify(name) || 'proyecto'
  for (let n = 1; ; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`
    const { totalDocs } = await payload.count({ collection: 'projects', where: { slug: { equals: candidate } }, overrideAccess: true })
    if (totalDocs === 0) return candidate
  }
}

async function findMembership(payload: Payload, projectId: ID, memberId: ID) {
  const { docs } = await payload.find({
    collection: 'project-members',
    where: { project: { equals: projectId }, member: { equals: memberId } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return docs[0] ?? null
}

// Idempotente: si ya es integrante no hace nada (también ante carreras con el índice único).
async function ensureMembership(payload: Payload, projectId: ID, memberId: ID, role: 'owner' | 'member') {
  if (await findMembership(payload, projectId, memberId)) return
  try {
    await payload.create({ collection: 'project-members', data: { project: projectId as number, member: memberId as number, role }, depth: 0, overrideAccess: true })
  } catch (err) {
    if (!(await findMembership(payload, projectId, memberId))) throw err
  }
}

export async function createProject(payload: Payload, owner: Member, data: ProjectInput): Promise<Project> {
  const clean = sanitize({ status: 'idea', ...data, name: data.name })
  const projectData: RequiredDataFromCollectionSlug<'projects'> = {
    ...clean,
    name: clean.name!,
    status: clean.status ?? 'idea',
    slug: await uniqueSlug(payload, clean.name!),
    owner: owner.id,
    inviteToken: newToken(),
  }
  const project = await payload.create({ collection: 'projects', data: projectData, depth: 0, overrideAccess: true })
  await ensureMembership(payload, project.id, owner.id, 'owner')
  return project
}

export async function updateProject(payload: Payload, actor: Member, projectId: ID, data: Partial<ProjectInput>): Promise<Project> {
  await getOwnedProject(payload, actor, projectId)
  // El slug no cambia al renombrar: las URLs compartidas siguen funcionando.
  return payload.update({ collection: 'projects', id: projectId, data: sanitize(data), depth: 0, overrideAccess: true })
}

export async function deleteProject(payload: Payload, actor: Member, projectId: ID): Promise<void> {
  await getOwnedProject(payload, actor, projectId)
  const where = { project: { equals: projectId } }
  await payload.delete({ collection: 'project-invites', where, overrideAccess: true })
  await payload.delete({ collection: 'project-members', where, overrideAccess: true })
  await payload.delete({ collection: 'projects', id: projectId, overrideAccess: true })
}

export async function getInviteToken(payload: Payload, actor: Member, projectId: ID): Promise<string> {
  const project = await getOwnedProject(payload, actor, projectId)
  if (project.inviteToken) return project.inviteToken
  return regenerateInviteToken(payload, actor, projectId)
}

export async function regenerateInviteToken(payload: Payload, actor: Member, projectId: ID): Promise<string> {
  await getOwnedProject(payload, actor, projectId)
  const token = newToken()
  await payload.update({ collection: 'projects', id: projectId, data: { inviteToken: token }, depth: 0, overrideAccess: true })
  return token
}

export async function joinByToken(payload: Payload, member: Member, token: string): Promise<Project> {
  const { docs } = token
    ? await payload.find({ collection: 'projects', where: { inviteToken: { equals: token } }, limit: 1, depth: 0, overrideAccess: true })
    : { docs: [] }
  const project = docs[0]
  if (!project) throw new ServiceError(404, 'Este enlace ya no es válido')
  await ensureMembership(payload, project.id, member.id, 'member')
  return project
}

// `identifier`: "@usuario", "usuario" o un correo.
export async function inviteMember(payload: Payload, actor: Member, projectId: ID, identifier: string): Promise<ProjectInvite> {
  await getOwnedProject(payload, actor, projectId)
  const raw = (identifier ?? '').trim()
  const isEmail = raw.includes('@') && !raw.startsWith('@')
  let target: Member | null = null
  let email: string | null = null

  if (isEmail) {
    email = normalizeEmail(raw)
    target = await findMemberByEmail(payload, email)
  } else {
    const username = raw.replace(/^@/, '').toLowerCase()
    if (!username) throw new ServiceError(400, 'Escribe un @usuario o un correo')
    const { docs } = await payload.find({ collection: 'members', where: { username: { equals: username } }, limit: 1, depth: 0, overrideAccess: true })
    target = docs[0] ?? null
    if (!target) throw new ServiceError(404, `No existe @${username}`)
  }

  if (target && (await findMembership(payload, projectId, target.id))) {
    throw new ServiceError(409, 'Esa persona ya es parte del proyecto')
  }

  const pendingWhere: Where = {
    project: { equals: projectId },
    status: { equals: 'pending' },
    ...(target ? { member: { equals: target.id } } : { email: { equals: email } }),
  }
  const existing = await payload.find({ collection: 'project-invites', where: pendingWhere, limit: 1, depth: 0, overrideAccess: true })
  if (existing.docs[0]) return existing.docs[0]

  return payload.create({
    collection: 'project-invites',
    data: {
      project: projectId as number,
      invitedBy: actor.id,
      ...(target ? { member: target.id } : { email: email! }),
      status: 'pending',
    },
    depth: 0,
    overrideAccess: true,
  })
}

// Los correos de miembros vienen de Pollar con mayúsculas variables: se compara normalizado.
async function findMemberByEmail(payload: Payload, email: string): Promise<Member | null> {
  const { docs } = await payload.find({ collection: 'members', where: { email: { like: email } }, limit: 20, depth: 0, overrideAccess: true })
  return docs.find((m) => m.email && normalizeEmail(m.email) === email) ?? null
}

export async function claimEmailInvites(payload: Payload, member: Member): Promise<number> {
  if (!member.email) return 0
  const { docs } = await payload.find({
    collection: 'project-invites',
    where: { email: { equals: normalizeEmail(member.email) }, member: { exists: false }, status: { equals: 'pending' } },
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })
  for (const invite of docs) {
    await payload.update({ collection: 'project-invites', id: invite.id, data: { member: member.id }, depth: 0, overrideAccess: true })
  }
  return docs.length
}

export async function respondToInvite(payload: Payload, member: Member, inviteId: ID, accept: boolean): Promise<void> {
  const invite = await payload.findByID({ collection: 'project-invites', id: inviteId, depth: 0, overrideAccess: true, disableErrors: true })
  if (!invite) throw new ServiceError(404, 'Invitación no encontrada')
  const forMe =
    sameId(idOf(invite.member), member.id) ||
    (!invite.member && !!invite.email && !!member.email && normalizeEmail(member.email) === invite.email)
  if (!forMe) throw new ServiceError(403, 'Esta invitación no es para ti')
  if (invite.status !== 'pending') throw new ServiceError(409, 'Esta invitación ya no está vigente')

  if (accept) await ensureMembership(payload, idOf(invite.project)!, member.id, 'member')
  await payload.update({
    collection: 'project-invites',
    id: invite.id,
    data: { status: accept ? 'accepted' : 'declined', member: member.id },
    depth: 0,
    overrideAccess: true,
  })
}

export async function revokeInvite(payload: Payload, actor: Member, inviteId: ID): Promise<void> {
  const invite = await payload.findByID({ collection: 'project-invites', id: inviteId, depth: 0, overrideAccess: true, disableErrors: true })
  if (!invite) throw new ServiceError(404, 'Invitación no encontrada')
  await getOwnedProject(payload, actor, idOf(invite.project)!)
  if (invite.status !== 'pending') return
  await payload.update({ collection: 'project-invites', id: invite.id, data: { status: 'revoked' }, depth: 0, overrideAccess: true })
}

export async function removeMember(payload: Payload, actor: Member, projectId: ID, memberId: ID): Promise<void> {
  const project = await getOwnedProject(payload, actor, projectId)
  if (sameId(idOf(project.owner), memberId)) throw new ServiceError(400, 'El dueño no puede quitarse del proyecto')
  await payload.delete({
    collection: 'project-members',
    where: { project: { equals: projectId }, member: { equals: memberId } },
    overrideAccess: true,
  })
}

export async function leaveProject(payload: Payload, member: Member, projectId: ID): Promise<void> {
  const project = await getProjectOr404(payload, projectId)
  if (sameId(idOf(project.owner), member.id)) {
    throw new ServiceError(400, 'El dueño no puede salir; puede borrar el proyecto')
  }
  await payload.delete({
    collection: 'project-members',
    where: { project: { equals: projectId }, member: { equals: member.id } },
    overrideAccess: true,
  })
}
