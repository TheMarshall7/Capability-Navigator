
import { NextRequest, NextResponse } from 'next/server'
import { generateCapabilityReport } from '@/lib/ai-service'
import { createClient } from '@/lib/supabase-server'
import { rateLimit } from '@/lib/rate-limit'
import type { GenerateReportInput } from '@/types'

// 3 generations per user per hour
const RATE_LIMIT = 3
const WINDOW_MS = 60 * 60 * 1000

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    // Rate limit by user ID (more reliable than IP behind proxies)
    const limit = rateLimit(`generate:${user.id}`, RATE_LIMIT, WINDOW_MS)
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `Too many generations. You can generate ${RATE_LIMIT} profiles per hour. Try again in ${limit.retryAfter} seconds.` },
        {
          status: 429,
          headers: {
            'Retry-After': String(limit.retryAfter),
            'X-RateLimit-Limit': String(RATE_LIMIT),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(limit.resetAt / 1000)),
          },
        }
      )
    }

    const body: GenerateReportInput = await req.json()

    if (!body.questionnaireAnswers || Object.keys(body.questionnaireAnswers).length === 0) {
      return NextResponse.json({ error: 'Questionnaire answers are required' }, { status: 400 })
    }

    // Generate the report (real AI or mock fallback)
    const report = await generateCapabilityReport(body)

    // Delete previous report and pathways so regeneration stays clean
    // (cascade on career_pathways via report_id handles pathways automatically)
    await supabase
      .from('capability_reports')
      .delete()
      .eq('user_id', user.id)

    // Persist new report
    const { data: savedReport, error: reportError } = await supabase
      .from('capability_reports')
      .insert({
        user_id: user.id,
        summary: report.capabilitySummary,
        core_capabilities_json: report.coreCapabilities,
        hidden_strengths_json: report.hiddenStrengths,
        work_style_summary: report.workStyleSummary,
        cv_underrepresentation_summary: report.cvUnderrepresentationSummary,
      })
      .select()
      .single()

    if (reportError) {
      console.error('[API /generate-profile] Report save failed:', reportError)
      // Return the generated report even if we can't save it
      return NextResponse.json({ report }, { status: 200 })
    }

    // Save career pathways
    if (report.careerPathways?.length > 0) {
      const pathwayRows = report.careerPathways.map(p => ({
        user_id: user.id,
        report_id: savedReport.id,
        title: p.title,
        match_reason: p.matchReason,
        capability_overlap: p.capabilityOverlap,
        missing_skills_json: p.missingSkills,
        difficulty: p.difficulty,
        estimated_transition_time: p.estimatedTransitionTime,
        first_step: p.firstStep,
        roadmap_json: p.roadmap,
      }))

      const { error: pathwayError } = await supabase
        .from('career_pathways')
        .insert(pathwayRows)

      if (pathwayError) {
        console.error('[API /generate-profile] Pathway save failed:', pathwayError)
      }
    }

    return NextResponse.json({
      report,
      reportId: savedReport.id,
    })

  } catch (err) {
    console.error('[API /generate-profile] Unhandled error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
