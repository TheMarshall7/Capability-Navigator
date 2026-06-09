import type { GenerateReportInput } from '@/types'

export function buildCapabilityUserPrompt(input: GenerateReportInput): string {
  const { cvText, questionnaireAnswers: qa } = input

  return `Analyse this person's CV and questionnaire answers. Generate a complete capability profile.

=== CV TEXT ===
${cvText || 'No CV provided — rely heavily on questionnaire answers.'}

=== QUESTIONNAIRE ANSWERS ===
Current/most recent role: ${qa.role || 'Not provided'}
Years of experience: ${qa.years || 'Not provided'}
Current situation: ${qa.situation || 'Not provided'}
Location: ${qa.city || ''}, ${qa.country || ''}
Working arrangements considered: ${JSON.stringify(qa.arrangements || [])}

5-year vision: ${qa.fiveYears || 'Not provided'}
Career curiosities: ${qa.curious || 'Not provided'}
Most important in next chapter: ${JSON.stringify(qa.matters || [])}

Activities that give energy: ${JSON.stringify(qa.energises || [])}
Activities that drain energy: ${JSON.stringify(qa.drains || [])}
Most proud of at work: ${qa.proud || 'Not provided'}
What people come to them for: ${qa.helpWith || 'Not provided'}

Hobbies and interests: ${qa.hobbies || 'Not provided'}
Personal or side projects: ${qa.projects || 'Not provided'}
Topics they self-educate on: ${qa.learning || 'Not provided'}
Ideal working week (no money constraint): ${qa.moneyNoObject || 'Not provided'}

Environment preference: ${qa.environment || 'Not provided'}
Work preference: ${qa.workPreference || 'Not provided'}
Uncertainty comfort (1–5): ${qa.uncertainty || 'Not provided'}
Personality type: ${qa.personality || 'Not provided'}

Open to retraining: ${qa.openToRetrain || 'Not provided'}
Time available for learning per week: ${qa.learningTime || 'Not provided'}
Willing to take salary/seniority step back: ${qa.salaryStep || 'Not provided'}
Timeline: ${qa.timeline || 'Not provided'}

Better than most people at: ${qa.betterThanMost || 'Not provided'}
Most overlooked strength: ${qa.overlooked || 'Not provided'}
Ideal future in one sentence: ${qa.idealFuture || 'Not provided'}

=== OUTPUT SCHEMA ===
Return ONLY valid JSON in this exact structure:
{
  "capabilitySummary": "string",
  "coreCapabilities": [
    { "title": "string", "explanation": "string", "evidence": "string" }
  ],
  "hiddenStrengths": [
    { "title": "string", "explanation": "string" }
  ],
  "workStyleSummary": "string",
  "cvUnderrepresentationSummary": "string",
  "careerPathways": [
    {
      "title": "string",
      "matchReason": "string",
      "capabilityOverlap": 0,
      "missingSkills": ["string"],
      "difficulty": "Low|Medium|High",
      "estimatedTransitionTime": "string",
      "firstStep": "string",
      "roadmap": {
        "startingPoint": "string",
        "targetCareer": "string",
        "existingStrengths": ["string"],
        "skillGaps": ["string"],
        "suggestedLearning": ["string"],
        "portfolioEvidence": ["string"],
        "entryRoutes": ["string"],
        "jobSearchTerms": ["string"],
        "firstThreeActions": ["string"],
        "threeMonthPlan": ["string"],
        "sixMonthPlan": ["string"],
        "twelveMonthPlan": ["string"]
      }
    }
  ]
}`
}
