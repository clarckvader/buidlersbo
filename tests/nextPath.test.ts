import { describe, expect, it } from 'vitest'
import { clearNext, rememberNext, safeNextPath, takeNext } from '@/lib/nextPath'

function memoryStorage() {
  const map = new Map<string, string>()
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  }
}

describe('nextPath', () => {
  it('guarda y devuelve una ruta interna una sola vez', () => {
    const s = memoryStorage()
    rememberNext('/unirse/abc', s)
    expect(takeNext(s)).toBe('/unirse/abc')
    expect(takeNext(s)).toBeNull()
  })

  it('rechaza destinos externos', () => {
    expect(safeNextPath('https://evil.com')).toBeNull()
    expect(safeNextPath('//evil.com')).toBeNull()
    expect(safeNextPath('/\\evil.com')).toBeNull()
    expect(safeNextPath('/admin')).toBe('/admin')
    // El parser de URL elimina tabs y saltos de línea: '/\t/evil.com' → https://evil.com
    expect(safeNextPath('/\t/evil.com')).toBeNull()
    expect(safeNextPath('/\n/evil.com')).toBeNull()
    expect(safeNextPath('/proyectos/x?ref=1#equipo')).toBe('/proyectos/x?ref=1#equipo')
  })

  it('no guarda destinos externos', () => {
    const s = memoryStorage()
    rememberNext('//evil.com', s)
    expect(takeNext(s)).toBeNull()
  })

  it('clearNext descarta un destino pendiente (modal cerrado sin login)', () => {
    const s = memoryStorage()
    rememberNext('/proyectos/nuevo', s)
    clearNext(s)
    expect(takeNext(s)).toBeNull()
  })
})
