import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { rateLimit } from '@/lib/rate-limit'
import { getGeminiClient, getGeminiModel } from '@/lib/gemini-client'
import { callGeminiJson, geminiJsonFailureMessage } from '@/lib/gemini-json'
import { locateHighlight, repairHighlightQuote } from '@/lib/cv-highlight-locate'
import { CV_REVIEW_SYSTEM_PROMPT } from '@/lib/prompts/cv-review-system'
import type {
  CvCareerChangeAssessment,
  CvReviewCategory,
  CvReviewChecklistItem,
  CvReviewAtsRisk,
  CvReviewReframingOpportunity,
  CvReviewHighlight,
  CvReviewResult,
  CvRegionInferred,
  CvReviewTab,
} from '@/types/cv-review'

export const maxDuration = 60

const RATE_LIMIT = 5
const WINDOW_MS = 60 * 60 * 1000
const MAX_CV_CHARS = 12_000
const MAX_JD_CHARS = 4_000

const VALID_TYPES = new Set<CvReviewTab>(['strong', 'improve'])
const VALID_CATEGORIES = new Set<CvReviewCategory>([
  'impact', 'clarity', 'transferable_skill', 'missing_evidence', 'weak_language', 'formatting',
  'ats_risk', 'career_change', 'regional',
])
const VALID_REGIONS = new Set<CvRegionInferred>(['UK', 'US', 'Canada', 'EU', 'Australia', 'International'])

function minHighlightsForCv(cvLength: number): { strong: number; improve: number } {
  if (cvLength < 400) return { strong: 3, improve: 3 }
  if (cvLength < 800) return { strong: 5, improve: 5 }
  return { strong: 8, improve: 8 }
}

function normalizeOverview(data: unknown): CvReviewResult['overview'] | null {
  if (!data || typeof data !== 'object') return null
  const o = data as Record<string, unknown>
  const summary = typeof o.summary === 'string' ? o.summary.trim() : ''
  if (!summary) return null

  const strengthsSummary = Array.isArray(o.strengthsSummary)
    ? o.strengthsSummary.map(s => String(s).trim()).filter(Boolean)
    : []
  const improvementsSummary = Array.isArray(o.improvementsSummary)
    ? o.improvementsSummary.map(s => String(s).trim()).filter(Boolean)
    : []

  return {
    summary,
    strengthsSummary: strengthsSummary.length > 0 ? strengthsSummary : ['Transferable experience evident in the CV'],
    improvementsSummary: improvementsSummary.length > 0 ? improvementsSummary : ['Opportunities to strengthen impact language'],
  }
}

function normalizeSections(data: unknown): CvReviewResult['sections'] {
  if (!data || !Array.isArray(data)) return []
  return data
    .filter(item => item && typeof item === 'object')
    .map(item => {
      const s = item as Record<string, unknown>
      return {
        name: typeof s.name === 'string' ? s.name.trim() : 'Section',
        assessment: typeof s.assessment === 'string' ? s.assessment.trim() : '',
      }
    })
    .filter(s => s.name && s.assessment)
}

function normalizeHighlights(data: unknown, cvText: string): CvReviewHighlight[] {
  if (!data || typeof data !== 'object') return []
  const raw = (data as { highlights?: unknown }).highlights
  if (!Array.isArray(raw)) return []

  return raw
    .filter(item => item && typeof item === 'object')
    .map(item => {
      const h = item as Record<string, unknown>
      const type = typeof h.type === 'string' && VALID_TYPES.has(h.type as CvReviewTab)
        ? h.type as CvReviewTab
        : 'improve'
      const category = typeof h.category === 'string' && VALID_CATEGORIES.has(h.category as CvReviewCategory)
        ? h.category as CvReviewCategory
        : 'clarity'
      const rawQuote = typeof h.quote === 'string' ? h.quote.trim() : ''
      const quote = rawQuote ? repairHighlightQuote(cvText, rawQuote) : ''
      const suggestion = typeof h.suggestion === 'string' ? h.suggestion.trim() : undefined
      return {
        quote,
        type,
        category,
        label: typeof h.label === 'string' ? h.label.trim() : String(h.comment || '').trim(),
        suggestion: type === 'improve' && suggestion ? suggestion : undefined,
        section: typeof h.section === 'string' ? h.section.trim() : undefined,
        anchored: Boolean(quote && locateHighlight(cvText, quote)),
      }
    })
    .filter(h => h.quote.length >= 5 && h.label.length > 0)
}

