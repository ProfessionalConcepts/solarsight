'use client'

import Tooltip from './Tooltip'

interface StatCardProps {
  label: string
  value: string
  subvalue?: string
  unitTooltip?: string
  tooltipTerm?: string
  highlight?: boolean
}

export default function StatCard({
  label,
  value,
  subvalue,
  unitTooltip,
  tooltipTerm,
  highlight = false,
}: StatCardProps) {
  return (
    <div
      className={`rounded-2xl p-4 border transition-all ${
        highlight
          ? 'bg-teal-50/50 border-primary/30 shadow-sm'
          : 'bg-surface border-border shadow-soft'
      }`}
    >
      <div className="flex items-center justify-between text-xs font-medium text-textSecondary mb-1.5">
        <span>{label}</span>
        {unitTooltip && tooltipTerm && (
          <Tooltip content={unitTooltip}>
            <span className="text-primary cursor-pointer">What is {tooltipTerm}?</span>
          </Tooltip>
        )}
      </div>

      <div className="text-2xl sm:text-3xl font-extrabold text-textPrimary tracking-tight">
        {value}
      </div>

      {subvalue && (
        <div className="mt-1 text-xs text-textSecondary font-normal leading-snug">
          {subvalue}
        </div>
      )}
    </div>
  )
}
