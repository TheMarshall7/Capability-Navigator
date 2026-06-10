import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { rateLimit } from '@/lib/rate-limit'
import { getGeminiClient, getGeminiModel } from '@/lib/gemini-client'
import { callGeminiJson, geminiJsonFailureMessage } from '@/lib/gemini-json'
import {
  CV_BUILDER_CORE_PROMPT,
  CV_BUILDER_SUPPLEMENT_PROMPT,
} from '@/lib/prompts/cv-builder-system'
import type {
  CvDraftContent,
  CvRegion,
  CvExperience,
  CvEducation,
  CvRelevantProject,
  CvGapAddressed,
  CvReframingExample,
  CvKeywordMapping,
  CvChecklistItem,
} from '@/types/cv-builder'

export type { CvDraftContent }

export const maxDuration = 60

const RATE_LIMIT = 3
const WINDOW_MS = 60 * 60 * 1000
const MAX_HISTORY_CHARS = 8_000
const MAX_JD_CHARS = 4_000
const ROUTE_BUDGET_MS = 58_000
const PHASE1_TIMEOUT_MS = 36_000
const PHASE2_TIMEOUT_MS = 20_000

type CvDraftCore = Pick<
  CvDraftContent,
  | 'contact' | 'region_applied' | 'format' | 'headline' | 'summary' | 'core_skills'
  | 'relevant_projects' | 'experience' | 'education' | 'skills' | 'gaps_addressed'
>

type CvDraftSupplement = Pick<
  CvDraftContent,
  'tailoring_notes' | 'reframing_examples' | 'keyword_mapping' | 'optimization_checklist' | 'cover_letter'
>

const VALID_REGIONS = new Set<CvRegion>(['UK', 'US', 'Canada', 'EU', 'Australia', 'International'])

function inferRegion(location: string): CvRegion {
  const loc = location.toLowerCase()
  if (loc.includes('uk') || loc.includes('england') || loc.includes('scotland') || loc.includes('wales') || loc.includes('london') || loc.includes('manchester') || loc.includes('birmingham')) return 'UK'
  if (loc.includes('australia') || loc.includes('sydney') || loc.includes('melbourne') || loc.includes('brisbane')) return 'Australia'
  if (loc.includes('canada') || loc.includes('ontario') || loc.includes('toronto') || loc.includes('vancouver') || loc.includes('montreal')) return 'Canada'
  if (loc.includes('usa') || loc.includes('united states') || loc.includes('new york') || loc.includes('los angeles') || loc.includes('chicago')) return 'US'
  return 'UK'
}

function normalizeStringArray(val: unknown): string[] {
  if (!Array.isArray(val)) return []
  return val.map(s => String(s).trim()).filter(Boolean)
}

function normalizeExperience(val: unknown): CvExperience[] {
  if (!Array.isArray(val)) return []
  return val
    .filter(item => item && typeof item === 'object')
    .slice(0, 5)
    .map(item => {
      const e = item as Record<string, unknown>
      const tier = e.tier === 'additional' ? 'additional' : 'relevant'
      const bullets = Array.isArray(e.bullets)
        ? e.bullets.map(b => String(b).trim()).filter(Boolean).slice(0, 6)
        : []
      return {
        company: typeof e.company === 'string' && e.company.trim() ? e.company.trim() : 'Organisation',
        title: typeof e.title === 'string' && e.title.trim() ? e.title.trim() : 'Role',
        location: typeof e.location === 'string' ? e.location.trim() : undefined,
        dates: typeof e.dates === 'string' && e.dates.trim() ? e.dates.trim() : 'Dates not specified',
        tier,
        bullets,
      }
    })
}

function normalizeEducation(val: unknown): CvEducation[] {
  if (!Array.isArray(val)) return []
  return val
    .filter(item => item && typeof item === 'object')
    .map(item => {
      const e = item as Record<string, unknown>
      return {
        institution: typeof e.institution === 'string' ? e.institution.trim() : 'Institution',
        qualification: typeof e.qualification === 'string' ? e.qualification.trim() : 'Qualification',
        year: typeof e.year === 'string' ? e.year.trim() : '',
        notes: typeof e.notes === 'string' ? e.notes.trim() : undefined,
      }
    })
    .filter(e => e.institution)
}

