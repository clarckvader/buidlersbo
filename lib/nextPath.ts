// A dónde volver después de iniciar sesión (ej. /unirse/<token>, /admin).
// Solo rutas internas: nunca redirigir a otro dominio.
type KV = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

const KEY = 'buidlers:next'

export function safeNextPath(path: string | null | undefined): string | null {
  if (!path || !path.startsWith('/') || path.startsWith('//') || path.startsWith('/\\')) return null
  return path
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
