'use client'
import { useState, useEffect } from 'react'
import type { Roadmap } from '@/types'

interface Milestone {
  id: string
  label: string
  phase: string
  sort_order: number
  completed: boolean
  completed_at: string | null
}

const PHASE_LABELS: Record<string, string> = {
  immediate: 'First actions',
  '3-month': '3-month plan',
  '6-month': '6-month plan',
  '12-month': '12-month plan',
}

const PHASE_COLORS: Record<string, string> = {
  immediate: '#E07A5F',
  '3-month': '#E07A5F',
  '6-month': '#3D8A7A',
  '12-month': '#7C6AF0',
}

function deriveMilestones(roadmap: Roadmap, pathwayId: string) {
  const items: { label: string; phase: string; sort_order: number }[] = []
  const phases: [string, string[] | undefined][] = [
    ['immediate', roadmap.firstThreeActions],
    ['3-month', roadmap.threeMonthPlan],
    ['6-month', roadmap.sixMonthPlan],
    ['12-month', roadmap.twelveMonthPlan],
  ]
  for (const [phase, actions] of phases) {
    actions?.forEach((label, i) => items.push({ label, phase, sort_order: i }))
  }
  return items
}

export default function MilestoneList({ pathwayId, roadmap }: { pathwayId: string; roadmap: Roadmap }) {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/milestones?pathwayId=${pathwayId}`)
        if (!res.ok) throw new Error('Failed to load milestones')
        const { milestones: data } = await res.json()

        if (data.length === 0) {
          // Auto-seed from roadmap JSON
          const items = deriveMilestones(roadmap, pathwayId)
          if (items.length > 0) {
            const seedRes = await fetch('/api/milestones', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ pathwayId, items }),
            })
            if (seedRes.ok) {
              const { milestones: seeded } = await seedRes.json()
              setMilestones(seeded || [])
            }
          }
        } else {
          setMilestones(data)
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load milestones')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [pathwayId])

  const toggle = async (id: string, current: boolean) => {
    setToggling(id)
    setError('')

    // Optimistic update
    setMilestones(prev => prev.map(m =>
      m.id === id ? { ...m, completed: !current, completed_at: !current ? new Date().toISOString() : null } : m
    ))

    try {
      const res = await fetch('/api/milestones', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, completed: !current }),
      })
      if (!res.ok) {
        const { error: apiError } = await res.json()
        throw new Error(apiError || 'Failed to update')
      }
    } catch (err: any) {
      // Revert optimistic update on failure
      setMilestones(prev => prev.map(m =>
        m.id === id ? { ...m, completed: current, completed_at: current ? new Date().toISOString() : null } : m
      ))
      setError('Failed to save. Please try again.')
    } finally {
      setToggling(null)
    }
  }

  const completed = milestones.filter(m => m.completed).length
  const total = milestones.length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  const phases = ['immediate', '3-month', '6-month', '12-month']

  if (loading) return (
    <div className="animate-pulse">
      <div className="h-6 bg-[#E8E3DA] rounded w-48 mb-4" />
      {[1, 2, 3].map(i => <div key={i} className="h-10 bg-[#E8E3DA] rounded-xl mb-2" />)}
    </div>
  )

  if (milestones.length === 0) return null

  return (
    <div className="mt-6">
      {/* Progress header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="font-semibold text-sm">Your progress</div>
          <div className="text-xs text-[#7A756F] mt-0.5">{completed} of {total} milestones completed</div>
        </div>
        <div className="text-2xl font-bold text-[#E07A5F]">{pct}%</div>
      </div>
      <div className="bg-[#E8E3DA] rounded-full h-2 mb-6 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #E07A5F, #C96848)' }} />
      </div>

      {error && (
        <div className="text-sm text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {/* Grouped by phase */}
      {phases.map(phase => {
        const items = milestones.filter(m => m.phase === phase)
        if (items.length === 0) return null
        const color = PHASE_COLORS[phase]
        return (
          <div key={phase} className="mb-6">
            <div className="text-xs font-bold tracking-widest mb-3" style={{ color }}>
              {PHASE_LABELS[phase]?.toUpperCase()}
            </div>
            <div className="flex flex-col gap-2">
              {items.map(m => (
                <div key={m.id}
                  onClick={() => toggling !== m.id && toggle(m.id, m.completed)}
                  className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all hover:bg-[#F8F6F1]"
                  style={{ opacity: toggling === m.id ? 0.6 : 1 }}>
                  <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                    style={{ borderColor: m.completed ? color : '#E8E3DA', background: m.completed ? color : 'transparent' }}>
                    {m.completed && <span className="text-white text-[10px] font-bold">✓</span>}
                  </div>
                  <span className="text-sm leading-relaxed flex-1"
                    style={{ color: m.completed ? '#7A756F' : '#2D2926', textDecoration: m.completed ? 'line-through' : 'none' }}>
                    {m.label}
                  </span>
                  {m.completed && m.completed_at && (
                    <span className="text-xs text-[#7A756F] flex-shrink-0 mt-0.5">
                      {new Date(m.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
