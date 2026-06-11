'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import type { ReadinessComponents } from '@/lib/readiness'

interface TransitionReadinessProps {
  score: number
  components: ReadinessComponents
  delta: number | null
  bottleneckLabel: string
  bottleneckHref: string
}

function ReadinessRing({ value, size = 88 }: { value: number; size?: number }) {
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
  const color = count >= 70 ? '#3D8A7A' : count >= 40 ? '#E8A838' : '#E07A5F'

  return (
    <div ref={ref} className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E8E3DA" strokeWidth={5} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-[#2D2926] leading-none">{count}</span>
        <span className="text-[9px] text-[#7A756F] mt-1 tracking-wide uppercase">Ready</span>
      </div>
    </div>
  )
}

function MiniBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-[#7A756F]">{label}</span>
        <span className="font-semibold text-[#2D2926]">{value}%</span>
      </div>
      <div className="bg-[#E8E3DA] rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, background: '#3D8A7A' }}
        />
      </div>
    </div>
  )
}

export default function TransitionReadiness({
  score,
  components,
  delta,
  bottleneckLabel,
  bottleneckHref,
}: TransitionReadinessProps) {
  return (
    <div className="border border-[#E8E3DA] rounded-2xl p-5 bg-white h-full">
      <div className="text-xs font-bold tracking-widest text-[#3D8A7A] mb-3">
        TRANSITION READINESS
      </div>

      <div className="flex items-center gap-5 mb-5">
        <ReadinessRing value={score} />
        <div>
          <div className="font-semibold text-[15px] mb-1">Your readiness score</div>
          <p className="text-xs text-[#7A756F] leading-relaxed">
            How positioned you are for your top pathway — based on capability match, roadmap progress, and profile depth.
          </p>
          {delta != null && delta !== 0 && (
            <div className="text-xs font-semibold text-[#3D8A7A] mt-2">
              {delta > 0 ? `+${delta}` : delta} since you started
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 mb-4">
        <MiniBar label="Capability match" value={components.capabilityMatch} />
        <MiniBar label="Roadmap progress" value={components.roadmapProgress} />
        <MiniBar label="Profile depth" value={components.profileDepth} />
      </div>

      <Link
        href={bottleneckHref}
        className="text-sm font-medium text-[#3D8A7A] no-underline hover:text-[#2D6B5E] transition-colors"
      >
        {bottleneckLabel}
      </Link>
    </div>
  )
}
