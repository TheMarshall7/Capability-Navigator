import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { rateLimit } from '@/lib/rate-limit'
import { getGeminiClient, getGeminiModel } from '@/lib/gemini-client'

const RATE_LIMIT = 5
const WINDOW_MS = 60 * 60 * 1000
const TIMEOUT_MS = 20_000
const MAX_CV_CHARS = 12_000

const CV_REVIEW_SYSTEM_PROMPT = `You are an expert CV reviewer for Capability Navigator — a career transition platform with an empowering, never-judgemental voice.

Analyse the CV text and return highlights as JSON.

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

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    highlights: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          quote: { type: 'STRING' },
          type: { type: 'STRING', enum: ['strong', 'improve'] },
          label: { type: 'STRING' },
          category: {
            type: 'STRING',
            enum: ['impact', 'clarity', 'transferable_skill', 'missing_evidence', 'weak_language', 'formatting'],
          },
        },
        required: ['quote', 'type', 'label', 'category'],
      },
    },
  },
  required: ['highlights'],
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
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const response = await client.models.generateContent({
        model: getGeminiModel(),
        contents: `Review this CV:\n\n${cvText}`,
        config: {
          systemInstruction: CV_REVIEW_SYSTEM_PROMPT,
          temperature: 0.4,
          maxOutputTokens: 2000,
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
          abortSignal: controller.signal,
        },
      })
      clearTimeout(timeout)

      const content = response.text
      if (!content) {
        return NextResponse.json({ error: 'Empty AI response' }, { status: 502 })
      }

      let parsed: { highlights?: unknown[] }
      try {
        parsed = JSON.parse(content) as { highlights?: unknown[] }
      } catch {
        return NextResponse.json({ error: 'AI returned invalid JSON' }, { status: 502 })
      }

      const highlights = Array.isArray(parsed.highlights) ? parsed.highlights : []

      return NextResponse.json({ highlights })
    } catch (err: unknown) {
      clearTimeout(timeout)
      const error = err as { name?: string }
      if (error.name === 'AbortError') {
        return NextResponse.json({ error: 'Review timed out' }, { status: 504 })
      }
      console.error('[cv-review]', err)
      return NextResponse.json({ error: 'Review failed' }, { status: 502 })
    }
  } catch (err) {
    console.error('[cv-review] Unhandled:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
