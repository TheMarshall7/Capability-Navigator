import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { rateLimit } from '@/lib/rate-limit'
import { getGeminiClient, getGeminiModel } from '@/lib/gemini-client'
import { callGeminiJson, geminiJsonFailureMessage } from '@/lib/gemini-json'

export const maxDuration = 60

const RATE_LIMIT = 3
const WINDOW_MS = 60 * 60 * 1000
const MAX_HISTORY_CHARS = 12_000

const CV_BUILDER_SYSTEM_PROMPT = `You are a CV writer for Capability Navigator — a career transition platform.

Your job: rewrite the user's work history so it speaks the language of their target pathway. People already have the skills — their CV just describes them in the wrong dialect. You translate.

Return ONLY valid JSON in this exact shape:
{
  "headline": "string",
  "summary": "string",
  "experience": [
    { "company": "string", "title": "string", "dates": "string", "bullets": ["string"] }
  ],
  "skills": { "core": ["string"], "developing": ["string"] },
  "tailoring_notes": "string"
}

RULES:
- Reframe every piece of experience using capability language (e.g. lesson planning → curriculum design, parent evenings → stakeholder management).
- Use keywords hiring managers in the target field actually search for.
- Lead bullets with outcomes where any are inferable from the input.
- Write a LinkedIn-ready headline: pipe-separated format like "Learning Designer | 8 Years Curriculum & Instructional Design | Open to L&D, EdTech".
- Summary: 3–4 sentences, tailored to the target pathway.
- Experience: preserve real employers, titles, and dates from the input — reframe bullets only. Max 5 bullets per role, each starting with a strong verb.
- Skills: group into core (existing transferable strengths) and developing (pathway missing skills the user has started addressing based on their history).
- tailoring_notes: 2–3 sentences telling the user what was changed and why — teach them the reframing.

CRITICAL — NEVER FABRICATE:
Never fabricate employers, dates, titles, qualifications, or metrics — if the input lacks a number, the output must not invent one. Honest reframing, not fiction.`

export interface CvDraftExperience {
  company: string
  title: string
  dates: string
  bullets: string[]
}

export interface CvDraftContent {
  headline: string
  summary: string
  experience: CvDraftExperience[]
  skills: { core: string[]; developing: string[] }
  tailoring_notes: string
  _inputs?: {
    name: string
    location: string
    targetRole: string
    historyText: string
  }
}

function normalizeParsedDraft(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== 'object') return null
  const d = { ...(data as Record<string, unknown>) }

  if (!d.tailoring_notes && typeof d.tailoringNotes === 'string') {
    d.tailoring_notes = d.tailoringNotes
  }

  if (!d.skills || typeof d.skills !== 'object') {
    d.skills = { core: [], developing: [] }
  } else {
    const skills = d.skills as Record<string, unknown>
    if (!Array.isArray(skills.core)) skills.core = []
    if (!Array.isArray(skills.developing)) skills.developing = []
    d.skills = skills
  }

  if (!Array.isArray(d.experience)) {
    d.experience = []
  } else {
    d.experience = (d.experience as unknown[])
      .filter(exp => exp && typeof exp === 'object')
      .map(exp => {
        const e = { ...(exp as Record<string, unknown>) }
        const bullets = Array.isArray(e.bullets)
          ? e.bullets.filter(b => typeof b === 'string' && b.trim()).slice(0, 5)
          : []
        return {
          company: typeof e.company === 'string' && e.company.trim() ? e.company.trim() : 'Organisation',
          title: typeof e.title === 'string' && e.title.trim() ? e.title.trim() : 'Role',
          dates: typeof e.dates === 'string' && e.dates.trim() ? e.dates.trim() : 'Dates not specified',
          bullets,
        }
      })
  }

  return d
}

