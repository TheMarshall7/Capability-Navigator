import 'server-only'
import { getGeminiModelCandidates } from '@/lib/gemini-client'

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

export type GeminiJsonFailure = 'timeout' | 'empty' | 'parse' | 'api' | 'api_key' | 'quota' | 'model'

export type GeminiJsonResult<T> =
  | { ok: true; data: T }
  | { ok: false; failure: GeminiJsonFailure; detail?: string }

type GeminiApiError = {
  code?: number | string
  reason?: string
  message: string
}

function parseGeminiApiError(err: unknown): GeminiApiError {
  const error = err as { name?: string; message?: string; status?: number }
  const message = error.message || 'Unknown Gemini error'

  if (error.name === 'ApiError' || typeof error.status === 'number') {
    return {
      code: error.status,
      message,
      reason: error.status === 401 || error.status === 403 ? 'API_KEY_INVALID' : undefined,
    }
  }

  try {
    const parsed = JSON.parse(message) as { error?: { code?: number; message?: string; details?: { reason?: string }[] } }
    const api = parsed?.error
    return {
      code: api?.code,
      reason: api?.details?.[0]?.reason,
      message: api?.message || message,
    }
  } catch {
    return { message }
  }
}

function isModelNotFoundError(message: string, code?: number | string): boolean {
  const lower = message.toLowerCase()
  if (code === 404) return true
  return (
    lower.includes('model') && lower.includes('not found')
  ) || (
    lower.includes('models/') && lower.includes('not found')
  ) || lower.includes('is not found for api version')
}

function classifyApiError(apiError: GeminiApiError): GeminiJsonFailure {
  if (
    apiError.reason === 'API_KEY_INVALID'
    || apiError.code === 401
    || apiError.code === 403
    || apiError.message.includes('API key not valid')
    || apiError.message.toLowerCase().includes('authentication')
  ) {
    return 'api_key'
  }
  if (isModelNotFoundError(apiError.message, apiError.code)) {
    return 'model'
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

async function generateStreamText(
  client: import('@google/genai').GoogleGenAI,
  model: string,
  config: GeminiJsonConfig,
  jsonMode: boolean,
  signal: AbortSignal,
): Promise<string> {
  const stream = await client.models.generateContentStream({
    model,
    contents: [
      { role: 'user', parts: [{ text: config.userPrompt }] },
    ],
    config: {
      systemInstruction: config.systemInstruction,
      temperature: config.temperature ?? 0.5,
      maxOutputTokens: config.maxOutputTokens ?? 4096,
      ...(jsonMode ? { responseMimeType: 'application/json' as const } : {}),
      abortSignal: signal,
    },
  })

  let text = ''
  for await (const chunk of stream) {
    text += chunk.text ?? ''
  }
  return text.trim()
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
  _model: string,
  config: GeminiJsonConfig,
  parse: (raw: unknown) => T | null,
  attemptsPerModel = 2,
): Promise<GeminiJsonResult<T>> {
  const models = getGeminiModelCandidates()
  const timeoutMs = config.timeoutMs ?? 25_000
  const modes: boolean[] = [false, true]
  let lastFailure: GeminiJsonFailure = 'api'
  let lastDetail = ''

  for (const model of models) {
    for (let i = 0; i < attemptsPerModel; i++) {
      const jsonMode = modes[Math.min(i, modes.length - 1)]
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), timeoutMs)

      try {
        const content = await generateStreamText(client, model, config, jsonMode, controller.signal)
        clearTimeout(timeout)

        const result = tryParse(content, parse)
        if (result.data) return { ok: true, data: result.data }

        lastFailure = result.failure || 'parse'
        lastDetail = `model=${model}, jsonMode=${jsonMode}`
      } catch (err: unknown) {
        clearTimeout(timeout)
        const error = err as { name?: string }
        if (error.name === 'AbortError') {
          lastFailure = 'timeout'
          lastDetail = `model=${model}`
          continue
        }

        const apiError = parseGeminiApiError(err)
        lastFailure = classifyApiError(apiError)
        lastDetail = `model=${model}, ${apiError.message}`
        console.error(`[gemini-json] stream failed (${lastDetail})`)

        if (lastFailure === 'model') break
        if (lastFailure === 'api_key' || lastFailure === 'quota') {
          return { ok: false, failure: lastFailure, detail: apiError.message }
        }
      }
    }
  }

  return { ok: false, failure: lastFailure, detail: lastDetail }
}

function sanitizeDetail(detail: string): string {
  return detail.replace(/AIza[0-9A-Za-z_-]{10,}/g, '[redacted]').slice(0, 200)
}

export function geminiJsonFailureMessage(failure: GeminiJsonFailure, detail?: string): string {
  const hint = detail ? ` ${sanitizeDetail(detail)}` : ''

  switch (failure) {
    case 'timeout':
      return 'Request timed out. Please try again with shorter text.'
    case 'empty':
      return 'The AI returned an empty response. Please try again.'
    case 'parse':
      return 'The AI returned an invalid response. Please try again.'
    case 'api_key':
      return 'AI service unavailable — check GEMINI_API_KEY is valid and unrestricted for server use.'
    case 'quota':
      return 'AI quota exceeded. Please try again later.'
    case 'model':
      return `Google AI model unavailable.${hint || ' The app tried gemini-2.5-flash and fallbacks automatically.'}`
    case 'api':
      return `AI service error.${hint || ' Please try again in a moment.'}`
  }
}
