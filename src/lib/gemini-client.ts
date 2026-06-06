import { GoogleGenAI } from '@google/genai'

export function getGeminiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) return null
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
}

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL || 'gemini-2.0-flash'
}
