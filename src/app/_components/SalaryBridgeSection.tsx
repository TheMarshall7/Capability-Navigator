'use client'
import { useState, useEffect, useRef } from 'react'

const PROFILES = [
  {
    id: 'teacher', label: 'Teacher', emoji: '◎',
    capability: 'Instructional Design & Learning Systems',
    sectors: [
      { name: 'State Education', role: 'Teacher / HOD', low: 25000, high: 35000 },
      { name: 'Corporate L&D', role: 'Learning Designer', low: 38000, high: 55000 },
      { name: 'EdTech', role: 'Instructional Designer', low: 46000, high: 65000 },
      { name: 'Enterprise Training', role: 'L&D Manager', low: 58000, high: 82000 },
    ],
  },
  {
    id: 'nurse', label: 'Nurse', emoji: '◆',
    capability: 'Complex Stakeholder Management & Patient Advocacy',
    sectors: [
      { name: 'NHS / Hospital', role: 'Band 5–6 Nurse', low: 28000, high: 38000 },
      { name: 'HealthTech', role: 'Customer Success Manager', low: 42000, high: 58000 },
      { name: 'Pharmaceutical', role: 'Medical Science Liaison', low: 52000, high: 72000 },
      { name: 'Management Consulting', role: 'Healthcare Consultant', low: 62000, high: 88000 },
    ],
  },
  {
    id: 'events', label: 'Events Manager', emoji: '◈',
    capability: 'High-Stakes Operations Under Pressure',
    sectors: [
      { name: 'Events & Hospitality', role: 'Events Manager', low: 24000, high: 36000 },
      { name: 'Non-profit', role: 'Ops Coordinator', low: 32000, high: 44000 },
      { name: 'Tech Startup', role: 'Operations Manager', low: 44000, high: 62000 },
      { name: 'Scale-up / Corp', role: 'Head of Operations', low: 60000, high: 85000 },
    ],
  },
  {
    id: 'journalist', label: 'Journalist', emoji: '◇',
    capability: 'Research, Narrative & Audience Intelligence',
    sectors: [
      { name: 'Traditional Media', role: 'Staff Journalist', low: 24000, high: 38000 },
      { name: 'Content & Brand', role: 'Content Strategist', low: 38000, high: 54000 },
      { name: 'Tech / Product', role: 'UX Researcher', low: 48000, high: 68000 },
      { name: 'Consultancy', role: 'Research Lead', low: 58000, high: 80000 },
    ],
  },
]

const fmt = (n: number) => n >= 1000 ? `£${(n / 1000).toFixed(0)}k` : `£${n}`

function useCounter(target: number, run: boolean) {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!run) return
    let start: number | null = null
    const dur = 900
    const tick = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / dur, 1)
      setV(Math.round((1 - Math.pow(1 - p, 3)) * target))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, run])
  return v
}

function SalaryBar({ sector, index, maxHigh, run, delay }: {
  sector: { name: string; role: string; low: number; high: number }
  index: number; maxHigh: number; run: boolean; delay: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  const lo = useCounter(sector.low, run && inView)
  const hi = useCounter(sector.high, run && inView)
  const lp = (sector.low / maxHigh) * 100
  const wp = ((sector.high - sector.low) / maxHigh) * 100
  const base = index === 0

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref} style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 600, color: base ? 'rgba(255,255,255,.35)' : '#FAFAF8' }}>{sector.name}</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,.25)', marginLeft: 8 }}>{sector.role}</span>
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: base ? 'rgba(255,255,255,.3)' : '#E07A5F' }}>
          {(run && inView) ? `${fmt(lo)} – ${fmt(hi)}` : `${fmt(sector.low)} – ${fmt(sector.high)}`}
        </span>
      </div>
      <div style={{ position: 'relative', height: 8, background: 'rgba(255,255,255,.05)', borderRadius: 99 }}>
        <div style={{
          position: 'absolute', top: 0, bottom: 0, left: `${lp}%`,
          width: (run && inView) ? `${wp}%` : '0%',
          background: base ? 'rgba(255,255,255,.15)' : 'linear-gradient(90deg,#E07A5F90,#E07A5F)',
          borderRadius: 99,
          transition: `width .8s cubic-bezier(.16,1,.3,1) ${delay}ms`,
          boxShadow: base ? 'none' : '0 0 10px #E07A5F40',
        }} />
      </div>
    </div>
  )
}

