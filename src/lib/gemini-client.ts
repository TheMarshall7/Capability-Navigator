import 'server-only'
import { GoogleGenAI } from '@google/genai'

export function getGeminiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) return null
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
}

function normalizeModelName(model: string): string {
  return model.trim().replace(/^models\//, '')
}

/** Primary model from env, defaulting to gemini-2.0-flash. */
export function getGeminiModel(): string {
  const configured = process.env.GEMINI_MODEL?.trim()
  return normalizeModelName(configured || 'gemini-2.0-flash')
}

/** Models to try in order when the primary model fails. */
export function getGeminiModelCandidates(): string[] {
  const primary = getGeminiModel()
  const fallbacks = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash']
  return [primary, ...fallbacks.filter(m => m !== primary)]
}
