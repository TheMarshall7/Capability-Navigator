// ─── Core domain types ────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  name: string
  created_at: string
}

export interface Profile {
  id: string
  user_id: string
  current_role: string
  experience_range: string
  situation: string
  city: string
  country: string
  work_arrangements: string[]
  created_at: string
  updated_at: string
}

export interface CVUpload {
  id: string
  user_id: string
  file_url: string
  file_name: string
  extracted_text: string
  created_at: string
}

export interface QuestionnaireAnswer {
  id: string
  user_id: string
  question_key: string
  answer_value: string
  created_at: string
}

export interface CoreCapability {
  title: string
  explanation: string
  evidence: string
}

export interface HiddenStrength {
  title: string
  explanation: string
}

export interface Roadmap {
  startingPoint: string
  targetCareer: string
  existingStrengths: string[]
  skillGaps: string[]
  suggestedLearning: string[]
  portfolioEvidence: string[]
  entryRoutes: string[]
  jobSearchTerms: string[]
  firstThreeActions: string[]
  threeMonthPlan: string[]
  sixMonthPlan: string[]
  twelveMonthPlan: string[]
}

export interface CareerPathway {
  id?: string
  user_id?: string
  title: string
  matchReason: string
  capabilityOverlap: number
  missingSkills: string[]
  difficulty: 'Low' | 'Medium' | 'High'
  estimatedTransitionTime: string
  firstStep: string
  roadmap: Roadmap
  created_at?: string
}

export interface CapabilityReport {
  id?: string
  user_id?: string
  capabilitySummary: string
  coreCapabilities: CoreCapability[]
  hiddenStrengths: HiddenStrength[]
  workStyleSummary: string
  cvUnderrepresentationSummary: string
  careerPathways: CareerPathway[]
  created_at?: string
}

export interface Feedback {
  id: string
  user_id: string
  accuracy_score: number
  revealed_new_possibilities: 'Yes' | 'No' | 'Somewhat'
  would_share: 'Yes' | 'No' | 'Maybe'
  most_accurate: string
  wrong_or_missing: string
  created_at: string
}

export interface ShareLink {
  id: string
  user_id: string
  report_id: string
  token: string
  visibility: 'private' | 'shareable' | 'mentor'
  created_at: string
}

export interface MentorFeedback {
  id: string
  share_link_id: string
  agreement_level: 'Strongly agree' | 'Mostly agree' | 'Unsure' | 'Disagree'
  perceived_strengths: string
  suggested_career_direction: string
  created_at: string
}

// ─── AI service types ─────────────────────────────────────────────────────────

export interface GenerateReportInput {
  cvText: string
  questionnaireAnswers: Record<string, string | string[] | number>
}

// ─── Questionnaire types ──────────────────────────────────────────────────────

export type QuestionType = 'text' | 'textarea' | 'radio' | 'multiselect' | 'scale'

export interface Question {
  key: string
  label: string
  type: QuestionType
  placeholder?: string
  options?: string[]
  max?: number
  min?: number
}

export interface QuestionSection {
  title: string
  questions: Question[]
}

// ─── Capability Validation Score (internal metric) ────────────────────────────

export interface CapabilityValidationScore {
  totalResponses: number
  accuracyHighPercent: number     // % rating 4 or 5
  revealedNewPercent: number      // % saying "Yes"
  wouldSharePercent: number       // % saying "Yes" or "Maybe"
}
