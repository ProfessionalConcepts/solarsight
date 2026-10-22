import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const KENYA_LOCATIONS = [
  { label: 'Kilimani, Nairobi', lat: -1.2921, lng: 36.785 },
  { label: 'Westlands, Nairobi', lat: -1.2678, lng: 36.8122 },
  { label: 'Karen, Nairobi', lat: -1.3197, lng: 36.7065 },
  { label: 'CBD, Nairobi', lat: -1.2833, lng: 36.8219 },
  { label: 'Upper Hill, Nairobi', lat: -1.2995, lng: 36.8167 },
  { label: 'Gigiri, Nairobi', lat: -1.2333, lng: 36.8 },
  { label: 'Nakuru Town, Nakuru', lat: -0.2833, lng: 36.0667 },
  { label: 'Kisumu Central, Kisumu', lat: -0.0917, lng: 34.768 },
  { label: 'Nyali, Mombasa', lat: -4.0435, lng: 39.7042 },
  { label: 'Eldoret CBD, Uasin Gishu', lat: 0.5143, lng: 35.2698 },
]

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()

  if (!q) {
    return NextResponse.json({ results: [] })
  }

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 4000)

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      q
    )}&countrycodes=ke&format=json&limit=5`

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'SolarSight/1.0 (Kenya Solar Engine contact@solarsight.co.ke)',
      },
    })
    clearTimeout(timer)

    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        const results = data.map((item: any) => ({
          label: item.display_name.split(',').slice(0, 3).join(',').trim(),
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        }))
        return NextResponse.json({ results })
      }
    }
  } catch (err) {
    console.warn('Nominatim search failed or timed out:', err)
  }

  // Fallback search across local Kenya towns
  const queryLower = q.toLowerCase()
  const matched = KENYA_LOCATIONS.filter((l) =>
    l.label.toLowerCase().includes(queryLower)
  )

  return NextResponse.json({
    results: matched.length > 0 ? matched : [{ label: `${q}, Kenya`, lat: -1.2921, lng: 36.8219 }],
  })
}
