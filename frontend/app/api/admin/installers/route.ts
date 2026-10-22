import { NextResponse } from 'next/server'
import { getInstallers } from '@/lib/server/store'
import type { AdminInstaller } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  const installers = getInstallers()
  return NextResponse.json({ installers })
}

export async function POST(req: Request) {
  const body = await req.json()
  const installers = getInstallers()

  const newId = installers.length > 0 ? Math.max(...installers.map((i) => i.id)) + 1 : 1
  const newInstaller: AdminInstaller = {
    id: newId,
    name: body.name || 'New Installer',
    phone: body.phone,
    whatsapp: body.whatsapp || body.phone,
    county: body.county || 'Nairobi',
    town: body.town || 'Nairobi',
    lat: body.lat != null ? Number(body.lat) : -1.2921,
    lng: body.lng != null ? Number(body.lng) : 36.8219,
    service_radius_km: Number(body.service_radius_km || 50),
    epra_license_no: body.epra_license_no,
    epra_verified: Boolean(body.epra_verified),
    product_types: body.product_types || ['pv_hybrid', 'pv_gridtie'],
    size_min_kw: Number(body.size_min_kw || 0.5),
    size_max_kw: Number(body.size_max_kw || 20.0),
    rating_avg: body.rating_avg != null ? Number(body.rating_avg) : 5.0,
    rating_count: body.rating_count != null ? Number(body.rating_count) : 1,
    lead_fee_ksh: Number(body.lead_fee_ksh || 500),
    active: body.active !== false,
  }

  installers.unshift(newInstaller)
  return NextResponse.json({ id: newId }, { status: 201 })
}
