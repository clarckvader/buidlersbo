import { beforeEach, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'
import { getProjectDirectory, getProjectPage, getProjects } from '@/lib/content'
import { createProject, getInviteToken, joinByToken } from '@/lib/services/projects'
import { createMember, getTestPayload, resetDb } from './helpers'

let payload: Payload

beforeEach(async () => {
  payload = await getTestPayload()
  await resetDb(payload)
})

describe('getProjectDirectory', () => {
  it('lista proyectos con su equipo (dueño primero) y sin token', async () => {
    const owner = await createMember(payload, { username: 'duena', name: 'Dueña' })
    const ana = await createMember(payload, { username: 'ana', name: 'Ana' })
    const project = await createProject(payload, owner, { name: 'Pacha', stack: ['Rust'], lookingFor: ['Diseño'] })
    await joinByToken(payload, ana, await getInviteToken(payload, owner, project.id))

    const dir = await getProjectDirectory()
    expect(dir).toHaveLength(1)
    expect(dir[0]).toMatchObject({ slug: 'pacha', name: 'Pacha', stack: ['Rust'], lookingFor: ['Diseño'] })
    expect(dir[0].team.map((m) => [m.username, m.role])).toEqual([['duena', 'owner'], ['ana', 'member']])
    expect(JSON.stringify(dir)).not.toContain('inviteToken')
  })

  it('vacío si no hay proyectos', async () => {
    expect(await getProjectDirectory()).toEqual([])
  })
})

describe('getProjectPage', () => {
  it('marca dueño e integrante según quién mira', async () => {
    const owner = await createMember(payload, { username: 'duena' })
    const ana = await createMember(payload, { username: 'ana' })
    const visitor = await createMember(payload)
    const project = await createProject(payload, owner, { name: 'Pacha' })
    await joinByToken(payload, ana, await getInviteToken(payload, owner, project.id))

    expect(await getProjectPage('pacha', owner)).toMatchObject({ isOwner: true, isMember: true })
    expect(await getProjectPage('pacha', ana)).toMatchObject({ isOwner: false, isMember: true })
    expect(await getProjectPage('pacha', visitor)).toMatchObject({ isOwner: false, isMember: false })
    expect(await getProjectPage('pacha', null)).toMatchObject({ isOwner: false, isMember: false })
  })

  it('null si no existe', async () => {
    expect(await getProjectPage('nada', null)).toBeNull()
  })
})

describe('getProjects (ranking)', () => {
  it('solo destacados, por rank', async () => {
    const owner = await createMember(payload, { username: 'duena' })
    const a = await createProject(payload, owner, { name: 'A' })
    const b = await createProject(payload, owner, { name: 'B' })
    await createProject(payload, owner, { name: 'C' })
    await payload.update({ collection: 'projects', id: a.id, data: { featured: true, rank: 2 }, overrideAccess: true })
    await payload.update({ collection: 'projects', id: b.id, data: { featured: true, rank: 1 }, overrideAccess: true })
    const ranking = await getProjects()
    expect(ranking.map((p) => p.name)).toEqual(['B', 'A'])
    expect(ranking[0].builder).toBe('@duena')
  })
})

describe('eventos con inscripción', () => {
  it('cupo real y marca si el miembro está inscrito', async () => {
    const { getEvents } = await import('@/lib/content')
    const { registerForEvent } = await import('@/lib/services/events')
    const a = await createMember(payload)
    const b = await createMember(payload)
    const ev = await payload.create({ collection: 'events', data: { name: 'Meetup', slug: 'meetup', type: 'Meetup', cap: 10 }, overrideAccess: true })
    await registerForEvent(payload, a, ev.id)
    await registerForEvent(payload, b, ev.id)
    const forA = await getEvents(a)
    expect(forA[0]).toMatchObject({ id: ev.id, taken: 2, registered: true })
    expect((await getEvents(null))[0].registered).toBe(false)
    expect((await getEvents(await createMember(payload)))[0].registered).toBe(false)
  })
})

describe('getParticipantData', () => {
  it('miembro nuevo: todo vacío', async () => {
    const { getParticipantData } = await import('@/lib/content')
    const m = await createMember(payload, { username: 'nuevo' })
    expect(await getParticipantData(m)).toEqual({ projects: [], invites: [], events: [] })
  })

  it('sus proyectos, invitaciones pendientes y eventos inscritos', async () => {
    const { getParticipantData } = await import('@/lib/content')
    const { inviteMember } = await import('@/lib/services/projects')
    const { registerForEvent } = await import('@/lib/services/events')
    const owner = await createMember(payload, { username: 'duena', name: 'Dueña' })
    const ana = await createMember(payload, { username: 'ana' })
    await createProject(payload, ana, { name: 'Propio' })
    const ajeno = await createProject(payload, owner, { name: 'Ajeno' })
    await inviteMember(payload, owner, ajeno.id, '@ana')
    const ev = await payload.create({ collection: 'events', data: { name: 'Taller', slug: 'taller', type: 'Taller', cap: 5 }, overrideAccess: true })
    await registerForEvent(payload, ana, ev.id)

    const data = await getParticipantData(ana)
    expect(data.projects.map((p) => p.name)).toEqual(['Propio'])
    expect(data.invites).toEqual([
      expect.objectContaining({ project: expect.objectContaining({ name: 'Ajeno', slug: 'ajeno' }), invitedBy: '@duena' }),
    ])
    expect(data.events.map((e) => e.name)).toEqual(['Taller'])
  })
})
