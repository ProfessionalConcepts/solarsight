import { DEFAULT_CONFIGS, type SolarAppConfig } from './config'
import type {
  AdminInstaller,
  AdminLead,
  AssessmentReport,
  InstallerProductItem,
  InstallerWorkflowStep,
  CustomerProjectTracker,
  InstallerPublicDetail,
} from '../types'

export interface StoredLeadMatch {
  installer_id: number
  installer_name: string
  whatsapp: string
  status: string
}

export interface StoredLead {
  lead_id: string
  assessment_id: string
  name: string
  phone: string
  consent: boolean
  status: string
  created_at: string
  selected_installer_id?: number
  matched_installers: StoredLeadMatch[]
}

export const DEFAULT_WORKFLOW_STEPS: InstallerWorkflowStep[] = [
  {
    step: 1,
    title: 'Feasibility Review & System Sizing',
    description:
      'We review your SolarSight satellite yield report, energy bills, and determine optimal panel capacity.',
    duration: '24 Hours',
    required_from_customer: 'Confirm property ownership and typical monthly electricity budget',
  },
  {
    step: 2,
    title: 'Site Visit & Roof Structural Audit',
    description:
      'Our EPRA-certified solar engineer visits your roof to check tilt, timber/steel rafters, cable routing, and shadow casting.',
    duration: '1 - 2 Days',
    required_from_customer:
      'Safe roof access ladder and clear access to electricity consumer unit',
  },
  {
    step: 3,
    title: 'Custom Bill of Materials (BOM) & Quote',
    description:
      'Detailed proposal with exact Tier 1 panel counts, Deye/Huawei hybrid inverter model, and lithium battery modules.',
    duration: '24 - 48 Hours',
    required_from_customer: 'Review and sign off on equipment brands and warranty terms',
  },
  {
    step: 4,
    title: 'EPRA Permitting & KPLC Net-Metering Prep',
    description:
      'We prepare regulatory filings, single-line diagrams (SLD), and grid-interconnection compliance documents.',
    duration: '3 - 5 Days',
    required_from_customer:
      'Copy of National ID / KRA PIN and recent KPLC post-paid / token meter number',
  },
  {
    step: 5,
    title: 'Mounting & Electrical Installation',
    description:
      'Certified technicians install anodized rails, mount panels facing North, wire DC surge protection and hybrid inverter.',
    duration: '1 - 2 Days on-site',
    required_from_customer:
      'Power outage window (approx 2 hours) to connect solar changeover switch',
  },
  {
    step: 6,
    title: 'Testing, Commissioning & Handover',
    description:
      'System testing, earth loop impedance check, inverter synchronization, and client training on mobile monitoring app.',
    duration: 'Half day',
    required_from_customer:
      'Home Wi-Fi password for inverter cloud monitoring connectivity',
  },
]

export const DEFAULT_PRODUCTS: InstallerProductItem[] = [
  {
    id: 'prod-panel-1',
    category: 'panel',
    brand: 'Jinko Solar',
    model: 'Tiger Pro 550W Mono-Facial TOPCon',
    specs: '550W, 21.3% Efficiency, 1500V DC, 25-Year Linear Output Warranty',
    warranty_years: 25,
    in_stock: true,
  },
  {
    id: 'prod-panel-2',
    category: 'panel',
    brand: 'LONGi Solar',
    model: 'Hi-MO 6 Explorer 575W',
    specs: '575W, HPBC Cell Tech, High Temperature Performance for Equator',
    warranty_years: 25,
    in_stock: true,
  },
  {
    id: 'prod-inv-1',
    category: 'inverter',
    brand: 'Deye',
    model: 'SUN-5K-SG04LP1-EU Hybrid 5kW',
    specs: '5kW Single Phase, Dual MPPT, 48V Battery Port, Generator Auto-Start Support',
    warranty_years: 5,
    in_stock: true,
  },
  {
    id: 'prod-inv-2',
    category: 'inverter',
    brand: 'Huawei',
    model: 'SUN2000-6KTL-L1 Smart Hybrid 6kW',
    specs: '6kW Output, AI-Powered Arc Fault Protection (AFCI), 98.4% Max Efficiency',
    warranty_years: 10,
    in_stock: true,
  },
  {
    id: 'prod-bat-1',
    category: 'battery',
    brand: 'Pylontech',
    model: 'US3000C LiFePO4 3.55kWh',
    specs: '48V, 95% DOD, 6,000+ Cycles, Modular Scalable, Smart BMS Communication',
    warranty_years: 10,
    in_stock: true,
  },
  {
    id: 'prod-bat-2',
    category: 'battery',
    brand: 'Felicity Solar',
    model: 'LPBA48100 5.12kWh Lithium',
    specs: '51.2V 100Ah, Grade A Cells, Wall-Mountable, Integrated Circuit Breaker',
    warranty_years: 7,
    in_stock: true,
  },
  {
    id: 'prod-bos-1',
    category: 'bos',
    brand: 'Suntree / Schneider',
    model: 'Protection Box + Bi-Directional Smart Meter',
    specs: '1000V DC Isolator, Type II SPD Surge Protector, IP65 UV Resistant Enclosure',
    warranty_years: 5,
    in_stock: true,
  },
]

