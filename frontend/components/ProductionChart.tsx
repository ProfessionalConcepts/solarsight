'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
  Cell,
} from 'recharts'
import type { MonthlyProduction } from '@/lib/types'

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

interface ProductionChartProps {
  monthlyProduction: MonthlyProduction[]
  recommendedKwp?: number
}

export default function ProductionChart({
  monthlyProduction,
  recommendedKwp = 3.0,
}: ProductionChartProps) {
  const chartData = monthlyProduction.map((item, idx) => {
    const monthNum = item.month || idx + 1
    const name = MONTH_NAMES[monthNum - 1] || `M${monthNum}`
    const isRainy = monthNum === 4 || monthNum === 5 || monthNum === 11 // Apr, May, Nov
    return {
      month: name,
      monthNum,
      kwh: Math.round(item.kwh),
      isRainy,
    }
  })

  const totalKwh = chartData.reduce((sum, d) => sum + d.kwh, 0)
  const ariaSummary = `Estimated monthly solar electricity generation averaging ${Math.round(
    totalKwh / 12
  )} kWh per month, with expected seasonal drops during Kenya's April-May and November rains.`

  return (
    <div
      className="bg-surface rounded-2xl p-4 sm:p-5 border border-border shadow-soft"
      role="region"
      aria-label={ariaSummary}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
        <div>
          <h3 className="font-bold text-base text-textPrimary">
            Estimated Monthly Generation (kWh)
          </h3>
          <p className="text-xs text-textSecondary">
            European Union PVGIS satellite data based on your specific roof slope and location
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-accent" />
            Sunny months
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-200 border border-dashed border-amber-400" />
            Rainy season
          </span>
        </div>
      </div>

      <div className="h-[250px] sm:h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={{ stroke: '#E2E8F0' }}
              tick={{ fill: '#64748B', fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={{ stroke: '#E2E8F0' }}
              tick={{ fill: '#64748B', fontSize: 12 }}
              unit=" kWh"
            />
            <Tooltip
              formatter={(value: any) => [`${value} kWh`, 'Generation']}
              labelFormatter={(label) => `Month: ${label}`}
              contentStyle={{
                backgroundColor: '#0F172A',
                borderColor: '#1E293B',
                borderRadius: '0.75rem',
                color: '#FFFFFF',
                fontSize: '12px',
              }}
            />
            <Bar dataKey="kwh" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isRainy ? '#FDE68A' : '#F59E0B'}
                  stroke={entry.isRainy ? '#F59E0B' : 'transparent'}
                  strokeDasharray={entry.isRainy ? '2 2' : 'none'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed">
        <svg
          className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z"
          />
        </svg>
        <div>
          <strong className="font-semibold">Notice the April-May and November dips?</strong> That is
          Kenya's 'long rains' and 'short rains'. A reputable solar design accounts for these cloudy
          months so you are never caught off guard.
        </div>
      </div>
    </div>
  )
}
