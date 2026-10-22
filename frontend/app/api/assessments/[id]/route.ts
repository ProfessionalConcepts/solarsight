import { NextResponse } from 'next/server'
import { getAssessmentById } from '@/lib/server/store'

export const dynamic = 'force-dynamic'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const assessment = getAssessmentById(params.id)

  if (!assessment) {
    return NextResponse.json(
      {
        error: {
          code: 'not_found',
          message: 'Assessment report not found.',
        },
      },
      { status: 404 }
    )
  }

  return NextResponse.json(assessment)
}