export const SAMPLE_INSTALLERS: AdminInstaller[] = [
  {
    id: 1,
    name: 'Solar Kenya Solutions [SAMPLE]',
    phone: '+254711234567',
    whatsapp: '254711234567',
    county: 'Nairobi',
    town: 'Westlands',
    lat: -1.2678,
    lng: 36.8122,
    service_radius_km: 60,
    epra_license_no: 'EPRA/SOL/2023/0481',
    epra_verified: true,
    product_types: ['pv_hybrid', 'pv_gridtie', 'pumping'],
    size_min_kw: 1.0,
    size_max_kw: 30.0,
    rating_avg: 4.85,
    rating_count: 32,
    lead_fee_ksh: 500,
    active: true,
    bio: 'Premier residential & commercial solar engineers in Nairobi. Over 150 commissioned systems across Kiambu, Nairobi & Machakos.',
    brands_supported: ['Jinko Solar', 'Deye', 'Pylontech', 'Huawei', 'Schneider'],
    experience_years: 8,
    projects_completed: 184,
    products: [...DEFAULT_PRODUCTS],
    workflow_steps: [...DEFAULT_WORKFLOW_STEPS],
    customer_requirements: [
      'Copy of recent KPLC bill showing Post-Paid account or Token Meter Number',
      'Clear, unobstructed ladder access to roof surfaces',
      'Location of main electricity distribution board / consumer unit',
      'Home Wi-Fi network password for solar monitoring setup',
    ],
  },
  {
    id: 2,
    name: 'Nairobi Solar Hub [SAMPLE]',
    phone: '+254722345678',
    whatsapp: '254722345678',
    county: 'Nairobi',
    town: 'Kilimani',
    lat: -1.2921,
    lng: 36.785,
    service_radius_km: 50,
    epra_license_no: 'EPRA/SOL/2022/1029',
    epra_verified: true,
    product_types: ['pv_hybrid', 'pv_gridtie', 'water_heating'],
    size_min_kw: 0.5,
    size_max_kw: 15.0,
    rating_avg: 4.7,
    rating_count: 19,
    lead_fee_ksh: 500,
    active: true,
    bio: 'Specialists in suburban villa and apartment roof backup systems. Certified Class V1 EPRA technical team.',
    brands_supported: ['LONGi Solar', 'Deye', 'Felicity Solar', 'Growatt'],
    experience_years: 6,
    projects_completed: 112,
    products: [...DEFAULT_PRODUCTS],
    workflow_steps: [...DEFAULT_WORKFLOW_STEPS],
    customer_requirements: [
      'Clear roof access',
      'KPLC meter number',
      'Space for battery wall mount (approx 1m x 1m)',
    ],
  },
  {
    id: 3,
    name: 'Greenlight Power KE [SAMPLE]',
    phone: '+254733456789',
    whatsapp: '254733456789',
    county: 'Nairobi',
    town: 'Industrial Area',
    lat: -1.3105,
    lng: 36.845,
    service_radius_km: 75,
    epra_license_no: 'EPRA/SOL/2021/0192',
    epra_verified: true,
    product_types: ['pv_hybrid', 'pv_gridtie'],
    size_min_kw: 2.0,
    size_max_kw: 50.0,
    rating_avg: 4.9,
    rating_count: 45,
    lead_fee_ksh: 500,
    active: true,
    bio: 'High-capacity EPC contractor for commercial buildings, schools, and estate residences across Kenya.',
    brands_supported: ['Canadian Solar', 'Huawei', 'Victron Energy', 'FreedomWon'],
    experience_years: 10,
    projects_completed: 240,
    products: [...DEFAULT_PRODUCTS],
    workflow_steps: [...DEFAULT_WORKFLOW_STEPS],
    customer_requirements: [
      'Structural drawings or roof inspection permit',
      'Recent 3 months KPLC power statements',
    ],
  },
  {
    id: 4,
    name: 'Sunshine Systems Nairobi [SAMPLE]',
    phone: '+254701234890',
    whatsapp: '254701234890',
    county: 'Nairobi',
    town: 'Karen',
    lat: -1.3197,
    lng: 36.7065,
    service_radius_km: 60,
    epra_license_no: 'EPRA/SOL/2023/0714',
    epra_verified: true,
    product_types: ['pv_hybrid', 'pv_gridtie', 'pumping'],
    size_min_kw: 1.0,
    size_max_kw: 25.0,
    rating_avg: 4.65,
    rating_count: 14,
    lead_fee_ksh: 500,
    active: true,
    bio: 'Custom off-grid & hybrid solar systems for Karen, Langata, and Runda properties with generator auto-integration.',
    brands_supported: ['Jinko Solar', 'Victron Energy', 'Pylontech', 'Deye'],
    experience_years: 7,
    projects_completed: 89,
    products: [...DEFAULT_PRODUCTS],
    workflow_steps: [...DEFAULT_WORKFLOW_STEPS],
    customer_requirements: [
      'Generator model & transfer switch location',
      'Clear roof path for North-facing orientation',
    ],
  },
  {
    id: 5,
    name: 'PowerAfrica Solar KE [SAMPLE]',
    phone: '+254712345901',
    whatsapp: '254712345901',
    county: 'Nairobi',
    town: 'CBD',
    lat: -1.2833,
    lng: 36.8219,
    service_radius_km: 80,
    epra_license_no: 'EPRA/SOL/2020/0045',
    epra_verified: true,
    product_types: ['pv_hybrid', 'pv_gridtie', 'commercial'],
    size_min_kw: 3.0,
    size_max_kw: 100.0,
    rating_avg: 4.8,
    rating_count: 28,
    lead_fee_ksh: 500,
    active: true,
    bio: 'Nationwide solar EPC with 12 years of East African utility and rooftop experience.',
    brands_supported: ['Trina Solar', 'Huawei', 'Sungrow', 'Pylontech'],
    experience_years: 12,
    projects_completed: 310,
    products: [...DEFAULT_PRODUCTS],
    workflow_steps: [...DEFAULT_WORKFLOW_STEPS],
    customer_requirements: ['Single-line electrical diagram if available'],
  },
]

