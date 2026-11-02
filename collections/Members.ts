import type { CollectionConfig, PayloadRequest } from 'payload'
import { verifyPollarToken } from '../lib/pollar'
import { getSessionMember, memberCookie, signMemberSession } from '../lib/memberSession'
import { isAdmin } from './access'
import { INTERESTS, LIMITS, ROLES, USERNAME_RE } from '../lib/profile'

const cleanList = (v: unknown, max: number) =>
  Array.isArray(v)
    ? [...new Set(v.filter((x): x is string => typeof x === 'string').map((x) => x.trim().slice(0, LIMITS.item)).filter(Boolean))].slice(0, max)
    : undefined
const pick = <T extends string>(v: unknown, allowed: readonly T[]) => cleanList(v, allowed.length)?.filter((x): x is T => (allowed as readonly string[]).includes(x))

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
  // No es una colección `auth` de Payload: la sesión de miembro (cookie propia) no debe
  // mezclarse con la de los admins del panel. Solo los admins leen/escriben por la API.
  access: { read: isAdmin, create: isAdmin, update: isAdmin, delete: isAdmin },
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

        const data = {
          pollarUserId: identity.userId,
          email: identity.email,
          name: identity.name,
          avatar: identity.avatar,
          wallet: identity.wallet,
          authProvider: identity.authProvider,
          lastLoginAt: new Date().toISOString(),
        }
        const { docs } = await req.payload.find({
          collection: 'members',
          where: { pollarUserId: { equals: identity.userId } },
          limit: 1,
          depth: 0,
          overrideAccess: true,
        })
        const member = docs[0]
          ? await req.payload.update({ collection: 'members', id: docs[0].id, data, overrideAccess: true })
          : await req.payload.create({ collection: 'members', data, overrideAccess: true })

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
          data.links = (cleanList(body.links, LIMITS.links) ?? []).filter((l) => /^https?:\/\/\S+$/.test(l))
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
    { name: 'username', type: 'text', label: '@usuario', unique: true, index: true },
    { name: 'name', type: 'text', label: 'Nombre' },
    { name: 'email', type: 'email', label: 'Email' },
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
