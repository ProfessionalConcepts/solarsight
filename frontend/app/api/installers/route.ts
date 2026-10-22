import { NextResponse } from 'next/server'
import { getInstallers, toPublicDetail } from '@/lib/server/store'

export const dynamic = 'force-dynamic'

export async function GET() {
  const installers = getInstallers().filter((i) => i.active)
  return NextResponse.json({
    installers: installers.map(toPublicDetail),
  })
}
