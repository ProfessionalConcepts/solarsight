// TypeScript types matching the EnergyIQ API contract
export type Locale = 'en' | 'sw'

// ─── Assessment Input ───────────────────────────────────────────────────────

export type RoofInputMode = 'trace' | 'manual' | 'skip'
export type Orientation = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW'
export type ShadingLevel = 'none' | 'some' | 'heavy'
export type PropertyType = 'apartment' | 'standalone_home' | 'farm' | 'sme'
export type EnergyInputMode = 'bill' | 'kwh' | 'appliance_wizard'
export type TariffType = 'domestic' | 'small_commercial' | 'commercial'

export interface ApplianceEntry {
  id: string
  name: string
  watts: number
  hours_per_day: number
  checked: boolean
}

export interface AssessmentInput {
  // Step 1: Location
  lat: number
  lng: number
  location_label: string

  // Step 2: Roof
  roof_input_mode: RoofInputMode
  roof_area_m2?: number
  orientation: Orientation
  tilt_degrees: number
  shading: ShadingLevel
  property_type: PropertyType

  // Step 3: Energy
  energy_input_mode: EnergyInputMode
  monthly_bill_ksh?: number
  monthly_kwh?: number
  appliances?: ApplianceEntry[]
  owns_genset: boolean
  monthly_fuel_ksh?: number
  backup_hours: number
  tariff_type: TariffType
  language?: string
}

// ─── Wizard Draft (localStorage) ───────────────────────────────────────────

export interface WizardDraft {
  step: number
  input: Partial<AssessmentInput>
  savedAt: string
}

// ─── Assessment Result (from backend) ──────────────────────────────────────

export type VerdictLevel = 'strong_yes' | 'explore' | 'caution'

export interface MonthlyProduction {
  month: number // 1 to 12
  kwh: number
}

export interface FinancialsResult {
  capex_grid_tie_ksh: number
  capex_hybrid_ksh: number
  savings_annual_grid_tie_ksh: number
  savings_annual_hybrid_ksh: number
  payback_grid_tie_yrs: number
  payback_hybrid_yrs: number
  monthly_savings_low_ksh: number
  monthly_savings_high_ksh: number
  npv_grid_tie_ksh: number
  npv_hybrid_ksh: number
  avoided_ksh_per_kwh: number
}

export interface SizingResult {
  recommended_kwp: number
  battery_kwh: number
  annual_kwh: number
  coverage_pct: number
  roof_limited: boolean
  roof_max_kwp: number | null
}

export interface VerdictResult {
  code: VerdictLevel
  reason: string
}

export interface AssessmentResult {
  sizing: SizingResult
  financials: FinancialsResult
  monthly_production: MonthlyProduction[]
  verdict: VerdictResult
  recommendations: string[]
  narrative: {
    en: string
    sw: string
  }
  assumptions: string[]
  data_last_updated: string
  disclaimer: string
  irradiance?: {
    source: string
    annual_kwh_per_kwp: number
    peak_sun_hours_daily: number
  }
}

export interface AssessmentReport {
  assessment_id: string
  id?: string
  lat: number
  lng: number
  location_label?: string
  roof_area_m2?: number | null
  roof_tilt?: number
  azimuth?: number
  shading_self?: string
  monthly_kwh?: number | null
  monthly_bill_ksh?: number | null
  tariff_type?: string
  has_genset?: boolean
  genset_monthly_fuel_ksh?: number | null
  backup_hours_goal?: number
  property_type?: string
  language?: string
  created_at?: string
  is_redacted?: boolean
  redacted_at?: string
  result: AssessmentResult
}

// ─── Leads ─────────────────────────────────────────────────────────────────

export interface LeadInput {
  assessment_id: string
  name: string
  phone: string
  consent: boolean
  selected_installer_id?: number
}

export interface InstallerProductItem {
  id: string
  category: 'panel' | 'inverter' | 'battery' | 'bos'
  brand: string
  model: string
  specs: string
  warranty_years: number
  in_stock: boolean
}

export interface InstallerWorkflowStep {
  step: number
  title: string
  description: string
  duration: string
  required_from_customer?: string
}

export interface InstallerPublicDetail {
  id: number
  name: string
  area: string
  phone?: string
  whatsapp?: string
  rating_avg: number | null
  rating_count: number
  epra_verified: boolean
  epra_license_no?: string
  service_radius_km: number
  brands_supported?: string[]
  bio?: string
  experience_years?: number
  projects_completed?: number
  products?: InstallerProductItem[]
  workflow_steps?: InstallerWorkflowStep[]
  customer_requirements?: string[]
}

export interface LeadResponse {
  lead_id: string
  matched_installers: string[]
  installers?: InstallerPublicDetail[]
  message: string
}

// ─── Installers ────────────────────────────────────────────────────────────

export interface InstallerPublic {
  id: number
  name: string
  area: string
  phone?: string
  whatsapp?: string
  rating_avg: number | null
  rating_count: number
  epra_verified: boolean
  epra_license_no?: string
  brands_supported?: string[]
  bio?: string
}

// ─── Customer Project Tracker ──────────────────────────────────────────────

export interface CustomerProjectTracker {
  project_id: string
  assessment_id: string
  customer_name: string
  customer_phone: string
  installer: InstallerPublicDetail
  status: 'site_survey_pending' | 'survey_scheduled' | 'quotation_ready' | 'permits_pending' | 'installing' | 'completed'
  scheduled_survey_date?: string
  survey_notes?: string
  created_at: string
}

// ─── Admin ─────────────────────────────────────────────────────────────────

export interface AdminMatchedInstaller {
  installer_id: number
  name: string
  whatsapp?: string
  phone?: string
  match_status: string
  forward_url?: string
}

export interface AdminLead {
  lead_id: string
  name: string
  phone: string
  consent: boolean
  status: string
  created_at: string
  assessment_id: string
  location_label: string
  monthly_bill_ksh?: number
  recommended_kwp?: number
  matched_installers: AdminMatchedInstaller[]
  selected_installer_id?: number
}

export interface AdminInstaller {
  id: number
  name: string
  phone?: string
  whatsapp?: string
  county?: string
  town?: string
  lat?: number
  lng?: number
  service_radius_km: number
  epra_license_no?: string
  epra_verified: boolean
  product_types?: string[]
  size_min_kw: number
  size_max_kw: number
  rating_avg?: number | null
  rating_count?: number
  lead_fee_ksh: number
  active: boolean
  bio?: string
  brands_supported?: string[]
  experience_years?: number
  projects_completed?: number
  products?: InstallerProductItem[]
  workflow_steps?: InstallerWorkflowStep[]
  customer_requirements?: string[]
}