// Global singleton state so memory persists across Next.js API requests
const globalData = globalThis as unknown as {
  __solarsight_assessments?: Map<string, AssessmentReport>
  __solarsight_leads?: StoredLead[]
  __solarsight_installers?: AdminInstaller[]
  __solarsight_config?: SolarAppConfig
  __solarsight_projects?: Map<string, CustomerProjectTracker>
}

if (!globalData.__solarsight_assessments) {
  globalData.__solarsight_assessments = new Map<string, AssessmentReport>()
}
if (!globalData.__solarsight_leads) {
  globalData.__solarsight_leads = []
}
if (!globalData.__solarsight_installers) {
  globalData.__solarsight_installers = [...SAMPLE_INSTALLERS]
}
if (!globalData.__solarsight_config) {
  globalData.__solarsight_config = { ...DEFAULT_CONFIGS }
}
if (!globalData.__solarsight_projects) {
  globalData.__solarsight_projects = new Map<string, CustomerProjectTracker>()
}

export function saveAssessment(report: AssessmentReport) {
  const key = report.assessment_id || report.id || ''
  if (key) {
    globalData.__solarsight_assessments!.set(key, report)
    if (report.id && report.id !== key) {
      globalData.__solarsight_assessments!.set(report.id, report)
    }
  }
}

export function getAssessmentById(id: string): AssessmentReport | null {
  return globalData.__solarsight_assessments!.get(id) || null
}

export function redactAssessmentGeodata(id: string): AssessmentReport | null {
  const report = getAssessmentById(id)
  if (!report) return null

  // Redact precise coordinates and clear roof area geometry
  report.lat = -1.2921 // Centered to Nairobi district
  report.lng = 36.8219
  report.location_label = `${report.location_label?.split(',')[0] || 'Kenya'} (Exact Coordinates Purged)`
  report.roof_area_m2 = null
  report.is_redacted = true
  report.redacted_at = new Date().toISOString()

  saveAssessment(report)
  return report
}

export function saveLead(lead: StoredLead) {
  globalData.__solarsight_leads!.unshift(lead)
}

export function getLeads(): StoredLead[] {
  return globalData.__solarsight_leads!
}

