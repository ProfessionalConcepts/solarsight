import { NextResponse } from 'next/server'
import { getAppConfig, updateAppConfig } from '@/lib/server/store'

export const dynamic = 'force-dynamic'

export async function GET() {
  const cfg = getAppConfig()
  const formatted: Record<string, { value: any; updated_at: string }> = {}

  for (const [k, v] of Object.entries(cfg)) {
    formatted[k] = {
      value: v,
      updated_at: cfg.data_last_updated || new Date().toISOString(),
    }
  }

  return NextResponse.json(formatted)
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const updates = body.updates || body

    const updated = updateAppConfig(updates)
    return NextResponse.json(updated)
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message } }, { status: 400 })
  }
}
