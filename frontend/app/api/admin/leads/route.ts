import { NextResponse } from 'next/server'
import { getLeads, getAssessmentById } from '@/lib/server/store'
import type { AdminLead } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  const storedLeads = getLeads()

  const adminLeads: AdminLead[] = storedLeads.map((lead) => {
    const assessment = lead.assessment_id ? getAssessmentById(lead.assessment_id) : null
    return {
      lead_id: lead.lead_id,
      name: lead.name,
      phone: lead.phone,
      consent: lead.consent,
      status: lead.status,
      created_at: lead.created_at,
      assessment_id: lead.assessment_id,
      location_label: assessment?.location_label || 'Kenya',
      monthly_bill_ksh: assessment?.monthly_bill_ksh ?? undefined,
      recommended_kwp: assessment?.result?.sizing?.recommended_kwp ?? undefined,
      matched_installers: lead.matched_installers.map((m) => {
        const text = encodeURIComponent(
          `Hi ${m.installer_name}, new SolarSight lead: ${lead.name} (${lead.phone}) in ${
            assessment?.location_label || 'Kenya'
          } looking for ~${assessment?.result?.sizing?.recommended_kwp || 3} kWp system.`
        )
        return {
          installer_id: m.installer_id,
          name: m.installer_name,
          whatsapp: m.whatsapp,
          phone: m.whatsapp,
          match_status: m.status,
          forward_url: m.whatsapp ? `https://wa.me/${m.whatsapp.replace(/\+/g, '')}?text=${text}` : undefined,
        }
      }),
    }
  })

  return NextResponse.json({ leads: adminLeads })
}
