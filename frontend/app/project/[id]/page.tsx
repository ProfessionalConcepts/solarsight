'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getProjectTracker, updateProjectTracker, getNearbyInstallers } from '@/lib/api'
import { formatKsh } from '@/lib/formatters'
import type { AssessmentReport, CustomerProjectTracker, InstallerPublic } from '@/lib/types'

export default function CustomerProjectPage({ params }: { params: { id: string } }) {
  const assessmentId = params.id
  const [tracker, setTracker] = useState<CustomerProjectTracker | null>(null)
  const [assessment, setAssessment] = useState<AssessmentReport | null>(null)
  const [installers, setInstallers] = useState<InstallerPublic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Site visit booking state
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [preferredDate, setPreferredDate] = useState('')
  const [preferredTime, setPreferredTime] = useState('morning')
  const [accessNotes, setAccessNotes] = useState('')
  const [bookingSuccess, setBookingSuccess] = useState(false)

  // Customer checklist interactive state
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({
    roof: true,
    bill: false,
    board: false,
    wifi: false,
  })

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const res = await getProjectTracker(assessmentId)
        setTracker(res.tracker)
        setAssessment(res.assessment)

        const lat = res.assessment?.lat || -1.2921
        const lng = res.assessment?.lng || 36.8219
        const nearby = await getNearbyInstallers(lat, lng, res.assessment?.result?.sizing?.recommended_kwp || 3.0)
        setInstallers(nearby)
      } catch (err: any) {
        setError(err.message || 'Unable to load installation tracker.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [assessmentId])

  async function handleSwitchInstaller(newInstallerId: number) {
    try {
      setLoading(true)
      const res = await updateProjectTracker(assessmentId, {
        installer_id: newInstallerId,
      })
      setTracker(res.tracker)
    } catch (err: any) {
      alert(`Could not switch installer: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleScheduleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!preferredDate) return

    try {
      const scheduledStr = `${preferredDate} (${preferredTime === 'morning' ? 'Morning 9AM-12PM' : 'Afternoon 2PM-5PM'})`
      const res = await updateProjectTracker(assessmentId, {
        scheduled_survey_date: scheduledStr,
        survey_notes: accessNotes,
        status: 'survey_scheduled',
      })
      setTracker(res.tracker)
      setBookingSuccess(true)
      setTimeout(() => {
        setBookingSuccess(false)
        setShowScheduleModal(false)
      }, 2000)
    } catch (err: any) {
      alert(`Booking failed: ${err.message}`)
    }
  }

  if (loading && !tracker) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold text-textPrimary">Loading your solar installation dashboard...</p>
      </div>
    )
  }

  if (error || !tracker) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800">
          <h2 className="font-bold text-lg mb-1">Project Not Found</h2>
          <p className="text-xs">{error || 'Please run a solar assessment first.'}</p>
          <div className="mt-4">
            <Link href="/assess" className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl inline-block">
              Start Assessment
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const inst = tracker.installer
  const sizing = assessment?.result?.sizing
  const fin = assessment?.result?.financials
  const kwp = sizing?.recommended_kwp || 3.0
  const batKwh = sizing?.battery_kwh || 5.0
  const panelCount = Math.ceil((kwp * 1000) / 550)

  // WhatsApp quick link for the customer to message the installer
  const waLeadText = encodeURIComponent(
    `Hello ${inst.name}, I am tracking my SolarSight project (Ref: ${assessmentId.slice(
      0,
      8
    )}). I would like to confirm my ${kwp} kWp solar system sizing and arrange our site visit in ${
      assessment?.location_label || 'Nairobi'
    }.`
  )
  const waUrl = inst.whatsapp
    ? `https://wa.me/${inst.whatsapp.replace(/[\+\s]/g, '')}?text=${waLeadText}`
    : `https://wa.me/254711234567?text=${waLeadText}`

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-8 pb-16">
      {/* ── Breadcrumb & Back ── */}
      <div className="flex items-center justify-between text-xs text-textSecondary">
        <Link href={`/report/${assessmentId}`} className="hover:text-primary flex items-center gap-1 font-semibold">
          ← Back to Feasibility Report
        </Link>
        <span className="bg-teal-50 text-teal-800 font-bold px-3 py-1 rounded-full">
          Project ID: {assessmentId.slice(0, 8)}
        </span>
      </div>

      {/* ── Header Card: Selected Installer ── */}
      <div className="p-6 bg-surface rounded-3xl border border-border shadow-soft space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-2xl flex-shrink-0">
              ☀️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-textPrimary">{inst.name}</h1>
                <span className="text-teal-600" title="EPRA Verified Partner">
                  ✓
                </span>
              </div>
              <p className="text-xs text-textSecondary mt-0.5">
                📍 {inst.area} · Service radius {inst.service_radius_km} km
              </p>
              {inst.epra_license_no && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                    EPRA License: {inst.epra_license_no} (Class V1)
                  </span>
                  <span className="text-[11px] text-textSecondary">★ {inst.rating_avg || 4.8} ({inst.rating_count || 24} reviews)</span>
                </div>
              )}
            </div>
          </div>

          {/* Installer Switcher Dropdown */}
          <div className="self-start sm:self-center">
            <label htmlFor="switch-inst" className="block text-[10px] font-bold text-textSecondary uppercase mb-1">
              Change Installer:
            </label>
            <select
              id="switch-inst"
              value={inst.id}
              onChange={(e) => handleSwitchInstaller(Number(e.target.value))}
              className="text-xs font-semibold px-2.5 py-1.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
            >
              {installers.map((other) => (
                <option key={other.id} value={other.id}>
                  {other.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bio / Value Prop */}
        {inst.bio && (
          <p className="text-xs text-textSecondary leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            "{inst.bio}"
          </p>
        )}

        {/* Direct Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-2xl shadow-sm transition-all"
          >
            <span>💬 Chat on WhatsApp</span>
          </a>

          <button
            type="button"
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-3.5 bg-primary hover:bg-teal-700 text-white font-extrabold text-sm rounded-2xl shadow-sm transition-all"
          >
            <span>📅 {tracker.scheduled_survey_date ? 'Reschedule Site Visit' : 'Schedule Site Visit'}</span>
          </button>
        </div>

        {tracker.scheduled_survey_date && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-semibold flex items-center gap-2">
            <span>⏰ Confirmed Site Inspection:</span>
            <strong>{tracker.scheduled_survey_date}</strong>
          </div>
        )}
      </div>

      {/* ── 2. Interactive Installation Milestones Timeline ── */}
      <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-border shadow-soft space-y-6">
        <div>
          <h2 className="text-xl font-bold text-textPrimary">Installation Roadmap & Milestones</h2>
          <p className="text-xs text-textSecondary mt-1">
            Track your project from initial roof survey to grid-tied commissioning and handover.
          </p>
        </div>

        <div className="relative border-l-2 border-teal-200 ml-4 pl-6 space-y-6">
          {/* Step 1 */}
          <div className="relative">
            <div className="absolute -left-[33px] top-0.5 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow">
              ✓
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                Completed
              </span>
              <h3 className="font-bold text-sm text-textPrimary mt-1">1. Feasibility Check & Solar Sizing</h3>
              <p className="text-xs text-textSecondary mt-0.5">
                Satellite solar irradiance verified via EU PVGIS. Recommended size: <strong>{kwp} kWp</strong> with{' '}
                <strong>{batKwh} kWh</strong> storage.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative">
            <div className="absolute -left-[33px] top-0.5 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold animate-pulse shadow">
              2
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                Current Active Step
              </span>
              <h3 className="font-bold text-sm text-textPrimary mt-1">2. Site Visit & Roof Structural Audit</h3>
              <p className="text-xs text-textSecondary mt-0.5">
                {inst.name}'s EPRA technician inspects your roof timber/steel trusses, electrical consumer unit, and confirms cable routing.
              </p>
              {!tracker.scheduled_survey_date ? (
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(true)}
                  className="mt-2.5 px-4 py-2 bg-accent hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-sm"
                >
                  Propose Your Visit Date →
                </button>
              ) : (
                <div className="mt-2 text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1.5 rounded-lg inline-block">
                  Site Visit Scheduled for: {tracker.scheduled_survey_date}
                </div>
              )}
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative opacity-85">
            <div className="absolute -left-[33px] top-0.5 w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold">
              3
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                Upcoming
              </span>
              <h3 className="font-bold text-sm text-textPrimary mt-1">3. Formal Bill of Materials (BOM) & Equipment Contract</h3>
              <p className="text-xs text-textSecondary mt-0.5">
                You receive a formal breakdown of panel brands, inverter model, warranties (25 yrs), and payment milestones.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="relative opacity-85">
            <div className="absolute -left-[33px] top-0.5 w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold">
              4
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                Upcoming
              </span>
              <h3 className="font-bold text-sm text-textPrimary mt-1">4. EPRA Compliance & KPLC Net-Metering Permitting</h3>
              <p className="text-xs text-textSecondary mt-0.5">
                Installer files single-line electrical diagrams (SLD) with EPRA and assists with KPLC grid connection paperwork.
              </p>
            </div>
          </div>

          {/* Step 5 */}
          <div className="relative opacity-85">
            <div className="absolute -left-[33px] top-0.5 w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold">
              5
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                Upcoming
              </span>
              <h3 className="font-bold text-sm text-textPrimary mt-1">5. Roof Mounting & Electrical Wiring</h3>
              <p className="text-xs text-textSecondary mt-0.5">
                Installation takes 1 to 2 days. Panels mounted North-facing on anodized aluminum rails with DC surge protection.
              </p>
            </div>
          </div>

          {/* Step 6 */}
          <div className="relative opacity-85">
            <div className="absolute -left-[33px] top-0.5 w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold">
              6
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                Upcoming
              </span>
              <h3 className="font-bold text-sm text-textPrimary mt-1">6. Commissioning, Testing & Handover</h3>
              <p className="text-xs text-textSecondary mt-0.5">
                Electrical earth resistance testing, inverter live synchronization, and setup of the mobile app to monitor your generation.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Equipment Sizing & Bill of Materials (BOM) Calculator ── */}
      <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-border shadow-soft space-y-6">
        <div>
          <h2 className="text-xl font-bold text-textPrimary">Your System Hardware Breakdown</h2>
          <p className="text-xs text-textSecondary mt-1">
            Hardware components recommended for your {kwp} kWp setup by {inst.name}.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Panels */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-teal-800 uppercase bg-teal-50 px-2 py-0.5 rounded">
                Solar Panels
              </span>
              <span className="text-xs font-bold text-textPrimary">{panelCount} Units</span>
            </div>
            <h4 className="font-bold text-sm text-textPrimary">550W Tier 1 Monocrystalline TOPCon</h4>
            <p className="text-xs text-textSecondary">
              {inst.brands_supported?.[0] || 'Jinko / LONGi'}. Total PV capacity: {(panelCount * 0.55).toFixed(1)} kWp. 25-year linear output guarantee.
            </p>
          </div>

          {/* Inverter */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-teal-800 uppercase bg-teal-50 px-2 py-0.5 rounded">
                Solar Inverter
              </span>
              <span className="text-xs font-bold text-textPrimary">1 Unit</span>
            </div>
            <h4 className="font-bold text-sm text-textPrimary">{kwp <= 3 ? '3.6kW' : kwp <= 5 ? '5.0kW' : '8.0kW'} Smart Hybrid Inverter</h4>
            <p className="text-xs text-textSecondary">
              {inst.brands_supported?.[1] || 'Deye / Huawei'}. Dual MPPT, seamless 10ms blackout changeover, generator auto-start port.
            </p>
          </div>

          {/* Battery */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-teal-800 uppercase bg-teal-50 px-2 py-0.5 rounded">
                Battery Storage
              </span>
              <span className="text-xs font-bold text-textPrimary">{batKwh} kWh</span>
            </div>
            <h4 className="font-bold text-sm text-textPrimary">48V LiFePO4 Lithium Battery</h4>
            <p className="text-xs text-textSecondary">
              {inst.brands_supported?.[2] || 'Pylontech / Felicity'}. 90% Depth of Discharge, 6,000+ life cycles (~15 years).
            </p>
          </div>

          {/* BOS */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-teal-800 uppercase bg-teal-50 px-2 py-0.5 rounded">
                Balance of System
              </span>
              <span className="text-xs font-bold text-textPrimary">Full Kit</span>
            </div>
            <h4 className="font-bold text-sm text-textPrimary">Anodized Rails & Protection Box</h4>
            <p className="text-xs text-textSecondary">
              Corrosion-proof aluminum clamps, 6mm² TUV DC solar cabling, 1000V DC surge protection, smart bi-directional meter.
            </p>
          </div>
        </div>

        {fin && (
          <div className="p-4 bg-teal-50/70 border border-teal-100 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-teal-950">Expected Monthly Savings: </span>
              <strong className="text-primary font-extrabold text-sm">
                {formatKsh(fin.monthly_savings_low_ksh)} – {formatKsh(fin.monthly_savings_high_ksh)}
              </strong>
            </div>
            <div>
              <span className="font-bold text-teal-950">Estimated Payback: </span>
              <strong className="text-primary font-extrabold text-sm">{fin.payback_grid_tie_yrs} Years</strong>
            </div>
          </div>
        )}
      </div>

      {/* ── 4. Customer Preparation Checklist ── */}
      <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-border shadow-soft space-y-4">
        <div>
          <h2 className="text-lg font-bold text-textPrimary">What to Prepare Before Your Site Visit</h2>
          <p className="text-xs text-textSecondary">
            To make your engineering survey quick and productive, check off these items:
          </p>
        </div>

        <div className="space-y-3">
          <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={checkedItems.roof}
              onChange={(e) => setCheckedItems({ ...checkedItems, roof: e.target.checked })}
              className="mt-0.5 w-4 h-4 text-primary rounded"
            />
            <div className="text-xs">
              <strong className="text-textPrimary block">Safe Roof Access</strong>
              <span className="text-textSecondary">Ensure there is clear space for an inspection ladder or an attic access hatch.</span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={checkedItems.bill}
              onChange={(e) => setCheckedItems({ ...checkedItems, bill: e.target.checked })}
              className="mt-0.5 w-4 h-4 text-primary rounded"
            />
            <div className="text-xs">
              <strong className="text-textPrimary block">Recent KPLC Power Bill / Token Meter Number</strong>
              <span className="text-textSecondary">Needed to verify your tariff category and design KPLC net-metering interconnection.</span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={checkedItems.board}
              onChange={(e) => setCheckedItems({ ...checkedItems, board: e.target.checked })}
              className="mt-0.5 w-4 h-4 text-primary rounded"
            />
            <div className="text-xs">
              <strong className="text-textPrimary block">Access to Main Electricity Consumer Unit</strong>
              <span className="text-textSecondary">The engineer will inspect main breaker amperage, earthing point, and cable channels.</span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={checkedItems.wifi}
              onChange={(e) => setCheckedItems({ ...checkedItems, wifi: e.target.checked })}
              className="mt-0.5 w-4 h-4 text-primary rounded"
            />
            <div className="text-xs">
              <strong className="text-textPrimary block">Home Wi-Fi Network Available</strong>
              <span className="text-textSecondary">Allows connecting the hybrid inverter for 24/7 smartphone solar monitoring.</span>
            </div>
          </label>
        </div>
      </div>

      {/* ── Schedule Modal ── */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-surface w-full max-w-md rounded-3xl p-6 border border-border shadow-xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-bold text-base text-textPrimary">Schedule Site Visit with {inst.name}</h3>
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="text-textSecondary hover:text-textPrimary text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {bookingSuccess ? (
              <div className="p-6 text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                  ✓
                </div>
                <h4 className="font-bold text-base text-textPrimary">Site Visit Requested!</h4>
                <p className="text-xs text-textSecondary">
                  {inst.name} will contact you shortly to confirm your requested inspection appointment.
                </p>
              </div>
            ) : (
              <form onSubmit={handleScheduleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-textSecondary mb-1">Preferred Date</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    required
                    className="w-full text-xs font-semibold px-3 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-textSecondary mb-1">Preferred Time of Day</label>
                  <select
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                  >
                    <option value="morning">Morning (9:00 AM – 12:00 PM)</option>
                    <option value="afternoon">Afternoon (2:00 PM – 5:00 PM)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-textSecondary mb-1">
                    Special Roof or Gate Access Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Iron sheet roof with attic hatch, call upon arrival at gate 4..."
                    value={accessNotes}
                    onChange={(e) => setAccessNotes(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl text-xs shadow-sm"
                  >
                    Confirm Appointment
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
