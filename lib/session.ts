import type { PayloadRequest } from 'payload'
import type { Member } from '../payload-types'
import { getSessionMember } from './memberSession'
import { ServiceError } from './services/projects'

// Para endpoints de miembro: devuelve el miembro de la cookie o una Response 401 lista para retornar.
export async function requireMember(req: PayloadRequest): Promise<Member | Response> {
  const member = await getSessionMember(req.payload, req.headers)
  return member ?? Response.json({ error: 'Sin sesión' }, { status: 401 })
}

// Envuelve un endpoint de miembro: exige sesión, responde JSON y traduce ServiceError a su status.
export function memberHandler(fn: (req: PayloadRequest, member: Member) => Promise<unknown>) {
  return async (req: PayloadRequest): Promise<Response> => {
    const member = await requireMember(req)
    if (member instanceof Response) return member
    try {
      return Response.json((await fn(req, member)) ?? { ok: true })
    } catch (err) {
      if (err instanceof ServiceError) return Response.json({ error: err.message }, { status: err.status })
      throw err
    }
  }
}

export async function readBody(req: PayloadRequest): Promise<Record<string, unknown>> {
  const body = await req.json?.().catch(() => null)
  return body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
}
