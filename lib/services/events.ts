// Inscripción de miembros a eventos.
import type { Payload } from 'payload'
import type { Member } from '../../payload-types'
import { ServiceError } from './projects'

type ID = number | string

// Día de hoy (UTC) como YYYY-MM-DD; las fechas de eventos se guardan a mediodía UTC.
export const todayIso = () => new Date().toISOString().slice(0, 10)
const relId = (v: unknown) => String(v && typeof v === 'object' ? (v as { id: ID }).id : v)

async function findRegistration(payload: Payload, memberId: ID, eventId: ID) {
  const { docs } = await payload.find({
    collection: 'event-registrations',
    where: { event: { equals: eventId }, member: { equals: memberId } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return docs[0] ?? null
}

// Idempotente. Si el evento tiene cupo y está lleno → 409.
export async function registerForEvent(payload: Payload, member: Member, eventId: ID): Promise<void> {
  const event = await payload.findByID({ collection: 'events', id: eventId, depth: 0, overrideAccess: true, disableErrors: true })
  if (!event) throw new ServiceError(404, 'Evento no encontrado')
  if (await findRegistration(payload, member.id, eventId)) return
  if (event.date && event.date.slice(0, 10) < todayIso()) throw new ServiceError(409, 'El evento ya pasó')

  const taken = (await countRegistrations(payload, [eventId])).get(String(eventId)) ?? 0
  if (event.cap && taken >= event.cap) throw new ServiceError(409, 'El evento está lleno')

  try {
    await payload.create({ collection: 'event-registrations', data: { event: event.id, member: member.id }, depth: 0, overrideAccess: true })
  } catch (err) {
    if (!(await findRegistration(payload, member.id, eventId))) throw err
  }
}

export async function cancelRegistration(payload: Payload, member: Member, eventId: ID): Promise<void> {
  await payload.delete({
    collection: 'event-registrations',
    where: { event: { equals: eventId }, member: { equals: member.id } },
    overrideAccess: true,
  })
}

export async function countRegistrations(payload: Payload, eventIds: ID[]): Promise<Map<string, number>> {
  const counts = new Map(eventIds.map((id) => [String(id), 0]))
  if (!eventIds.length) return counts
  const { docs } = await payload.find({
    collection: 'event-registrations',
    where: { event: { in: eventIds } },
    limit: 0,
    depth: 0,
    select: { event: true },
    overrideAccess: true,
  })
  for (const r of docs) counts.set(relId(r.event), (counts.get(relId(r.event)) ?? 0) + 1)
  return counts
}

export async function memberEventIds(payload: Payload, memberId: ID): Promise<Set<string>> {
  const { docs } = await payload.find({
    collection: 'event-registrations',
    where: { member: { equals: memberId } },
    limit: 0,
    depth: 0,
    select: { event: true },
    overrideAccess: true,
  })
  return new Set(docs.map((r) => relId(r.event)))
}
