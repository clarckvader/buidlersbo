import { beforeEach, describe, expect, it } from 'vitest'
import type { Payload, PayloadRequest } from 'payload'
import { isAdmin, isStaff } from '@/collections/access'
import { applyAdminBootstrap } from '@/collections/Members'
import { createMember, getTestPayload, resetDb } from './helpers'

const reqWith = (role?: string) =>
  ({ req: { user: role ? { id: 1, collection: 'members', role } : null } as unknown as PayloadRequest })

describe('access', () => {
  it('isStaff: admin y organizer sí; member y anónimo no', () => {
    expect(isStaff(reqWith('admin'))).toBe(true)
    expect(isStaff(reqWith('organizer'))).toBe(true)
    expect(isStaff(reqWith('member'))).toBe(false)
    expect(isStaff(reqWith())).toBe(false)
  })

  it('isAdmin: solo admin', () => {
    expect(isAdmin(reqWith('admin'))).toBe(true)
    expect(isAdmin(reqWith('organizer'))).toBe(false)
    expect(isAdmin(reqWith())).toBe(false)
  })
})

describe('applyAdminBootstrap', () => {
  it('promueve a admin si el email está en la lista (sin mayúsculas ni espacios)', () => {
    expect(applyAdminBootstrap({ email: ' Roberto@X.com ', role: 'member' }, 'roberto@x.com, otro@y.com')).toBe('admin')
  })

  it('mantiene el rol existente si el email no está en la lista', () => {
    expect(applyAdminBootstrap({ email: 'ana@x.com', role: 'organizer' }, 'roberto@x.com')).toBe('organizer')
  })

  it('sin rol previo ni lista, queda member', () => {
    expect(applyAdminBootstrap({ email: null, role: null }, '')).toBe('member')
  })
})

describe('rol de miembro', () => {
  let payload: Payload
  beforeEach(async () => {
    payload = await getTestPayload()
    await resetDb(payload)
  })

  it('un miembro nuevo es member por defecto', async () => {
    const m = await createMember(payload)
    expect(m.role).toBe('member')
  })

  it('un organizer no puede cambiar roles', async () => {
    const organizer = await createMember(payload, { role: 'organizer' })
    const target = await createMember(payload)
    await expect(
      payload.update({
        collection: 'members',
        id: target.id,
        data: { role: 'admin' },
        overrideAccess: false,
        user: { ...organizer, collection: 'members' },
      }),
    ).rejects.toThrow()
    const after = await payload.findByID({ collection: 'members', id: target.id, overrideAccess: true })
    expect(after.role).toBe('member')
  })

  it('un admin sí puede cambiar roles', async () => {
    const admin = await createMember(payload, { role: 'admin' })
    const target = await createMember(payload)
    const updated = await payload.update({
      collection: 'members',
      id: target.id,
      data: { role: 'organizer' },
      overrideAccess: false,
      user: { ...admin, collection: 'members' },
    })
    expect(updated.role).toBe('organizer')
  })
})
