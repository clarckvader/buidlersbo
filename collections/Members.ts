import { APIError, type CollectionConfig, type PayloadRequest } from 'payload'
import { hasVerifiedEmail, verifyPollarToken } from '../lib/pollar'
import { claimEmailInvites } from '../lib/services/projects'
import { getSessionMember, memberCookie, signMemberSession } from '../lib/memberSession'
import { isAdmin, isAdminField, isStaff, isStaffUser, type Role } from './access'
import { INTERESTS, LIMITS, ROLES, USERNAME_RE, cleanLinks, cleanList } from '../lib/profile'

const pick = <T extends string>(v: unknown, allowed: readonly T[]) => cleanList(v, allowed.length)?.filter((x): x is T => (allowed as readonly string[]).includes(x))

// Primer admin: emails en ADMIN_EMAILS (separados por comas) quedan como admin al iniciar sesión,
// solo si el proveedor verifica el email. Nunca baja un rol existente.
export function applyAdminBootstrap(
  member: { email?: string | null; role?: string | null; authProvider?: string | null },
  list: string = process.env.ADMIN_EMAILS ?? '',
): Role {
  const normalize = (e: string) => e.trim().toLowerCase()
  const admins = list.split(',').map(normalize).filter(Boolean)
  if (member.email && hasVerifiedEmail(member.authProvider) && admins.includes(normalize(member.email))) return 'admin'
  return (member.role as Role) || 'member'
}

