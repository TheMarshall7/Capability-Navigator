import 'server-only'
import type { CapabilityReport, GenerateReportInput } from '@/types'
import { getGeminiClient, getGeminiModel } from '@/lib/gemini-client'
import { CAPABILITY_SYSTEM_PROMPT } from '@/lib/prompts/capability-system'
import { buildCapabilityUserPrompt } from '@/lib/prompts/capability-user'
import { getMockCapabilityReport } from '@/lib/mock-capability-report'

export async function generateCapabilityReport(
  input: GenerateReportInput
): Promise<CapabilityReport> {
  const client = getGeminiClient()

  if (!client) {
    console.log('[AI Service] No Gemini key — returning mock data')
    return getMockCapabilityReport()
  }

  const userPrompt = buildCapabilityUserPrompt(input)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 55_000)

  try {
    const response = await client.models.generateContent({
      model: getGeminiModel(),
      contents: userPrompt,
      config: {
        systemInstruction: CAPABILITY_SYSTEM_PROMPT,
        temperature: 0.7,
        maxOutputTokens: 4000,
        responseMimeType: 'application/json',
        abortSignal: controller.signal,
      },
    })
    clearTimeout(timeout)

    const content = response.text
    if (!content) throw new Error('Empty response from Gemini')

    return JSON.parse(content) as CapabilityReport
  } catch (err: unknown) {
    clearTimeout(timeout)
    const error = err as { name?: string; message?: string }
    if (error.name === 'AbortError' || error.message?.includes('abort')) {
      console.error('[AI Service] Gemini request timed out after 55s — falling back to mock')
    } else {
      console.error('[AI Service] Generation failed:', err)
    }
    return getMockCapabilityReport()
  }
}
