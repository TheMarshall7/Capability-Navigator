import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getGeminiClient, getGeminiModel, getGeminiModelCandidates, isGeminiModelConfigured } from '@/lib/gemini-client'

export const maxDuration = 30

/** Authenticated diagnostic — tests whether Gemini is reachable from this deployment. */
export async function GET() {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const hasKey = Boolean(process.env.GEMINI_API_KEY)
  const primaryModel = getGeminiModel()
  const candidates = getGeminiModelCandidates()
  const modelConfiguredInEnv = isGeminiModelConfigured()

  if (!hasKey) {
    return NextResponse.json({
      hasKey: false,
      primaryModel,
      modelConfiguredInEnv,
      candidates,
      ok: false,
      error: 'GEMINI_API_KEY is not set in this environment',
    })
  }

  const client = getGeminiClient()
  if (!client) {
    return NextResponse.json({
      hasKey: true,
      primaryModel,
      modelConfiguredInEnv,
      candidates,
      ok: false,
      error: 'Failed to initialise Gemini client',
    })
  }

  for (const model of candidates) {
    try {
      const stream = await client.models.generateContentStream({
        model,
        contents: [{ role: 'user', parts: [{ text: 'Reply with exactly: OK' }] }],
        config: { maxOutputTokens: 16, temperature: 0 },
      })
      let text = ''
      for await (const chunk of stream) {
        text += chunk.text ?? ''
      }
      return NextResponse.json({
        hasKey: true,
        primaryModel,
        modelConfiguredInEnv,
        workingModel: model,
        candidates,
        ok: true,
        sample: text.trim().slice(0, 50),
      })
    } catch (err: unknown) {
      const error = err as { name?: string; message?: string; status?: number }
      console.error(`[ai-health] model ${model} failed:`, error.message || err)
      if (model === candidates[candidates.length - 1]) {
        return NextResponse.json({
          hasKey: true,
          primaryModel,
          modelConfiguredInEnv,
          candidates,
          ok: false,
          error: error.message || 'All models failed',
          status: error.status,
        })
      }
    }
  }

  return NextResponse.json({ hasKey: true, primaryModel, candidates, ok: false, error: 'Unknown failure' })
}
