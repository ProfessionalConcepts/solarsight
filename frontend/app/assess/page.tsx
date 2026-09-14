'use client'

import { useState, useEffect, useTransition } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import ProgressBar from '@/components/ProgressBar'
import SkeletonLoader from '@/components/SkeletonLoader'
import ShadingPicker from '@/components/ShadingPicker'
import ApplianceWizard from '@/components/ApplianceWizard'
import { submitAssessment } from '@/lib/api'
import { saveDraft, loadDraft, clearDraft } from '@/lib/draft'
import type {
  AssessmentInput,
  RoofInputMode,
  Orientation,
  ShadingLevel,
  PropertyType,
  EnergyInputMode,
  TariffType,
  ApplianceEntry,
} from '@/lib/types'

// Dynamically import Leaflet map components without SSR
const MapPicker = dynamic(() => import('@/components/MapPicker'), {
  ssr: false,
  loading: () => (
    <div className="h-[360px] bg-slate-100 rounded-2xl animate-pulse flex items-center justify-center text-xs text-textSecondary">
      Loading satellite imagery...
    </div>
  ),
})

const RoofTracer = dynamic(() => import('@/components/RoofTracer'), {
  ssr: false,
  loading: () => (
    <div className="h-[320px] bg-slate-100 rounded-2xl animate-pulse flex items-center justify-center text-xs text-textSecondary">
      Loading roof tracer...
    </div>
  ),
})

const ORIENTATIONS: Array<{ id: Orientation; label: string; desc: string }> = [
  { id: 'N', label: 'North', desc: 'Optimal for Kenya (Equator)' },
  { id: 'NE', label: 'North-East', desc: 'Morning sun' },
  { id: 'E', label: 'East', desc: 'Morning sun' },
  { id: 'SE', label: 'South-East', desc: 'Mild shade' },
  { id: 'S', label: 'South', desc: 'Lower output in Kenya' },
  { id: 'SW', label: 'South-West', desc: 'Afternoon sun' },
  { id: 'W', label: 'West', desc: 'Afternoon sun' },
  { id: 'NW', label: 'North-West', desc: 'Afternoon sun' },
]

const PROPERTY_TYPES: Array<{ id: PropertyType; label: string; icon: string }> = [
  { id: 'standalone_home', label: 'Own Home / House', icon: '🏡' },
  { id: 'apartment', label: 'Apartment / Flat', icon: '🏢' },
  { id: 'farm', label: 'Farm / Agricultural', icon: '🌾' },
  { id: 'sme', label: 'Business / SME', icon: '🏪' },
]

