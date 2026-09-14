'use client'

import type { ShadingLevel } from '@/lib/types'

interface ShadingPickerProps {
  value: ShadingLevel
  onChange: (val: ShadingLevel) => void
}

export default function ShadingPicker({ value, onChange }: ShadingPickerProps) {
  const options: Array<{
    id: ShadingLevel
    title: string
    desc: string
    icon: React.ReactNode
  }> = [
    {
      id: 'none',
      title: 'Full Sun',
      desc: 'No trees or buildings blocking the sun',
      icon: (
        <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <circle cx="12" cy="12" r="5" strokeWidth={2} fill="#F59E0B" fillOpacity={0.2} />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41m14.14-14.14l-1.41 1.41" />
        </svg>
      ),
    },
    {
      id: 'some',
      title: 'Partial Shade',
      desc: 'A nearby tree or roof wall casts some shade',
      icon: (
        <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
      ),
    },
    {
      id: 'heavy',
      title: 'Heavy Shade',
      desc: 'Surrounded by tall trees or tall adjacent buildings',
      icon: (
        <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
      ),
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {options.map((opt) => {
        const isSelected = value === opt.id
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`flex flex-col items-center text-center p-4 rounded-2xl border-2 min-h-[120px] justify-center transition-all ${
              isSelected
                ? 'border-primary bg-teal-50/60 shadow-sm ring-1 ring-primary'
                : 'border-border bg-surface hover:border-slate-300'
            }`}
            aria-pressed={isSelected}
          >
            <div className="mb-2" aria-hidden="true">{opt.icon}</div>
            <span className="font-bold text-sm text-textPrimary">{opt.title}</span>
            <span className="text-xs text-textSecondary mt-1 leading-snug">{opt.desc}</span>
          </button>
        )
      })}
    </div>
  )
}
