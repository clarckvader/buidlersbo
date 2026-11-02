import { beforeEach, describe, expect, it } from 'vitest'
import type { Endpoint, Payload, PayloadRequest } from 'payload'
import type { Member } from '@/payload-types'
import { MEMBER_COOKIE, signMemberSession } from '@/lib/memberSession'
import { createProject, getInviteToken, inviteMember } from '@/lib/services/projects'
import { createMember, getTestPayload, resetDb } from './helpers'

let payload: Payload

type Call = { member?: Member; body?: unknown; params?: Record<string, string> }

// Invoca el handler de un endpoint de colección tal como lo haría Payload.
async function call(slug: string, method: string, path: string, { member, body, params = {} }: Call = {}) {
  const endpoints = (payload.collections[slug as 'projects'].config.endpoints || []) as Endpoint[]
  const endpoint = endpoints.find((e) => e.method === method && e.path === path)
  if (!endpoint) throw new Error(`No existe ${method.toUpperCase()} ${slug}${path}`)
  const cookie = member ? `${MEMBER_COOKIE}=${await signMemberSession(member.id)}` : ''
  const req = {
    payload,
    headers: new Headers(cookie ? { cookie } : {}),
    routeParams: params,
    searchParams: new URLSearchParams(),
    json: async () => body ?? {},
  } as unknown as PayloadRequest
  const res = await endpoint.handler(req)
  return { status: res.status, body: await res.json() }
}

beforeEach(async () => {
  payload = await getTestPayload()
  await resetDb(payload)
})

describe('endpoints de proyectos', () => {
  it('sin sesión → 401', async () => {
    const res = await call('projects', 'post', '/create', { body: { name: 'X' } })
    expect(res.status).toBe(401)
  })

  it('create → proyecto del miembro', async () => {
    const m = await createMember(payload)
    const res = await call('projects', 'post', '/create', { member: m, body: { name: 'Pacha ID', stack: ['Rust'] } })
    expect(res.status).toBe(200)
    expect(res.body.project.slug).toBe('pacha-id')
    expect(res.body.project).not.toHaveProperty('inviteToken')
  })

  it('invite-link por no-dueño → 403; por dueño → token', async () => {
    const owner = await createMember(payload)
    const other = await createMember(payload)
    const project = await createProject(payload, owner, { name: 'Pacha' })
    const params = { id: String(project.id) }
    expect((await call('projects', 'get', '/:id/invite-link', { member: other, params })).status).toBe(403)
    const ok = await call('projects', 'get', '/:id/invite-link', { member: owner, params })
    expect(ok.body.token).toBe(await getInviteToken(payload, owner, project.id))
  })

  it('join con token → une al miembro', async () => {
    const owner = await createMember(payload)
    const other = await createMember(payload)
    const project = await createProject(payload, owner, { name: 'Pacha' })
    const res = await call('projects', 'post', '/join', { member: other, body: { token: await getInviteToken(payload, owner, project.id) } })
    expect(res.status).toBe(200)
    expect(res.body.project.slug).toBe('pacha')
  })

  it('error de servicio se devuelve con su status y mensaje', async () => {
    const m = await createMember(payload)
    const res = await call('projects', 'post', '/join', { member: m, body: { token: 'nope' } })
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Este enlace ya no es válido')
  })
})

describe('ids desde la URL (texto)', () => {
  it('invitar con el id del proyecto como string funciona', async () => {
    const owner = await createMember(payload)
    await createMember(payload, { username: 'ana' })
    const project = await createProject(payload, owner, { name: 'Pacha' })
    const res = await call('projects', 'post', '/:id/invite', { member: owner, params: { id: String(project.id) }, body: { identifier: '@ana' } })
    expect(res.status).toBe(200)
    expect(res.body.invite.status).toBe('pending')
  })
})

describe('endpoints de invitaciones', () => {
  it('mine devuelve solo las del miembro, con proyecto', async () => {
    const owner = await createMember(payload)
    const ana = await createMember(payload, { username: 'ana' })
    await createMember(payload, { username: 'beto' })
    const project = await createProject(payload, owner, { name: 'Pacha' })
    await inviteMember(payload, owner, project.id, '@ana')
    await inviteMember(payload, owner, project.id, '@beto')
    const res = await call('project-invites', 'get', '/mine', { member: ana })
    expect(res.body.invites).toHaveLength(1)
    expect(res.body.invites[0].project.name).toBe('Pacha')
  })
})

describe('rutas propias no pisan las de Payload', () => {
  it('ningún endpoint propio comparte método y ruta con uno de Payload', () => {
    for (const slug of ['projects', 'project-invites', 'event-registrations', 'members']) {
      const keys = ((payload.collections[slug as 'projects'].config.endpoints || []) as Endpoint[]).map(
        (e) => `${e.method} ${e.path.replace(/:[a-zA-Z]+/g, ':p')}`,
      )
      expect(keys.filter((k, i) => keys.indexOf(k) !== i)).toEqual([])
    }
  })
})

describe('endpoints de inscripción', () => {
  it('inscribir y cancelar', async () => {
    const m = await createMember(payload)
    const event = await payload.create({ collection: 'events', data: { name: 'Meetup', slug: 'meetup', type: 'Meetup', cap: 5 }, overrideAccess: true })
    const params = { eventId: String(event.id) }
    expect((await call('event-registrations', 'post', '/event/:eventId', { member: m, params })).status).toBe(200)
    expect((await payload.count({ collection: 'event-registrations', overrideAccess: true })).totalDocs).toBe(1)
    expect((await call('event-registrations', 'delete', '/event/:eventId', { member: m, params })).status).toBe(200)
    expect((await payload.count({ collection: 'event-registrations', overrideAccess: true })).totalDocs).toBe(0)
  })
})
