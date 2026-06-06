'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'

interface VelocityData {
  pathwayTitle: string
  pathwayId: string
  completed: number
  total: number
  pct: number
  recentlyCompleted: string[]
}

export default function CareerVelocity() {
  const [data, setData] = useState<VelocityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Get top pathway
        const { data: pathway, error: pathwayError } = await supabase
          .from('career_pathways')
          .select('id, title')
          .eq('user_id', user.id)
          .order('capability_overlap', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (pathwayError) throw pathwayError
        if (!pathway) { setLoading(false); return }

        // Get milestones for that pathway
        const { data: milestones, error: milestoneError } = await supabase
          .from('milestones')
          .select('label, completed, completed_at')
          .eq('user_id', user.id)
          .eq('pathway_id', pathway.id)
          .order('completed_at', { ascending: false })

        if (milestoneError) throw milestoneError
        if (!milestones || milestones.length === 0) { setLoading(false); return }

        const completed = milestones.filter(m => m.completed).length
        const total = milestones.length
        const pct = total > 0 ? Math.round((completed / total) * 100) : 0
        const recentlyCompleted = milestones
          .filter(m => m.completed)
          .slice(0, 2)
          .map(m => m.label)

        setData({ pathwayTitle: pathway.title, pathwayId: pathway.id, completed, total, pct, recentlyCompleted })
      } catch (err: any) {
        setError(err.message || 'Failed to load progress')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return (
    <div className="animate-pulse border border-[#E8E3DA] rounded-2xl p-5 mb-5">
      <div className="h-4 bg-[#E8E3DA] rounded w-48 mb-3" />
      <div className="h-2 bg-[#E8E3DA] rounded-full mb-2" />
      <div className="h-3 bg-[#E8E3DA] rounded w-32" />
    </div>
  )

  // Don't render if no milestones seeded yet
  if (!data) return null

  const { pathwayTitle, pathwayId, completed, total, pct, recentlyCompleted } = data

  return (
    <div className="border border-[#E8E3DA] rounded-2xl p-5 mb-5 bg-white">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-xs font-bold tracking-widest text-[#7A756F] mb-1">CAREER VELOCITY</div>
          <div className="font-semibold text-[15px]">Toward {pathwayTitle}</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-[#E07A5F]">{pct}%</div>
          <div className="text-xs text-[#7A756F]">{completed}/{total} done</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-[#E8E3DA] rounded-full h-2 mb-3 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: pct === 100 ? '#3D8A7A' : 'linear-gradient(90deg, #E07A5F, #C96848)' }} />
      </div>

      {/* Recently completed */}
      {recentlyCompleted.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-[#7A756F] mb-1.5">Recently completed</div>
          {recentlyCompleted.map(label => (
            <div key={label} className="flex items-center gap-2 text-xs text-[#3D8A7A] py-0.5">
              <span>✓</span>
              <span className="truncate">{label}</span>
            </div>
          ))}
        </div>
      )}

      {pct === 100 ? (
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#3D8A7A]">🎉 All milestones complete!</span>
          <Link href="/outcome" className="text-xs text-[#E07A5F] font-medium no-underline hover:underline">
            Log your outcome →
          </Link>
        </div>
      ) : (
        <Link href={`/roadmap/${pathwayId}`}
          className="text-sm text-[#E07A5F] font-medium no-underline hover:underline">
          Continue roadmap →
        </Link>
      )}

      {error && <div className="text-xs text-[#DC2626] mt-2">{error}</div>}
    </div>
  )
}
