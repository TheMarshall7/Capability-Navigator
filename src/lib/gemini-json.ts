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

export type GeminiJsonResult<T> =
  | { ok: true; data: T }
  | { ok: false; failure: 'timeout' | 'empty' | 'parse' | 'api' }

export async function callGeminiJson<T>(
  client: import('@google/genai').GoogleGenAI,
  model: string,
  config: GeminiJsonConfig,
  parse: (raw: unknown) => T | null,
  attempts = 3,
): Promise<GeminiJsonResult<T>> {
  let lastFailure: GeminiJsonResult<T> = { ok: false, failure: 'api' }

  for (let i = 0; i < attempts; i++) {
    const controller = new AbortController()
    const timeoutMs = config.timeoutMs ?? 25_000
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await client.models.generateContent({
        model,
        contents: config.userPrompt,
        config: {
          systemInstruction: config.systemInstruction,
          temperature: config.temperature ?? 0.5,
          maxOutputTokens: config.maxOutputTokens ?? 4096,
          responseMimeType: 'application/json',
          abortSignal: controller.signal,
        },
      })
      clearTimeout(timeout)

      const content = response.text
      if (!content?.trim()) {
        lastFailure = { ok: false, failure: 'empty' }
        continue
      }

      let parsed: unknown
      try {
        parsed = parseGeminiJsonContent(content)
      } catch (err) {
        console.error('[gemini-json] parse failed:', err, content.slice(0, 300))
        lastFailure = { ok: false, failure: 'parse' }
        continue
      }

      const data = parse(parsed)
      if (data) return { ok: true, data }
      console.error('[gemini-json] validation failed:', JSON.stringify(parsed).slice(0, 500))
      lastFailure = { ok: false, failure: 'parse' }
    } catch (err: unknown) {
      clearTimeout(timeout)
      const error = err as { name?: string; message?: string }
      if (error.name === 'AbortError') {
        lastFailure = { ok: false, failure: 'timeout' }
      } else {
        console.error('[gemini-json] API call failed:', err)
        lastFailure = { ok: false, failure: 'api' }
      }
    }
  }

  return lastFailure
}
