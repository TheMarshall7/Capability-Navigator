import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import {
  getPublicTransitions,
  getDistinctTransitionRoles,
  getTransitionStats,
  getStatForRolePair,
} from '@/lib/transitions'
import { EXAMPLE_TRANSITIONS } from '@/lib/example-transitions'
import TransitionFilters from '@/components/transitions/TransitionFilters'
import TransitionStoryCard from '@/components/transitions/TransitionStoryCard'

interface PageProps {
  searchParams: { from?: string; to?: string }
}

export default async function TransitionsPage({ searchParams }: PageProps) {
  const fromFilter = searchParams.from ?? ''
  const toFilter = searchParams.to ?? ''
  const hasFilters = !!(fromFilter || toFilter)

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [transitions, roleOptions, stats] = await Promise.all([
    getPublicTransitions({
      fromRole: fromFilter || undefined,
      toRole: toFilter || undefined,
      limit: 50,
    }),
    getDistinctTransitionRoles(),
    fromFilter && toFilter
      ? getTransitionStats(fromFilter, toFilter)
      : Promise.resolve([]),
  ])

  const pairStat = fromFilter && toFilter ? getStatForRolePair(stats, fromFilter, toFilter) : null
  const showStatsBanner = pairStat != null && pairStat.transition_count >= 3
  const medianMonths = pairStat?.median_months != null ? Math.round(pairStat.median_months) : null

  const noPublicData = transitions.length === 0 && !hasFilters
  const showExamples = noPublicData
  const displayTransitions = showExamples ? EXAMPLE_TRANSITIONS : transitions
  const filteredEmpty = hasFilters && transitions.length === 0

  return (
    <div className="max-w-[900px] mx-auto px-6 py-10">
      <div className="mb-8">
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#EBF5F3] text-[#3D8A7A]">
          Transition records
        </span>
        <h1 className="text-3xl mt-3 mb-3" style={{ fontFamily: 'var(--font-lora)' }}>
          Real transitions, real timelines
        </h1>
        <p className="text-[#7A756F] max-w-xl leading-relaxed">
          These are actual moves logged by people on this platform — not predictions or AI estimates. Every story is anonymised and shared with permission.
        </p>
      </div>

      {roleOptions.fromRoles.length > 0 && (
        <div className="mb-8">
          <TransitionFilters
            fromRoles={roleOptions.fromRoles}
            toRoles={roleOptions.toRoles}
            currentFrom={fromFilter}
            currentTo={toFilter}
          />
        </div>
      )}

      {showStatsBanner && pairStat && medianMonths != null && (
        <div className="mb-6 px-5 py-4 rounded-xl bg-[#EBF5F3] border border-[#3D8A7A30] text-sm text-[#2D2926]">
          <span className="font-semibold text-[#3D8A7A]">
            {pairStat.transition_count} people made this move · median {medianMonths} months
          </span>
        </div>
      )}

      {showExamples && (
        <div className="mb-6 px-5 py-4 rounded-xl bg-[#FDF0EA] border border-[#E07A5F30]">
          <div className="text-xs font-bold tracking-widest text-[#E07A5F] mb-1">EXAMPLE TRANSITIONS</div>
          <p className="text-sm text-[#7A756F] leading-relaxed">
            Real user stories appear here as people log their moves.
          </p>
        </div>
      )}

      {filteredEmpty ? (
        <div className="text-center py-16 px-6">
          <p className="text-[#7A756F] mb-6 leading-relaxed max-w-md mx-auto">
            No one has logged this exact move yet. Be the first —
          </p>
          <Link
            href={user ? '/outcome' : '/auth'}
            className="inline-flex px-6 py-3 bg-[#E07A5F] text-white rounded-xl text-sm font-semibold no-underline hover:bg-[#C96848] transition-colors"
          >
            {user ? 'Log your outcome →' : 'Sign up and log your move →'}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {displayTransitions.map((t, i) => (
            <TransitionStoryCard key={`${t.original_role}-${t.new_role}-${i}`} transition={t} />
          ))}
        </div>
      )}

      <p className="text-xs text-[#7A756F] text-center leading-relaxed">
        Stories are anonymised and shared with permission.
      </p>
    </div>
  )
}