async function usernameTaken(req: PayloadRequest, username: string, exceptId?: number | string) {
  const { docs } = await req.payload.find({
    collection: 'members',
    where: { username: { equals: username }, ...(exceptId ? { id: { not_equals: exceptId } } : {}) },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return docs.length > 0
}

// Miembros de la comunidad. Se autentican con Pollar; no tienen contraseña.
export const Members: CollectionConfig = {
  slug: 'members',
  labels: { singular: 'Miembro', plural: 'Miembros' },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'username', 'email', 'lastLoginAt'] },
  // Es la colección de usuarios del panel: se autentica con la cookie de miembro (login de Pollar),
  // sin contraseña. Solo staff entra a /admin; solo admins gestionan miembros y roles.
  auth: {
    disableLocalStrategy: true,
    strategies: [
      {
        name: 'pollar-session',
        authenticate: async ({ payload, headers }) => {
          const member = await getSessionMember(payload, headers)
          return { user: member ? { ...member, collection: 'members' as const, _strategy: 'pollar-session' } : null }
        },
      },
    ],
  },
  access: { admin: ({ req }) => isStaffUser(req.user), read: isStaff, create: isAdmin, update: isAdmin, delete: isAdmin },
  hooks: {
    // Borrar un miembro (solo admins) limpia su participación; no si es dueño de proyectos.
    beforeDelete: [
      async ({ req, id }) => {
        const owned = await req.payload.count({ collection: 'projects', where: { owner: { equals: id } }, req, overrideAccess: true })
        if (owned.totalDocs > 0) {
          throw new APIError('No se puede borrar: es dueño de proyectos. Bórralos primero.', 400, null, true)
        }
        await req.payload.delete({ collection: 'project-members', where: { member: { equals: id } }, req, overrideAccess: true })
        await req.payload.delete({ collection: 'event-registrations', where: { member: { equals: id } }, req, overrideAccess: true })
        await req.payload.delete({
          collection: 'project-invites',
          where: { or: [{ member: { equals: id } }, { invitedBy: { equals: id } }] },
          req,
          overrideAccess: true,
        })
      },
    ],
  },
  endpoints: [
    {
      // Miembro de la sesión actual (o null).
      path: '/session',
      method: 'get',
      handler: async (req) => Response.json({ member: await getSessionMember(req.payload, req.headers) }),
    },
    {
      // Recibe el access token del SDK, lo verifica con Pollar y abre la sesión.
      path: '/session',
      method: 'post',
      handler: async (req) => {
        const body = (await req.json?.().catch(() => null)) as { token?: unknown } | null
        const token = typeof body?.token === 'string' ? body.token : null
        if (!token) return Response.json({ error: 'Falta el token' }, { status: 400 })

        const identity = await verifyPollarToken(token)
        if (!identity) return Response.json({ error: 'Token de Pollar inválido' }, { status: 401 })

        const { docs } = await req.payload.find({
          collection: 'members',
          where: { pollarUserId: { equals: identity.userId } },
          limit: 1,
          depth: 0,
          overrideAccess: true,
        })
        const data = {
          role: applyAdminBootstrap({ email: identity.email, role: docs[0]?.role, authProvider: identity.authProvider }),
          pollarUserId: identity.userId,
          email: identity.email,
          name: identity.name,
          avatar: identity.avatar,
          wallet: identity.wallet,
          authProvider: identity.authProvider,
          lastLoginAt: new Date().toISOString(),
        }
        const member = docs[0]
          ? await req.payload.update({ collection: 'members', id: docs[0].id, data, overrideAccess: true })
          : await req.payload.create({ collection: 'members', data, overrideAccess: true })
        // Invitaciones a proyectos enviadas a su correo antes de que fuera miembro.
        await claimEmailInvites(req.payload, member)

        return Response.json(
          { member },
          { headers: { 'Set-Cookie': memberCookie(await signMemberSession(member.id)) } },
        )
      },
    },
    {
      // ¿Está libre este @usuario? Lo usa el stepper mientras se escribe.
      path: '/username',
      method: 'get',
      handler: async (req) => {
        const username = String(req.searchParams.get('u') ?? '').toLowerCase()
        if (!USERNAME_RE.test(username)) return Response.json({ valid: false, available: false })
        const me = await getSessionMember(req.payload, req.headers)
        return Response.json({ valid: true, available: !(await usernameTaken(req, username, me?.id)) })
      },
    },
    {
      // El miembro actualiza su propio perfil (stepper / más adelante, su página de perfil).
      path: '/profile',
      method: 'patch',
      handler: async (req) => {
        const me = await getSessionMember(req.payload, req.headers)
        if (!me) return Response.json({ error: 'Sin sesión' }, { status: 401 })
        const body = ((await req.json?.().catch(() => null)) ?? {}) as Record<string, unknown>

        const data: Record<string, unknown> = {}
        if ('username' in body) {
          const username = String(body.username ?? '').toLowerCase()
          if (!USERNAME_RE.test(username)) return Response.json({ error: 'Usuario inválido' }, { status: 400 })
          if (await usernameTaken(req, username, me.id)) return Response.json({ error: 'Ese usuario ya está tomado' }, { status: 409 })
          data.username = username
        }
        if ('roles' in body) data.roles = pick(body.roles, ROLES) ?? []
        if ('interests' in body) data.interests = pick(body.interests, INTERESTS) ?? []
        if ('stack' in body) data.stack = cleanList(body.stack, LIMITS.stack) ?? []
        if ('links' in body) {
          data.links = cleanLinks(body.links)
        }
        if ('building' in body) data.building = String(body.building ?? '').trim().slice(0, LIMITS.building)
        if (body.finishOnboarding === true && !me.onboardedAt) data.onboardedAt = new Date().toISOString()

        const member = await req.payload.update({ collection: 'members', id: me.id, data, overrideAccess: true })
        return Response.json({ member })
      },
    },
    {
      path: '/session',
      method: 'delete',
      handler: () => Response.json({ ok: true }, { headers: { 'Set-Cookie': memberCookie(null) } }),
    },
  ],
  fields: [
    { name: 'pollarUserId', type: 'text', label: 'Pollar user ID', required: true, unique: true, index: true, admin: { readOnly: true } },
    {
      name: 'role',
      type: 'select',
      label: 'Rol',
      required: true,
      defaultValue: 'member',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Organizador', value: 'organizer' },
        { label: 'Miembro', value: 'member' },
      ],
      access: { update: isAdminField },
      admin: { position: 'sidebar' },
    },
    { name: 'username', type: 'text', label: '@usuario', unique: true, index: true },
    { name: 'name', type: 'text', label: 'Nombre' },
    {
      name: 'email',
      type: 'email',
      label: 'Email',
      // Normalizado para buscar invitaciones por correo con igualdad exacta.
      hooks: { beforeValidate: [({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() || null : value)] },
    },
    { name: 'avatar', type: 'text', label: 'Avatar (URL)', admin: { readOnly: true } },
    { name: 'wallet', type: 'text', label: 'Wallet', admin: { readOnly: true } },
    { name: 'authProvider', type: 'text', label: 'Proveedor', admin: { readOnly: true } },
    { name: 'lastLoginAt', type: 'date', label: 'Último acceso', admin: { readOnly: true } },
    {
      type: 'collapsible',
      label: 'Perfil',
      fields: [
        { name: 'roles', type: 'select', label: 'Qué hace', hasMany: true, options: [...ROLES] },
        { name: 'interests', type: 'select', label: 'Intereses', hasMany: true, options: [...INTERESTS] },
        { name: 'stack', type: 'text', label: 'Stack', hasMany: true },
        { name: 'building', type: 'textarea', label: 'Qué está construyendo' },
        { name: 'links', type: 'text', label: 'Links', hasMany: true },
        { name: 'onboardedAt', type: 'date', label: 'Completó la bienvenida', admin: { readOnly: true } },
      ],
    },
  ],
}
