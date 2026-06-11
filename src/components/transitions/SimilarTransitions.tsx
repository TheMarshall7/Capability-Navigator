import Link from 'next/link'
import type { PublicTransition } from '@/lib/transitions'
import { truncateExcerpt } from '@/lib/transitions'

interface SimilarTransitionsProps {
  transitions: PublicTransition[]
  userRole: string
  variant?: 'profile' | 'pathways'
}

export default function SimilarTransitions({
  transitions,
  userRole,
  variant = 'profile',
}: SimilarTransitionsProps) {
  if (!transitions.length || !userRole) return null

  const rows = transitions.slice(0, 3)
  const filterHref = `/transitions?from=${encodeURIComponent(userRole)}`

  return (
    <div className={variant === 'profile' ? 'mb-5' : 'mb-8'}>
      <div className="text-xs font-bold tracking-widest text-[#3D8A7A] mb-2">
        PEOPLE LIKE YOU
      </div>
      <h2
        className="text-xl font-semibold mb-4"
        style={{ fontFamily: 'var(--font-lora)' }}
      >
        People like you made these moves
      </h2>
      <div className="flex flex-col gap-3">
        {rows.map((t, i) => (
          <div
            key={`${t.original_role}-${t.new_role}-${i}`}
            className="p-4 rounded-xl border border-[#E8E3DA] bg-white"
          >
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs text-[#7A756F]">{t.original_role}</span>
              <span className="text-xs text-[#7A756F]">→</span>
              <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-lora)' }}>
                {t.new_role}
              </span>
              {t.time_taken_months != null && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F8F6F1] text-[#7A756F] sm:ml-auto">
                  {t.time_taken_months} mo
                </span>
              )}
            </div>
            {t.what_worked && (
              <p className="text-sm text-[#7A756F] leading-relaxed line-clamp-2">
                {truncateExcerpt(t.what_worked, 120)}
              </p>
            )}
          </div>
        ))}
      </div>
      <Link
        href={filterHref}
        className="inline-block mt-4 text-sm font-medium text-[#3D8A7A] no-underline hover:text-[#2D6B5E] transition-colors"
      >
        See more transitions like yours →
      </Link>
    </div>
  )
}
