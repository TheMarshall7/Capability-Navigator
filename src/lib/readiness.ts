/**
 * Transition Readiness Score — v1 formula
 *
 * Weighted composite (0–100) from signals the platform actually measures:
 *   50% capability overlap of top pathway
 *   30% milestone completion on that pathway
 *   20% profile depth (CV, questionnaire, feedback)
 *
 * V3 roadmap: replace these fixed weights with weights learned from real
 * outcome data once `outcomes` has volume — i.e. which signals actually
 * predict successful transitions. Until then, this formula is intentionally
 * honest about what we know vs. what we're estimating.
 */

export interface ReadinessComponents {
  capabilityMatch: number
  roadmapProgress: number
  profileDepth: number
}

export interface ReadinessResult {
  score: number
  components: ReadinessComponents
}

export interface ReadinessSnapshot {
  score: number
  created_at: string
}

export interface ReadinessInputs {
  capabilityOverlap: number
  milestonesCompleted: number
  milestonesTotal: number
  hasCv: boolean
  questionnaireDone: boolean
  feedbackGiven: boolean
}

export function computeReadiness(inputs: ReadinessInputs): ReadinessResult {
  const capabilityMatch = Math.min(100, Math.max(0, inputs.capabilityOverlap))

  const roadmapProgress = inputs.milestonesTotal > 0
    ? Math.round((inputs.milestonesCompleted / inputs.milestonesTotal) * 100)
    : 0

  const profileItems = [
    inputs.hasCv,
    inputs.questionnaireDone,
    inputs.feedbackGiven,
  ]
  const profileDepth = Math.round(
    (profileItems.filter(Boolean).length / profileItems.length) * 100,
  )

  const score = Math.round(
    capabilityMatch * 0.50 +
    roadmapProgress * 0.30 +
    profileDepth * 0.20,
  )

  return {
    score,
    components: { capabilityMatch, roadmapProgress, profileDepth },
  }
}

export type ReadinessBottleneck = 'capabilityMatch' | 'roadmapProgress' | 'profileDepth'

export interface ReadinessBottleneckLink {
  component: ReadinessBottleneck
  label: string
  href: string
}

export function getReadinessBottleneck(
  components: ReadinessComponents,
  pathwayId?: string,
  profileMissing?: { cv: boolean; questionnaire: boolean; feedback: boolean },
): ReadinessBottleneckLink {
  const entries: { key: ReadinessBottleneck; value: number }[] = [
    { key: 'capabilityMatch', value: components.capabilityMatch },
    { key: 'roadmapProgress', value: components.roadmapProgress },
    { key: 'profileDepth', value: components.profileDepth },
  ]
  const lowest = entries.reduce((a, b) => (a.value <= b.value ? a : b))

  if (lowest.key === 'roadmapProgress') {
    return {
      component: 'roadmapProgress',
      label: 'Complete milestones to raise your score →',
      href: pathwayId ? `/roadmap/${pathwayId}` : '/pathways',
    }
  }

  if (lowest.key === 'profileDepth') {
    if (profileMissing?.cv) {
      return { component: 'profileDepth', label: 'Upload your CV to raise your score →', href: '/cv-upload' }
    }
    if (profileMissing?.questionnaire) {
      return { component: 'profileDepth', label: 'Complete the questionnaire to raise your score →', href: '/questionnaire' }
    }
    return { component: 'profileDepth', label: 'Give feedback to raise your score →', href: '/feedback' }
  }

  return {
    component: 'capabilityMatch',
    label: 'Explore pathways with higher overlap →',
    href: '/pathways',
  }
}

/** Delta from earliest snapshot with a different score to current. */
export function getReadinessDelta(
  snapshots: ReadinessSnapshot[],
  currentScore: number,
): number | null {
  if (snapshots.length < 2) return null

  const sorted = [...snapshots].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  )

  const earliestDifferent = sorted.find(s => s.score !== currentScore)
  if (!earliestDifferent) return null

  const delta = currentScore - earliestDifferent.score
  return delta !== 0 ? delta : null
}
