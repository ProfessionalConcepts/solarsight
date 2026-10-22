import { NextResponse } from 'next/server'
import { updateLeadStatus } from '@/lib/server/store'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = await req.json()
  const { status } = body

  if (!status) {
    return NextResponse.json({ error: { message: 'Status is required' } }, { status: 400 })
  }

  const ok = updateLeadStatus(params.id, status)
  if (!ok) {
    return NextResponse.json({ error: { message: 'Lead not found' } }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
