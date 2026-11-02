import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Member } from '../payload-types'
import { getSessionMember } from './memberSession'

// Miembro de la sesión para server components (lee la cookie de la request actual).
export async function getCurrentMember(): Promise<Member | null> {
  return getSessionMember(await getPayload({ config }), await headers())
}