function normalizeCareerChange(data: unknown): CvCareerChangeAssessment | undefined {
  if (!data || typeof data !== 'object') return undefined
  const c = data as Record<string, unknown>
  const validFormats = new Set(['hybrid', 'chronological', 'functional', 'unclear'])
  const format = typeof c.format === 'string' && validFormats.has(c.format)
    ? c.format as CvCareerChangeAssessment['format']
    : 'unclear'
  return {
    format,
    summary_quality: typeof c.summary_quality === 'string' ? c.summary_quality.trim() : '',
    transition_evidence: typeof c.transition_evidence === 'string' ? c.transition_evidence.trim() : '',
    jargon_translation_needed: Boolean(c.jargon_translation_needed),
    cover_letter_recommended: Boolean(c.cover_letter_recommended),
  }
}

function normalizeAtsRisks(data: unknown): CvReviewAtsRisk[] {
  if (!Array.isArray(data)) return []
  return data
    .filter(item => item && typeof item === 'object')
    .map(item => {
      const a = item as Record<string, unknown>
      const severity: 'critical' | 'warning' = a.severity === 'critical' ? 'critical' : 'warning'
      return {
        issue: typeof a.issue === 'string' ? a.issue.trim() : '',
        severity,
        quote: typeof a.quote === 'string' ? a.quote.trim() : undefined,
      }
    })
    .filter(a => a.issue)
}

function normalizeReframing(data: unknown): CvReviewReframingOpportunity[] {
  if (!Array.isArray(data)) return []
  return data
    .filter(item => item && typeof item === 'object')
    .map(item => {
      const r = item as Record<string, unknown>
      return {
        before: typeof r.before === 'string' ? r.before.trim() : '',
        after: typeof r.after === 'string' ? r.after.trim() : '',
        why: typeof r.why === 'string' ? r.why.trim() : '',
      }
    })
    .filter(r => r.before && r.after)
}

function normalizeChecklist(data: unknown): CvReviewChecklistItem[] {
  if (!Array.isArray(data)) return []
  return data
    .filter(item => item && typeof item === 'object')
    .map(item => {
      const c = item as Record<string, unknown>
      return {
        item: typeof c.item === 'string' ? c.item.trim() : '',
        passed: Boolean(c.passed),
        note: typeof c.note === 'string' ? c.note.trim() : undefined,
      }
    })
    .filter(c => c.item)
}

function normalizeKeywordGaps(data: unknown): { skill: string; note: string }[] {
  if (!Array.isArray(data)) return []
  return data
    .filter(item => item && typeof item === 'object')
    .map(item => {
      const k = item as Record<string, unknown>
      return {
        skill: typeof k.skill === 'string' ? k.skill.trim() : '',
        note: typeof k.note === 'string' ? k.note.trim() : '',
      }
    })
    .filter(k => k.skill)
}

