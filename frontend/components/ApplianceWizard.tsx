'use client'

import { useState, useEffect } from 'react'
import type { ApplianceEntry } from '@/lib/types'

const DEFAULT_APPLIANCES: ApplianceEntry[] = [
  { id: 'fridge', name: 'Refrigerator', watts: 150, hours_per_day: 24, checked: true },
  { id: 'tv', name: 'Television (LED/Smart)', watts: 100, hours_per_day: 5, checked: true },
  { id: 'led_bulb', name: 'LED Lighting (5 bulbs)', watts: 50, hours_per_day: 6, checked: true },
  { id: 'laptop', name: 'Laptop / Computer', watts: 65, hours_per_day: 6, checked: false },
  { id: 'water_pump', name: 'Water Booster Pump', watts: 750, hours_per_day: 1.5, checked: false },
  { id: 'security_lights', name: 'Security Floodlights', watts: 40, hours_per_day: 10, checked: false },
  { id: 'fan', name: 'Ceiling / Standing Fan', watts: 60, hours_per_day: 4, checked: false },
  { id: 'iron', name: 'Electric Iron', watts: 1000, hours_per_day: 0.5, checked: false },
]

interface ApplianceWizardProps {
  initialValue?: ApplianceEntry[]
  onChange: (monthlyKwh: number, appliances: ApplianceEntry[]) => void
}

export default function ApplianceWizard({
  initialValue,
  onChange,
}: ApplianceWizardProps) {
  const [appliances, setAppliances] = useState<ApplianceEntry[]>(
    initialValue && initialValue.length > 0 ? initialValue : DEFAULT_APPLIANCES
  )

  const dailyKwh = appliances
    .filter((a) => a.checked)
    .reduce((sum, a) => sum + (a.watts * a.hours_per_day) / 1000, 0)
  const monthlyKwh = Math.round(dailyKwh * 30)

  useEffect(() => {
    onChange(monthlyKwh, appliances)
  }, [monthlyKwh, appliances, onChange])

  function toggleCheck(id: string) {
    setAppliances((prev) =>
      prev.map((a) => (a.id === id ? { ...a, checked: !a.checked } : a))
    )
  }

  function updateHours(id: string, hours: number) {
    setAppliances((prev) =>
      prev.map((a) => (a.id === id ? { ...a, hours_per_day: hours } : a))
    )
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">
            Estimated Usage
          </span>
          <div className="text-2xl font-extrabold text-primary">
            {monthlyKwh} <span className="text-base font-medium">kWh / month</span>
          </div>
        </div>
        <div className="text-right text-xs text-textSecondary">
          ~{(dailyKwh).toFixed(1)} kWh per day
        </div>
      </div>

      <div className="divide-y divide-border bg-surface rounded-2xl border border-border overflow-hidden">
        {appliances.map((app) => (
          <div key={app.id} className="p-3.5 sm:p-4 transition-colors hover:bg-slate-50">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={app.checked}
                  onChange={() => toggleCheck(app.id)}
                  className="w-5 h-5 rounded text-primary focus:ring-primary border-slate-300"
                />
                <div>
                  <span className="font-semibold text-sm text-textPrimary block">
                    {app.name}
                  </span>
                  <span className="text-xs text-textSecondary">{app.watts}W</span>
                </div>
              </label>

              {app.checked && (
                <div className="text-right">
                  <span className="text-xs font-semibold text-primary">
                    {app.hours_per_day} hrs/day
                  </span>
                </div>
              )}
            </div>

            {app.checked && (
              <div className="mt-3 pl-8 pr-2">
                <input
                  type="range"
                  min="0.5"
                  max="24"
                  step="0.5"
                  value={app.hours_per_day}
                  onChange={(e) => updateHours(app.id, parseFloat(e.target.value))}
                  className="w-full accent-primary h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  aria-label={`${app.name} hours per day`}
                />
                <div className="flex justify-between text-[10px] text-textSecondary mt-1">
                  <span>30 mins</span>
                  <span>12 hrs</span>
                  <span>24 hrs</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
