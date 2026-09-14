'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
// @ts-expect-error Turf package export type mapping
import * as turf from '@turf/turf'

interface RoofTracerProps {
  lat: number
  lng: number
  tilt: number
  onAreaConfirmed: (areaM2: number) => void
}

export default function RoofTracer({
  lat,
  lng,
  tilt,
  onAreaConfirmed,
}: RoofTracerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const pointsRef = useRef<L.LatLng[]>([])
  const markersRef = useRef<L.CircleMarker[]>([])
  const polylineRef = useRef<L.Polyline | null>(null)
  const polygonRef = useRef<L.Polygon | null>(null)

  const [pointsCount, setPointsCount] = useState<number>(0)
  const [calculatedArea, setCalculatedArea] = useState<number>(0)

  // Calculate turf.js area with slope correction
  const computeSlopeCorrectedArea = useCallback(
    (pts: L.LatLng[]) => {
      if (pts.length < 3) return 0
      try {
        const coords = pts.map((p) => [p.lng, p.lat])
        coords.push([pts[0].lng, pts[0].lat]) // close ring
        const polygon = turf.polygon([coords])
        const planArea = turf.area(polygon)
        const tiltRad = (tilt * Math.PI) / 180
        const slopeFactor = Math.cos(tiltRad)
        const trueArea = slopeFactor > 0 ? planArea / slopeFactor : planArea
        return Math.round(trueArea)
      } catch {
        return 0
      }
    },
    [tilt]
  )

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: 19,
      maxZoom: 19,
      minZoom: 15,
    })

    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Esri, Maxar, Earthstar Geographics',
        maxZoom: 19,
      }
    ).addTo(map)

    map.on('click', (e: L.LeafletMouseEvent) => {
      const newPt = e.latlng
      pointsRef.current.push(newPt)
      setPointsCount(pointsRef.current.length)

      // Add vertex dot
      const marker = L.circleMarker(newPt, {
        radius: 4,
        color: '#F59E0B',
        fillColor: '#FFFFFF',
        fillOpacity: 1,
        weight: 2,
      }).addTo(map)
      markersRef.current.push(marker)

      const pts = pointsRef.current

      // Redraw lines or polygon
      if (pts.length >= 3) {
        if (polylineRef.current) {
          map.removeLayer(polylineRef.current)
          polylineRef.current = null
        }
        if (polygonRef.current) {
          polygonRef.current.setLatLngs(pts)
        } else {
          polygonRef.current = L.polygon(pts, {
            color: '#F59E0B',
            fillColor: '#0F766E',
            fillOpacity: 0.35,
            weight: 2,
          }).addTo(map)
        }
        const area = computeSlopeCorrectedArea(pts)
        setCalculatedArea(area)
      } else if (pts.length === 2) {
        if (!polylineRef.current) {
          polylineRef.current = L.polyline(pts, {
            color: '#F59E0B',
            weight: 2,
            dashArray: '4, 4',
          }).addTo(map)
        } else {
          polylineRef.current.setLatLngs(pts)
        }
      }
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [lat, lng, computeSlopeCorrectedArea])

  function resetTrace() {
    if (!mapRef.current) return
    markersRef.current.forEach((m) => mapRef.current?.removeLayer(m))
    markersRef.current = []
    if (polylineRef.current) {
      mapRef.current.removeLayer(polylineRef.current)
      polylineRef.current = null
    }
    if (polygonRef.current) {
      mapRef.current.removeLayer(polygonRef.current)
      polygonRef.current = null
    }
    pointsRef.current = []
    setPointsCount(0)
    setCalculatedArea(0)
  }

  function handleConfirm() {
    if (calculatedArea > 0) {
      onAreaConfirmed(calculatedArea)
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative rounded-2xl overflow-hidden border border-border shadow-soft">
        <div ref={mapContainerRef} className="w-full h-[320px] sm:h-[360px] z-10" />

        <div className="absolute top-3 left-3 z-20 bg-slate-900/85 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs">
          Click around the corners of your roof to trace the outline
        </div>

        <div className="absolute bottom-3 left-3 z-20 bg-slate-900/80 backdrop-blur-sm text-slate-200 px-2.5 py-1 rounded text-[11px]">
          Note: Satellite imagery may be 1–2 years old
        </div>
      </div>

      <div className="p-4 bg-surface rounded-2xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-soft">
        <div>
          <span className="text-xs font-semibold text-textSecondary uppercase tracking-wider block">
            Traced Roof Area
          </span>
          <div className="text-2xl font-extrabold text-primary">
            {calculatedArea > 0 ? `${calculatedArea} m²` : '0 m²'}
          </div>
          <div className="text-[11px] text-textSecondary">
            {pointsCount < 3
              ? `Place at least 3 points (${pointsCount} placed)`
              : `Adjusted for ${tilt}° roof pitch`}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetTrace}
            disabled={pointsCount === 0}
            className="px-3 py-2 border border-border rounded-xl text-xs font-semibold text-textSecondary hover:text-textPrimary disabled:opacity-40 min-h-[44px]"
          >
            Clear Outline
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={calculatedArea < 4}
            className="px-5 py-2 bg-primary hover:bg-teal-800 text-white font-bold rounded-xl text-xs transition-colors shadow disabled:opacity-40 min-h-[44px]"
          >
            Use Traced Area
          </button>
        </div>
      </div>
    </div>
  )
}