function validateReview(
  data: unknown,
  cvText: string,
  hasPathway: boolean,
): CvReviewResult | null {
  if (!data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>

  const overview = normalizeOverview(d.overview)
  if (!overview) return null

  const highlights = normalizeHighlights(d, cvText)
  const mins = minHighlightsForCv(cvText.length)
  const strongCount = highlights.filter(h => h.type === 'strong').length
  const improveCount = highlights.filter(h => h.type === 'improve').length

  if (strongCount < mins.strong || improveCount < mins.improve) {
    console.error(`[cv-review] Insufficient highlights: ${strongCount} strong, ${improveCount} improve (need ${mins.strong}/${mins.improve})`)
    return null
  }

  const optimization_checklist = normalizeChecklist(d.optimization_checklist)
  if (optimization_checklist.length < 8) {
    console.error(`[cv-review] Insufficient checklist items: ${optimization_checklist.length}`)
    return null
  }

  const career_change = normalizeCareerChange(d.career_change)
  if (!career_change) {
    console.error('[cv-review] Missing career_change assessment')
    return null
  }

  const sections = normalizeSections(d.sections)
  const ats_risks = normalizeAtsRisks(d.ats_risks)
  const reframing_opportunities = normalizeReframing(d.reframing_opportunities)
  const keyword_gaps = normalizeKeywordGaps(d.keyword_gaps)

  if (hasPathway && reframing_opportunities.length < 2) {
    console.error(`[cv-review] Pathway review needs ≥2 reframing_opportunities, got ${reframing_opportunities.length}`)
    return null
  }

  const regionRaw = typeof d.region_inferred === 'string' ? d.region_inferred : ''
  const region_inferred = VALID_REGIONS.has(regionRaw as CvRegionInferred)
    ? (regionRaw as CvRegionInferred)
    : undefined

  return {
    overview,
    sections,
    highlights,
    region_inferred,
    regional_notes: typeof d.regional_notes === 'string' ? d.regional_notes.trim() : undefined,
    career_change,
    ats_risks: ats_risks.length > 0 ? ats_risks : undefined,
    reframing_opportunities: reframing_opportunities.length > 0 ? reframing_opportunities : undefined,
    optimization_checklist,
    keyword_gaps: keyword_gaps.length > 0 ? keyword_gaps : undefined,
    pathway_title: typeof d.pathway_title === 'string' ? d.pathway_title.trim() : undefined,
  }
}

function validateReviewLenient(
  data: unknown,
  cvText: string,
  hasPathway: boolean,
): CvReviewResult | null {
  if (!data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>

  const overview = normalizeOverview(d.overview)
  if (!overview) return null

  const highlights = normalizeHighlights(d, cvText)
  if (highlights.length < 4) return null

  const career_change = normalizeCareerChange(d.career_change) ?? {
    format: 'unclear' as const,
    summary_quality: 'Summary could not be fully assessed — review the Professional Summary section manually.',
    transition_evidence: 'Transition evidence was not clearly identified in this review.',
    jargon_translation_needed: true,
    cover_letter_recommended: true,
  }

  const checklist = normalizeChecklist(d.optimization_checklist)
  const optimization_checklist = checklist.length >= 5 ? checklist : [
    { item: 'Hybrid format used (not pure functional)', passed: false, note: 'Could not verify' },
    { item: 'Standard section headings used', passed: false },
    { item: 'Bullets start with strong action verbs', passed: false },
    { item: 'Career-change pivot addressed in summary', passed: false },
    { item: 'Timeline complete — no unexplained gaps', passed: false },
  ]

  const reframing_opportunities = normalizeReframing(d.reframing_opportunities)
  const keyword_gaps = normalizeKeywordGaps(d.keyword_gaps)

  const regionRaw = typeof d.region_inferred === 'string' ? d.region_inferred : ''
  const region_inferred = VALID_REGIONS.has(regionRaw as CvRegionInferred)
    ? (regionRaw as CvRegionInferred)
    : undefined

  return {
    overview,
    sections: normalizeSections(d.sections),
    highlights,
    region_inferred,
    regional_notes: typeof d.regional_notes === 'string' ? d.regional_notes.trim() : undefined,
    career_change,
    ats_risks: normalizeAtsRisks(d.ats_risks).length > 0 ? normalizeAtsRisks(d.ats_risks) : undefined,
    reframing_opportunities: reframing_opportunities.length > 0 ? reframing_opportunities : undefined,
    optimization_checklist,
    keyword_gaps: hasPathway && keyword_gaps.length > 0 ? keyword_gaps : undefined,
    pathway_title: typeof d.pathway_title === 'string' ? d.pathway_title.trim() : undefined,
  }
}

function buildBasicUserPrompt(cvText: string): string {
  return `Review this CV in depth — section by section. The user is a career-changer on Capability Navigator. Infer the target region from CV content (spelling, location, terminology). Apply all career-changer diagnostic rules. Return the full JSON report.

CV TEXT:
${cvText}`
}

function buildPathwayUserPrompt(data: {
  cvText: string
  pathwayTitle: string
  matchReason: string
  missingSkills: string[]
  coreCapabilities: { title: string; explanation: string }[]
}): string {
  const caps = data.coreCapabilities
    .slice(0, 5)
    .map(c => `- ${c.title}: ${c.explanation}`)
    .join('\n')
  const gaps = data.missingSkills.map(s => `- ${s}`).join('\n')

  return `Review this CV in depth — section by section. The user is targeting the pathway below on Capability Navigator.

TARGET PATHWAY: ${data.pathwayTitle}
Match reason: ${data.matchReason}
Identified skill gaps (surface these in keyword_gaps if not addressed in the CV):
${gaps || 'None listed'}

CORE CAPABILITIES (from their profile — look for evidence in the CV, flag if absent):
${caps || 'None'}

INSTRUCTIONS:
- Evaluate how well the CV translates this person's background into the target pathway's language.
- Populate keyword_gaps with skills from the pathway that are missing or poorly evidenced in the CV.
- Populate reframing_opportunities with at least 2 worked before/after examples from their actual CV text.
- Flag old-field jargon that won't resonate with hiring managers in this pathway.
- Apply all standard ATS, regional, and bullet-craft diagnostic rules as well.
- Return the full JSON report. Include "pathway_title": "${data.pathwayTitle}" in your JSON.

CV TEXT:
${data.cvText}`
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const limit = rateLimit(`cv-review:${user.id}`, RATE_LIMIT, WINDOW_MS)
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `Too many reviews. Try again in ${limit.retryAfter} seconds.` },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
      )
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 })
    }

    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const text = body.text
    if (typeof text !== 'string' || text.trim().length < 80) {
      return NextResponse.json({ error: 'CV text too short for review' }, { status: 400 })
    }

    const pathwayId = typeof body.pathwayId === 'string' ? body.pathwayId.trim() : null

    const client = getGeminiClient()
    if (!client) {
      return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 })
    }

    const cvText = text.trim().slice(0, MAX_CV_CHARS)
    let userPrompt: string
    let hasPathway = false

    if (pathwayId) {
      const [
        { data: pathway, error: pathwayError },
        { data: report, error: reportError },
      ] = await Promise.all([
        supabase.from('career_pathways')
          .select('title, match_reason, missing_skills_json')
          .eq('id', pathwayId)
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase.from('capability_reports')
          .select('core_capabilities_json')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])

      if (pathwayError) console.warn('[cv-review] Pathway fetch failed:', pathwayError)
      if (reportError) console.warn('[cv-review] Report fetch failed:', reportError)

      if (pathway) {
        hasPathway = true
        userPrompt = buildPathwayUserPrompt({
          cvText,
          pathwayTitle: pathway.title,
          matchReason: pathway.match_reason || '',
          missingSkills: pathway.missing_skills_json || [],
          coreCapabilities: report?.core_capabilities_json || [],
        })
      } else {
        userPrompt = buildBasicUserPrompt(cvText)
      }
    } else {
      userPrompt = buildBasicUserPrompt(cvText)
    }

    // Clip job description if accidentally sent (not used in review, kept for compat)
    if (typeof body.jobDescription === 'string' && body.jobDescription.length > MAX_JD_CHARS) {
      console.warn('[cv-review] Unexpected jobDescription field; ignoring.')
    }

    const result = await callGeminiJson(
      client,
      getGeminiModel(),
      {
        systemInstruction: CV_REVIEW_SYSTEM_PROMPT,
        userPrompt,
        temperature: 0.45,
        maxOutputTokens: 4096,
        timeoutMs: 58_000,
        totalTimeoutMs: 59_000,
        maxAttempts: 1,
      },
      (parsed) => validateReview(parsed, cvText, hasPathway)
        ?? validateReviewLenient(parsed, cvText, hasPathway),
      1,
    )

    if (!result.ok) {
      if (result.detail) console.error('[cv-review] Gemini failure:', result.detail)
      const status = result.failure === 'timeout' ? 504 : result.failure === 'api_key' ? 503 : 502
      return NextResponse.json(
        { error: geminiJsonFailureMessage(result.failure, result.detail) },
        { status },
      )
    }

    return NextResponse.json(result.data)
  } catch (err) {
    console.error('[cv-review] Unhandled:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
