import { createClient } from '@/lib/supabase-server'

export interface PublicTransition {
  original_role: string
  new_role: string
  time_taken_months: number | null
  salary_change: string | null
  what_worked: string | null
  headline: string | null
  created_at: string
  isExample?: boolean
}

export interface TransitionStat {
  original_role: string
  new_role: string
  transition_count: number
  avg_months: number | null
  median_months: number | null
}

export interface TransitionRoleOptions {
  fromRoles: string[]
  toRoles: string[]
}

/** Extract a meaningful keyword for fuzzy ILIKE matching on free-text roles. */
export function roleKeyword(role: string): string {
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'of', 'in', 'at', 'for', 'to', 'with',
    'senior', 'junior', 'lead', 'head', 'chief', 'assistant', 'associate',
    'primary', 'secondary', 'school', 'level',
  ])
  const words = role
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w))

  if (words.length === 0) {
    const fallback = role.toLowerCase().trim()
    return fallback.length > 0 ? fallback : role
  }

  // Prefer the last substantive word (often the role noun: teacher, nurse, journalist)
  return words[words.length - 1]
}

/** Parse questionnaire role answer (JSON-stringified in DB). */
export function parseQuestionnaireRole(answerValue: unknown): string {
  if (answerValue == null) return ''
  if (typeof answerValue === 'string') {
    try {
      const parsed = JSON.parse(answerValue)
      return typeof parsed === 'string' ? parsed : String(parsed ?? '')
    } catch {
      return answerValue
    }
  }
  return String(answerValue)
}

export function truncateExcerpt(text: string | null | undefined, max = 200): string {
  if (!text) return ''
  if (text.length <= max) return text
  return text.slice(0, max).trimEnd() + '…'
}

export function salaryDirectionBadge(salaryChange: string | null | undefined): string {
  switch (salaryChange) {
    case 'increased': return '↑'
    case 'decreased': return '↓'
    case 'same': return '→'
    default: return '→'
  }
}

export async function getPublicTransitions(filters?: {
  fromRole?: string
  toRole?: string
  limit?: number
}): Promise<PublicTransition[]> {
  try {
    const supabase = createClient()
    let query = supabase
      .from('public_transitions')
      .select('original_role, new_role, time_taken_months, salary_change, what_worked, headline, created_at')
      .order('created_at', { ascending: false })
      .limit(filters?.limit ?? 50)

    if (filters?.fromRole) {
      query = query.ilike('original_role', `%${roleKeyword(filters.fromRole)}%`)
    }
    if (filters?.toRole) {
      query = query.ilike('new_role', `%${roleKeyword(filters.toRole)}%`)
    }

    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as PublicTransition[]
  } catch (err) {
    console.error('[getPublicTransitions]', err)
    return []
  }
}

export async function getTransitionStats(
  fromRole?: string,
  toRole?: string,
): Promise<TransitionStat[]> {
  try {
    const supabase = createClient()
    let query = supabase
      .from('transition_stats')
      .select('original_role, new_role, transition_count, avg_months, median_months')

    if (fromRole) {
      query = query.ilike('original_role', `%${roleKeyword(fromRole)}%`)
    }
    if (toRole) {
      query = query.ilike('new_role', `%${roleKeyword(toRole)}%`)
    }

    const { data, error } = await query
    if (error) throw error

    return (data ?? []).map(row => ({
      original_role: row.original_role,
      new_role: row.new_role,
      transition_count: Number(row.transition_count),
      avg_months: row.avg_months != null ? Number(row.avg_months) : null,
      median_months: row.median_months != null ? Number(row.median_months) : null,
    }))
  } catch (err) {
    console.error('[getTransitionStats]', err)
    return []
  }
}

export async function getSimilarTransitions(
  userCurrentRole: string,
  limit = 3,
): Promise<PublicTransition[]> {
  if (!userCurrentRole?.trim()) return []
  return getPublicTransitions({ fromRole: userCurrentRole, limit })
}

export async function getDistinctTransitionRoles(): Promise<TransitionRoleOptions> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('public_transitions')
      .select('original_role, new_role')

    if (error) throw error

    const fromSet = new Set<string>()
    const toSet = new Set<string>()
    for (const row of data ?? []) {
      if (row.original_role) fromSet.add(row.original_role)
      if (row.new_role) toSet.add(row.new_role)
    }

    const sort = (a: string, b: string) => a.localeCompare(b)
    return {
      fromRoles: Array.from(fromSet).sort(sort),
      toRoles: Array.from(toSet).sort(sort),
    }
  } catch (err) {
    console.error('[getDistinctTransitionRoles]', err)
    return { fromRoles: [], toRoles: [] }
  }
}

/** Find stat row matching user's from-role and a pathway title (exact title match). */
export function matchPathwayStat(
  stats: TransitionStat[],
  userRole: string,
  pathwayTitle: string,
): TransitionStat | null {
  if (!userRole || !pathwayTitle) return null
  const keyword = roleKeyword(userRole)
  const titleNorm = pathwayTitle.trim().toLowerCase()

  return stats.find(s =>
    s.new_role.trim().toLowerCase() === titleNorm &&
    s.original_role.toLowerCase().includes(keyword) &&
    s.transition_count >= 2,
  ) ?? null
}

/** Stats for a specific from→to filter pair (exact role strings from dropdown). */
export function getStatForRolePair(
  stats: TransitionStat[],
  fromRole: string,
  toRole: string,
): TransitionStat | null {
  return stats.find(
    s => s.original_role === fromRole && s.new_role === toRole,
  ) ?? null
}
