import { describe, expect, it } from 'vitest'
import { createMember, getTestPayload } from './helpers'

describe('harness', () => {
  it('usa la base de tests, nunca producción', async () => {
    const payload = await getTestPayload()
    const pool = (payload.db as unknown as { pool: { options: { connectionString: string } } }).pool
    expect(pool.options.connectionString).toContain('buidlers_test')
  })

  it('createMember crea un miembro con id', async () => {
    const payload = await getTestPayload()
    const member = await createMember(payload)
    expect(member.id).toBeDefined()
    expect(member.pollarUserId).toMatch(/^test-/)
  })
})
