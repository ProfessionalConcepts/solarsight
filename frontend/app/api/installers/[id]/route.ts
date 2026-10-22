import { NextResponse } from 'next/server'
import { getInstallerById, updateInstaller, toPublicDetail } from '@/lib/server/store'

export const dynamic = 'force-dynamic'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10)
  const installer = getInstallerById(id)

  if (!installer) {
    return NextResponse.json({ error: { message: 'Installer not found' } }, { status: 404 })
  }

  return NextResponse.json(installer)
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10)
  const body = await req.json()

  const updated = updateInstaller(id, body)

  if (!updated) {
    return NextResponse.json({ error: { message: 'Installer not found' } }, { status: 404 })
  }

  return NextResponse.json({
    success: true,
    installer: updated,
  })
}
