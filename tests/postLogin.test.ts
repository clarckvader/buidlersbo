import { describe, expect, it } from 'vitest'
import { postLoginRoute } from '@/lib/postLogin'

describe('postLoginRoute', () => {
  it('sin @usuario → bienvenida, y el login deja de contar como "recién"', () => {
    expect(postLoginRoute({ hasUsername: false, justLoggedIn: true, pathname: '/' })).toEqual({ to: '/bienvenida', consumeLogin: true })
  })

  it('ya en bienvenida sin @usuario → se queda', () => {
    expect(postLoginRoute({ hasUsername: false, justLoggedIn: false, pathname: '/bienvenida' })).toEqual({ to: null, consumeLogin: false })
  })

  it('guardar el @usuario en la bienvenida no la interrumpe', () => {
    // Tras el primer redirect, justLoggedIn ya se consumió.
    expect(postLoginRoute({ hasUsername: true, justLoggedIn: false, pathname: '/bienvenida' })).toEqual({ to: null, consumeLogin: false })
  })

  it('login nuevo con @usuario → destino guardado o panel', () => {
    expect(postLoginRoute({ hasUsername: true, justLoggedIn: true, pathname: '/', next: '/unirse/abc' })).toEqual({ to: '/unirse/abc', consumeLogin: true })
    expect(postLoginRoute({ hasUsername: true, justLoggedIn: true, pathname: '/' })).toEqual({ to: '/participante', consumeLogin: true })
  })

  it('sesión restaurada con @usuario → no redirige', () => {
    expect(postLoginRoute({ hasUsername: true, justLoggedIn: false, pathname: '/eventos' })).toEqual({ to: null, consumeLogin: false })
  })
})
