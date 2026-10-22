import { NextResponse } from 'next/server'
import { redactAssessmentGeodata } from '@/lib/server/store'

export const dynamic = 'force-dynamic'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const updatedReport = redactAssessmentGeodata(params.id)

  if (!updatedReport) {
    return NextResponse.json(
      { error: { message: 'Assessment report not found' } },
      { status: 404 }
    )
  }

  return NextResponse.json({
    success: true,
    message: 'Exact location coordinates and roof polygon have been permanently redacted.',
    report: updatedReport,
  })
}
