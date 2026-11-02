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
