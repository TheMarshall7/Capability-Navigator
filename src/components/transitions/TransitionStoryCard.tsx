import type { PublicTransition } from '@/lib/transitions'
import { salaryDirectionBadge, truncateExcerpt } from '@/lib/transitions'

interface TransitionStoryCardProps {
  transition: PublicTransition
  variant?: 'light' | 'dark'
}

export default function TransitionStoryCard({ transition, variant = 'light' }: TransitionStoryCardProps) {
  const dark = variant === 'dark'
  const excerpt = truncateExcerpt(transition.what_worked)

  return (
    <div
      className="rounded-2xl p-5 flex flex-col h-full"
      style={{
        background: dark ? 'rgba(255,255,255,.04)' : '#FFF',
        border: dark ? '1px solid rgba(255,255,255,.08)' : '1px solid #E8E3DA',
      }}
    >
      <div className="mb-4">
        <div
          className="text-xs mb-1"
          style={{ color: dark ? 'rgba(255,255,255,.35)' : '#7A756F' }}
        >
          {transition.original_role} →
        </div>
        <div
          className="text-xl font-semibold leading-tight break-words"
          style={{ fontFamily: 'var(--font-lora)', color: dark ? '#FAFAF8' : '#2D2926' }}
        >
          {transition.new_role}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {transition.time_taken_months != null && (
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: dark ? 'rgba(255,255,255,.08)' : '#F8F6F1', color: dark ? 'rgba(255,255,255,.6)' : '#7A756F' }}
          >
            {transition.time_taken_months} mo
          </span>
        )}
        {transition.salary_change && (
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: dark ? '#3D8A7A20' : '#EBF5F3', color: '#3D8A7A' }}
          >
            {salaryDirectionBadge(transition.salary_change)} salary
          </span>
        )}
      </div>

      {transition.headline && (
        <p
          className="text-sm font-medium mb-2 leading-relaxed"
          style={{ color: dark ? 'rgba(255,255,255,.7)' : '#2D2926' }}
        >
          {transition.headline}
        </p>
      )}

      {excerpt && (
        <blockquote
          className="text-sm leading-relaxed flex-1"
          style={{
            fontFamily: 'var(--font-lora)',
            fontStyle: 'italic',
            color: dark ? 'rgba(255,255,255,.45)' : '#7A756F',
            borderLeft: `2px solid ${dark ? 'rgba(255,255,255,.15)' : '#E8E3DA'}`,
            paddingLeft: 12,
            margin: 0,
          }}
        >
          &ldquo;{excerpt}&rdquo;
        </blockquote>
      )}
    </div>
  )
}
