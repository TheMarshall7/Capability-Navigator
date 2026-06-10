import 'server-only'
import { GoogleGenAI } from '@google/genai'

const DEFAULT_MODEL = 'gemini-2.5-flash'

const FALLBACK_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-flash-latest',
]

export function getGeminiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) return null
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
}

function normalizeModelName(model: string): string {
  return model.trim().replace(/^models\//, '')
}

/** Whether GEMINI_MODEL is explicitly set in the environment. */
export function isGeminiModelConfigured(): boolean {
  return Boolean(process.env.GEMINI_MODEL?.trim())
}

/** Primary model from env, defaulting to gemini-2.5-flash. */
export function getGeminiModel(): string {
  const configured = process.env.GEMINI_MODEL?.trim()
  return normalizeModelName(configured || DEFAULT_MODEL)
}

/** Models to try in order when the primary model fails. */
export function getGeminiModelCandidates(): string[] {
  const primary = getGeminiModel()
  return [primary, ...FALLBACK_MODELS.filter(m => m !== primary)]
}
