
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { rateLimit } from '@/lib/rate-limit'
import { getGeminiClient, getGeminiModel } from '@/lib/gemini-client'
import {
  getTransitionStats,
  getSimilarTransitions,
  parseQuestionnaireRole,
  truncateExcerpt,
  type PublicTransition,
  type TransitionStat,
} from '@/lib/transitions'

// 20 messages per user per hour
const RATE_LIMIT = 20
const WINDOW_MS = 60 * 60 * 1000

function buildPlatformDataSection(
  userRole: string,
  pathwayTitle: string,
  stat: TransitionStat | null,
  similar: PublicTransition[],
): string {
  const pathwayNorm = pathwayTitle.trim().toLowerCase()
  const excerpts = similar
    .filter(t => t.what_worked && (!pathwayTitle || t.new_role.trim().toLowerCase() === pathwayNorm))
    .slice(0, 3)
    .map(t => truncateExcerpt(t.what_worked, 150))

  if (stat && stat.transition_count > 0) {
    const median = stat.median_months != null ? Math.round(stat.median_months) : 'unknown'
    let section = `PLATFORM TRANSITION DATA (real, from our users — cite this when relevant):
- ${stat.transition_count} people on this platform moved from ${userRole || stat.original_role} to ${pathwayTitle || stat.new_role}. Median time: ${median} months.`
    if (excerpts.length > 0) {
      section += `\n- What they said worked: ${excerpts.map(e => `"${e}"`).join('; ')}`
    }
    return section
  }

  return `PLATFORM TRANSITION DATA (real, from our users — cite this when relevant):
- No platform data exists yet for this exact transition.`
}

function buildSystemPrompt(data: {
  name: string
  report: any
  topPathway: any
  milestoneProgress: { completed: number; total: number }
  userRole: string
  transitionStat: TransitionStat | null
  similarTransitions: PublicTransition[]
}): string {
  const { name, report, topPathway, milestoneProgress, userRole, transitionStat, similarTransitions } = data
  const capabilities = (report.core_capabilities_json || []).map((c: any) => c.title).join(', ')
  const strengths = (report.hidden_strengths_json || []).map((h: any) => h.title).join(', ')
  const pct = milestoneProgress.total > 0
    ? Math.round((milestoneProgress.completed / milestoneProgress.total) * 100)
    : 0

  const platformData = buildPlatformDataSection(
    userRole,
    topPathway?.title || '',
    transitionStat,
    similarTransitions,
  )

  return `You are a personal career transition coach helping ${name} make a career change.

THEIR PROFILE:
- Capability summary: ${report.summary || 'Not available'}
- Core capabilities: ${capabilities || 'Not yet generated'}
- Hidden strengths: ${strengths || 'Not yet generated'}
- Work style: ${report.work_style_summary || 'Not available'}
- Current role: ${userRole || 'Not provided'}

TARGET PATHWAY:
- Title: ${topPathway?.title || 'Not yet selected'}
- Capability overlap: ${topPathway?.capability_overlap || 0}%
- Estimated timeline: ${topPathway?.estimated_transition_time || 'Unknown'}
- First step: ${topPathway?.first_step || 'Not available'}

THEIR PROGRESS:
- Milestones completed: ${milestoneProgress.completed} of ${milestoneProgress.total} (${pct}%)

${platformData}

YOUR ROLE:
- Give specific, actionable advice grounded in their actual capabilities — never generic career advice
- Reference their specific strengths when relevant
- Keep answers direct and concise (2–4 sentences unless they need more detail)
- Ask one focused follow-up question at a time to understand where they're stuck
- Tone: warm, direct, like a smart friend who knows career transitions deeply

When platform transition data is provided above, ground any timeline, difficulty, or feasibility claims in it and say the numbers come from real users of this platform. When NO platform data is provided, you MUST say so plainly ('we don't have platform data on this exact move yet') before giving your best general guidance — never imply general knowledge is platform data, and never invent counts, success rates, or timelines.

NEVER:
- Give advice that ignores their specific profile
- Use corporate language or excessive enthusiasm
- Overwhelm with too many options at once
- Pretend you know things you don't — say so if you're uncertain
- Invent transition counts, timelines, or success rates when no platform data is provided`
}

function buildFallbackReply(data: {
  topPathway: any
  report: any
}): string {
  const { topPathway, report } = data
  return `I can see you're working toward becoming a ${topPathway?.title || 'career changer'}. Based on your profile, your strongest asset is your ${(report?.core_capabilities_json?.[0]?.title) || 'capability set'}. What specific obstacle are you hitting right now?`
}

