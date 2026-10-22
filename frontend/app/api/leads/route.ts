import { NextResponse } from 'next/server'
import crypto from 'crypto'
import {
  getAssessmentById,
  matchInstallers,
  saveLead,
  toPublicDetail,
  saveProjectTracker,
  getInstallerById,
  type StoredLead,
} from '@/lib/server/store'
import type { CustomerProjectTracker } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { assessment_id, name, phone, consent, selected_installer_id } = body

    if (!consent) {
      return NextResponse.json(
        {
          error: {
            code: 'consent_required',
            message: 'Data Protection Act consent is required to connect with solar installers.',
          },
        },
        { status: 400 }
      )
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        {
          error: {
            code: 'invalid_name',
            message: 'Please provide your full name.',
          },
        },
        { status: 400 }
      )
    }

    const cleanPhone = (phone || '').toString().trim().replace(/[\s\-()]/g, '')
    const kePhoneRegex = /^(?:\+?254|0)([17]\d{8})$/
    const match = cleanPhone.match(kePhoneRegex)
    if (!match) {
      return NextResponse.json(
        {
          error: {
            code: 'invalid_phone',
            message: 'Please enter a valid Kenyan phone number (e.g. 0712345678 or +254712345678).',
          },
        },
        { status: 400 }
      )
    }

    const normalizedPhone = `+254${match[1]}`
    const assessment = assessment_id ? getAssessmentById(assessment_id) : null

    const lat = assessment?.lat ?? -1.2921
    const lng = assessment?.lng ?? 36.8219
    const kwp = assessment?.result?.sizing?.recommended_kwp ?? 3.0

    // Match up to 3 EPRA-verified installers near customer
    const matched = matchInstallers(lat, lng, kwp, 3)
    const matchedNames = matched.map((i) => i.name)
    const richInstallers = matched.map(toPublicDetail)

    const leadId = crypto.randomUUID()
    const storedLead: StoredLead = {
      lead_id: leadId,
      assessment_id: assessment_id || '',
      name: name.trim(),
      phone: normalizedPhone,
      consent: true,
      status: matched.length > 0 ? 'matched' : 'unmatched',
      selected_installer_id: selected_installer_id ? Number(selected_installer_id) : undefined,
      created_at: new Date().toISOString(),
      matched_installers: matched.map((inst) => ({
        installer_id: inst.id,
        installer_name: inst.name,
        whatsapp: inst.whatsapp || inst.phone || '',
        status: 'notified',
      })),
    }

    saveLead(storedLead)

    // If an installer was selected or default to the top match, initialize the customer project tracker
    const chosenInstaller = selected_installer_id
      ? getInstallerById(Number(selected_installer_id)) || matched[0]
      : matched[0]

    if (chosenInstaller && assessment_id) {
      const tracker: CustomerProjectTracker = {
        project_id: crypto.randomUUID(),
        assessment_id,
        customer_name: name.trim(),
        customer_phone: normalizedPhone,
        installer: toPublicDetail(chosenInstaller),
        status: 'site_survey_pending',
        created_at: new Date().toISOString(),
      }
      saveProjectTracker(tracker)
    }

    const message =
      matched.length > 0
        ? `We have matched your assessment with ${matched.length} EPRA-vetted solar installers serving your area.`
        : 'Thank you! We are currently onboarding installers in your area and will connect you shortly.'

    return NextResponse.json(
      {
        lead_id: leadId,
        matched_installers: matchedNames,
        installers: richInstallers,
        message,
      },
      { status: 201 }
    )
  } catch (err: any) {
    console.error('Lead submission error:', err)
    return NextResponse.json(
      {
        error: {
          code: 'server_error',
          message: 'Failed to submit quote request. Please try again.',
        },
      },
      { status: 500 }
    )
  }
}
