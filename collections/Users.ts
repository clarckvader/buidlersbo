import type { CollectionConfig } from 'payload'
import { adminWrite, isAdmin } from './access'

// Administradores del panel /admin (no son los miembros de Pollar).
export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Admin', plural: 'Admins' },
  admin: { useAsTitle: 'email' },
  auth: true,
  access: { read: isAdmin, ...adminWrite },
  fields: [],
}