function textStreamResponse(text: string, remaining: number): Response {
  return new Response(text, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-RateLimit-Remaining': String(remaining),
    },
  })
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    // Rate limit
    const limit = rateLimit(`coach:${user.id}`, RATE_LIMIT, WINDOW_MS)
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `Too many messages. Try again in ${limit.retryAfter} seconds.` },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
      )
    }

    const { message } = await req.json()
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Fetch everything needed for personalized context in parallel
    const [
      { data: userData },
      { data: report },
      { data: topPathway },
      { data: roleAnswer },
    ] = await Promise.all([
      supabase.from('users').select('name').eq('id', user.id).single(),
      supabase.from('capability_reports').select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('career_pathways').select('*').eq('user_id', user.id)
        .order('capability_overlap', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('questionnaire_answers').select('answer_value')
        .eq('user_id', user.id).eq('question_key', 'role').maybeSingle(),
    ])

    const userRole = parseQuestionnaireRole(roleAnswer?.answer_value)
    const pathwayTitle = topPathway?.title || ''

    const [transitionStats, similarTransitions] = userRole
      ? await Promise.all([
          getTransitionStats(userRole, pathwayTitle || undefined),
          getSimilarTransitions(userRole, 3),
        ])
      : [[], []]

    const transitionStat = pathwayTitle
      ? transitionStats.find(
          s => s.new_role.trim().toLowerCase() === pathwayTitle.trim().toLowerCase(),
        ) ?? null
      : null

    // Milestone progress for context
    const { data: milestones } = topPathway
      ? await supabase.from('milestones').select('completed').eq('pathway_id', topPathway.id)
      : { data: [] }

    const milestoneProgress = {
      completed: (milestones || []).filter((m: any) => m.completed).length,
      total: (milestones || []).length,
    }

    // Last 20 messages for conversation context
    const { data: history } = await supabase
      .from('coach_messages')
      .select('role, content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    const historyMessages = (history || []).reverse().map((m: any) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    // Save user message to DB
    await supabase.from('coach_messages').insert({
      user_id: user.id,
      role: 'user',
      content: message.trim(),
    })

    // Check for Gemini key — return helpful fallback if missing
    const fallbackReply = buildFallbackReply({ topPathway, report: report || {} })

    if (!process.env.GEMINI_API_KEY) {
      await supabase.from('coach_messages').insert({
        user_id: user.id,
        role: 'assistant',
        content: fallbackReply,
      })
      return textStreamResponse(fallbackReply, limit.remaining)
    }

    const client = getGeminiClient()
    if (!client) {
      await supabase.from('coach_messages').insert({
        user_id: user.id,
        role: 'assistant',
        content: fallbackReply,
      })
      return textStreamResponse(fallbackReply, limit.remaining)
    }

    const systemPrompt = buildSystemPrompt({
      name: userData?.name || 'there',
      report: report || {},
      topPathway,
      milestoneProgress,
      userRole,
      transitionStat,
      similarTransitions,
    })

    // Stream the response
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30_000)

    let stream
    try {
      stream = await client.models.generateContentStream({
        model: getGeminiModel(),
        contents: [
          ...historyMessages.map(m => ({
            role: m.role === 'assistant' ? 'model' as const : 'user' as const,
            parts: [{ text: m.content }],
          })),
          { role: 'user', parts: [{ text: message.trim() }] },
        ],
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.75,
          maxOutputTokens: 500,
          abortSignal: controller.signal,
        },
      })
    } catch (err) {
      clearTimeout(timeout)
      console.error('[coach API] Gemini stream failed:', err)
      await supabase.from('coach_messages').insert({
        user_id: user.id,
        role: 'assistant',
        content: fallbackReply,
      })
      return textStreamResponse(fallbackReply, limit.remaining)
    }

    let assistantMessage = ''

    const readable = new ReadableStream({
      async start(streamController) {
        try {
          for await (const chunk of stream) {
            const text = chunk.text ?? ''
            if (text) {
              assistantMessage += text
              streamController.enqueue(new TextEncoder().encode(text))
            }
          }
          clearTimeout(timeout)

          // Persist the complete assistant response
          await supabase.from('coach_messages').insert({
            user_id: user.id,
            role: 'assistant',
            content: assistantMessage,
          })

          streamController.close()
        } catch (err: any) {
          clearTimeout(timeout)
          const errMsg = err.name === 'AbortError'
            ? 'Response timed out. Please try again.'
            : 'Something went wrong. Please try again.'
          streamController.enqueue(new TextEncoder().encode(`\n\n[Error: ${errMsg}]`))
          streamController.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-RateLimit-Remaining': String(limit.remaining),
      },
    })
  } catch (err: any) {
    console.error('[coach API]', err)
    return NextResponse.json(
      { error: err.message || 'Failed to get coach response' },
      { status: 500 }
    )
  }
}
