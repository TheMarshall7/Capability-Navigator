import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { rateLimit } from '@/lib/rate-limit'
import { getGeminiClient, getGeminiModel } from '@/lib/gemini-client'
import { callGeminiJson, geminiJsonFailureMessage } from '@/lib/gemini-json'
import { locateHighlight, repairHighlightQuote } from '@/lib/cv-highlight-locate'
import type {
  CvReviewCategory,
  CvReviewHighlight,
  CvReviewResult,
  CvReviewTab,
} from '@/types/cv-review'

export const maxDuration = 60

const RATE_LIMIT = 5
const WINDOW_MS = 60 * 60 * 1000
const MAX_CV_CHARS = 12_000

const VALID_TYPES = new Set<CvReviewTab>(['strong', 'improve'])
const VALID_CATEGORIES = new Set<CvReviewCategory>([
  'impact', 'clarity', 'transferable_skill', 'missing_evidence', 'weak_language', 'formatting',
])

const CV_REVIEW_SYSTEM_PROMPT = `You are an expert CV reviewer for Capability Navigator — a career transition platform with an empowering, never-judgemental voice.

Produce a DEEP, section-by-section expert review. This is not a quick skim — treat every major CV section (summary/profile, experience, skills, education, other) as deserving specific feedback.

Return ONLY valid JSON in this exact shape:
{
  "overview": {
    "summary": "3-5 sentences overall assessment",
    "strengthsSummary": ["theme 1", "theme 2", "theme 3"],
    "improvementsSummary": ["priority 1", "priority 2", "priority 3"]
  },
  "sections": [
    { "name": "Section name e.g. Professional Summary", "assessment": "2-4 sentences on this section" }
  ],
  "highlights": [
    {
      "quote": "verbatim substring from CV",
      "type": "strong" | "improve",
      "category": "impact" | "clarity" | "transferable_skill" | "missing_evidence" | "weak_language" | "formatting",
      "label": "2-3 sentences of specific, actionable advice",
      "suggestion": "for improve items only: concrete rewrite direction",
      "section": "which CV section this relates to"
    }
  ]
}

DEPTH REQUIREMENTS:
- Minimum 8 items with type "strong" and 8 with type "improve" for a typical CV (scale down proportionally only if CV is very short).
- Cover ALL major sections present — do not cluster feedback on a single bullet.
- Include at least one highlight per category where applicable across the full set.
- Each label: 2-3 sentences, specific and mentor-like — not generic praise or criticism.
- For every "improve" item, include a "suggestion" with a concrete rewrite direction (never invent metrics or employers).

QUOTE RULES:
- Each quote MUST be copied verbatim from the CV text (roughly 5-30 words).
- Copy-paste only — never paraphrase. If no exact substring exists, omit that item.

TONE:
- Empowering and specific — critique the document, never the person.
- NEVER use: "bad", "poor", "weak CV", or language that scores the person.
- No numeric CV scores.`

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

function validateReview(data: unknown, cvText: string): CvReviewResult | null {
  if (!data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>

  const overview = normalizeOverview(d.overview)
  if (!overview) return null

  const sections = normalizeSections(d.sections)
  const highlights = normalizeHighlights(d, cvText)
  const mins = minHighlightsForCv(cvText.length)
  const strongCount = highlights.filter(h => h.type === 'strong').length
  const improveCount = highlights.filter(h => h.type === 'improve').length

  if (strongCount < mins.strong || improveCount < mins.improve) {
    console.error(`[cv-review] Insufficient highlights: ${strongCount} strong, ${improveCount} improve (need ${mins.strong}/${mins.improve})`)
    return null
  }

  return { overview, sections, highlights }
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

    const client = getGeminiClient()
    if (!client) {
      return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 })
    }

    const cvText = text.trim().slice(0, MAX_CV_CHARS)
    const result = await callGeminiJson(
      client,
      getGeminiModel(),
      {
        systemInstruction: CV_REVIEW_SYSTEM_PROMPT,
        userPrompt: `Review this CV in depth — section by section. Return the full JSON report.\n\n${cvText}`,
        temperature: 0.45,
        maxOutputTokens: 8192,
        timeoutMs: 55_000,
      },
      parsed => validateReview(parsed, cvText),
      3,
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