function validateDraft(data: unknown): CvDraftContent | null {
  const normalized = normalizeParsedDraft(data)
  if (!normalized) return null

  const headline = typeof normalized.headline === 'string' ? normalized.headline.trim() : ''
  const summary = typeof normalized.summary === 'string' ? normalized.summary.trim() : ''
  const tailoringNotes = typeof normalized.tailoring_notes === 'string'
    ? normalized.tailoring_notes.trim()
    : ''

  if (!headline && !summary) return null

  const skills = normalized.skills as { core: unknown[]; developing: unknown[] }
  const experience = normalized.experience as CvDraftExperience[]

  return {
    headline: headline || 'Career professional open to new opportunities',
    summary: summary || 'Experienced professional with transferable skills ready for a new pathway.',
    experience: experience.map(e => ({
      company: e.company,
      title: e.title,
      dates: e.dates,
      bullets: e.bullets,
    })),
    skills: {
      core: skills.core.map(s => String(s).trim()).filter(Boolean),
      developing: skills.developing.map(s => String(s).trim()).filter(Boolean),
    },
    tailoring_notes: tailoringNotes || 'Your experience was reframed using capability language for your target pathway.',
  }
}

function buildUserPrompt(data: {
  name: string
  location: string
  targetRole: string
  historyText: string
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

  return `TARGET PATHWAY: ${data.pathwayTitle}
Match reason: ${data.matchReason}
Missing skills to address in "developing": ${gaps || 'None listed'}

CAPABILITY PROFILE SUMMARY:
${data.reportSummary}

CORE CAPABILITIES:
${caps || 'None'}

HIDDEN STRENGTHS:
${strengths || 'None'}

CANDIDATE:
Name: ${data.name}
Location: ${data.location}
Target role: ${data.targetRole}

WORK HISTORY (raw — reframe using capability language for the target pathway):
${data.historyText}`
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
    const name = body.name
    const location = body.location
    const targetRole = body.targetRole
    const historyText = body.historyText

    if (typeof pathwayId !== 'string' || !pathwayId) {
      return NextResponse.json({ error: 'pathwayId is required' }, { status: 400 })
    }
    if (typeof historyText !== 'string' || !historyText.trim()) {
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
      name: (typeof name === 'string' ? name : '').trim() || 'Candidate',
      location: (typeof location === 'string' ? location : '').trim(),
      targetRole: (typeof targetRole === 'string' ? targetRole : '').trim() || pathway.title,
      historyText: historyText.trim().slice(0, MAX_HISTORY_CHARS),
      reportSummary: report.summary || 'No capability summary available.',
      coreCapabilities: report.core_capabilities_json || [],
      hiddenStrengths: report.hidden_strengths_json || [],
      pathwayTitle: pathway.title,
      matchReason: pathway.match_reason || '',
      missingSkills: pathway.missing_skills_json || [],
    })

    const result = await callGeminiJson(
      client,
      getGeminiModel(),
      {
        systemInstruction: CV_BUILDER_SYSTEM_PROMPT,
        userPrompt,
        temperature: 0.5,
        maxOutputTokens: 4096,
        timeoutMs: 25_000,
      },
      validateDraft,
    )

    if (!result.ok) {
      if (result.detail) console.error('[cv-builder] Gemini failure:', result.detail)
      const status = result.failure === 'timeout' ? 504 : result.failure === 'api_key' ? 503 : 502
      return NextResponse.json(
        { error: geminiJsonFailureMessage(result.failure) },
        { status },
      )
    }
    const draft = result.data

    const contentJson: CvDraftContent = {
      ...draft,
      _inputs: {
        name: (typeof name === 'string' ? name : '').trim(),
        location: (typeof location === 'string' ? location : '').trim(),
        targetRole: (typeof targetRole === 'string' ? targetRole : '').trim() || pathway.title,
        historyText: historyText.trim(),
      },
    }

    const { error: upsertError } = await supabase.from('cv_drafts').upsert({
      user_id: user.id,
      pathway_id: pathwayId,
      content_json: contentJson,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,pathway_id' })

    if (upsertError) {
      console.error('[cv-builder] Upsert failed:', upsertError)
      const isMissingTable = upsertError.code === '42P01' || upsertError.message?.includes('cv_drafts')
      return NextResponse.json({
        draft: contentJson,
        saved: false,
        warning: isMissingTable
          ? 'Your CV was generated but could not be saved — the database table may not exist yet. Run migration 004_cv_drafts.sql in Supabase.'
          : 'Your CV was generated but could not be saved. You can still copy it — it will be lost if you leave this page.',
      })
    }

    return NextResponse.json({ draft: contentJson, saved: true })
  } catch (err) {
    console.error('[cv-builder] Unhandled:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
