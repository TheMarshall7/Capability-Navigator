export type CvReviewCategory =
  | 'impact'
  | 'clarity'
  | 'transferable_skill'
  | 'missing_evidence'
  | 'weak_language'
  | 'formatting'

export type CvReviewTab = 'strong' | 'improve'

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

export interface CvReviewResult {
  overview: CvReviewOverview
  sections: CvReviewSection[]
  highlights: CvReviewHighlight[]
}

export interface LocatedCvReviewHighlight extends CvReviewHighlight {
  start: number
  end: number
  listIndex: number
}
