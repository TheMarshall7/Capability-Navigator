import Link from 'next/link'
import { getPublicTransitions } from '@/lib/transitions'
import { EXAMPLE_TRANSITIONS } from '@/lib/example-transitions'
import TransitionStoryCard from '@/components/transitions/TransitionStoryCard'

export default async function TransitionsTeaserSection() {
  const recent = await getPublicTransitions({ limit: 3 })
  const isExamples = recent.length === 0
  const display = isExamples ? EXAMPLE_TRANSITIONS.slice(0, 3) : recent

  return (
    <div style={{ background: '#111009', borderTop: '1px solid rgba(255,255,255,.06)', padding: '80px 32px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 28, height: 1, background: '#3D8A7A' }} />
          <span style={{ fontSize: 11, letterSpacing: 2, color: '#3D8A7A', fontWeight: 600 }}>
            {isExamples ? 'EXAMPLE RECORDS' : 'FROM OUR USERS'}
          </span>
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-lora), serif',
            fontSize: 'clamp(28px,4vw,42px)',
            color: '#FAFAF8',
            lineHeight: 1.2,
            marginBottom: 12,
          }}
        >
          These aren&apos;t predictions. They&apos;re records.
        </h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,.4)', lineHeight: 1.8, maxWidth: 520, marginBottom: 40 }}>
          Real moves logged by people who made the transition — with timelines and what actually worked.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {display.map((t, i) => (
            <TransitionStoryCard key={`${t.original_role}-${t.new_role}-${i}`} transition={t} variant="dark" />
          ))}
        </div>

        <Link
          href="/transitions"
          style={{
            display: 'inline-flex',
            padding: '12px 24px',
            background: 'transparent',
            border: '1.5px solid rgba(255,255,255,.15)',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 600,
            color: '#FAFAF8',
            textDecoration: 'none',
          }}
        >
          Browse all transition stories →
        </Link>
      </div>
    </div>
  )
}
