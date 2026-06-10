import 'server-only'

/** Parse JSON from Gemini — handles fences and leading/trailing prose. */
export function parseGeminiJsonContent(content: string): unknown {
  let jsonStr = content.trim()
  const fenceMatch = jsonStr.match(/^```(?:json)?\s*([\s\S]*?)```$/i)
  if (fenceMatch) jsonStr = fenceMatch[1].trim()

  if (!jsonStr.startsWith('{') && !jsonStr.startsWith('[')) {
    const start = jsonStr.indexOf('{')
    const end = jsonStr.lastIndexOf('}')
    if (start !== -1 && end > start) jsonStr = jsonStr.slice(start, end + 1)
  }

  return JSON.parse(jsonStr)
}

export type GeminiJsonConfig = {
  systemInstruction: string
  userPrompt: string
  temperature?: number
  maxOutputTokens?: number
  timeoutMs?: number
}

export type GeminiJsonFailure = 'timeout' | 'empty' | 'parse' | 'api' | 'api_key' | 'quota'

export type GeminiJsonResult<T> =
  | { ok: true; data: T }
  | { ok: false; failure: GeminiJsonFailure }

type GeminiApiError = {
  code?: number | string
  reason?: string
  message: string
}

function parseGeminiApiError(err: unknown): GeminiApiError {
  const error = err as { message?: string }
  const raw = error.message || ''
  try {
    const parsed = JSON.parse(raw) as { error?: { code?: number; message?: string; details?: { reason?: string }[] } }
    const api = parsed?.error
    return {
      code: api?.code,
      reason: api?.details?.[0]?.reason,
      message: api?.message || raw || 'Unknown Gemini error',
    }
  } catch {
    return { message: raw || 'Unknown Gemini error' }
  }
}

function classifyApiError(apiError: GeminiApiError): GeminiJsonFailure {
  if (apiError.reason === 'API_KEY_INVALID' || apiError.message.includes('API key not valid')) {
    return 'api_key'
  }
  if (
    apiError.code === 429
    || apiError.reason === 'RATE_LIMIT_EXCEEDED'
    || apiError.message.toLowerCase().includes('quota')
    || apiError.message.toLowerCase().includes('rate limit')
  ) {
    return 'quota'
  }
  return 'api'
}

function buildContents(userPrompt: string) {
  return [{ role: 'user' as const, parts: [{ text: userPrompt }] }]
}

async function generateOnce(
  client: import('@google/genai').GoogleGenAI,
  model: string,
  config: GeminiJsonConfig,
  jsonMode: boolean,
  signal: AbortSignal,
): Promise<{ content: string | null; apiError?: GeminiApiError }> {
  const response = await client.models.generateContent({
    model,
    contents: buildContents(config.userPrompt),
    config: {
      systemInstruction: config.systemInstruction,
      temperature: config.temperature ?? 0.5,
      maxOutputTokens: config.maxOutputTokens ?? 4096,
      ...(jsonMode ? { responseMimeType: 'application/json' as const } : {}),
      abortSignal: signal,
    },
  })

  const content = response.text?.trim() || null
  return { content }
}

function tryParse<T>(
  content: string,
  parse: (raw: unknown) => T | null,
): { data: T | null; failure?: 'empty' | 'parse' } {
  if (!content) return { data: null, failure: 'empty' }

  let parsed: unknown
  try {
    parsed = parseGeminiJsonContent(content)
  } catch (err) {
    console.error('[gemini-json] parse failed:', err, content.slice(0, 300))
    return { data: null, failure: 'parse' }
  }

  const data = parse(parsed)
  if (!data) {
    console.error('[gemini-json] validation failed:', JSON.stringify(parsed).slice(0, 500))
    return { data: null, failure: 'parse' }
  }
  return { data }
}

export async function callGeminiJson<T>(
  client: import('@google/genai').GoogleGenAI,
  model: string,
  config: GeminiJsonConfig,
  parse: (raw: unknown) => T | null,
  attempts = 3,
): Promise<GeminiJsonResult<T>> {
  let lastFailure: GeminiJsonFailure = 'api'
  const timeoutMs = config.timeoutMs ?? 25_000
  const modes: boolean[] = [true, false]

  for (let i = 0; i < attempts; i++) {
    const jsonMode = modes[Math.min(i, modes.length - 1)]
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const { content } = await generateOnce(client, model, config, jsonMode, controller.signal)
      clearTimeout(timeout)

      const result = tryParse(content || '', parse)
      if (result.data) return { ok: true, data: result.data }

      lastFailure = result.failure || 'parse'
    } catch (err: unknown) {
      clearTimeout(timeout)
      const error = err as { name?: string }
      if (error.name === 'AbortError') {
        lastFailure = 'timeout'
        continue
      }

      const apiError = parseGeminiApiError(err)
      console.error(`[gemini-json] API call failed (jsonMode=${jsonMode}):`, apiError.message)
      lastFailure = classifyApiError(apiError)
    }
  }

  return { ok: false, failure: lastFailure }
}

export function geminiJsonFailureMessage(failure: GeminiJsonFailure): string {
  switch (failure) {
    case 'timeout':
      return 'Request timed out. Please try again with shorter text.'
    case 'empty':
      return 'The AI returned an empty response. Please try again.'
    case 'parse':
      return 'The AI returned an invalid response. Please try again.'
    case 'api_key':
      return 'AI service unavailable — API key missing or invalid on the server.'
    case 'quota':
      return 'AI quota exceeded. Please try again later.'
    case 'api':
      return 'AI service error. Please try again in a moment.'
  }
}
