import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const lat = parseFloat(searchParams.get('lat') || '0')
  const lng = parseFloat(searchParams.get('lng') || '0')

  if (!lat || !lng) {
    return NextResponse.json({ label: 'Nairobi, Kenya' })
  }

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 4000)

    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'SolarSight/1.0 (Kenya Solar Engine contact@solarsight.co.ke)',
      },
    })
    clearTimeout(timer)

    if (res.ok) {
      const data = await res.json()
      if (data && data.display_name) {
        const parts = data.display_name.split(',').slice(0, 3).map((p: string) => p.trim())
        return NextResponse.json({ label: parts.join(', ') })
      }
    }
  } catch (err) {
    console.warn('Nominatim reverse geocode failed or timed out:', err)
  }

  return NextResponse.json({ label: `${lat.toFixed(4)}, ${lng.toFixed(4)}` })
}
