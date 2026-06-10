'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'

const PHASES = [
  {
    title: 'Writing your CV',
    detail: 'Reframing your experience for your target pathway',
  },
  {
    title: 'Cover letter & reframing',
    detail: 'Drafting your pivot letter and before/after examples',
  },
  {
    title: 'ATS checklist',
    detail: 'Running optimisation checks and keyword mapping',
  },
] as const

export const CV_BUILDER_TOTAL_PHASES = PHASES.length

export function CvBuilderGenerationProgress({ phase }: { phase: number }) {
  const [barValue, setBarValue] = useState(0)
  const clampedPhase = Math.min(Math.max(phase, 1), CV_BUILDER_TOTAL_PHASES)
  const info = PHASES[clampedPhase - 1]

  useEffect(() => {
    const phaseStart = ((clampedPhase - 1) / CV_BUILDER_TOTAL_PHASES) * 100
    const phaseEnd = (clampedPhase / CV_BUILDER_TOTAL_PHASES) * 100 - 3
    setBarValue(phaseStart)

    const interval = setInterval(() => {
      setBarValue(prev => {
        if (prev >= phaseEnd) return prev
        return Math.min(phaseEnd, prev + 0.8)
      })
    }, 500)

    return () => clearInterval(interval)
  }, [clampedPhase])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2D2926]/40 px-6">
      <Card className="w-full max-w-md !py-8 !px-8 text-center shadow-xl">
        <div
          className="w-10 h-10 border-2 border-[#E8E3DA] rounded-full animate-spin mx-auto mb-5"
          style={{ borderTopColor: '#E07A5F' }}
        />
        <p className="text-xs font-semibold uppercase tracking-widest text-[#E07A5F] mb-2">
          Phase {clampedPhase} of {CV_BUILDER_TOTAL_PHASES}
        </p>
        <h2 className="text-xl mb-2" style={{ fontFamily: 'var(--font-lora)' }}>
          {info.title}
        </h2>
        <p className="text-sm text-[#7A756F] leading-relaxed mb-6">
          {info.detail}
        </p>
        <ProgressBar value={barValue} max={100} color="#E07A5F" />
        <p className="text-xs text-[#7A756F] mt-3">
          Each step can take up to a minute — please keep this tab open.
        </p>
      </Card>
    </div>
  )
}
