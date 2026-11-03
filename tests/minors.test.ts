import { beforeEach, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'
import type { Member } from '@/payload-types'
import {
  ServiceError,
  createProject,
  getInviteToken,
  inviteMember,
  joinByToken,
  removeMember,
} from '@/lib/services/projects'
import { registerForEvent } from '@/lib/services/events'
import { getEvents } from '@/lib/content'
import { createMember, getTestPayload, resetDb } from './helpers'

let payload: Payload
const asUser = (m: Member) => ({ ...m, collection: 'members' as const })
const day = (offset: number) => new Date(Date.now() + offset * 86400000).toISOString()
const errOf = (p: Promise<unknown>) => p.then(() => null, (e) => e)

beforeEach(async () => {
  payload = await getTestPayload()
  await resetDb(payload)
})

describe('quitar integrante', () => {
  it('invalida el enlace: el quitado no puede volver con el mismo', async () => {
    const owner = await createMember(payload)
    const ana = await createMember(payload)
    const project = await createProject(payload, owner, { name: 'Pacha' })
    const token = await getInviteToken(payload, owner, project.id)
    await joinByToken(payload, ana, token)
    await removeMember(payload, owner, project.id, ana.id)
    const err = await errOf(joinByToken(payload, ana, token))
    expect((err as ServiceError).status).toBe(404)
  })
})

describe('unirse por enlace con invitación pendiente', () => {
  it('marca la invitación como aceptada', async () => {
    const owner = await createMember(payload)
    const ana = await createMember(payload, { username: 'ana' })
    const project = await createProject(payload, owner, { name: 'Pacha' })
    const invite = await inviteMember(payload, owner, project.id, '@ana')
    await joinByToken(payload, ana, await getInviteToken(payload, owner, project.id))
    const after = await payload.findByID({ collection: 'project-invites', id: invite.id, overrideAccess: true })
    expect(after.status).toBe('accepted')
  })
})

describe('eventos', () => {
  it('no se puede inscribir a un evento pasado', async () => {
    const ev = await payload.create({ collection: 'events', data: { name: 'Viejo', slug: 'viejo', type: 'Meetup', cap: 5, date: day(-3) }, overrideAccess: true })
    const err = await errOf(registerForEvent(payload, await createMember(payload), ev.id))
    expect((err as ServiceError).status).toBe(409)
    expect((err as ServiceError).message).toMatch(/ya pasó/)
  })

  it('sin cupo definido no hay límite', async () => {
    const ev = await payload.create({ collection: 'events', data: { name: 'Libre', slug: 'libre', type: 'Meetup', cap: null, date: day(5) }, overrideAccess: true })
    for (let i = 0; i < 3; i++) await registerForEvent(payload, await createMember(payload), ev.id)
    expect((await payload.count({ collection: 'event-registrations', overrideAccess: true })).totalDocs).toBe(3)
  })

  it('el listado solo muestra eventos de hoy en adelante (o sin fecha)', async () => {
    await payload.create({ collection: 'events', data: { name: 'Pasado', slug: 'pasado', type: 'Meetup', date: day(-2) }, overrideAccess: true })
    await payload.create({ collection: 'events', data: { name: 'Futuro', slug: 'futuro', type: 'Meetup', date: day(2) }, overrideAccess: true })
    await payload.create({ collection: 'events', data: { name: 'Sin fecha', slug: 'sin-fecha', type: 'Meetup' }, overrideAccess: true })
    expect((await getEvents(null)).map((e) => e.name).sort()).toEqual(['Futuro', 'Sin fecha'])
  })
})

describe('proyectos creados o editados desde el panel', () => {
  it('crear con dueño agrega al dueño al equipo', async () => {
    const owner = await createMember(payload)
    const project = await payload.create({ collection: 'projects', data: { name: 'Desde admin', slug: 'desde-admin', status: 'idea', owner: owner.id }, overrideAccess: true })
    const { docs } = await payload.find({ collection: 'project-members', where: { project: { equals: project.id } }, overrideAccess: true, depth: 0 })
    expect(docs.map((d) => [d.member, d.role])).toEqual([[owner.id, 'owner']])
  })

  it('cambiar el dueño actualiza los roles del equipo', async () => {
    const a = await createMember(payload)
    const b = await createMember(payload)
    const project = await createProject(payload, a, { name: 'Pacha' })
    await payload.update({ collection: 'projects', id: project.id, data: { owner: b.id }, overrideAccess: true })
    const { docs } = await payload.find({ collection: 'project-members', where: { project: { equals: project.id } }, overrideAccess: true, depth: 0 })
    const roles = Object.fromEntries(docs.map((d) => [String(d.member), d.role]))
    expect(roles).toEqual({ [String(a.id)]: 'member', [String(b.id)]: 'owner' })
  })
})

describe('slug con creaciones simultáneas', () => {
  it('dos proyectos con el mismo nombre a la vez no fallan', async () => {
    const owner = await createMember(payload)
    const results = await Promise.all([1, 2, 3].map(() => createProject(payload, owner, { name: 'Mismo' })))
    expect(new Set(results.map((p) => p.slug)).size).toBe(3)
  })
})

describe('accesos', () => {
  it('un miembro sin rol no puede escribir contenido por la API de Payload', async () => {
    const m = asUser(await createMember(payload))
    const tries = [
      payload.create({ collection: 'projects', data: { name: 'X', slug: 'x', status: 'idea', owner: m.id }, overrideAccess: false, user: m }),
      payload.create({ collection: 'events', data: { name: 'X', slug: 'x', type: 'Meetup' }, overrideAccess: false, user: m }),
      payload.create({ collection: 'project-members', data: { project: 1, member: m.id, role: 'owner' }, overrideAccess: false, user: m }),
      payload.update({ collection: 'members', id: m.id, data: { role: 'admin' }, overrideAccess: false, user: m }),
    ]
    for (const t of tries) await expect(t).rejects.toThrow()
  })

  it('el equipo público no expone emails ni el token al poblar relaciones', async () => {
    const owner = await createMember(payload, { email: 'secreto@x.com' })
    await createProject(payload, owner, { name: 'Pacha' })
    const { docs } = await payload.find({ collection: 'project-members', depth: 1, overrideAccess: false })
    const json = JSON.stringify(docs)
    expect(json).not.toContain('secreto@x.com')
    expect(json).not.toContain('inviteToken')
  })

  it('no se puede filtrar proyectos por inviteToken', async () => {
    const owner = await createMember(payload)
    const project = await createProject(payload, owner, { name: 'Pacha' })
    const token = await getInviteToken(payload, owner, project.id)
    await expect(payload.find({ collection: 'projects', where: { inviteToken: { equals: token } }, overrideAccess: false })).rejects.toThrow()
  })

  it('las invitaciones (con correos) solo las leen admins, no organizadores', async () => {
    const organizer = asUser(await createMember(payload, { role: 'organizer' }))
    const admin = asUser(await createMember(payload, { role: 'admin' }))
    await expect(payload.find({ collection: 'project-invites', overrideAccess: false, user: organizer })).rejects.toThrow()
    await expect(payload.find({ collection: 'project-invites', overrideAccess: false, user: admin })).resolves.toBeDefined()
  })

  it('un miembro sin rol no puede crear bloqueos de documentos', async () => {
    const m = asUser(await createMember(payload))
    const ev = await payload.create({ collection: 'events', data: { name: 'X', slug: 'lock-x', type: 'Meetup' }, overrideAccess: true })
    await expect(
      payload.create({
        collection: 'payload-locked-documents',
        data: { document: { relationTo: 'events', value: ev.id }, user: { relationTo: 'members', value: m.id } },
        overrideAccess: false,
        user: m,
      }),
    ).rejects.toThrow()
  })
})
