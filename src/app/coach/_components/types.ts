export interface CoachMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  error?: boolean
}

export const COACH_STARTERS = [
  "I'm not sure where to start — what should I do first?",
  "How do I explain my career change to employers?",
  "I'm struggling to find time to work on this. Help.",
  "Should I apply for jobs now or wait until I have more experience?",
  "How long did this move take for people like me?",
]