export default function AssessWizard() {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const [step, setStep] = useState<number>(1)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [hasDraftNotice, setHasDraftNotice] = useState<boolean>(false)

  // Step 1: Location
  const [lat, setLat] = useState<number>(-1.2921)
  const [lng, setLng] = useState<number>(36.8219)
  const [locationLabel, setLocationLabel] = useState<string>('Kilimani, Nairobi')
  const [locationConfirmed, setLocationConfirmed] = useState<boolean>(false)

  // Step 2: Roof
  const [roofMode, setRoofMode] = useState<RoofInputMode>('skip')
  const [roofAreaM2, setRoofAreaM2] = useState<number | undefined>(undefined)
  const [roofLength, setRoofLength] = useState<string>('')
  const [roofWidth, setRoofWidth] = useState<string>('')
  const [orientation, setOrientation] = useState<Orientation>('N')
  const [tilt, setTilt] = useState<number>(10)
  const [shading, setShading] = useState<ShadingLevel>('none')
  const [propertyType, setPropertyType] = useState<PropertyType>('standalone_home')

  // Step 3: Energy
  const [energyMode, setEnergyMode] = useState<EnergyInputMode>('bill')
  const [monthlyBillKsh, setMonthlyBillKsh] = useState<string>('6000')
  const [monthlyKwh, setMonthlyKwh] = useState<string>('300')
  const [appliances, setAppliances] = useState<ApplianceEntry[]>([])
  const [ownsGenset, setOwnsGenset] = useState<boolean>(false)
  const [monthlyFuelKsh, setMonthlyFuelKsh] = useState<string>('5000')
  const [backupHours, setBackupHours] = useState<number>(6)
  const [tariffType, setTariffType] = useState<TariffType>('domestic')

  // Check draft on mount
  useEffect(() => {
    const draft = loadDraft()
    if (draft && draft.input) {
      setHasDraftNotice(true)
    }
  }, [])

  function restoreDraft() {
    const draft = loadDraft()
    if (!draft || !draft.input) return

    const i = draft.input
    if (i.lat) setLat(i.lat)
    if (i.lng) setLng(i.lng)
    if (i.location_label) setLocationLabel(i.location_label)
    if (i.roof_input_mode) setRoofMode(i.roof_input_mode)
    if (i.roof_area_m2) setRoofAreaM2(i.roof_area_m2)
    if (i.orientation) setOrientation(i.orientation)
    if (i.tilt_degrees !== undefined) setTilt(i.tilt_degrees)
    if (i.shading) setShading(i.shading)
    if (i.property_type) setPropertyType(i.property_type)
    if (i.energy_input_mode) setEnergyMode(i.energy_input_mode)
    if (i.monthly_bill_ksh) setMonthlyBillKsh(String(i.monthly_bill_ksh))
    if (i.monthly_kwh) setMonthlyKwh(String(i.monthly_kwh))
    if (i.appliances) setAppliances(i.appliances)
    if (i.owns_genset !== undefined) setOwnsGenset(i.owns_genset)
    if (i.monthly_fuel_ksh) setMonthlyFuelKsh(String(i.monthly_fuel_ksh))
    if (i.backup_hours !== undefined) setBackupHours(i.backup_hours)
    if (i.tariff_type) setTariffType(i.tariff_type)

    setLocationConfirmed(true)
    setStep(draft.step || 1)
    setHasDraftNotice(false)
  }

  function dismissDraft() {
    clearDraft()
    setHasDraftNotice(false)
  }

  // Persist draft on changes
  useEffect(() => {
    if (step > 1 || locationConfirmed) {
      saveDraft({
        step,
        savedAt: new Date().toISOString(),
        input: {
          lat,
          lng,
          location_label: locationLabel,
          roof_input_mode: roofMode,
          roof_area_m2: roofAreaM2,
          orientation,
          tilt_degrees: tilt,
          shading,
          property_type: propertyType,
          energy_input_mode: energyMode,
          monthly_bill_ksh: monthlyBillKsh ? parseFloat(monthlyBillKsh) : undefined,
          monthly_kwh: monthlyKwh ? parseFloat(monthlyKwh) : undefined,
          appliances,
          owns_genset: ownsGenset,
          monthly_fuel_ksh: monthlyFuelKsh ? parseFloat(monthlyFuelKsh) : undefined,
          backup_hours: backupHours,
          tariff_type: tariffType,
        },
      })
    }
  }, [
    step,
    lat,
    lng,
    locationLabel,
    locationConfirmed,
    roofMode,
    roofAreaM2,
    orientation,
    tilt,
    shading,
    propertyType,
    energyMode,
    monthlyBillKsh,
    monthlyKwh,
    appliances,
    ownsGenset,
    monthlyFuelKsh,
    backupHours,
    tariffType,
  ])

  // Step 1: Location confirmed handler
  function handleLocationConfirmed(selectedLat: number, selectedLng: number, label: string) {
    setLat(selectedLat)
    setLng(selectedLng)
    setLocationLabel(label)
    setLocationConfirmed(true)
    setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Manual dimensions area computation
  function handleManualDimensions(lenStr: string, widStr: string) {
    setRoofLength(lenStr)
    setRoofWidth(widStr)
    const l = parseFloat(lenStr)
    const w = parseFloat(widStr)
    if (l > 0 && w > 0) {
      setRoofAreaM2(Math.round(l * w))
    }
  }

  // Trigger Assessment API
  async function handleFinalSubmit() {
    setApiError(null)
    setSubmitting(true)
    setStep(4)

    const payload: AssessmentInput = {
      lat,
      lng,
      location_label: locationLabel,
      roof_input_mode: roofMode,
      roof_area_m2: roofAreaM2,
      orientation,
      tilt_degrees: tilt,
      shading,
      property_type: propertyType,
      energy_input_mode: energyMode,
      monthly_bill_ksh: monthlyBillKsh ? parseFloat(monthlyBillKsh) : undefined,
      monthly_kwh: monthlyKwh ? parseFloat(monthlyKwh) : undefined,
      appliances: energyMode === 'appliance_wizard' ? appliances : undefined,
      owns_genset: ownsGenset,
      monthly_fuel_ksh: ownsGenset && monthlyFuelKsh ? parseFloat(monthlyFuelKsh) : undefined,
      backup_hours: backupHours,
      tariff_type: tariffType,
    }

    try {
      const res = await submitAssessment(payload)
      clearDraft()
      sessionStorage.setItem(
        `solarsight-report-${res.assessment_id}`,
        JSON.stringify({
          assessment_id: res.assessment_id,
          lat,
          lng,
          location_label: locationLabel,
          result: res.result,
        }),
      )
      startTransition(() => {
        router.push(`/report/${res.assessment_id}`)
      })
    } catch (err: any) {
      setSubmitting(false)
      setApiError(err.message || 'Unable to compute solar assessment. Please check your connection.')
    }
  }

  return (
    <div className="max-w-[640px] mx-auto px-4 py-6 sm:py-10">
      {/* Draft Resume Notice Banner */}
      {hasDraftNotice && (
        <div className="mb-6 p-4 bg-teal-50 border border-teal-200 rounded-2xl flex items-center justify-between gap-3 shadow-sm">
          <div className="text-xs text-primary leading-snug">
            <strong>Resume previous assessment?</strong> We found your saved inputs.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={restoreDraft}
              className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-xl shadow"
            >
              Resume
            </button>
            <button
              type="button"
              onClick={dismissDraft}
              className="px-2 py-1.5 text-textSecondary text-xs hover:text-textPrimary"
            >
              Start New
            </button>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <ProgressBar currentStep={step} />

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Step 1: Location */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-textPrimary tracking-tight">
              Where is your building?
            </h1>
            <p className="text-xs sm:text-sm text-textSecondary mt-1 leading-relaxed">
              We look up exact satellite sunshine data for this spot. Pin your roof accurately on the map.
            </p>
          </div>

          <MapPicker
            initialLat={lat}
            initialLng={lng}
            initialLabel={locationLabel}
            onConfirm={handleLocationConfirmed}
          />
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Step 2: Roof & Building */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-textPrimary tracking-tight">
              Tell us about your roof
            </h1>
            <p className="text-xs sm:text-sm text-textSecondary mt-1 leading-relaxed">
              Roof size, angle, and direction dictate how many panels will fit and how much electricity they produce.
            </p>
          </div>

          {/* Property Type */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-textPrimary uppercase tracking-wider">
              Property Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PROPERTY_TYPES.map((pt) => (
                <button
                  key={pt.id}
                  type="button"
                  onClick={() => setPropertyType(pt.id)}
                  className={`p-3 rounded-2xl border-2 text-left flex flex-col justify-between min-h-[80px] transition-all ${
                    propertyType === pt.id
                      ? 'border-primary bg-teal-50/70 ring-1 ring-primary'
                      : 'border-border bg-surface hover:border-slate-300'
                  }`}
                >
                  <span className="text-2xl mb-1">{pt.icon}</span>
                  <span className="text-xs font-bold text-textPrimary">{pt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Roof Area Mode */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-textPrimary uppercase tracking-wider">
              Roof Area Size
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRoofMode('trace')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                  roofMode === 'trace'
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-surface text-textSecondary border-border hover:text-textPrimary'
                }`}
              >
                Trace on Satellite
              </button>
              <button
                type="button"
                onClick={() => setRoofMode('manual')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                  roofMode === 'manual'
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-surface text-textSecondary border-border hover:text-textPrimary'
                }`}
              >
                Enter Metres (L × W)
              </button>
              <button
                type="button"
                onClick={() => {
                  setRoofMode('skip')
                  setRoofAreaM2(undefined)
                }}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                  roofMode === 'skip'
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-surface text-textSecondary border-border hover:text-textPrimary'
                }`}
              >
                Estimate For Me
              </button>
            </div>

            {/* Trace Mode */}
            {roofMode === 'trace' && (
              <RoofTracer
                lat={lat}
                lng={lng}
                tilt={tilt}
                onAreaConfirmed={(area) => setRoofAreaM2(area)}
              />
            )}

            {/* Manual Metres Mode */}
            {roofMode === 'manual' && (
              <div className="p-4 bg-surface rounded-2xl border border-border space-y-3 shadow-soft">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-textSecondary font-medium mb-1">
                      Length (metres)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 10"
                      value={roofLength}
                      onChange={(e) => handleManualDimensions(e.target.value, roofWidth)}
                      className="w-full px-3 py-2 rounded-xl border border-border text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-textSecondary font-medium mb-1">
                      Width (metres)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 6"
                      value={roofWidth}
                      onChange={(e) => handleManualDimensions(roofLength, e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-border text-sm"
                    />
                  </div>
                </div>
                {roofAreaM2 && (
                  <div className="text-xs font-semibold text-primary">
                    Calculated usable area: {roofAreaM2} m²
                  </div>
                )}
              </div>
            )}

            {roofMode === 'skip' && (
              <p className="text-xs text-textSecondary italic">
                We will assume standard roof availability based on your electricity consumption.
              </p>
            )}
          </div>

          {/* Orientation Compass Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-textPrimary uppercase tracking-wider">
                Roof Facing Direction
              </label>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                North is best in Kenya
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {ORIENTATIONS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setOrientation(o.id)}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    orientation === o.id
                      ? 'border-primary bg-teal-50/70 font-bold text-primary ring-1 ring-primary'
                      : 'border-border bg-surface text-textSecondary hover:border-slate-300'
                  }`}
                >
                  <span className="block text-sm">{o.label}</span>
                  <span className="block text-[10px] opacity-75">{o.id === 'N' ? 'Equator' : o.id}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Roof Slope / Tilt Slider */}
          <div className="p-4 bg-surface rounded-2xl border border-border space-y-2 shadow-soft">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-textPrimary uppercase tracking-wider">
                Roof Tilt / Pitch
              </span>
              <span className="font-extrabold text-primary text-sm">{tilt}° slope</span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="1"
              value={tilt}
              onChange={(e) => setTilt(parseInt(e.target.value, 10))}
              className="w-full accent-primary h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-textSecondary">
              <span>0° (Flat)</span>
              <span>10° (Typical Kenya mabati roof)</span>
              <span>30° (Steep tile)</span>
            </div>
          </div>

          {/* Shading Picker */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-textPrimary uppercase tracking-wider">
              Tree & Building Shading
            </label>
            <ShadingPicker value={shading} onChange={(s) => setShading(s)} />
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-5 py-3 border border-border rounded-xl text-sm font-semibold text-textSecondary hover:text-textPrimary"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => {
                setStep(3)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="px-8 py-3 bg-primary hover:bg-teal-800 text-white font-bold rounded-xl text-sm shadow transition-colors"
            >
              Continue to Energy
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Step 3: Energy & Power Needs */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-textPrimary tracking-tight">
              Your electricity usage
            </h1>
            <p className="text-xs sm:text-sm text-textSecondary mt-1 leading-relaxed">
              We size your solar panels and battery storage to match your everyday power consumption.
            </p>
          </div>

          {/* Tariff Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-textPrimary uppercase tracking-wider">
              Electricity Tariff Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'domestic', label: 'Domestic', desc: 'Homes' },
                { id: 'small_commercial', label: 'Small Commercial', desc: 'Shops, clinics' },
                { id: 'commercial', label: 'Commercial', desc: 'Factories, large sites' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTariffType(t.id as TariffType)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    tariffType === t.id
                      ? 'border-primary bg-teal-50/70 font-bold text-primary ring-1 ring-primary'
                      : 'border-border bg-surface text-textSecondary hover:border-slate-300'
                  }`}
                >
                  <span className="block text-xs">{t.label}</span>
                  <span className="block text-[10px] opacity-75">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Energy Input Mode */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-textPrimary uppercase tracking-wider">
              How do you prefer to provide your usage?
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setEnergyMode('bill')}
                className={`py-2.5 px-2 rounded-xl border text-xs font-bold transition-all ${
                  energyMode === 'bill'
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-surface text-textSecondary border-border hover:text-textPrimary'
                }`}
              >
                Monthly KPLC Bill (KSh)
              </button>
              <button
                type="button"
                onClick={() => setEnergyMode('kwh')}
                className={`py-2.5 px-2 rounded-xl border text-xs font-bold transition-all ${
                  energyMode === 'kwh'
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-surface text-textSecondary border-border hover:text-textPrimary'
                }`}
              >
                Monthly Units (kWh)
              </button>
              <button
                type="button"
                onClick={() => setEnergyMode('appliance_wizard')}
                className={`py-2.5 px-2 rounded-xl border text-xs font-bold transition-all ${
                  energyMode === 'appliance_wizard'
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-surface text-textSecondary border-border hover:text-textPrimary'
                }`}
              >
                Pick Appliances
              </button>
            </div>

            {/* Bill input */}
            {energyMode === 'bill' && (
              <div className="p-5 bg-surface rounded-2xl border border-border space-y-2 shadow-soft">
                <label className="block text-xs font-semibold text-textPrimary">
                  Average Monthly KPLC Electricity Bill (KSh)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-sm font-bold text-textSecondary">
                    KSh
                  </span>
                  <input
                    type="number"
                    min="500"
                    max="500000"
                    step="500"
                    value={monthlyBillKsh}
                    onChange={(e) => setMonthlyBillKsh(e.target.value)}
                    className="w-full pl-14 pr-4 py-2.5 rounded-xl border border-border text-base font-bold focus:ring-2 focus:ring-primary focus:outline-none"
                    placeholder="6000"
                  />
                </div>
                <div className="flex justify-between text-[11px] text-textSecondary pt-1">
                  <span>Minimum: KSh 500</span>
                  <span>Average Nairobi home: KSh 4,000–8,000</span>
                </div>
              </div>
            )}

            {/* kWh input */}
            {energyMode === 'kwh' && (
              <div className="p-5 bg-surface rounded-2xl border border-border space-y-2 shadow-soft">
                <label className="block text-xs font-semibold text-textPrimary">
                  Monthly Power Consumption (kWh units)
                </label>
                <input
                  type="number"
                  min="10"
                  max="50000"
                  value={monthlyKwh}
                  onChange={(e) => setMonthlyKwh(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border text-base font-bold focus:ring-2 focus:ring-primary focus:outline-none"
                  placeholder="300"
                />
              </div>
            )}

            {/* Appliance Wizard */}
            {energyMode === 'appliance_wizard' && (
              <ApplianceWizard
                initialValue={appliances}
                onChange={(computedKwh, appList) => {
                  setMonthlyKwh(String(computedKwh))
                  setAppliances(appList)
                }}
              />
            )}
          </div>

          {/* Generator / Genset Toggle */}
          <div className="p-4 bg-surface rounded-2xl border border-border shadow-soft space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-sm text-textPrimary block">
                  Do you run a fuel generator?
                </span>
                <span className="text-xs text-textSecondary">
                  Replacing diesel/petrol power with solar significantly speeds up payback.
                </span>
              </div>
              <input
                type="checkbox"
                checked={ownsGenset}
                onChange={(e) => setOwnsGenset(e.target.checked)}
                className="w-5 h-5 rounded text-primary focus:ring-primary border-slate-300 cursor-pointer"
              />
            </div>

            {ownsGenset && (
              <div className="pt-2 border-t border-border">
                <label className="block text-xs text-textSecondary font-medium mb-1">
                  Estimated Monthly Generator Fuel Spend (KSh)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-textSecondary">
                    KSh
                  </span>
                  <input
                    type="number"
                    value={monthlyFuelKsh}
                    onChange={(e) => setMonthlyFuelKsh(e.target.value)}
                    className="w-full pl-12 pr-4 py-2 rounded-xl border border-border text-sm font-semibold"
                    placeholder="5000"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Backup Hours Goal Slider */}
          <div className="p-4 bg-surface rounded-2xl border border-border space-y-2 shadow-soft">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-textPrimary uppercase tracking-wider">
                Blackout Backup Hours Goal
              </span>
              <span className="font-extrabold text-primary text-sm">{backupHours} Hours</span>
            </div>
            <input
              type="range"
              min="0"
              max="12"
              step="1"
              value={backupHours}
              onChange={(e) => setBackupHours(parseInt(e.target.value, 10))}
              className="w-full accent-primary h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-textSecondary">
              <span>0 hrs (No battery / Grid-tie)</span>
              <span>6 hrs (Evening blackout cover)</span>
              <span>12 hrs (Overnight full cover)</span>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-5 py-3 border border-border rounded-xl text-sm font-semibold text-textSecondary hover:text-textPrimary"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleFinalSubmit}
              className="px-8 py-3.5 bg-accent hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-sm shadow transition-colors"
            >
              Generate My Assessment
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Step 4: Loading / Processing */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {step === 4 && (
        <div className="space-y-4">
          {submitting && <SkeletonLoader />}

          {apiError && (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-4 shadow-soft">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-rose-900">Assessment Calculation Error</h3>
                <p className="text-xs text-rose-800 mt-1 max-w-sm mx-auto">{apiError}</p>
              </div>
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-2 border border-rose-300 text-rose-900 text-xs font-semibold rounded-xl"
                >
                  Edit Inputs
                </button>
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow"
                >
                  Retry
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
