'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { LANDING_TRANSFORMATIONS } from '@/lib/example-transitions'

const TRANSFORMATIONS = LANDING_TRANSFORMATIONS

function OverlapRing({ value, color, size = 72 }: { value: number; color: string; size?: number }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const ran = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !ran.current) {
        ran.current = true
        const start = performance.now()
        const dur = 900
        const tick = (now: number) => {
          const p = Math.min((now - start) / dur, 1)
          setCount(Math.round((1 - Math.pow(1 - p, 3)) * value))
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.2 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [value])

  const r = size / 2 - 6
  const circ = 2 * Math.PI * r
  const dash = (count / 100) * circ

  return (
    <div ref={ref} style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth={5} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray .05s linear' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#FFF', lineHeight: 1 }}>{count}%</span>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,.4)', marginTop: 2, letterSpacing: .5 }}>OVERLAP</span>
      </div>
    </div>
  )
}

export default function BecomeSection() {
  const [active, setActive] = useState(0)
  const router = useRouter()
  const t = TRANSFORMATIONS[active]

  useEffect(() => {
    const timer = setInterval(() => setActive(i => (i + 1) % TRANSFORMATIONS.length), 4200)
    return () => clearInterval(timer)
  }, [])

  return (
    <div style={{ background: '#0E0C0A', padding: '100px 0 0' }}>
      {/* Header */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 32px 56px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 28, height: 1, background: '#E07A5F' }} />
          <span style={{ fontSize: 11, letterSpacing: 2, color: '#E07A5F', fontWeight: 600 }}>REAL TRANSITIONS</span>
        </div>
        <h2 style={{ fontFamily: 'var(--font-lora), serif', fontSize: 'clamp(32px,4.5vw,54px)', color: '#FAFAF8', lineHeight: 1.15, marginBottom: 16 }}>
          People don't want capabilities.<br />
          <em style={{ color: '#E07A5F' }}>They want to become something.</em>
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,.4)', lineHeight: 1.8, maxWidth: 500 }}>
          These are roles people actually moved into. The capability profile is the bridge — the destination is a real job and a different life.
        </p>
      </div>

      {/* Scrollable cards */}
      <div style={{ display: 'flex', gap: 16, padding: '0 clamp(16px, 4vw, 32px) 48px', overflowX: 'auto', scrollbarWidth: 'none', maxWidth: '100%', WebkitOverflowScrolling: 'touch' }}>
        {TRANSFORMATIONS.map((tr, i) => (
          <div key={i} onClick={() => setActive(i)} style={{
            background: active === i ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.03)',
            border: `1px solid ${active === i ? tr.accent + '60' : 'rgba(255,255,255,.08)'}`,
            borderRadius: 20, padding: 24, cursor: 'pointer', transition: 'all .3s',
            transform: active === i ? 'translateY(-2px)' : 'none',
            boxShadow: active === i ? `0 20px 60px ${tr.accent}20` : 'none',
            minWidth: 280, flex: '0 0 280px',
          }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.3)', marginBottom: 4 }}>{tr.from} →</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-lora)', fontSize: 18, fontWeight: 600, color: '#FFF', lineHeight: 1.2 }}>{tr.to}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: tr.accent, fontWeight: 600, background: tr.accent + '20', padding: '3px 8px', borderRadius: 20 }}>{tr.salary}</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,.3)' }}>{tr.time}</span>
                  </div>
                </div>
                <OverlapRing value={tr.overlap} color={tr.accent} />
              </div>
            </div>
            <blockquote style={{ fontFamily: 'var(--font-lora)', fontSize: 13, color: 'rgba(255,255,255,.55)', lineHeight: 1.7, fontStyle: 'italic', borderLeft: `2px solid ${tr.accent}40`, paddingLeft: 12, margin: '0 0 12px' }}>
              "{tr.quote}"
            </blockquote>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.25)', marginBottom: 12 }}>— {tr.name}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {tr.tags.map(g => (
                <span key={g} style={{ fontSize: 11, padding: '4px 9px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 20, color: 'rgba(255,255,255,.4)' }}>{g}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, paddingBottom: 80 }}>
        {TRANSFORMATIONS.map((_, i) => (
          <div key={i} onClick={() => setActive(i)} style={{ width: i === active ? 24 : 6, height: 6, borderRadius: 3, background: i === active ? t.accent : 'rgba(255,255,255,.15)', cursor: 'pointer', transition: 'all .3s' }} />
        ))}
      </div>

      {/* Active callout */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 32px 100px' }}>
        <div style={{ background: 'rgba(255,255,255,.03)', border: `1px solid ${t.accent}30`, borderRadius: 24, padding: '40px 48px', transition: 'border-color .4s' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40, alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontSize: 12, letterSpacing: 2, color: t.accent, fontWeight: 600, marginBottom: 12 }}>WHAT THIS LOOKS LIKE</div>
              <div style={{ fontFamily: 'var(--font-lora)', fontSize: 13, color: 'rgba(255,255,255,.35)', marginBottom: 4 }}>{t.from} → {t.time} →</div>
              <div style={{ fontFamily: 'var(--font-lora)', fontSize: 30, color: '#FAFAF8', fontWeight: 600, lineHeight: 1.2, marginBottom: 16 }}>{t.to}</div>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,.45)', lineHeight: 1.7 }}>
                The skills were already there. The profile made them visible — to {t.name.split(' ')[0]}, and to anyone reading it.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 180 }}>
              {[['Transition time', t.time], ['Salary change', t.salary], ['Capability overlap', `${t.overlap}%`]].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,.35)' }}>{l}</span>
                  <span style={{ fontSize: 15, fontWeight: 600, color: t.accent }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mentor section */}
      <div style={{ background: 'rgba(255,255,255,.02)', borderTop: '1px solid rgba(255,255,255,.06)', padding: '80px 32px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 48, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: 2, color: '#E07A5F', fontWeight: 600, marginBottom: 20 }}>EXTERNAL VALIDATION</div>
            <h3 style={{ fontFamily: 'var(--font-lora)', fontSize: 'clamp(26px,3.5vw,40px)', color: '#FAFAF8', lineHeight: 1.25, marginBottom: 20 }}>
              The people who already know<br /><em style={{ color: '#E07A5F' }}>what you could be.</em>
            </h3>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,.4)', lineHeight: 1.8, marginBottom: 24 }}>
              Share your profile with someone who knows your work. They see strengths your CV has never captured — and now they have a structured way to say so.
            </p>
            <blockquote style={{ fontFamily: 'var(--font-lora)', fontSize: 14, color: 'rgba(255,255,255,.3)', fontStyle: 'italic', lineHeight: 1.7, borderLeft: '2px solid rgba(255,255,255,.1)', paddingLeft: 16 }}>
              "I knew Sarah had more in her than teaching. I just didn't have the language to explain it until I saw this profile."
            </blockquote>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,.2)', marginTop: 10 }}>— Colleague, secondary school</div>
          </div>

          {/* Mock mentor card */}
          <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, overflow: 'hidden' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 34, height: 34, background: '#E07A5F20', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>◎</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#FAFAF8' }}>Sarah Mitchell's profile</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)' }}>You've been invited to validate this</div>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: 11, padding: '4px 10px', background: '#3D8A7A20', color: '#3D8A7A', borderRadius: 20, fontWeight: 600 }}>Mentor review</div>
            </div>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
              <div style={{ fontSize: 11, letterSpacing: 1, color: 'rgba(255,255,255,.25)', marginBottom: 10 }}>THE PROFILE SAYS</div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', lineHeight: 1.7 }}>"An exceptional communicator and systems thinker who has spent 8 years building structured learning experiences at scale..."</p>
            </div>
            <div style={{ padding: '18px 22px' }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginBottom: 12 }}>Do these strengths feel accurate to you?</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {['Strongly agree', 'Mostly agree', 'Unsure', 'Disagree'].map((o, i) => (
                  <div key={o} style={{ padding: '7px 13px', background: i === 0 ? '#E07A5F15' : 'rgba(255,255,255,.03)', border: `1px solid ${i === 0 ? '#E07A5F50' : 'rgba(255,255,255,.08)'}`, borderRadius: 20, fontSize: 12, color: i === 0 ? '#E07A5F' : 'rgba(255,255,255,.3)', fontWeight: i === 0 ? 600 : 400 }}>{o}</div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.2)' }}>No account needed · Takes 2 minutes</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: 'linear-gradient(to bottom,#0E0C0A,#1A1410)', borderTop: '1px solid rgba(255,255,255,.05)', padding: '100px 32px', textAlign: 'center' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ fontSize: 12, letterSpacing: 2, color: '#E07A5F', fontWeight: 600, marginBottom: 20 }}>THE QUESTION</div>
          <h2 style={{ fontFamily: 'var(--font-lora)', fontSize: 'clamp(30px,5vw,58px)', color: '#FAFAF8', lineHeight: 1.15, marginBottom: 20 }}>
            Who do you want<br />to become?
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,.4)', lineHeight: 1.8, marginBottom: 48, maxWidth: 460, margin: '0 auto 48px' }}>
            Not what skills do you have. Not what jobs are available. What do you actually want your working life to look like in three years?
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => router.push('/auth')}
              style={{ padding: '16px 36px', background: '#E07A5F', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 600, color: '#FFF', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)' }}>
              Find out →
            </button>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.2)', marginTop: 24 }}>Free · No CV judgement · Delete your data anytime</p>
        </div>
      </div>
    </div>
  )
}
