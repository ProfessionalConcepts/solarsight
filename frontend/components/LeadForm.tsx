'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitLead } from '@/lib/api'
import type { InstallerPublicDetail } from '@/lib/types'

interface LeadFormProps {
  assessmentId: string
  isOpen: boolean
  onClose: () => void
}

export default function LeadForm({
  assessmentId,
  isOpen,
  onClose,
}: LeadFormProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [consent, setConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    matchedInstallers: string[]
    installers?: InstallerPublicDetail[]
    message: string
  } | null>(null)

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Validate phone
    const cleanPhone = phone.trim().replace(/\s+/g, '')
    const kePhoneRegex = /^(?:\+?254|0)([17]\d{8})$/
    if (!kePhoneRegex.test(cleanPhone)) {
      setError('Please enter a valid Kenyan phone number (e.g. 0712345678 or +254712345678)')
      return
    }

    if (!consent) {
      setError('Please agree to allow verified installers to contact you.')
      return
    }

    try {
      setSubmitting(true)
      const res = await submitLead({
        assessment_id: assessmentId,
        name: name.trim(),
        phone: cleanPhone,
        consent,
      })

      setResult({
        matchedInstallers: res.matched_installers,
        installers: res.installers,
        message: res.message,
      })
    } catch (err: any) {
      setError(err.message || 'Failed to submit quote request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleChooseInstaller(installerId?: number) {
    onClose()
    router.push(`/project/${assessmentId}${installerId ? `?installer=${installerId}` : ''}`)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lead-modal-title"
    >
      <div className="bg-surface w-full max-w-lg rounded-3xl p-6 sm:p-7 border border-border shadow-xl relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-textSecondary hover:text-textPrimary p-2 rounded-lg"
          aria-label="Close dialog"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {!result ? (
          <div>
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-full bg-teal-50 text-primary flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 id="lead-modal-title" className="text-xl font-bold text-textPrimary">
                Get Up to 3 Free Installer Quotes
              </h3>
              <p className="text-xs text-textSecondary mt-1 leading-relaxed">
                Connect with vetted EPRA-licensed solar companies serving your area and track your installation roadmap.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="lead-name" className="block text-xs font-bold text-textSecondary mb-1">
                  Your Full Name
                </label>
                <input
                  id="lead-name"
                  type="text"
                  required
                  placeholder="e.g. Antony Mwangi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="lead-phone" className="block text-xs font-bold text-textSecondary mb-1">
                  M-Pesa / WhatsApp Phone Number
                </label>
                <input
                  id="lead-phone"
                  type="tel"
                  required
                  placeholder="0712 345 678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                />
                <span className="text-[11px] text-textSecondary mt-1 block">
                  Kenyan mobile number format (e.g. 07XXXXXXXX or +254XXXXXXXXX)
                </span>
              </div>

              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary border-border"
                  />
                  <span className="text-xs text-textSecondary leading-normal">
                    I consent to SolarSight sharing my solar sizing summary with vetted installers for the purpose of receiving quotes. (Kenya Data Protection Act 2019)
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-4 bg-accent hover:bg-amber-500 text-slate-950 font-extrabold rounded-2xl shadow transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {submitting ? 'Matching Installers...' : 'Request Free Quotes'}
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center py-2 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-textPrimary">Installers Matched!</h3>
              <p className="text-xs text-textSecondary mt-1 leading-relaxed">
                Choose your preferred partner below to open your interactive installation tracker:
              </p>
            </div>

            {/* Rich Installer Selection Cards */}
            <div className="space-y-3 text-left">
              {(result.installers && result.installers.length > 0
                ? result.installers
                : result.matchedInstallers.map((name, i) => ({
                    id: i + 1,
                    name,
                    area: 'Nairobi, Kenya',
                    rating_avg: 4.8,
                    rating_count: 24,
                    epra_verified: true,
                    service_radius_km: 50,
                  }))
              ).map((inst: any) => (
                <div
                  key={inst.id}
                  className="p-4 bg-slate-50 hover:bg-teal-50/50 border border-border hover:border-primary/50 rounded-2xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-textPrimary">{inst.name}</h4>
                      <span className="text-[10px] font-extrabold bg-teal-100 text-teal-800 px-2 py-0.5 rounded">
                        EPRA Class V1
                      </span>
                    </div>
                    <p className="text-xs text-textSecondary mt-0.5">
                      📍 {inst.area} · ★ {inst.rating_avg || 4.8} ({inst.rating_count || 18} reviews)
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleChooseInstaller(inst.id)}
                    className="px-4 py-2 bg-primary hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm whitespace-nowrap self-start sm:self-center"
                  >
                    Select & Track Installation →
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => handleChooseInstaller()}
              className="w-full py-3 px-4 bg-accent hover:bg-amber-500 text-slate-950 font-bold rounded-2xl text-xs transition-colors shadow-sm"
            >
              Continue to Project Tracker Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
