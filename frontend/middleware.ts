import { NextResponse } from 'next/server'

export default function middleware() {
  return NextResponse.next()
}

export const config = {
  // Match all pathnames except for
  // - /api routes
  // - /_next (Next.js internals)
  // - /_vercel (Vercel internals)
  // - /.*\..* (static files)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
  runtime: 'experimental-edge', // or 'edge'
}
