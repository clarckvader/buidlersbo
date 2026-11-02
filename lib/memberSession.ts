// Sesión de miembros: cookie httpOnly con un JWT propio, separada de la de admins de Payload.
import { SignJWT, jwtVerify } from 'jose'
import type { Payload } from 'payload'
import { parseCookies } from 'payload/shared'
import type { Member } from '../payload-types'

export const MEMBER_COOKIE = 'buidlers-member'
const MAX_AGE = 60 * 60 * 24 * 30 // 30 días

const key = () => new TextEncoder().encode(process.env.PAYLOAD_SECRET || '')

export async function signMemberSession(memberId: string | number): Promise<string> {
  return new SignJWT({ kind: 'member' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(memberId))
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(key())
}

export async function readMemberSession(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ['HS256'] })
    return payload.kind === 'member' && payload.sub ? payload.sub : null
  } catch {
    return null
  }
}

export function memberCookie(value: string | null): string {
  const parts = [
    `${MEMBER_COOKIE}=${value ?? ''}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${value ? MAX_AGE : 0}`,
  ]
  if (process.env.NODE_ENV === 'production') parts.push('Secure')
  return parts.join('; ')
}

// Lee la cookie de la request y devuelve el miembro, o null si no hay sesión válida.
export async function getSessionMember(payload: Payload, headers: Headers): Promise<Member | null> {
  const token = parseCookies(headers).get(MEMBER_COOKIE)
  const id = token ? await readMemberSession(token) : null
  if (!id) return null
  return payload.findByID({ collection: 'members', id, depth: 0, disableErrors: true, overrideAccess: true })
}
