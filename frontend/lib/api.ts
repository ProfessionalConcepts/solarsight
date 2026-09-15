/**
 * API client for SolarSight backend.
 * Local development uses the Next.js same-origin proxy by default.
 */

import type {
  AssessmentInput,
  AssessmentReport,
  AssessmentResult,
  LeadInput,
  LeadResponse,
  InstallerPublic,
  AdminLead,
  AdminInstaller,
} from './types'

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? '/api').replace(/\/$/, '')

const ORIENTATION_MAP: Record<string, number> = {
  N: 0,
  NE: 45,
  E: 90,
  SE: 135,
  S: 180,
  SW: 225,
  W: 270,
  NW: 315,
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
      ...options,
    })
  } catch {
    throw new Error('SolarSight could not reach the assessment service. Please start the backend and try again.')
  }

  if (!res.ok) {
    let errorDetail = `Request failed (${res.status} ${res.statusText || 'HTTP error'})`
    try {
      const responseText = await res.text()
      const errJson = JSON.parse(responseText)
      if (errJson.error?.message) {
        errorDetail = errJson.error.message
      } else if (errJson.detail) {
        errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail)
      }
    } catch {
      // Keep the HTTP status when the proxy or upstream returns non-JSON text.
    }
    throw new Error(errorDetail)
  }

  return res.json() as Promise<T>
}

// ─── Assessment Endpoints ──────────────────────────────────────────────────

export async function submitAssessment(
  data: AssessmentInput
): Promise<{ assessment_id: string; result: AssessmentResult }> {
  // Convert frontend wizard state to backend AssessmentInput schema
  const payload = {
    lat: data.lat,
    lng: data.lng,
    location_label: data.location_label,
    roof_area_m2: data.roof_input_mode !== 'skip' ? data.roof_area_m2 : null,
    roof_tilt: data.tilt_degrees ?? 10,
    azimuth: ORIENTATION_MAP[data.orientation] ?? 0,
    shading_self: data.shading ?? 'none',
    monthly_kwh: data.energy_input_mode === 'kwh' ? data.monthly_kwh : null,
    monthly_bill_ksh: data.energy_input_mode === 'bill' ? data.monthly_bill_ksh : null,
    appliances:
      data.energy_input_mode === 'appliance_wizard' && data.appliances
        ? data.appliances.filter((a) => a.checked).map((a) => ({ name: a.name, watts: a.watts, hours_per_day: a.hours_per_day }))
        : null,
    tariff_type: data.tariff_type ?? 'domestic',
    has_genset: Boolean(data.owns_genset),
    genset_monthly_fuel_ksh: data.owns_genset ? data.monthly_fuel_ksh : null,
    backup_hours_goal: data.backup_hours ?? 6,
    property_type: data.property_type,
    language: data.language ?? 'en',
  }

  return apiFetch('/assess', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getAssessment(id: string): Promise<AssessmentReport> {
  return apiFetch(`/assessments/${id}`)
}

// ─── Lead Endpoints ────────────────────────────────────────────────────────

export async function submitLead(data: LeadInput): Promise<LeadResponse> {
  return apiFetch('/leads', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getNearbyInstallers(
  lat: number,
  lng: number,
  kwp: number = 3.0
): Promise<InstallerPublic[]> {
  return apiFetch(`/installers/near?lat=${lat}&lng=${lng}&kwp=${kwp}`)
}

// ─── Geocoding Proxies ─────────────────────────────────────────────────────

export async function searchLocations(q: string): Promise<Array<{ label: string; lat: number; lng: number }>> {
  const res = await apiFetch<{ results: Array<{ label: string; lat: number; lng: number }> }>(
    `/geocode/search?q=${encodeURIComponent(q)}`
  )
  return res.results || []
}

export async function reverseGeocodeCoords(lat: number, lng: number): Promise<string> {
  const res = await apiFetch<{ label: string }>(`/geocode/reverse?lat=${lat}&lng=${lng}`)
  return res.label || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
}

export async function getIpLocation(): Promise<{ lat: number; lng: number; label: string }> {
  return apiFetch<{ lat: number; lng: number; label: string }>('/geocode/ip')
}

// ─── Admin Endpoints ───────────────────────────────────────────────────────

function adminHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` }
}

export async function adminGetLeads(token: string): Promise<{ leads: AdminLead[] }> {
  return apiFetch('/admin/leads', { headers: adminHeaders(token) })
}

export async function adminUpdateLeadStatus(token: string, leadId: string, status: string): Promise<void> {
  return apiFetch(`/admin/leads/${leadId}/status`, {
    method: 'PATCH',
    headers: adminHeaders(token),
    body: JSON.stringify({ status }),
  })
}

export async function adminGetInstallers(token: string): Promise<{ installers: AdminInstaller[] }> {
  return apiFetch('/admin/installers', { headers: adminHeaders(token) })
}

export async function adminCreateInstaller(token: string, data: any): Promise<{ id: number }> {
  return apiFetch('/admin/installers', {
    method: 'POST',
    headers: adminHeaders(token),
    body: JSON.stringify(data),
  })
}

export async function adminUpdateInstaller(token: string, id: number, data: any): Promise<void> {
  return apiFetch(`/admin/installers/${id}`, {
    method: 'PATCH',
    headers: adminHeaders(token),
    body: JSON.stringify(data),
  })
}

export async function adminDeleteInstaller(token: string, id: number): Promise<void> {
  return apiFetch(`/admin/installers/${id}`, {
    method: 'DELETE',
    headers: adminHeaders(token),
  })
}

export async function adminGetConfig(token: string): Promise<Record<string, { value: any; updated_at: string }>> {
  return apiFetch('/admin/config', { headers: adminHeaders(token) })
}

export async function adminUpdateConfig(token: string, updates: Record<string, any>): Promise<void> {
  return apiFetch('/admin/config', {
    method: 'PATCH',
    headers: adminHeaders(token),
    body: JSON.stringify({ updates }),
  })
}
