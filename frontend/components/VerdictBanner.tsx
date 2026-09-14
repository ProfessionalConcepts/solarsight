'use client'

import type { VerdictLevel } from '@/lib/types'

interface VerdictBannerProps {
  level: VerdictLevel
  headline: string
  reasons: string[]
}

export default function VerdictBanner({
  level,
  headline,
  reasons,
}: VerdictBannerProps) {
  const configs = {
    strong_yes: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-950',
      badgeBg: 'bg-emerald-600 text-white',
      badgeText: 'Strong Yes',
      icon: (
        <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    explore: {
      bg: 'bg-amber-50 border-amber-200 text-amber-950',
      badgeBg: 'bg-amber-500 text-white',
      badgeText: 'Worth Exploring',
      icon: (
        <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    caution: {
      bg: 'bg-rose-50 border-rose-200 text-rose-950',
      badgeBg: 'bg-rose-600 text-white',
      badgeText: 'Caution / Survey Needed',
      icon: (
        <svg className="w-6 h-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
  }

  const current = configs[level] || configs.explore

  return (
    <div
      className={`rounded-2xl p-5 border shadow-sm ${current.bg} transition-all`}
      role="region"
      aria-label="Solar Assessment Verdict"
    >
      <div className="flex items-center gap-3 mb-2">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${current.badgeBg}`}>
          {current.badgeText}
        </span>
      </div>

      <div className="flex items-start gap-3 mt-2">
        <div className="flex-shrink-0 mt-0.5">{current.icon}</div>
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight">
            {headline}
          </h2>
          {reasons && reasons.length > 0 && (
            <ul className="mt-3 space-y-1.5 text-sm opacity-90">
              {reasons.map((r, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
