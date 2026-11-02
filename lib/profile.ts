// Opciones y reglas del perfil de miembro, compartidas entre la colección (server) y el stepper (client).
import { slugify } from './slugify'

export const ROLES = ['Desarrollo', 'Diseño', 'Producto', 'Comunidad', 'Investigación', 'Negocios', 'Estudiante'] as const

export const INTERESTS = [
  'DeFi', 'Pagos', 'Identidad', 'ZK', 'DAOs', 'Infraestructura', 'RWA', 'NFTs & cultura', 'Educación', 'IA',
] as const

export const STACK_SUGGESTIONS = [
  'Soroban', 'Rust', 'TypeScript', 'Solidity', 'Go', 'Python', 'React', 'Next.js', 'Foundry', 'Node.js',
]

export const USERNAME_RE = /^[a-z0-9_]{3,20}$/
export const USERNAME_HINT = '3–20 caracteres: minúsculas, números o _'

export function suggestUsername(name: string | null | undefined): string {
  const base = slugify(name ?? '').replace(/-/g, '_').replace(/[^a-z0-9_]/g, '')
  return base.slice(0, 20)
}

// Límites para lo que llega del cliente.
export const LIMITS = { stack: 15, links: 5, item: 60, link: 300, building: 500, name: 80, tagline: 140, description: 2000, lookingFor: 10 }

// Lista de strings saneada: recorta, quita vacíos y duplicados, limita cantidad. undefined si no es lista.
export const cleanList = (v: unknown, max: number): string[] | undefined =>
  Array.isArray(v)
    ? [...new Set(v.filter((x): x is string => typeof x === 'string').map((x) => x.trim().slice(0, LIMITS.item)).filter(Boolean))].slice(0, max)
    : undefined

// Un link http(s) válido, o null. Completa https:// si viene como "github.com/x". Sin recortar:
// una URL cortada se publicaría rota.
export function normalizeLink(raw: string): string | null {
  let link = raw.trim()
  if (!link || link.length > LIMITS.link) return null
  if (!/^[a-z][a-z0-9+.-]*:/i.test(link) && /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(link)) link = `https://${link}`
  try {
    const url = new URL(link)
    return (url.protocol === 'https:' || url.protocol === 'http:') && !/\s/.test(link) ? link : null
  } catch {
    return null
  }
}

const rawLinks = (v: unknown): string[] =>
  Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === 'string').map((x) => x.trim()).filter(Boolean))] : []

// Perfil: tolerante, descarta lo inválido.
export const cleanLinks = (v: unknown): string[] =>
  rawLinks(v).map(normalizeLink).filter((l): l is string => !!l).slice(0, LIMITS.links)

// Proyecto: estricto, devuelve también los inválidos para poder avisar.
export function checkLinks(v: unknown): { links: string[]; invalid: string[] } {
  const raw = rawLinks(v).slice(0, LIMITS.links)
  const links: string[] = []
  const invalid: string[] = []
  for (const l of raw) {
    const ok = normalizeLink(l)
    if (ok) links.push(ok)
    else invalid.push(l)
  }
  return { links, invalid }
}

export const PROJECT_STATUS = ['idea', 'construyendo', 'lanzado'] as const
export type ProjectStatus = (typeof PROJECT_STATUS)[number]
