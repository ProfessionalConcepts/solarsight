/**
 * Manages the wizard draft in localStorage.
 * Key: 'energyiq_draft'
 */

import type { WizardDraft } from './types'

const DRAFT_KEY = 'energyiq_draft'

/**
 * Saves the current wizard state to localStorage.
 */
export function saveDraft(draft: WizardDraft): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  } catch {
    // Quota exceeded or private mode – silently fail
  }
}

/**
 * Loads the wizard draft from localStorage.
 * Returns null if no draft exists or if it's invalid.
 */
export function loadDraft(): WizardDraft | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as WizardDraft
    // Basic shape validation
    if (typeof parsed.step !== 'number' || !parsed.input) return null
    return parsed
  } catch {
    return null
  }
}

/**
 * Clears the wizard draft from localStorage.
 * Call this after a successful report submission.
 */
export function clearDraft(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(DRAFT_KEY)
  } catch {
    // Silently fail
  }
}

/**
 * Returns true if a draft exists and has meaningful data.
 */
export function hasDraft(): boolean {
  return loadDraft() !== null
}
