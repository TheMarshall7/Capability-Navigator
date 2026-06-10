export type CvRegion = 'UK' | 'US' | 'Canada' | 'EU' | 'Australia' | 'International'

export interface CvContact {
  name: string
  location: string
  email?: string
  phone?: string
  linkedin?: string
}

export interface CvExperience {
  company: string
  title: string
  location?: string
  dates: string
  tier: 'relevant' | 'additional'
  bullets: string[]
}

export interface CvEducation {
  institution: string
  qualification: string
  year: string
  notes?: string
}

export interface CvRelevantProject {
  title: string
  description: string
}

export interface CvGapAddressed {
  period: string
  explanation: string
}

export interface CvReframingExample {
  before: string
  after: string
  why: string
}

export interface CvKeywordMapping {
  jd_keyword: string
  evidence_in_cv: string
}

export interface CvChecklistItem {
  item: string
  passed: boolean
  note?: string
}

export interface CvCoverLetter {
  opening: string
  body: string
  closing: string
}

export interface CvDraftContent {
  contact: CvContact
  region_applied: CvRegion
  format: 'hybrid'
  headline: string
  summary: string
  core_skills: string[]
  relevant_projects: CvRelevantProject[]
  experience: CvExperience[]
  education: CvEducation[]
  skills: { core: string[]; developing: string[] }
  gaps_addressed: CvGapAddressed[]
  tailoring_notes: string
  reframing_examples: CvReframingExample[]
  keyword_mapping: CvKeywordMapping[]
  optimization_checklist: CvChecklistItem[]
  cover_letter: CvCoverLetter
  _inputs?: {
    name: string
    location: string
    targetRole: string
    targetRegion: CvRegion
    historyText: string
    jobDescription?: string
  }
}
