import { describe, expect, it } from 'vitest'
import { rememberNext, safeNextPath, takeNext } from '@/lib/nextPath'

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
  })

  it('no guarda destinos externos', () => {
    const s = memoryStorage()
    rememberNext('//evil.com', s)
    expect(takeNext(s)).toBeNull()
  })
})