function normalizeProjects(val: unknown): CvRelevantProject[] {
  if (!Array.isArray(val)) return []
  return val
    .filter(item => item && typeof item === 'object')
    .map(item => {
      const p = item as Record<string, unknown>
      return {
        title: typeof p.title === 'string' ? p.title.trim() : '',
        description: typeof p.description === 'string' ? p.description.trim() : '',
      }
    })
    .filter(p => p.title)
}

function normalizeGaps(val: unknown): CvGapAddressed[] {
  if (!Array.isArray(val)) return []
  return val
    .filter(item => item && typeof item === 'object')
    .map(item => {
      const g = item as Record<string, unknown>
      return {
        period: typeof g.period === 'string' ? g.period.trim() : '',
        explanation: typeof g.explanation === 'string' ? g.explanation.trim() : '',
      }
    })
    .filter(g => g.period && g.explanation)
}

function normalizeReframing(val: unknown): CvReframingExample[] {
  if (!Array.isArray(val)) return []
  return val
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

function normalizeKeywordMapping(val: unknown): CvKeywordMapping[] {
  if (!Array.isArray(val)) return []
  return val
    .filter(item => item && typeof item === 'object')
    .map(item => {
      const k = item as Record<string, unknown>
      return {
        jd_keyword: typeof k.jd_keyword === 'string' ? k.jd_keyword.trim() : '',
        evidence_in_cv: typeof k.evidence_in_cv === 'string' ? k.evidence_in_cv.trim() : '',
      }
    })
    .filter(k => k.jd_keyword)
}

function normalizeChecklist(val: unknown): CvChecklistItem[] {
  if (!Array.isArray(val)) return []
  return val
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

function parseCoreContact(d: Record<string, unknown>) {
  const contactRaw = d.contact as Record<string, unknown> | null
  return {
    name: typeof contactRaw?.name === 'string' ? contactRaw.name.trim() : '',
    location: typeof contactRaw?.location === 'string' ? contactRaw.location.trim() : '',
    email: typeof contactRaw?.email === 'string' ? contactRaw.email.trim() : undefined,
    phone: typeof contactRaw?.phone === 'string' ? contactRaw.phone.trim() : undefined,
    linkedin: typeof contactRaw?.linkedin === 'string' ? contactRaw.linkedin.trim() : undefined,
  }
}

function validateCoreDraft(data: unknown): CvDraftCore | null {
  if (!data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>

  const headline = typeof d.headline === 'string' ? d.headline.trim() : ''
  const summary = typeof d.summary === 'string' ? d.summary.trim() : ''
  if (!headline && !summary) return null

  const experience = normalizeExperience(d.experience)
  const core_skills = normalizeStringArray(d.core_skills)
  const relevantRoles = experience.filter(e => e.tier === 'relevant')
  if (relevantRoles.length === 0 || relevantRoles[0].bullets.length < 2) return null
  if (core_skills.length < 4) return null

  const regionRaw = typeof d.region_applied === 'string' ? d.region_applied as CvRegion : 'UK'
  const skillsRaw = d.skills as Record<string, unknown> | null
  const skills = {
    core: normalizeStringArray(skillsRaw?.core),
    developing: normalizeStringArray(skillsRaw?.developing),
  }
  if (skills.core.length === 0) skills.core = core_skills.slice(0, 6)

  return {
    contact: parseCoreContact(d),
    region_applied: VALID_REGIONS.has(regionRaw) ? regionRaw : 'UK',
    format: 'hybrid',
    headline: headline || 'Career professional open to new opportunities',
    summary: summary || 'Experienced professional with transferable skills ready for a new pathway.',
    core_skills,
    relevant_projects: normalizeProjects(d.relevant_projects),
    experience,
    education: normalizeEducation(d.education),
    skills,
    gaps_addressed: normalizeGaps(d.gaps_addressed),
  }
}

function validateCoreLenient(data: unknown): CvDraftCore | null {
  if (!data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>

  const headline = typeof d.headline === 'string' ? d.headline.trim() : ''
  const summary = typeof d.summary === 'string' ? d.summary.trim() : ''
  if (!headline && !summary) return null

  let experience = normalizeExperience(d.experience)
  if (experience.length === 0) return null
  experience = experience.map((e, i) => ({
    ...e,
    tier: e.tier || (i === 0 ? 'relevant' as const : 'additional' as const),
    bullets: e.bullets.length > 0 ? e.bullets : ['Contributed to team objectives and delivered on key responsibilities.'],
  }))

  const core_skills = normalizeStringArray(d.core_skills)
  const regionRaw = typeof d.region_applied === 'string' ? d.region_applied as CvRegion : 'UK'
  const skillsRaw = d.skills as Record<string, unknown> | null
  const skills = {
    core: normalizeStringArray(skillsRaw?.core).length > 0
      ? normalizeStringArray(skillsRaw?.core)
      : core_skills.slice(0, 6),
    developing: normalizeStringArray(skillsRaw?.developing),
  }

  return {
    contact: parseCoreContact(d),
    region_applied: VALID_REGIONS.has(regionRaw) ? regionRaw : 'UK',
    format: 'hybrid',
    headline: headline || 'Career professional open to new opportunities',
    summary: summary || 'Experienced professional with transferable skills ready for a new pathway.',
    core_skills: core_skills.length >= 2 ? core_skills : skills.core.slice(0, 6),
    relevant_projects: normalizeProjects(d.relevant_projects),
    experience,
    education: normalizeEducation(d.education),
    skills,
    gaps_addressed: normalizeGaps(d.gaps_addressed),
  }
}

function validateSupplement(data: unknown): CvDraftSupplement | null {
  if (!data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>

  const coverLetterRaw = d.cover_letter as Record<string, unknown> | null
  const cover_letter = {
    opening: typeof coverLetterRaw?.opening === 'string' ? coverLetterRaw.opening.trim() : '',
    body: typeof coverLetterRaw?.body === 'string' ? coverLetterRaw.body.trim() : '',
    closing: typeof coverLetterRaw?.closing === 'string' ? coverLetterRaw.closing.trim() : '',
  }
  if (!cover_letter.opening) return null

  const checklist = normalizeChecklist(d.optimization_checklist)
  if (checklist.length < 5) return null

  return {
    tailoring_notes: typeof d.tailoring_notes === 'string' && d.tailoring_notes.trim()
      ? d.tailoring_notes.trim()
      : 'Your experience was reframed using capability language for your target pathway.',
    reframing_examples: normalizeReframing(d.reframing_examples),
    keyword_mapping: normalizeKeywordMapping(d.keyword_mapping),
    optimization_checklist: checklist,
    cover_letter,
  }
}

const DEFAULT_CHECKLIST: CvChecklistItem[] = [
  { item: 'Hybrid format used (not pure functional)', passed: true },
  { item: 'ATS-safe: single-column structure implied', passed: true },
  { item: 'Standard section headings used', passed: true },
  { item: 'Dates formatted as Mon YYYY – Mon YYYY', passed: false, note: 'Review date formatting' },
  { item: 'Bullets start with strong action verbs', passed: false, note: 'Some bullets may need strengthening' },
]

function defaultSupplement(targetRole: string): CvDraftSupplement {
  return {
    tailoring_notes: 'Your experience was reframed using capability language for your target pathway.',
    reframing_examples: [],
    keyword_mapping: [],
    optimization_checklist: DEFAULT_CHECKLIST,
    cover_letter: {
      opening: `I am applying for ${targetRole} roles, bringing transferable experience from my previous career and a deliberate investment in this transition.`,
      body: '',
      closing: 'I would welcome the opportunity to discuss how my background translates to your team.',
    },
  }
}

function buildSupplementUserPrompt(
  core: CvDraftCore,
  data: { pathwayTitle: string; targetRole: string; jobDescription?: string },
): string {
  const expSummary = core.experience
    .map(e => `- ${e.title} at ${e.company} (${e.dates}): ${e.bullets.slice(0, 2).join(' ')}`)
    .join('\n')
  const jdSection = data.jobDescription
    ? `\nJOB DESCRIPTION (mirror keywords in keyword_mapping where truthful):\n${data.jobDescription}\n`
    : '\nNo job description provided — return keyword_mapping as empty array.\n'

  return `TARGET PATHWAY: ${data.pathwayTitle}
TARGET ROLE: ${data.targetRole}
${jdSection}
GENERATED CV TO SUPPLEMENT:
Headline: ${core.headline}
Summary: ${core.summary}
Core skills: ${core.core_skills.join(', ')}
Experience:
${expSummary}

Write tailoring_notes, 2 reframing_examples, 8-item optimization_checklist, cover_letter, and keyword_mapping.`
}

function buildUserPrompt(data: {
  name: string
  location: string
  targetRole: string
  targetRegion: CvRegion
  historyText: string
  jobDescription?: string
  reportSummary: string
  coreCapabilities: { title: string; explanation: string; evidence: string }[]
  hiddenStrengths: { title: string; explanation: string }[]
  pathwayTitle: string
  matchReason: string
  missingSkills: string[]
}): string {
  const caps = data.coreCapabilities
    .map(c => `- ${c.title}: ${c.explanation} (Evidence: ${c.evidence})`)
    .join('\n')
  const strengths = data.hiddenStrengths
    .map(s => `- ${s.title}: ${s.explanation}`)
    .join('\n')
  const gaps = data.missingSkills.map(s => `- ${s}`).join('\n')

  const jdSection = data.jobDescription
    ? `\nJOB DESCRIPTION TO TAILOR TO (extract keywords, mirror exact terminology where truthful):\n${data.jobDescription}\n`
    : ''

  return `TARGET PATHWAY: ${data.pathwayTitle}
Match reason: ${data.matchReason}
Missing skills to surface in "developing": ${gaps || 'None listed'}
TARGET REGION: ${data.targetRegion} — apply all regional conventions for this region throughout.
${jdSection}
CAPABILITY PROFILE SUMMARY:
${data.reportSummary || 'Not available'}

CORE CAPABILITIES:
${caps || 'None'}

HIDDEN STRENGTHS:
${strengths || 'None'}

CANDIDATE:
Name: ${data.name}
Location: ${data.location}
Target role: ${data.targetRole}

WORK HISTORY (raw — translate into capability language for the target pathway using hybrid career-changer format):
${data.historyText}

Keep the JSON concise per OUTPUT LIMITS in your instructions.`
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const limit = rateLimit(`cv-builder:${user.id}`, RATE_LIMIT, WINDOW_MS)
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `Too many generations. You can build ${RATE_LIMIT} CVs per hour. Try again in ${limit.retryAfter} seconds.` },
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

    const pathwayId = body.pathwayId
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const location = typeof body.location === 'string' ? body.location.trim() : ''
    const targetRole = typeof body.targetRole === 'string' ? body.targetRole.trim() : ''
    const historyText = typeof body.historyText === 'string' ? body.historyText.trim() : ''
    const jobDescription = typeof body.jobDescription === 'string' ? body.jobDescription.trim() : undefined
    const regionRaw = typeof body.targetRegion === 'string' ? body.targetRegion as CvRegion : null
    const targetRegion: CvRegion = regionRaw && VALID_REGIONS.has(regionRaw) ? regionRaw : inferRegion(location)

    if (typeof pathwayId !== 'string' || !pathwayId) {
      return NextResponse.json({ error: 'pathwayId is required' }, { status: 400 })
    }
    if (!historyText) {
      return NextResponse.json({ error: 'Work history text is required' }, { status: 400 })
    }

    const [
      { data: report, error: reportError },
      { data: pathway, error: pathwayError },
    ] = await Promise.all([
      supabase.from('capability_reports')
        .select('summary, core_capabilities_json, hidden_strengths_json')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from('career_pathways')
        .select('id, title, match_reason, missing_skills_json')
        .eq('id', pathwayId)
        .eq('user_id', user.id)
        .maybeSingle(),
    ])

    if (reportError) {
      console.error('[cv-builder] Report fetch failed:', reportError)
      return NextResponse.json({ error: 'Failed to load capability profile' }, { status: 500 })
    }
    if (pathwayError) {
      console.error('[cv-builder] Pathway fetch failed:', pathwayError)
      return NextResponse.json({ error: 'Failed to load pathway' }, { status: 500 })
    }
    if (!report) {
      return NextResponse.json({ error: 'Capability profile required' }, { status: 400 })
    }
    if (!pathway) {
      return NextResponse.json({ error: 'Pathway not found' }, { status: 404 })
    }

    const client = getGeminiClient()
    if (!client) {
      return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 })
    }

    const userPrompt = buildUserPrompt({
      name: name || 'Candidate',
      location,
      targetRole: targetRole || pathway.title,
      targetRegion,
      historyText: historyText.slice(0, MAX_HISTORY_CHARS),
      jobDescription: jobDescription ? jobDescription.slice(0, MAX_JD_CHARS) : undefined,
      reportSummary: report.summary || 'No capability summary available.',
      coreCapabilities: report.core_capabilities_json || [],
      hiddenStrengths: report.hidden_strengths_json || [],
      pathwayTitle: pathway.title,
      matchReason: pathway.match_reason || '',
      missingSkills: pathway.missing_skills_json || [],
    })

    const routeStarted = Date.now()

    const coreResult = await callGeminiJson(
      client,
      getGeminiModel(),
      {
        systemInstruction: CV_BUILDER_CORE_PROMPT,
        userPrompt,
        temperature: 0.5,
        maxOutputTokens: 4096,
        timeoutMs: PHASE1_TIMEOUT_MS,
        totalTimeoutMs: PHASE1_TIMEOUT_MS,
        maxAttempts: 1,
      },
      (raw) => validateCoreDraft(raw) ?? validateCoreLenient(raw),
      1,
    )

    if (!coreResult.ok) {
      if (coreResult.detail) console.error('[cv-builder] Core phase failure:', coreResult.detail)
      const status = coreResult.failure === 'timeout' ? 504 : coreResult.failure === 'api_key' ? 503 : 502
      return NextResponse.json(
        { error: geminiJsonFailureMessage(coreResult.failure, coreResult.detail) },
        { status },
      )
    }

    const roleLabel = targetRole || pathway.title
    let supplement = defaultSupplement(roleLabel)
    const phase2Budget = ROUTE_BUDGET_MS - (Date.now() - routeStarted) - 1_000

    if (phase2Budget >= 8_000) {
      const supplementPrompt = buildSupplementUserPrompt(coreResult.data, {
        pathwayTitle: pathway.title,
        targetRole: roleLabel,
        jobDescription: jobDescription ? jobDescription.slice(0, MAX_JD_CHARS) : undefined,
      })
      const phase2Timeout = Math.min(PHASE2_TIMEOUT_MS, phase2Budget)

      const supplementResult = await callGeminiJson(
        client,
        getGeminiModel(),
        {
          systemInstruction: CV_BUILDER_SUPPLEMENT_PROMPT,
          userPrompt: supplementPrompt,
          temperature: 0.5,
          maxOutputTokens: 2048,
          timeoutMs: phase2Timeout,
          totalTimeoutMs: phase2Timeout,
          maxAttempts: 1,
        },
        (raw) => validateSupplement(raw) ?? defaultSupplement(roleLabel),
        1,
      )

      if (supplementResult.ok) {
        supplement = supplementResult.data
      } else {
        console.warn('[cv-builder] Supplement phase failed, using defaults:', supplementResult.detail)
      }
    } else {
      console.warn('[cv-builder] Skipping supplement phase — insufficient time budget')
    }

    const draft: CvDraftContent = {
      ...coreResult.data,
      ...supplement,
      _inputs: {
        name,
        location,
        targetRole: targetRole || pathway.title,
        targetRegion,
        historyText,
        jobDescription: jobDescription || undefined,
      },
    }

    const { error: upsertError } = await supabase.from('cv_drafts').upsert({
      user_id: user.id,
      pathway_id: pathwayId,
      content_json: draft,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,pathway_id' })

    if (upsertError) {
      console.error('[cv-builder] Upsert failed:', upsertError)
      const isMissingTable = upsertError.code === '42P01' || upsertError.message?.includes('cv_drafts')
      return NextResponse.json({
        draft,
        saved: false,
        warning: isMissingTable
          ? 'Your CV was generated but could not be saved — the database table may not exist yet. Run migration 004_cv_drafts.sql in Supabase.'
          : 'Your CV was generated but could not be saved. You can still copy it — it will be lost if you leave this page.',
      })
    }

    return NextResponse.json({ draft, saved: true })
  } catch (err) {
    console.error('[cv-builder] Unhandled:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
