'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { searchLocations, reverseGeocodeCoords, getIpLocation } from '@/lib/api'

// Custom marker icon using pure SVG data URI so no local image asset issues occur
const PIN_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 48" width="32" height="48"><path fill="%230F766E" stroke="%23FFFFFF" stroke-width="2" d="M16 0C7.163 0 0 7.163 0 16c0 12 16 32 16 32s16-20 16-32C32 7.163 24.837 0 16 0z"/><circle cx="16" cy="16" r="6" fill="%23F59E0B"/></svg>`

const defaultIcon = L.icon({
  iconUrl: PIN_SVG,
  iconSize: [32, 48],
  iconAnchor: [16, 48],
  popupAnchor: [0, -48],
})

interface MapPickerProps {
  initialLat?: number
  initialLng?: number
  initialLabel?: string
  onConfirm: (lat: number, lng: number, label: string) => void
}

export default function MapPicker({
  initialLat = -1.2921,
  initialLng = 36.8219,
  initialLabel = 'Nairobi, Kenya',
  onConfirm,
}: MapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)

  const [lat, setLat] = useState<number>(initialLat)
  const [lng, setLng] = useState<number>(initialLng)
  const [label, setLabel] = useState<string>(initialLabel)
  const [zoomLevel, setZoomLevel] = useState<number>(16)
  const [locating, setLocating] = useState<boolean>(false)
  const [zoomWarning, setZoomWarning] = useState<boolean>(false)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Array<{ label: string; lat: number; lng: number }>>([])
  const [isSearching, setIsSearching] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Reverse geocode on pin move
  const updateLocation = useCallback(async (newLat: number, newLng: number) => {
    setLat(newLat)
    setLng(newLng)
    try {
      const revLabel = await reverseGeocodeCoords(newLat, newLng)
      setLabel(revLabel)
    } catch {
      setLabel(`${newLat.toFixed(4)}, ${newLng.toFixed(4)}`)
    }
  }, [])

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 16,
      maxZoom: 19,
      minZoom: 6,
    })

    // Esri World Imagery Satellite Tiles
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Esri, Maxar, Earthstar Geographics',
        maxZoom: 19,
      }
    ).addTo(map)

    // Initial marker
    const marker = L.marker([initialLat, initialLng], {
      icon: defaultIcon,
      draggable: true,
    }).addTo(map)

    marker.on('dragend', (e) => {
      const pos = e.target.getLatLng()
      updateLocation(pos.lat, pos.lng)
    })

    map.on('click', (e) => {
      marker.setLatLng(e.latlng)
      updateLocation(e.latlng.lat, e.latlng.lng)
    })

    map.on('zoomend', () => {
      const z = map.getZoom()
      setZoomLevel(z)
      if (z >= 16) {
        setZoomWarning(false)
      }
    })

    mapRef.current = map
    markerRef.current = marker

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [initialLat, initialLng, updateLocation])

  // Move marker and map center programmatically
  const setMapPosition = useCallback((newLat: number, newLng: number, newZoom?: number) => {
    if (mapRef.current && markerRef.current) {
      const zoom = newZoom ?? mapRef.current.getZoom()
      mapRef.current.setView([newLat, newLng], zoom)
      markerRef.current.setLatLng([newLat, newLng])
      updateLocation(newLat, newLng)
    }
  }, [updateLocation])

  // Search input handler with 1s debounce
  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setSearchQuery(val)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)

    if (val.trim().length < 2) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchLocations(val)
        setSearchResults(results)
      } catch {
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 1000)
  }

  function handleSelectResult(r: { label: string; lat: number; lng: number }) {
    setSearchResults([])
    setSearchQuery(r.label)
    setMapPosition(r.lat, r.lng, 17)
  }

  // Use My GPS button with IP fallback
  function handleUseGps() {
    setLocating(true)
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocating(false)
          setMapPosition(pos.coords.latitude, pos.coords.longitude, 18)
        },
        async () => {
          // Fallback to GeoJS IP
          try {
            const ipLoc = await getIpLocation()
            setMapPosition(ipLoc.lat, ipLoc.lng, 16)
          } catch {
            // Keep current
          } finally {
            setLocating(false)
          }
        },
        { timeout: 8000 }
      )
    } else {
      getIpLocation().then((ipLoc) => {
        setMapPosition(ipLoc.lat, ipLoc.lng, 16)
        setLocating(false)
      }).catch(() => setLocating(false))
    }
  }

  function handleConfirm() {
    if (zoomLevel < 16) {
      setZoomWarning(true)
    }
    onConfirm(lat, lng, label)
  }

  return (
    <div className="space-y-3">
      {/* Search Box and GPS Button */}
      <div className="flex flex-col sm:flex-row gap-2 relative z-20">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search town, estate, or landmark (e.g. Kilimani)"
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-surface text-sm focus:ring-2 focus:ring-primary focus:outline-none"
          />
          <svg
            className="w-4 h-4 text-textSecondary absolute left-3 top-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {isSearching && (
            <div className="absolute right-3 top-3 text-xs text-textSecondary">
              Searching...
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-xl shadow-lg z-30 divide-y divide-border overflow-hidden">
              {searchResults.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectResult(r)}
                  className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-slate-50 transition-colors block text-textPrimary"
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleUseGps}
          disabled={locating}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-surface hover:bg-slate-50 border border-border text-primary font-semibold text-xs rounded-xl transition-colors shadow-sm whitespace-nowrap min-h-[44px]"
        >
          <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {locating ? 'Locating...' : 'Use My GPS'}
        </button>
      </div>

      {/* Satellite Map Container */}
      <div className="relative rounded-2xl overflow-hidden border border-border shadow-soft">
        <div ref={mapContainerRef} className="w-full h-[340px] sm:h-[400px] z-10" />

        <div className="absolute top-3 left-3 z-20 bg-slate-900/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Click map or drag pin to your roof</span>
        </div>
      </div>

      {/* Zoom Warning */}
      {zoomWarning && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Zoom in closer to place your pin accurately on your building.</span>
        </div>
      )}

      {/* Selected Location Card & Confirm CTA */}
      <div className="p-4 bg-surface rounded-2xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-soft">
        <div>
          <span className="text-xs font-semibold text-textSecondary uppercase tracking-wider block">
            Selected Location
          </span>
          <div className="text-sm font-bold text-textPrimary">{label}</div>
          <div className="text-[11px] text-textSecondary">
            {lat.toFixed(5)}, {lng.toFixed(5)}
          </div>
        </div>

        <button
          type="button"
          onClick={handleConfirm}
          className="w-full sm:w-auto px-6 py-2.5 bg-primary hover:bg-teal-800 text-white font-bold rounded-xl text-sm transition-colors shadow min-h-[44px]"
        >
          Confirm Location
        </button>
      </div>
    </div>
  )
}
