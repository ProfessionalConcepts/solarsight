'use client'

export default function SkeletonLoader({
  message = 'Reading sunlight data for your area...',
}: {
  message?: string
}) {
  return (
    <div className="max-w-[640px] mx-auto p-6 bg-surface rounded-2xl border border-border shadow-sm text-center space-y-6 animate-pulse">
      <div className="inline-flex p-4 bg-amber-50 rounded-full text-accent mb-2">
        <svg
          className="w-10 h-10 animate-spin text-accent"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-bold text-textPrimary">{message}</h3>
        <p className="text-sm text-textSecondary">
          Connecting to European Union satellite irradiance records (PVGIS)...
        </p>
      </div>

      <div className="space-y-3 pt-4">
        <div className="h-6 bg-slate-200 rounded-lg w-3/4 mx-auto" />
        <div className="h-16 bg-slate-200 rounded-xl w-full" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-20 bg-slate-200 rounded-xl" />
          <div className="h-20 bg-slate-200 rounded-xl" />
          <div className="h-20 bg-slate-200 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
