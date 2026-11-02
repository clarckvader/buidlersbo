import { beforeEach, describe, expect, it } from 'vitest'
import type { Payload, PayloadRequest } from 'payload'
import { requireMember } from '@/lib/session'
import { MEMBER_COOKIE, signMemberSession } from '@/lib/memberSession'
import { createMember, getTestPayload, resetDb } from './helpers'

const reqWithCookie = (payload: Payload, cookie?: string) =>
  ({ payload, headers: new Headers(cookie ? { cookie } : {}) }) as unknown as PayloadRequest

describe('requireMember', () => {
  let payload: Payload
  beforeEach(async () => {
    payload = await getTestPayload()
    await resetDb(payload)
  })

  it('sin cookie devuelve una Response 401', async () => {
    const result = await requireMember(reqWithCookie(payload))
    expect(result).toBeInstanceOf(Response)
    expect((result as Response).status).toBe(401)
  })

  it('con cookie válida devuelve el miembro', async () => {
    const m = await createMember(payload, { name: 'Ana' })
    const result = await requireMember(reqWithCookie(payload, `${MEMBER_COOKIE}=${await signMemberSession(m.id)}`))
    expect(result).not.toBeInstanceOf(Response)
    expect((result as { id: unknown }).id).toBe(m.id)
  })
})
