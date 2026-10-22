import { NextResponse } from 'next/server'
import { getInstallers } from '@/lib/server/store'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10)
  const body = await req.json()
  const installers = getInstallers()
  const idx = installers.findIndex((i) => i.id === id)

  if (idx === -1) {
    return NextResponse.json({ error: { message: 'Installer not found' } }, { status: 404 })
  }

  installers[idx] = {
    ...installers[idx],
    ...body,
    id,
  }

  return NextResponse.json(installers[idx])
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10)
  const installers = getInstallers()
  const idx = installers.findIndex((i) => i.id === id)

  if (idx === -1) {
    return NextResponse.json({ error: { message: 'Installer not found' } }, { status: 404 })
  }

  installers.splice(idx, 1)
  return NextResponse.json({ success: true })
}
