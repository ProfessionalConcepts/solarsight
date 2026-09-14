'use client'

import { useState } from 'react'
import { submitLead } from '@/lib/api'

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
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [consent, setConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    matchedInstallers: string[]
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
        message: res.message,
      })
    } catch (err: any) {
      setError(err.message || 'Failed to submit quote request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lead-modal-title"
    >
      <div className="bg-surface w-full max-w-md rounded-2xl p-6 border border-border shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
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
                We share your solar sizing summary with up to 3 EPRA-vetted solar companies serving your area.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="lead-name" className="block text-xs font-semibold text-textPrimary mb-1">
                  Full Name
                </label>
                <input
                  id="lead-name"
                  type="text"
                  required
                  placeholder="e.g. Wanjiku Kamau"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                />
              </div>

              <div>
                <label htmlFor="lead-phone" className="block text-xs font-semibold text-textPrimary mb-1">
                  WhatsApp / Phone Number
                </label>
                <input
                  id="lead-phone"
                  type="tel"
                  required
                  placeholder="0712 345 678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                />
                <span className="text-[11px] text-textSecondary mt-1 block">
                  Installers will reach out via WhatsApp or phone call.
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-primary focus:ring-primary border-slate-300"
                  />
                  <span className="text-xs text-textSecondary leading-snug">
                    I consent to SolarSight sharing my assessment details with up to 3 licensed installers for the purpose of receiving quotes. (Kenya Data Protection Act 2019)
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 bg-accent hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {submitting ? 'Matching Installers...' : 'Request Free Quotes'}
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h3 className="text-xl font-extrabold text-textPrimary">
              Quote Request Sent!
            </h3>

            <p className="text-xs text-textSecondary leading-relaxed">
              {result.message}
            </p>

            {result.matchedInstallers && result.matchedInstallers.length > 0 && (
              <div className="p-4 bg-slate-50 border border-border rounded-xl text-left">
                <span className="text-xs font-semibold text-textPrimary block mb-2">
                  Matched Vetted Installers:
                </span>
                <ul className="space-y-1.5 text-xs text-textSecondary">
                  {result.matchedInstallers.map((instName, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span className="font-medium text-textPrimary">{instName}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-teal-800 transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
