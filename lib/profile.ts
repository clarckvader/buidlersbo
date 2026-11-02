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
export const LIMITS = { stack: 15, links: 5, item: 60, building: 500, name: 80, tagline: 140, description: 2000, lookingFor: 10 }

// Lista de strings saneada: recorta, quita vacíos y duplicados, limita cantidad. undefined si no es lista.
export const cleanList = (v: unknown, max: number): string[] | undefined =>
  Array.isArray(v)
    ? [...new Set(v.filter((x): x is string => typeof x === 'string').map((x) => x.trim().slice(0, LIMITS.item)).filter(Boolean))].slice(0, max)
    : undefined

export const cleanLinks = (v: unknown): string[] =>
  (cleanList(v, LIMITS.links) ?? []).filter((l) => /^https?:\/\/\S+$/.test(l))
