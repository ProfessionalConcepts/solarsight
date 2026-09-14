'use client'

interface ProgressBarProps {
  currentStep: number
  totalSteps?: number
  stepNames?: string[]
}

export default function ProgressBar({
  currentStep,
  totalSteps = 4,
  stepNames = ['Location', 'Roof', 'Energy', 'Report'],
}: ProgressBarProps) {
  const percentage = Math.round((currentStep / totalSteps) * 100)

  return (
    <div className="w-full max-w-[640px] mx-auto mb-6">
      <div className="flex justify-between items-center text-xs font-medium text-textSecondary mb-2">
        <span>
          Step {currentStep} of {totalSteps}:{' '}
          <strong className="text-textPrimary">{stepNames[currentStep - 1] ?? ''}</strong>
        </span>
        <span>{percentage}%</span>
      </div>
      <div
        className="h-2 w-full bg-slate-200 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