export default function SalaryBridgeSection() {
  const [active, setActive] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  const p = PROFILES[active]
  const maxH = Math.max(...p.sectors.map(s => s.high))
  const gap = p.sectors[p.sectors.length - 1].low - p.sectors[0].high
  const gapCount = useCounter(gap, inView)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold: 0.15 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref} style={{ background: '#111009', borderTop: '1px solid rgba(255,255,255,.05)', padding: 'clamp(48px, 10vw, 100px) 0' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 clamp(16px, 4vw, 32px)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 28, height: 1, background: '#E07A5F' }} />
          <span style={{ fontSize: 11, letterSpacing: 2, color: '#E07A5F', fontWeight: 600 }}>THE SALARY BRIDGE</span>
        </div>
        <h2 style={{ fontFamily: 'var(--font-lora)', fontSize: 'clamp(30px,4vw,50px)', color: '#FAFAF8', lineHeight: 1.15, marginBottom: 16 }}>
          The same capability.<br /><em style={{ color: '#E07A5F' }}>Three different valuations.</em>
        </h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,.4)', lineHeight: 1.8, maxWidth: 500, marginBottom: 48 }}>
          The market doesn't pay for what you know. It pays for which industry you're selling it to.
        </p>

        {/* Profile tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 40, flexWrap: 'nowrap', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', paddingBottom: 4 }}>
          {PROFILES.map((sp, i) => (
            <button key={sp.id} onClick={() => setActive(i)} style={{
              padding: '9px 18px', border: `1px solid ${active === i ? '#E07A5F' : 'rgba(255,255,255,.1)'}`,
              borderRadius: 99, cursor: 'pointer',
              background: active === i ? '#E07A5F15' : 'transparent',
              color: active === i ? '#E07A5F' : 'rgba(255,255,255,.4)',
              fontSize: 13, fontWeight: active === i ? 600 : 400,
              fontFamily: 'var(--font-dm-sans)', transition: 'all .2s', flexShrink: 0,
            }}>
              {sp.emoji} {sp.label}
            </button>
          ))}
        </div>

        {/* Capability label */}
        <div style={{ marginBottom: 32, padding: '18px 22px', background: 'rgba(255,255,255,.03)', borderRadius: 14, borderLeft: '3px solid rgba(224,122,95,.4)' }}>
          <div style={{ fontSize: 11, letterSpacing: 1.5, color: 'rgba(255,255,255,.25)', marginBottom: 6 }}>CAPABILITY BEING PRICED</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#FAFAF8' }}>{p.capability}</div>
        </div>

        {/* Scale labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,.15)' }}>£0</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,.15)' }}>{fmt(maxH)}</span>
        </div>

        {/* Bars */}
        <div key={active}>
          {p.sectors.map((s, i) => (
            <SalaryBar key={`${active}-${i}`} sector={s} index={i} maxHigh={maxH} run={inView} delay={i * 120} />
          ))}
        </div>

        {/* Gap callout */}
        <div style={{ marginTop: 28, padding: '20px 24px', background: 'rgba(224,122,95,.08)', border: '1px solid rgba(224,122,95,.25)', borderRadius: 16, display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 140 }}>
            <div style={{ fontSize: 11, letterSpacing: 1.5, color: '#E07A5F', fontWeight: 600, marginBottom: 6 }}>THE GAP</div>
            <div style={{ fontFamily: 'var(--font-lora)', fontSize: 34, color: '#FAFAF8', fontWeight: 600 }}>
              +{inView ? fmt(gapCount) : fmt(gap)}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,.35)', marginTop: 4 }}>
              {p.sectors[0].name} vs {p.sectors[p.sectors.length - 1].name}
            </div>
          </div>
          <div style={{ flex: 2, minWidth: 200 }}>
            <p style={{ fontFamily: 'var(--font-lora)', fontSize: 14, color: 'rgba(255,255,255,.5)', lineHeight: 1.8, fontStyle: 'italic' }}>
              Same capability. Same person. The difference is which industry chooses to pay for it.
            </p>
          </div>
        </div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,.18)', marginTop: 16, lineHeight: 1.6 }}>
          Salary ranges from UK market data (2024). The point is the direction, not the exact number.
        </p>
      </div>
    </div>
  )
}
