import { beforeEach, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'
import type { Event } from '@/payload-types'
import { ServiceError } from '@/lib/services/projects'
import { cancelRegistration, countRegistrations, memberEventIds, registerForEvent } from '@/lib/services/events'
import { createMember, getTestPayload, resetDb } from './helpers'

let payload: Payload

const createEvent = (data: Partial<Event> = {}) =>
  payload.create({
    collection: 'events',
    data: { name: 'Meetup', slug: `ev-${Math.random().toString(36).slice(2)}`, type: 'Meetup', cap: 10, ...data } as Event,
    overrideAccess: true,
  })

beforeEach(async () => {
  payload = await getTestPayload()
  await resetDb(payload)
})

describe('registerForEvent', () => {
  it('inscribir dos veces cuenta una', async () => {
    const event = await createEvent()
    const m = await createMember(payload)
    await registerForEvent(payload, m, event.id)
    await registerForEvent(payload, m, event.id)
    expect((await countRegistrations(payload, [event.id])).get(String(event.id))).toBe(1)
    expect((await memberEventIds(payload, m.id)).has(String(event.id))).toBe(true)
  })

  it('evento lleno → 409', async () => {
    const event = await createEvent({ cap: 1 })
    await registerForEvent(payload, await createMember(payload), event.id)
    const err = await registerForEvent(payload, await createMember(payload), event.id).then(() => null, (e) => e)
    expect(err).toBeInstanceOf(ServiceError)
    expect((err as ServiceError).status).toBe(409)
  })

  it('cancelar libera cupo', async () => {
    const event = await createEvent({ cap: 1 })
    const a = await createMember(payload)
    await registerForEvent(payload, a, event.id)
    await cancelRegistration(payload, a, event.id)
    await registerForEvent(payload, await createMember(payload), event.id)
    expect((await countRegistrations(payload, [event.id])).get(String(event.id))).toBe(1)
  })

  it('evento inexistente → 404', async () => {
    const err = await registerForEvent(payload, await createMember(payload), 999999).then(() => null, (e) => e)
    expect((err as ServiceError).status).toBe(404)
  })
})

describe('countRegistrations', () => {
  it('0 para evento sin inscritos', async () => {
    const event = await createEvent()
    expect((await countRegistrations(payload, [event.id])).get(String(event.id))).toBe(0)
  })
})
