import type { Access, FieldAccess } from 'payload'

export const PANEL_ROLES = ['admin', 'organizer', 'member'] as const
export type Role = (typeof PANEL_ROLES)[number]

const STAFF: Role[] = ['admin', 'organizer']

// Solo los miembros (única colección auth) tienen rol.
const roleOf = (user: unknown): Role | null => {
  const u = user as { collection?: string; role?: Role | null } | null | undefined
  return u?.collection === 'members' ? (u.role ?? null) : null
}

export const isAdminUser = (user: unknown): boolean => roleOf(user) === 'admin'
export const isStaffUser = (user: unknown): boolean => STAFF.includes(roleOf(user) as Role)

export const isAdmin: Access = ({ req: { user } }) => isAdminUser(user)
export const isStaff: Access = ({ req: { user } }) => isStaffUser(user)
export const isAdminField: FieldAccess = ({ req: { user } }) => isAdminUser(user)
export const isStaffField: FieldAccess = ({ req: { user } }) => isStaffUser(user)

// Sin esto, Payload deja escribir a cualquier usuario autenticado, incluidos miembros sin rol.
export const staffWrite = { create: isStaff, update: isStaff, delete: isStaff }
