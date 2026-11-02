import { beforeEach, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'
import type { Member } from '@/payload-types'
import {
  ServiceError,
  claimEmailInvites,
  createProject,
  deleteProject,
  getInviteToken,
  inviteMember,
  joinByToken,
  leaveProject,
  regenerateInviteToken,
  removeMember,
  respondToInvite,
  updateProject,
} from '@/lib/services/projects'
import { createMember, getTestPayload, resetDb } from './helpers'

let payload: Payload
let owner: Member
let other: Member

const teamOf = async (projectId: number | string) =>
  (await payload.find({ collection: 'project-members', where: { project: { equals: projectId } }, depth: 0, overrideAccess: true })).docs

const expectServiceError = async (p: Promise<unknown>, status: number) => {
  const err = await p.then(() => null, (e) => e)
  expect(err).toBeInstanceOf(ServiceError)
  expect((err as ServiceError).status).toBe(status)
}

beforeEach(async () => {
  payload = await getTestPayload()
  await resetDb(payload)
  owner = await createMember(payload, { name: 'Dueña', username: 'duena', email: 'duena@x.com' })
  other = await createMember(payload, { name: 'Ana', username: 'ana', email: 'ana@x.com' })
})

describe('createProject', () => {
  it('crea owner y token', async () => {
    const project = await createProject(payload, owner, { name: 'Pacha ID' })
    const team = await teamOf(project.id)
    expect(team).toHaveLength(1)
    expect(team[0].role).toBe('owner')
    expect(team[0].member).toBe(owner.id)
    expect((await getInviteToken(payload, owner, project.id)).length).toBeGreaterThanOrEqual(32)
  })

  it('slug único', async () => {
    const a = await createProject(payload, owner, { name: 'Pacha ID' })
    const b = await createProject(payload, other, { name: 'Pacha ID' })
    expect(a.slug).toBe('pacha-id')
    expect(b.slug).toBe('pacha-id-2')
  })

  it('exige nombre', async () => {
    await expectServiceError(createProject(payload, owner, { name: '   ' }), 400)
  })
})

describe('permisos del dueño', () => {
  it('solo el dueño edita', async () => {
    const project = await createProject(payload, owner, { name: 'Pacha' })
    await expectServiceError(updateProject(payload, other, project.id, { tagline: 'x' }), 403)
    const updated = await updateProject(payload, owner, project.id, { tagline: 'identidad' })
    expect(updated.tagline).toBe('identidad')
  })

  it('solo el dueño ve el token', async () => {
    const project = await createProject(payload, owner, { name: 'Pacha' })
    await expectServiceError(getInviteToken(payload, other, project.id), 403)
  })
})

describe('joinByToken', () => {
  it('une e idempotente', async () => {
    const project = await createProject(payload, owner, { name: 'Pacha' })
    const token = await getInviteToken(payload, owner, project.id)
    await joinByToken(payload, other, token)
    await joinByToken(payload, other, token)
    const mine = (await teamOf(project.id)).filter((m) => m.member === other.id)
    expect(mine).toHaveLength(1)
    expect(mine[0].role).toBe('member')
  })

  it('rechaza token viejo', async () => {
    const project = await createProject(payload, owner, { name: 'Pacha' })
    const old = await getInviteToken(payload, owner, project.id)
    const fresh = await regenerateInviteToken(payload, owner, project.id)
    expect(fresh).not.toBe(old)
    await expectServiceError(joinByToken(payload, other, old), 404)
    await joinByToken(payload, other, fresh)
  })
})

describe('invitaciones', () => {
  it('por @usuario y por email', async () => {
    const project = await createProject(payload, owner, { name: 'Pacha' })
    const byUser = await inviteMember(payload, owner, project.id, '@ana')
    expect(byUser.member).toBe(other.id)
    const byEmail = await inviteMember(payload, owner, project.id, ' Nuevo@X.com ')
    expect(byEmail.member ?? null).toBeNull()
    expect(byEmail.email).toBe('nuevo@x.com')
  })

  it('una invitación pendiente repetida devuelve la existente', async () => {
    const project = await createProject(payload, owner, { name: 'Pacha' })
    const a = await inviteMember(payload, owner, project.id, 'ana')
    const b = await inviteMember(payload, owner, project.id, '@ana')
    expect(b.id).toBe(a.id)
  })

  it('email de un miembro existente se asocia a ese miembro', async () => {
    const project = await createProject(payload, owner, { name: 'Pacha' })
    const invite = await inviteMember(payload, owner, project.id, 'ANA@x.com')
    expect(invite.member).toBe(other.id)
  })

  it('claimEmailInvites asocia por correo y aceptar lo une', async () => {
    const project = await createProject(payload, owner, { name: 'Pacha' })
    await inviteMember(payload, owner, project.id, 'nuevo@x.com')
    const nuevo = await createMember(payload, { email: 'NUEVO@x.com' })
    expect(await claimEmailInvites(payload, nuevo)).toBe(1)
    const { docs } = await payload.find({ collection: 'project-invites', where: { member: { equals: nuevo.id } }, overrideAccess: true })
    await respondToInvite(payload, nuevo, docs[0].id, true)
    expect((await teamOf(project.id)).some((m) => m.member === nuevo.id)).toBe(true)
  })

  it('invitar a un integrante → 409; responder por otro → 403', async () => {
    const project = await createProject(payload, owner, { name: 'Pacha' })
    await expectServiceError(inviteMember(payload, owner, project.id, '@duena'), 409)
    const invite = await inviteMember(payload, owner, project.id, '@ana')
    const intruso = await createMember(payload)
    await expectServiceError(respondToInvite(payload, intruso, invite.id, true), 403)
  })

  it('usuario inexistente → 404; solo el dueño invita → 403', async () => {
    const project = await createProject(payload, owner, { name: 'Pacha' })
    await expectServiceError(inviteMember(payload, owner, project.id, '@nadie'), 404)
    await expectServiceError(inviteMember(payload, other, project.id, '@duena'), 403)
  })

  it('aceptar siendo ya integrante es idempotente', async () => {
    const project = await createProject(payload, owner, { name: 'Pacha' })
    const invite = await inviteMember(payload, owner, project.id, '@ana')
    await joinByToken(payload, other, await getInviteToken(payload, owner, project.id))
    await respondToInvite(payload, other, invite.id, true)
    expect((await teamOf(project.id)).filter((m) => m.member === other.id)).toHaveLength(1)
  })

  it('revocada no se puede aceptar', async () => {
    const { revokeInvite } = await import('@/lib/services/projects')
    const project = await createProject(payload, owner, { name: 'Pacha' })
    const invite = await inviteMember(payload, owner, project.id, '@ana')
    await revokeInvite(payload, owner, invite.id)
    await expectServiceError(respondToInvite(payload, other, invite.id, true), 409)
  })
})

describe('salir y quitar', () => {
  it('dueño no puede salir ni quitarse', async () => {
    const project = await createProject(payload, owner, { name: 'Pacha' })
    await expectServiceError(leaveProject(payload, owner, project.id), 400)
    await expectServiceError(removeMember(payload, owner, project.id, owner.id), 400)
  })

  it('integrante sale; dueño quita', async () => {
    const project = await createProject(payload, owner, { name: 'Pacha' })
    const token = await getInviteToken(payload, owner, project.id)
    await joinByToken(payload, other, token)
    await leaveProject(payload, other, project.id)
    expect((await teamOf(project.id)).some((m) => m.member === other.id)).toBe(false)
    await joinByToken(payload, other, token)
    await removeMember(payload, owner, project.id, other.id)
    expect((await teamOf(project.id)).some((m) => m.member === other.id)).toBe(false)
  })
})

describe('deleteProject', () => {
  it('borra integrantes e invitaciones', async () => {
    const project = await createProject(payload, owner, { name: 'Pacha' })
    await inviteMember(payload, owner, project.id, '@ana')
    await expectServiceError(deleteProject(payload, other, project.id), 403)
    await deleteProject(payload, owner, project.id)
    expect(await teamOf(project.id)).toHaveLength(0)
    const invites = await payload.find({ collection: 'project-invites', where: { project: { equals: project.id } }, overrideAccess: true })
    expect(invites.docs).toHaveLength(0)
  })
})

describe('lectura pública', () => {
  it('inviteToken no es público', async () => {
    await createProject(payload, owner, { name: 'Pacha' })
    const { docs } = await payload.find({ collection: 'projects', overrideAccess: false })
    expect(docs).toHaveLength(1)
    expect(docs[0]).not.toHaveProperty('inviteToken')
  })
})
