import { randomUUID } from 'crypto'
import { getPayload, type CollectionSlug, type Payload } from 'payload'
import config from '@payload-config'
import type { Member } from '@/payload-types'

export function getTestPayload(): Promise<Payload> {
  return getPayload({ config })
}

export function createMember(payload: Payload, data: Partial<Member> = {}): Promise<Member> {
  return payload.create({
    collection: 'members',
    data: { pollarUserId: `test-${randomUUID()}`, ...data } as Member,
    overrideAccess: true,
  })
}

// Orden: primero lo que referencia a otras colecciones.
const RESET_ORDER = ['event-registrations', 'project-invites', 'project-members', 'projects', 'events', 'members']

export async function resetDb(payload: Payload): Promise<void> {
  for (const slug of RESET_ORDER) {
    if (!payload.collections[slug as CollectionSlug]) continue
    await payload.delete({ collection: slug as CollectionSlug, where: { id: { exists: true } }, overrideAccess: true })
  }
}
