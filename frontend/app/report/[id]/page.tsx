'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import VerdictBanner from '@/components/VerdictBanner'
import StatCard from '@/components/StatCard'
import LeadForm from '@/components/LeadForm'
import { getAssessment, redactAssessment, getNearbyInstallers } from '@/lib/api'
import { formatKsh, formatYears } from '@/lib/formatters'
import type { AssessmentReport, InstallerPublic } from '@/lib/types'

// Dynamic import of Recharts component
const ProductionChart = dynamic(() => import('@/components/ProductionChart'), {
  ssr: false,
  loading: () => (
    <div className="h-[280px] bg-slate-100 rounded-2xl animate-pulse flex items-center justify-center text-xs text-textSecondary">
      Loading generation chart...
    </div>
  ),
})

export default function ReportPage({ params }: { params: { id: string } }) {
  const assessmentId = params.id
  const [report, setReport] = useState<AssessmentReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [leadModalOpen, setLeadModalOpen] = useState(false)
  const [assumptionsOpen, setAssumptionsOpen] = useState(false)
  const [nearbyInstallers, setNearbyInstallers] = useState<InstallerPublic[]>([])

  // Geospatial Redaction state
  const [redacting, setRedacting] = useState(false)
  const [redactedSuccess, setRedactedSuccess] = useState(false)

  // Copy link state
  const [copiedLink, setCopiedLink] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const cachedReport = sessionStorage.getItem(`solarsight-report-${assessmentId}`)
        let data: AssessmentReport
        if (cachedReport) {
          data = JSON.parse(cachedReport) as AssessmentReport
          setReport(data)
        } else {
          data = await getAssessment(assessmentId)
          setReport(data)
        }

        if (data.is_redacted) {
          setRedactedSuccess(true)
        }

        // Fetch nearby installers for direct matching
        const lat = data.lat || -1.2921
        const lng = data.lng || 36.8219
        const kwp = data.result?.sizing?.recommended_kwp || 3.0
        const insts = await getNearbyInstallers(lat, lng, kwp)
        setNearbyInstallers(insts.slice(0, 3))
      } catch (err: any) {
        setError(err.message || 'Unable to load your solar assessment.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [assessmentId])

  // Handle Redacting Exact Location & Polygon
  async function handleRedactGeodata() {
    if (!report) return
    const confirmRedact = window.confirm(
      'Are you sure you want to delete your exact coordinates and roof polygon trace? Your sizing and financial numbers will be preserved, but geospatial details will be permanently purged in accordance with the Kenya Data Protection Act 2019.'
    )
    if (!confirmRedact) return

    try {
      setRedacting(true)
      const res = await redactAssessment(assessmentId)
      setReport(res.report)
      setRedactedSuccess(true)
      sessionStorage.setItem(`solarsight-report-${assessmentId}`, JSON.stringify(res.report))

      // Also clean any draft from localStorage
      try {
        localStorage.removeItem('energyiq_draft')
      } catch {}
    } catch (err: any) {
      alert(`Redaction failed: ${err.message}`)
    } finally {
      setRedacting(false)
    }
  }

  function handleCopyShareLink() {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 3000)
    }
  }

  function handlePrintDossier() {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  if (loading) {
    return (
      <div className="max-w-[640px] mx-auto px-4 py-12 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold text-textPrimary">Loading your solar report...</p>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="max-w-[640px] mx-auto px-4 py-12 text-center space-y-4">
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800">
          <h2 className="font-bold text-lg mb-1">Report Not Found</h2>
          <p className="text-xs">{error || 'This report does not exist or has expired.'}</p>
          <div className="mt-4">
            <Link
              href="/assess"
              className="inline-block px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl"
            >
              Start New Assessment
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const res = report.result
  const sizing = res.sizing
  const fin = res.financials
  const verdict = res.verdict
  const kwp = sizing.recommended_kwp
  const batKwh = sizing.battery_kwh
  const panelCount = Math.ceil((kwp * 1000) / 550)

  // WhatsApp share message for sending to an installer
  const shareText = encodeURIComponent(
    `Hello, here is my SolarSight Feasibility Dossier (Ref: ${assessmentId.slice(
      0,
      8
    )}): Location: ${report.location_label || 'Kenya'}, System Size: ${kwp} kWp (${panelCount} x 550W panels), Battery: ${batKwh} kWh, Monthly Bill: KSh ${report.monthly_bill_ksh || 6000}. You can review my assessment here: ${
      typeof window !== 'undefined' ? window.location.href : ''
    }`
  )
  const waShareUrl = `https://wa.me/?text=${shareText}`

  return (
    <div className="max-w-[680px] mx-auto px-4 py-6 sm:py-10 space-y-6">
      {/* ── Top Bar: Location & Actions ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border text-xs">
        <div className="flex items-center gap-2">
          <span className="text-base">📍</span>
          <div>
            <span className="font-bold text-textPrimary block">{report.location_label}</span>
            <span className="text-textSecondary text-[11px]">Ref: {assessmentId.slice(0, 8)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrintDossier}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl flex items-center gap-1 transition-all"
            title="Print or Save PDF"
          >
            🖨️ <span>Print Dossier</span>
          </button>
          <button
            type="button"
            onClick={handleCopyShareLink}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl flex items-center gap-1 transition-all"
          >
            📋 <span>{copiedLink ? 'Copied!' : 'Share Link'}</span>
          </button>
        </div>
      </div>

      {/* ── 1. Verdict Banner ── */}
      <VerdictBanner
        level={verdict.code}
        headline={verdict.reason}
        reasons={[
          sizing.roof_limited
            ? 'Roof space limits maximum panel capacity'
            : 'Your roof is large enough for optimal coverage',
          fin.payback_grid_tie_yrs <= 8
            ? `Grid-tie payback is good at ~${fin.payback_grid_tie_yrs} years`
            : `Payback is ~${fin.payback_grid_tie_yrs} years`,
        ]}
      />

      {/* ── Personalized Narrative ── */}
      {res.narrative?.en && (
        <div className="p-4 bg-teal-50/70 border border-teal-200/80 rounded-2xl text-xs sm:text-sm text-teal-950 leading-relaxed shadow-soft">
          <span className="font-bold block mb-1 text-primary">Assessment Summary</span>
          {res.narrative.en}
        </div>
      )}

      {/* ── 2. Three Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          label="Recommended Size"
          value={`${sizing.recommended_kwp} kWp`}
          subvalue={
            sizing.battery_kwh > 0
              ? `+ ${sizing.battery_kwh} kWh battery`
              : 'Direct solar (no battery)'
          }
          unitTooltip="kWp stands for kilowatt-peak: the rated power capacity of your solar panel array in direct sunlight."
          tooltipTerm="kWp"
          highlight
        />

        <StatCard
          label="Monthly Savings"
          value={formatKsh(fin.monthly_savings_low_ksh)}
          subvalue={`Up to ${formatKsh(fin.monthly_savings_high_ksh)} in sunny months`}
        />

        <StatCard
          label="Estimated Payback"
          value={formatYears(fin.payback_grid_tie_yrs)}
          subvalue={
            fin.payback_hybrid_yrs > 0
              ? `${formatYears(fin.payback_hybrid_yrs)} with battery`
              : 'Grid-tie setup'
          }
        />
      </div>

      {/* ── 3. Monthly Production Chart ── */}
      <ProductionChart
        monthlyProduction={res.monthly_production}
        recommendedKwp={sizing.recommended_kwp}
      />

      {/* ── 4. Customer Engineering Dossier & Equipment Checklist ── */}
      <div className="bg-surface rounded-3xl p-6 border border-border shadow-soft space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h3 className="font-extrabold text-base text-textPrimary">Customer Engineering Dossier</h3>
            <p className="text-xs text-textSecondary">Equipment bill of materials generated for installers</p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 text-[11px] font-bold">
            EPRA Standard Kit
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl space-y-1">
            <span className="font-bold text-textPrimary block">Solar PV Array</span>
            <span className="text-textSecondary">
              {panelCount} x 550W Monocrystalline Panels ({(panelCount * 0.55).toFixed(1)} kWp)
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl space-y-1">
            <span className="font-bold text-textPrimary block">Inverter Unit</span>
            <span className="text-textSecondary">
              {kwp <= 3 ? '3.6kW' : kwp <= 5 ? '5.0kW' : '8.0kW'} Hybrid Inverter (Dual MPPT)
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl space-y-1">
            <span className="font-bold text-textPrimary block">Storage Module</span>
            <span className="text-textSecondary">
              {batKwh > 0 ? `${batKwh} kWh LiFePO4 Lithium Battery` : 'Grid-Tie Only (No Battery)'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl space-y-1">
            <span className="font-bold text-textPrimary block">Protection & Interconnection</span>
            <span className="text-textSecondary">Type II DC/AC SPD, 1000V Isolator, KPLC Net-Meter</span>
          </div>
        </div>

        {/* Action: Send Dossier to Installer via WhatsApp */}
        <div className="pt-2 flex flex-col sm:flex-row gap-2">
          <a
            href={waShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <span>📱 Send Dossier to Installer via WhatsApp</span>
          </a>

          <Link
            href={`/project/${assessmentId}`}
            className="flex-1 py-3 px-4 bg-primary hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm text-center"
          >
            <span>Track Installation Steps →</span>
          </Link>
        </div>
      </div>

      {/* ── 5. Financial Comparison Table: Grid-Tie vs Hybrid ── */}
      <div className="bg-surface rounded-2xl border border-border shadow-soft overflow-hidden">
        <div className="p-4 border-b border-border bg-slate-50/50">
          <h3 className="font-bold text-sm text-textPrimary">
            Financial Comparison: Grid-Tie vs. Hybrid
          </h3>
          <p className="text-xs text-textSecondary mt-0.5">
            Compare pure daytime savings against 24/7 blackout battery protection.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-textSecondary uppercase tracking-wider font-semibold border-b border-border">
              <tr>
                <th className="py-3 px-4">System Type</th>
                <th className="py-3 px-3">Est. Cost</th>
                <th className="py-3 px-3">Monthly Savings</th>
                <th className="py-3 px-3">Payback</th>
                <th className="py-3 px-3">Blackout Power</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-textPrimary">
              {/* Grid-Tie */}
              <tr className="hover:bg-slate-50/50">
                <td className="py-3.5 px-4 font-bold">
                  Grid-Tie
                  <span className="block text-[11px] font-normal text-textSecondary">
                    No batteries; daytime savings
                  </span>
                </td>
                <td className="py-3.5 px-3 font-semibold text-primary">
                  {formatKsh(fin.capex_grid_tie_ksh)}
                </td>
                <td className="py-3.5 px-3">
                  {formatKsh(fin.savings_annual_grid_tie_ksh / 12)} /mo
                </td>
                <td className="py-3.5 px-3 font-bold text-emerald-700">
                  {formatYears(fin.payback_grid_tie_yrs)}
                </td>
                <td className="py-3.5 px-3 text-textSecondary">
                  <span className="inline-flex items-center gap-1 text-slate-400">
                    ✕ Shuts off
                  </span>
                </td>
              </tr>

              {/* Hybrid */}
              <tr className="hover:bg-slate-50/50 bg-teal-50/20">
                <td className="py-3.5 px-4 font-bold">
                  Hybrid System
                  <span className="block text-[11px] font-normal text-textSecondary">
                    {sizing.battery_kwh} kWh battery included
                  </span>
                </td>
                <td className="py-3.5 px-3 font-semibold text-primary">
                  {formatKsh(fin.capex_hybrid_ksh)}
                </td>
                <td className="py-3.5 px-3">
                  {formatKsh(fin.savings_annual_hybrid_ksh / 12)} /mo
                </td>
                <td className="py-3.5 px-3 font-bold">
                  {formatYears(fin.payback_hybrid_yrs)}
                </td>
                <td className="py-3.5 px-3 font-semibold text-emerald-600">
                  ✓ ~6 hours
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 6. Matched Installers Direct Selection ── */}
      {nearbyInstallers.length > 0 && (
        <div className="bg-surface rounded-3xl p-6 border border-border shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-textPrimary">Matched EPRA-Vetted Installers</h3>
              <p className="text-xs text-textSecondary">Choose an installer to proceed to your installation dashboard</p>
            </div>
            <span className="text-xs font-bold text-primary">Nairobi Area</span>
          </div>

          <div className="space-y-3">
            {nearbyInstallers.map((inst) => (
              <div
                key={inst.id}
                className="p-4 bg-slate-50 hover:bg-teal-50/40 border border-border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-textPrimary">{inst.name}</h4>
                    {inst.epra_verified && (
                      <span className="text-[10px] font-extrabold bg-teal-100 text-teal-800 px-2 py-0.5 rounded">
                        EPRA Verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-textSecondary mt-0.5">
                    📍 {inst.area} · ★ {inst.rating_avg || 4.8} ({inst.rating_count || 24} reviews)
                  </p>
                </div>

                <Link
                  href={`/project/${assessmentId}?installer=${inst.id}`}
                  className="px-4 py-2 bg-primary hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm text-center whitespace-nowrap self-start sm:self-center"
                >
                  Choose Installer & View Roadmap →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 7. Geospatial Privacy & Data Redaction Controls (Data Protection Act 2019) ── */}
      <div className="bg-surface rounded-3xl p-6 border border-border shadow-soft space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-lg flex-shrink-0">
            🛡️
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm text-textPrimary">Geospatial Privacy Controls</h3>
            <p className="text-xs text-textSecondary mt-0.5 leading-relaxed">
              In accordance with Kenya Data Protection Act 2019, you have full control over your satellite coordinates and roof polygon outline.
            </p>
          </div>
        </div>

        {redactedSuccess || report.is_redacted ? (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <span>✓</span>
            <span>
              Exact GPS coordinates and roof trace have been permanently purged. Your solar capacity and financial calculations remain saved.
            </span>
          </div>
        ) : (
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <span className="text-xs text-textSecondary">
              Uncomfortable keeping your roof geometry or pin stored?
            </span>
            <button
              type="button"
              onClick={handleRedactGeodata}
              disabled={redacting}
              className="px-4 py-2 bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 border border-rose-200 font-bold text-xs rounded-xl transition-all shadow-sm whitespace-nowrap"
            >
              {redacting ? 'Purging Geodata...' : '🔒 Redact Exact Location & Polygon'}
            </button>
          </div>
        )}
      </div>

      {/* ── 8. Assumptions Accordion (Transparency Builds Trust) ── */}
      <div className="bg-surface rounded-2xl border border-border shadow-soft overflow-hidden">
        <button
          type="button"
          onClick={() => setAssumptionsOpen((prev) => !prev)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
        >
          <div>
            <span className="font-bold text-xs text-textPrimary block">
              Calculation Assumptions & Market Rates
            </span>
            <span className="text-[11px] text-textSecondary">
              Data last updated: {res.data_last_updated || '2025-06-01'}
            </span>
          </div>
          <svg
            className={`w-4 h-4 text-textSecondary transition-transform ${
              assumptionsOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {assumptionsOpen && (
          <div className="p-4 pt-1 border-t border-border bg-slate-50/40 text-xs text-textSecondary space-y-1.5">
            {res.assumptions.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 9. Disclaimer ── */}
      <div className="p-3.5 bg-slate-100/70 border border-slate-200 rounded-xl text-[11px] text-textSecondary leading-relaxed">
        <strong>Disclaimer:</strong> {res.disclaimer}
      </div>

      {/* ── 10. Sticky Primary CTA 'Get 3 Free Quotes' ── */}
      <div className="sticky bottom-4 z-30 pt-2">
        <button
          type="button"
          onClick={() => setLeadModalOpen(true)}
          className="w-full py-4 px-6 bg-accent hover:bg-amber-500 text-slate-950 font-extrabold rounded-2xl shadow-lg transition-all text-base flex items-center justify-center gap-2"
        >
          <span>Get 3 Free Quotes from Vetted Installers</span>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>

      {/* Lead Modal */}
      <LeadForm
        assessmentId={assessmentId}
        isOpen={leadModalOpen}
        onClose={() => setLeadModalOpen(false)}
      />
    </div>
  )
}
