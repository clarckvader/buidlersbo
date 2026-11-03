// A dónde volver después de iniciar sesión (ej. /unirse/<token>, /admin).
// Solo rutas internas: nunca redirigir a otro dominio.
type KV = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

const KEY = 'buidlers:next'

// Se valida resolviendo la URL (no por prefijo): el parser ignora tabs/saltos y trata `\` como `/`,
// así que '/\t/evil.com' sería https://evil.com. Si el origen cambia, se rechaza.
export function safeNextPath(path: string | null | undefined): string | null {
  if (!path || !path.startsWith('/')) return null
  const base = 'https://next.invalid'
  try {
    const url = new URL(path, base)
    return url.origin === base ? url.pathname + url.search + url.hash : null
  } catch {
    return null
  }
}

function session(): KV | null {
  try {
    return typeof window === 'undefined' ? null : window.sessionStorage
  } catch {
    return null
  }
}

export function rememberNext(path: string, storage: KV | null = session()): void {
  const safe = safeNextPath(path)
  if (!safe || !storage) return
  try {
    storage.setItem(KEY, safe)
  } catch {}
}

export function takeNext(storage: KV | null = session()): string | null {
  if (!storage) return null
  try {
    const value = safeNextPath(storage.getItem(KEY))
    storage.removeItem(KEY)
    return value
  } catch {
    return null
  }
}

// Al cerrar el modal sin iniciar sesión: que un login posterior no lleve a un destino viejo.
export function clearNext(storage: KV | null = session()): void {
  try {
    storage?.removeItem(KEY)
  } catch {}
}
