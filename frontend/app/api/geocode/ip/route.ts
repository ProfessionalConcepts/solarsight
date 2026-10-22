import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 3500)

    const res = await fetch('https://get.geojs.io/v1/ip/geo.json', {
      signal: controller.signal,
    })
    clearTimeout(timer)

    if (res.ok) {
      const data = await res.json()
      const lat = parseFloat(data.latitude)
      const lng = parseFloat(data.longitude)

      // Ensure within Kenya boundaries, otherwise default to Nairobi
      if (lat >= -5.0 && lat <= 5.5 && lng >= 33.0 && lng <= 42.0) {
        return NextResponse.json({
          lat,
          lng,
          label: `${data.city || 'Nairobi'}, Kenya`,
        })
      }
    }
  } catch (err) {
    console.warn('GeoJS IP lookup failed or timed out:', err)
  }

  // Default to Nairobi Center
  return NextResponse.json({
    lat: -1.2921,
    lng: 36.8219,
    label: 'Kilimani, Nairobi',
  })
}
