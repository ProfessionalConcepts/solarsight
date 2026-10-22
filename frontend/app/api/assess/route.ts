import { NextResponse } from 'next/server'
import crypto from 'crypto'
import {
  fetchSolarIrradiance,
  computeAssessment,
} from '@/lib/server/engine'
import {
  saveAssessment,
  getAppConfig,
} from '@/lib/server/store'
import type { AssessmentReport } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const lat = Number(body.lat)
    const lng = Number(body.lng)

    // 1. Kenya Bounds Validation (-5.0 to 5.5, 33.0 to 42.0)
    if (isNaN(lat) || isNaN(lng) || lat < -5.0 || lat > 5.5 || lng < 33.0 || lng > 42.0) {
      return NextResponse.json(
        {
          error: {
            code: 'out_of_bounds',
            message: 'SolarSight is currently calibrated for Kenya only (-5.0 to 5.5 Lat, 33.0 to 42.0 Lng).',
          },
        },
        { status: 400 }
      )
    }

    const tilt = Number(body.roof_tilt ?? 10)
    const azimuth = Number(body.azimuth ?? 0)
    const config = getAppConfig()
    const loss = Number(config.pvgis_system_loss_pct ?? 14)

    // 2. Fetch Solar Irradiance from EU PVGIS (with instant regional fallback)
    const irradiance = await fetchSolarIrradiance(lat, lng, tilt, azimuth, loss)

    // 3. Compute Assessment with Pure Engine
    const result = computeAssessment(
      {
        lat,
        lng,
        roof_area_m2: body.roof_area_m2 != null ? Number(body.roof_area_m2) : null,
        roof_tilt: tilt,
        azimuth,
        shading_self: body.shading_self ?? 'none',
        monthly_kwh: body.monthly_kwh != null ? Number(body.monthly_kwh) : null,
        monthly_bill_ksh: body.monthly_bill_ksh != null ? Number(body.monthly_bill_ksh) : null,
        appliances: body.appliances ?? null,
        tariff_type: body.tariff_type ?? 'domestic',
        has_genset: Boolean(body.has_genset),
        genset_monthly_fuel_ksh:
          body.genset_monthly_fuel_ksh != null ? Number(body.genset_monthly_fuel_ksh) : null,
        backup_hours_goal: Number(body.backup_hours_goal ?? 6),
        language: body.language ?? 'en',
      },
      irradiance,
      config
    )

    // 4. Create and Save Report
    const assessmentId = crypto.randomUUID()
    const report: AssessmentReport = {
      assessment_id: assessmentId,
      id: assessmentId,
      lat,
      lng,
      location_label: body.location_label || 'Kenya',
      roof_area_m2: body.roof_area_m2 ?? null,
      roof_tilt: tilt,
      azimuth,
      shading_self: body.shading_self ?? 'none',
      monthly_kwh: body.monthly_kwh ?? null,
      monthly_bill_ksh: body.monthly_bill_ksh ?? null,
      tariff_type: body.tariff_type ?? 'domestic',
      has_genset: Boolean(body.has_genset),
      genset_monthly_fuel_ksh: body.genset_monthly_fuel_ksh ?? null,
      backup_hours_goal: Number(body.backup_hours_goal ?? 6),
      property_type: body.property_type || 'standalone_home',
      result,
      language: body.language || 'en',
      created_at: new Date().toISOString(),
    }

    saveAssessment(report)

    return NextResponse.json(
      {
        assessment_id: assessmentId,
        result,
      },
      { status: 201 }
    )
  } catch (err: any) {
    console.error('Assessment calculation error:', err)
    return NextResponse.json(
      {
        error: {
          code: 'calculation_error',
          message: err?.message || 'Failed to compute solar assessment.',
        },
      },
      { status: 500 }
    )
  }
}
