import { NextResponse } from 'next/server'
import { matchInstallers } from '@/lib/server/store'
import type { InstallerPublic } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const lat = Number(searchParams.get('lat') ?? -1.2921)
  const lng = Number(searchParams.get('lng') ?? 36.8219)
  const kwp = Number(searchParams.get('kwp') ?? 3.0)

  const matched = matchInstallers(lat, lng, kwp, 10)

  const publicList: InstallerPublic[] = matched.map((inst) => ({
    id: inst.id,
    name: inst.name,
    area: `${inst.town || ''}${inst.town && inst.county ? ', ' : ''}${inst.county || 'Kenya'}`.trim(),
    rating_avg: inst.rating_avg ?? null,
    rating_count: inst.rating_count ?? 0,
    epra_verified: Boolean(inst.epra_verified),
  }))

  return NextResponse.json(publicList)
}
