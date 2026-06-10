export type CvReviewCategory =
  | 'impact'
  | 'clarity'
  | 'transferable_skill'
  | 'missing_evidence'
  | 'weak_language'
  | 'formatting'
  | 'ats_risk'
  | 'career_change'
  | 'regional'

export type CvReviewTab = 'strong' | 'improve'

export type CvRegionInferred = 'UK' | 'US' | 'Canada' | 'EU' | 'Australia' | 'International'

export interface CvReviewHighlight {
  quote: string
  type: CvReviewTab
  category: CvReviewCategory
  label: string
  suggestion?: string
  section?: string
  anchored?: boolean
}

export interface CvReviewSection {
  name: string
  assessment: string
}

export interface CvReviewOverview {
  summary: string
  strengthsSummary: string[]
  improvementsSummary: string[]
}

export interface CvReviewChecklistItem {
  item: string
  passed: boolean
  note?: string
}

export interface CvReviewAtsRisk {
  issue: string
  severity: 'critical' | 'warning'
  quote?: string
}

export interface CvReviewReframingOpportunity {
  before: string
  after: string
  why: string
}

export interface CvCareerChangeAssessment {
  format: 'hybrid' | 'chronological' | 'functional' | 'unclear'
  summary_quality: string
  transition_evidence: string
  jargon_translation_needed: boolean
  cover_letter_recommended: boolean
}

export interface CvReviewResult {
  overview: CvReviewOverview
  sections: CvReviewSection[]
  highlights: CvReviewHighlight[]
  // Optional — present in upgraded reviews; absent in legacy session data
  region_inferred?: CvRegionInferred
  regional_notes?: string
  career_change?: CvCareerChangeAssessment
  ats_risks?: CvReviewAtsRisk[]
  reframing_opportunities?: CvReviewReframingOpportunity[]
  optimization_checklist?: CvReviewChecklistItem[]
  // Only present when pathway context was provided
  keyword_gaps?: { skill: string; note: string }[]
  pathway_title?: string
}

export interface LocatedCvReviewHighlight extends CvReviewHighlight {
  start: number
  end: number
  listIndex: number
}
