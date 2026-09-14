'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import VerdictBanner from '@/components/VerdictBanner'
import StatCard from '@/components/StatCard'
import LeadForm from '@/components/LeadForm'
import { getAssessment } from '@/lib/api'
import { formatKsh, formatYears } from '@/lib/formatters'
import type { AssessmentReport } from '@/lib/types'

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

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const cachedReport = sessionStorage.getItem(`solarsight-report-${assessmentId}`)
        if (cachedReport) {
          setReport(JSON.parse(cachedReport) as AssessmentReport)
          return
        }
        const data = await getAssessment(assessmentId)
        setReport(data)
      } catch (err: any) {
        setError(err.message || 'Unable to load your solar assessment.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [assessmentId])

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

  const savingsRange = `${formatKsh(fin.monthly_savings_low_ksh)} – ${formatKsh(
    fin.monthly_savings_high_ksh
  )}`

  return (
    <div className="max-w-[640px] mx-auto px-4 py-6 sm:py-10 space-y-6">
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

      {/* ── 4. Financial Comparison Table: Grid-Tie vs Hybrid ── */}
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

      {/* ── 5. Recommendations List ── */}
      {res.recommendations && res.recommendations.length > 0 && (
        <div className="bg-surface rounded-2xl p-5 border border-border shadow-soft space-y-3">
          <h3 className="font-bold text-sm text-textPrimary">
            Tailored Engineering Recommendations
          </h3>
          <ul className="space-y-2.5">
            {res.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-3 text-xs text-textSecondary leading-relaxed">
                <div className="p-1 rounded bg-teal-50 text-primary mt-0.5 flex-shrink-0">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── 6. Assumptions Accordion (Transparency Builds Trust) ── */}
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

      {/* ── 7. Disclaimer ── */}
      <div className="p-3.5 bg-slate-100/70 border border-slate-200 rounded-xl text-[11px] text-textSecondary leading-relaxed">
        <strong>Disclaimer:</strong> {res.disclaimer}
      </div>

      {/* ── 8. Primary CTA 'Get 3 Free Quotes' ── */}
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
