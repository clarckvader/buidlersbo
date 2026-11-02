import type { PayloadRequest } from 'payload'
import type { Member } from '../payload-types'
import { getSessionMember } from './memberSession'

// Para endpoints de miembro: devuelve el miembro de la cookie o una Response 401 lista para retornar.
export async function requireMember(req: PayloadRequest): Promise<Member | Response> {
  const member = await getSessionMember(req.payload, req.headers)
  return member ?? Response.json({ error: 'Sin sesión' }, { status: 401 })
}
