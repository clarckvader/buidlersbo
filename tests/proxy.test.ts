import { describe, expect, it } from 'vitest'
import { adminRedirectTarget } from '@/proxy'

describe('adminRedirectTarget', () => {
  it('login del panel → login del sitio, volviendo a /admin', () => {
    expect(adminRedirectTarget('/admin/login')).toBe('/acceder?next=%2Fadmin')
  })

  it('logout del panel → logout del sitio', () => {
    expect(adminRedirectTarget('/admin/logout')).toBe('/salir')
    expect(adminRedirectTarget('/admin/logout-inactivity')).toBe('/salir')
  })

  it('el resto del panel no se toca', () => {
    expect(adminRedirectTarget('/admin')).toBeNull()
    expect(adminRedirectTarget('/admin/collections/events')).toBeNull()
  })
})
