import { beforeEach, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'
import { createProject, getInviteToken, inviteMember, joinByToken } from '@/lib/services/projects'
import { registerForEvent } from '@/lib/services/events'
import { createMember, getTestPayload, resetDb } from './helpers'

let payload: Payload
const count = async (collection: 'project-members' | 'project-invites' | 'event-registrations') =>
  (await payload.count({ collection, overrideAccess: true })).totalDocs

beforeEach(async () => {
  payload = await getTestPayload()
  await resetDb(payload)
})

describe('borrado desde el panel (staff) limpia lo relacionado', () => {
  it('borrar un proyecto borra integrantes e invitaciones', async () => {
    const owner = await createMember(payload)
    await createMember(payload, { username: 'ana' })
    const project = await createProject(payload, owner, { name: 'Pacha' })
    await inviteMember(payload, owner, project.id, '@ana')
    await payload.delete({ collection: 'projects', id: project.id, overrideAccess: true })
    expect(await count('project-members')).toBe(0)
    expect(await count('project-invites')).toBe(0)
  })

  it('borrar un evento borra sus inscripciones', async () => {
    const event = await payload.create({ collection: 'events', data: { name: 'M', slug: 'm', type: 'Meetup', cap: 5 }, overrideAccess: true })
    await registerForEvent(payload, await createMember(payload), event.id)
    await payload.delete({ collection: 'events', id: event.id, overrideAccess: true })
    expect(await count('event-registrations')).toBe(0)
  })

  it('borrar un miembro borra sus membresías, inscripciones e invitaciones', async () => {
    const owner = await createMember(payload)
    const ana = await createMember(payload, { username: 'ana' })
    const project = await createProject(payload, owner, { name: 'Pacha' })
    await joinByToken(payload, ana, await getInviteToken(payload, owner, project.id))
    const other = await createProject(payload, owner, { name: 'Otro' })
    await inviteMember(payload, owner, other.id, '@ana')
    const event = await payload.create({ collection: 'events', data: { name: 'M', slug: 'm2', type: 'Meetup', cap: 5 }, overrideAccess: true })
    await registerForEvent(payload, ana, event.id)
    await payload.delete({ collection: 'members', id: ana.id, overrideAccess: true })
    expect(await count('project-members')).toBe(2) // quedan los dos dueños
    expect(await count('project-invites')).toBe(0)
    expect(await count('event-registrations')).toBe(0)
  })

  it('no se puede borrar un miembro que es dueño de proyectos', async () => {
    const owner = await createMember(payload)
    await createProject(payload, owner, { name: 'Pacha' })
    await expect(payload.delete({ collection: 'members', id: owner.id, overrideAccess: true })).rejects.toThrow(/dueño/)
  })
})
