import { NextResponse } from 'next/server'
import crypto from 'crypto'
import {
  getProjectTracker,
  saveProjectTracker,
  getAssessmentById,
  getInstallerById,
  getInstallers,
  toPublicDetail,
} from '@/lib/server/store'
import type { CustomerProjectTracker } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const assessmentId = params.id
  const requestedInstallerId = new URL(req.url).searchParams.get('installer')
  let tracker = getProjectTracker(assessmentId)

  // If no tracker exists yet, initialize one from the assessment
  if (!tracker) {
    const assessment = getAssessmentById(assessmentId)
    const installers = getInstallers().filter((i) => i.active)
    const requestedInstaller = requestedInstallerId
      ? installers.find((i) => i.id === Number(requestedInstallerId))
      : undefined
    const defaultInstaller = requestedInstaller || installers[0]

    if (defaultInstaller) {
      tracker = {
        project_id: crypto.randomUUID(),
        assessment_id: assessmentId,
        customer_name: 'Solar Customer',
        customer_phone: '+254700000000',
        installer: toPublicDetail(defaultInstaller),
        status: 'site_survey_pending',
        created_at: new Date().toISOString(),
      }
      saveProjectTracker(tracker)
    }
  }

  if (tracker && requestedInstallerId) {
    const requestedInstaller = getInstallerById(Number(requestedInstallerId))
    if (requestedInstaller?.active && tracker.installer.id !== requestedInstaller.id) {
      tracker.installer = toPublicDetail(requestedInstaller)
      saveProjectTracker(tracker)
    }
  }

  if (!tracker) {
    return NextResponse.json({ error: { message: 'Project tracker not found' } }, { status: 404 })
  }

  const assessment = getAssessmentById(tracker.assessment_id)

  return NextResponse.json({
    tracker,
    assessment,
  })
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const assessmentId = params.id
    const body = await req.json()
    let tracker = getProjectTracker(assessmentId)

    if (!tracker) {
      const assessment = getAssessmentById(assessmentId)
      const installers = getInstallers().filter((i) => i.active)
      const defaultInstaller = installers[0]
      tracker = {
        project_id: crypto.randomUUID(),
        assessment_id: assessmentId,
        customer_name: body.customer_name || 'Solar Customer',
        customer_phone: body.customer_phone || '+254700000000',
        installer: toPublicDetail(defaultInstaller),
        status: 'site_survey_pending',
        created_at: new Date().toISOString(),
      }
    }

    // Switch selected installer if requested
    if (body.installer_id) {
      const newInst = getInstallerById(Number(body.installer_id))
      if (newInst) {
        tracker.installer = toPublicDetail(newInst)
      }
    }

    // Update scheduled survey date
    if (body.scheduled_survey_date) {
      tracker.scheduled_survey_date = body.scheduled_survey_date
      tracker.status = 'survey_scheduled'
    }

    if (body.survey_notes) {
      tracker.survey_notes = body.survey_notes
    }

    if (body.status) {
      tracker.status = body.status
    }

    saveProjectTracker(tracker)

    return NextResponse.json({
      success: true,
      tracker,
    })
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message } }, { status: 500 })
  }
}
