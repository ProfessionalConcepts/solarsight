import { NextResponse } from 'next/server'
import { createInstallerProfile, getInstallers, toPublicDetail } from '@/lib/server/store'
import type { AdminInstaller } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  const installers = getInstallers().filter((i) => i.active)
  return NextResponse.json({
    installers: installers.map(toPublicDetail),
  })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const requiredFields = ['name', 'phone', 'county', 'town', 'epra_license_no']
    if (requiredFields.some((field) => typeof body[field] !== 'string' || !body[field].trim())) {
      return NextResponse.json(
        { error: { message: 'Company name, phone, county, town, and EPRA license number are required.' } },
        { status: 400 }
      )
    }

    const installer = createInstallerProfile({
      name: body.name.trim(),
      phone: body.phone.trim(),
      county: body.county.trim(),
      town: body.town.trim(),
      epra_license_no: body.epra_license_no.trim(),
      service_radius_km: Math.min(300, Math.max(10, Number(body.service_radius_km) || 50)),
      bio: typeof body.bio === 'string' ? body.bio.trim() : '',
    } as Pick<AdminInstaller, 'name' | 'phone' | 'county' | 'town' | 'epra_license_no' | 'service_radius_km' | 'bio'>)

    return NextResponse.json({ success: true, installer }, { status: 201 })
  } catch {
    return NextResponse.json({ error: { message: 'Unable to submit company profile.' } }, { status: 400 })
  }
}
