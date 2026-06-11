import Link from 'next/link'
import { getPublicTransitions } from '@/lib/transitions'
import { EXAMPLE_TRANSITIONS } from '@/lib/example-transitions'
import TransitionStoryCard from '@/components/transitions/TransitionStoryCard'

export default async function TransitionsTeaserSection() {
  const recent = await getPublicTransitions({ limit: 3 })
  const isExamples = recent.length === 0
  const display = isExamples ? EXAMPLE_TRANSITIONS.slice(0, 3) : recent

  return (
    <div className="py-12 sm:py-20 px-4 sm:px-8 border-t border-white/10" style={{ background: '#111009' }}>
      <div className="max-w-[900px] mx-auto">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-7 h-px bg-[#3D8A7A]" />
          <span className="text-[11px] tracking-[2px] text-[#3D8A7A] font-semibold">
            {isExamples ? 'EXAMPLE RECORDS' : 'FROM OUR USERS'}
          </span>
        </div>
        <h2
          className="page-title text-[#FAFAF8] leading-tight mb-3"
          style={{ fontSize: 'clamp(28px,4vw,42px)' }}
        >
          These aren&apos;t predictions. They&apos;re records.
        </h2>
        <p className="text-[15px] text-white/40 leading-relaxed max-w-[520px] mb-10">
          Real moves logged by people who made the transition — with timelines and what actually worked.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {display.map((t, i) => (
            <TransitionStoryCard key={`${t.original_role}-${t.new_role}-${i}`} transition={t} variant="dark" />
          ))}
        </div>

        <Link
          href="/transitions"
          className="inline-flex px-6 py-3 border border-white/15 rounded-xl text-sm font-semibold text-[#FAFAF8] no-underline hover:border-white/30 transition-colors"
        >
          Browse all transition stories →
        </Link>
      </div>
    </div>
  )
}
