import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    '/modulos',
    '/dashboard/:path*',
    '/inspecao/:path*',
    '/equipamentos/:path*',
    '/qr-codes/:path*',
    '/relatorios/:path*',
    '/usuarios/:path*',
  ],
}
