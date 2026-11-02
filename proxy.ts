import { NextResponse, type NextRequest } from 'next/server'

// El panel no tiene login propio: se entra con la sesión de miembro (Pollar) del sitio.
export function adminRedirectTarget(pathname: string): string | null {
  if (pathname === '/admin/login') return `/acceder?next=${encodeURIComponent('/admin')}`
  if (pathname.startsWith('/admin/logout')) return '/salir'
  return null
}

export function proxy(request: NextRequest) {
  const target = adminRedirectTarget(request.nextUrl.pathname)
  return target ? NextResponse.redirect(new URL(target, request.url)) : NextResponse.next()
}

export const config = { matcher: ['/admin/login', '/admin/logout/:path*', '/admin/logout-inactivity'] }