export function updateLeadStatus(leadId: string, status: string): boolean {
  const lead = globalData.__solarsight_leads!.find((l) => l.lead_id === leadId)
  if (!lead) return false
  lead.status = status
  return true
}

export function getInstallers(): AdminInstaller[] {
  return globalData.__solarsight_installers!
}

export function getInstallerById(id: number): AdminInstaller | null {
  return globalData.__solarsight_installers!.find((i) => i.id === id) || null
}

export function createInstallerProfile(
  details: Pick<AdminInstaller, 'name' | 'phone' | 'county' | 'town' | 'epra_license_no' | 'service_radius_km' | 'bio'>
): AdminInstaller {
  const installers = getInstallers()
  const id = installers.length ? Math.max(...installers.map((installer) => installer.id)) + 1 : 1
  const installer: AdminInstaller = {
    id,
    ...details,
    whatsapp: details.phone,
    epra_verified: false,
    product_types: ['pv_hybrid', 'pv_gridtie'],
    size_min_kw: 0.5,
    size_max_kw: 20,
    lead_fee_ksh: 0,
    active: false,
    products: [],
    workflow_steps: [...DEFAULT_WORKFLOW_STEPS],
    customer_requirements: [],
  }
  installers.unshift(installer)
  return installer
}

export function updateInstaller(id: number, updates: Partial<AdminInstaller>): AdminInstaller | null {
  const installers = getInstallers()
  const idx = installers.findIndex((i) => i.id === id)
  if (idx === -1) return null

  installers[idx] = {
    ...installers[idx],
    ...updates,
    id,
  }
  return installers[idx]
}

export function saveProjectTracker(tracker: CustomerProjectTracker) {
  globalData.__solarsight_projects!.set(tracker.assessment_id, tracker)
  globalData.__solarsight_projects!.set(tracker.project_id, tracker)
}

export function getProjectTracker(idOrAssessmentId: string): CustomerProjectTracker | null {
  return globalData.__solarsight_projects!.get(idOrAssessmentId) || null
}

export function getAppConfig(): SolarAppConfig {
  return globalData.__solarsight_config!
}

export function updateAppConfig(updates: Partial<SolarAppConfig>): SolarAppConfig {
  globalData.__solarsight_config = {
    ...globalData.__solarsight_config!,
    ...updates,
    data_last_updated: new Date().toISOString().split('T')[0],
  }
  return globalData.__solarsight_config!
}

export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function matchInstallers(
  lat: number,
  lng: number,
  kwp: number = 3.0,
  maxCount: number = 3
): AdminInstaller[] {
  const installers = getInstallers().filter((i) => i.active)

  const scored = installers
    .map((inst) => {
      const distance =
        inst.lat != null && inst.lng != null
          ? haversineDistanceKm(lat, lng, inst.lat, inst.lng)
          : 0
      const inRadius = distance <= inst.service_radius_km
      const sizeFits = kwp >= inst.size_min_kw && kwp <= inst.size_max_kw
      return {
        inst,
        distance,
        inRadius,
        sizeFits,
      }
    })
    .sort((a, b) => {
      // 1. Prefer in service radius
      if (a.inRadius !== b.inRadius) return a.inRadius ? -1 : 1
      // 2. Prefer EPRA verified
      if (a.inst.epra_verified !== b.inst.epra_verified)
        return a.inst.epra_verified ? -1 : 1
      // 3. Higher rating
      return (b.inst.rating_avg ?? 0) - (a.inst.rating_avg ?? 0)
    })

  return scored.slice(0, maxCount).map((s) => s.inst)
}

export function toPublicDetail(inst: AdminInstaller): InstallerPublicDetail {
  return {
    id: inst.id,
    name: inst.name,
    area: `${inst.town || ''}${inst.town && inst.county ? ', ' : ''}${inst.county || 'Kenya'}`.trim(),
    phone: inst.phone,
    whatsapp: inst.whatsapp,
    rating_avg: inst.rating_avg ?? null,
    rating_count: inst.rating_count ?? 0,
    epra_verified: Boolean(inst.epra_verified),
    epra_license_no: inst.epra_license_no,
    service_radius_km: inst.service_radius_km,
    brands_supported: inst.brands_supported || [],
    bio: inst.bio,
    experience_years: inst.experience_years,
    projects_completed: inst.projects_completed,
    products: inst.products || [],
    workflow_steps: inst.workflow_steps || [],
    customer_requirements: inst.customer_requirements || [],
  }
}
