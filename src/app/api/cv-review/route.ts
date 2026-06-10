import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { rateLimit } from '@/lib/rate-limit'
import { getGeminiClient, getGeminiModel } from '@/lib/gemini-client'
import { callGeminiJson, geminiJsonFailureMessage } from '@/lib/gemini-json'

export const maxDuration = 60

const RATE_LIMIT = 5
const WINDOW_MS = 60 * 60 * 1000
const MAX_CV_CHARS = 12_000

const CV_REVIEW_SYSTEM_PROMPT = `You are an expert CV reviewer for Capability Navigator — a career transition platform with an empowering, never-judgemental voice.

Analyse the CV text and return ONLY valid JSON in this exact shape:
{
  "highlights": [
    { "quote": "...", "type": "strong" | "improve", "label": "...", "category": "impact" | "clarity" | "transferable_skill" | "missing_evidence" | "weak_language" | "formatting" }
  ]
}

RULES FOR QUOTES:
- Each quote MUST be an exact, verbatim substring copied from the CV text (5–25 words).
- Copy-paste only — never paraphrase, reword, or fix grammar in quotes.
- If you cannot find a suitable exact substring, omit that item.

RULES FOR LABELS:
- One sentence, max 20 words.
- Empowering and specific — critique the document, never the person.
- NEVER use: "bad", "poor", "weak CV", or language that scores the person.
- Improve examples: "This lists duties without showing the result" — NOT "You failed to show impact".

OUTPUT:
- 4–7 items with type "strong"
- 3–6 items with type "improve"
- category must be one of: impact, clarity, transferable_skill, missing_evidence, weak_language, formatting`

const VALID_TYPES = new Set(['strong', 'improve'])
const VALID_CATEGORIES = new Set([
  'impact', 'clarity', 'transferable_skill', 'missing_evidence', 'weak_language', 'formatting',
])

interface CvHighlight {
  quote: string
  type: 'strong' | 'improve'
  label: string
  category: string
}

function normalizeHighlights(data: unknown): CvHighlight[] {
  if (!data || typeof data !== 'object') return []
  const raw = (data as { highlights?: unknown }).highlights
  if (!Array.isArray(raw)) return []

  return raw
    .filter(item => item && typeof item === 'object')
    .map(item => {
      const h = item as Record<string, unknown>
      const type = typeof h.type === 'string' && VALID_TYPES.has(h.type) ? h.type as 'strong' | 'improve' : 'improve'
      const category = typeof h.category === 'string' && VALID_CATEGORIES.has(h.category)
        ? h.category
        : 'clarity'
      return {
        quote: typeof h.quote === 'string' ? h.quote.trim() : '',
        type,
        label: typeof h.label === 'string' ? h.label.trim() : String(h.comment || '').trim(),
        category,
      }
    })
    .filter(h => h.quote.length >= 5 && h.label.length > 0)
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
        userPrompt: `Review this CV:\n\n${cvText}`,
        temperature: 0.4,
        maxOutputTokens: 4096,
        timeoutMs: 25_000,
      },
      parsed => {
        const highlights = normalizeHighlights(parsed)
        return highlights.length > 0 ? highlights : null
      },
    )

    if (!result.ok) {
      if (result.detail) console.error('[cv-review] Gemini failure:', result.detail)
      const status = result.failure === 'timeout' ? 504 : result.failure === 'api_key' ? 503 : 502
      return NextResponse.json(
        { error: geminiJsonFailureMessage(result.failure) },
        { status },
      )
    }

    return NextResponse.json({ highlights: result.data })
  } catch (err) {
    console.error('[cv-review] Unhandled:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
