export const runtime = 'edge'

import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { Card, Badge } from '@/components/ui'
import type { Roadmap } from '@/types'
import MilestoneList from './MilestoneList'

export default async function RoadmapPage({ params }: { params: { pathwayId: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: pathway } = await supabase
    .from('career_pathways')
    .select('*')
    .eq('id', params.pathwayId)
    .eq('user_id', user.id)
    .single()

  if (!pathway) notFound()

  const r: Roadmap = pathway.roadmap_json || {}

  const Section = ({ title, items, accentColor }: { title: string; items?: string[]; accentColor: string }) => {
    if (!items?.length) return null
    return (
      <div className="mb-5">
        <div className="text-xs font-bold tracking-widest mb-3" style={{ color: accentColor }}>{title}</div>
        <div className="flex flex-col gap-2">
          {items.map((item, i) => (
            <div key={i} className="flex gap-3 p-3 rounded-xl text-sm leading-relaxed"
              style={{ background: accentColor === '#3D8A7A' ? '#EBF5F3' : accentColor === '#E07A5F' ? '#FDF0EA' : '#F8F6F1' }}>
              <span style={{ color: accentColor, flexShrink: 0 }}>→</span>
              <span className="text-[#7A756F]">{item}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[780px] mx-auto px-6 py-10">
      <Link href="/pathways" className="text-sm text-[#7A756F] hover:text-[#2D2926] no-underline mb-5 inline-block">
        ← Back to pathways
      </Link>

      <div className="mb-8">
        <Badge color="teal">Transition Roadmap</Badge>
        <h1 className="text-3xl mt-3 mb-2" style={{ fontFamily: 'var(--font-lora)' }}>
          Becoming a {pathway.title}
        </h1>
        <p className="text-[#7A756F]">{pathway.estimated_transition_time} · {pathway.difficulty} difficulty · {pathway.capability_overlap}% capability overlap</p>
      </div>

      {/* Strengths vs gaps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="!border-l-4" style={{ borderLeftColor: '#3D8A7A' }}>
          <div className="text-xs font-bold tracking-widest text-[#3D8A7A] mb-4">EXISTING STRENGTHS</div>
          {r.existingStrengths?.map(s => (
            <div key={s} className="flex items-center gap-2 py-2 border-b border-[#E8E3DA] last:border-0">
              <span className="text-[#3D8A7A] text-sm">✓</span>
              <span className="text-sm">{s}</span>
            </div>
          ))}
        </Card>
        <Card className="!border-l-4" style={{ borderLeftColor: '#E8A838' }}>
          <div className="text-xs font-bold tracking-widest text-[#E8A838] mb-4">CAPABILITY GAPS</div>
          {r.skillGaps?.map(g => (
            <div key={g} className="flex items-center gap-2 py-2 border-b border-[#E8E3DA] last:border-0">
              <span className="text-[#E8A838] text-sm">△</span>
              <span className="text-sm">{g}</span>
            </div>
          ))}
        </Card>
      </div>

      <Card className="mb-5">
        <Section title="SUGGESTED LEARNING" items={r.suggestedLearning} accentColor="#3D8A7A" />
        <Section title="PORTFOLIO EVIDENCE" items={r.portfolioEvidence} accentColor="#7C6AF0" />
        <Section title="YOUR FIRST 3 ACTIONS" items={r.firstThreeActions} accentColor="#E07A5F" />
      </Card>

      {/* Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          ['3-Month Plan', r.threeMonthPlan, '#E07A5F'],
          ['6-Month Plan', r.sixMonthPlan, '#3D8A7A'],
          ['12-Month Plan', r.twelveMonthPlan, '#7C6AF0'],
        ].map(([label, items, color]) => (
          <Card key={String(label)} className="!border-t-[3px]" style={{ borderTopColor: String(color) }}>
            <div className="text-sm font-bold mb-4" style={{ color: String(color) }}>{String(label)}</div>
            {(items as string[] | undefined)?.map((item, i) => (
              <div key={i} className="text-sm text-[#7A756F] leading-relaxed py-1.5 border-b border-[#E8E3DA] last:border-0">{item}</div>
            ))}
          </Card>
        ))}
      </div>

      {/* Entry routes + job search terms */}
      {(r.entryRoutes?.length || r.jobSearchTerms?.length) && (
        <Card className="mb-6">
          {r.entryRoutes?.length && (
            <div className="mb-5">
              <div className="text-xs font-bold tracking-widest text-[#2D2926] mb-3">ENTRY ROUTES</div>
              {r.entryRoutes.map((e, i) => (
                <div key={i} className="text-sm text-[#7A756F] py-2 border-b border-[#E8E3DA] last:border-0 leading-relaxed">{e}</div>
              ))}
            </div>
          )}
          {r.jobSearchTerms?.length && (
            <div>
              <div className="text-xs font-bold tracking-widest text-[#2D2926] mb-3">SEARCH TERMS TO USE</div>
              <div className="flex flex-wrap gap-2">
                {r.jobSearchTerms.map(t => (
                  <span key={t} className="text-sm px-3 py-1.5 bg-[#F8F6F1] border border-[#E8E3DA] rounded-full text-[#7A756F]">{t}</span>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      <Card className="mb-6">
        <div className="text-xs font-bold tracking-widest text-[#2D2926] mb-5">YOUR MILESTONES</div>
        <MilestoneList pathwayId={pathway.id} roadmap={r} />
      </Card>

      {/* Resources */}
      <Card>
        <div className="text-xs font-bold tracking-widest text-[#2D2926] mb-4">RESOURCES</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[['LinkedIn Jobs', '🔍'], ['Indeed', '🔍'], ['Reed', '🔍'], ['Coursera', '📚'], ['Udemy', '📚'], ['FutureLearn', '📚']].map(([name, icon]) => (
            <a key={String(name)} href="#" onClick={e => e.preventDefault()}
              className="flex items-center gap-2 px-4 py-3 bg-[#F8F6F1] border border-[#E8E3DA] rounded-xl text-sm font-medium text-[#2D2926] no-underline hover:bg-white transition-colors">
              <span>{icon}</span><span>{name}</span>
            </a>
          ))}
        </div>
      </Card>

      <div className="flex gap-3 mt-6 flex-wrap">
        <Link href="/share" className="inline-flex items-center gap-2 px-6 py-3 bg-[#E07A5F] text-white rounded-xl text-sm font-medium no-underline hover:bg-[#C96848] transition-colors">
          Share this roadmap →
        </Link>
        <Link href="/coach" className="inline-flex items-center gap-2 px-6 py-3 bg-transparent border border-[#E8E3DA] text-[#2D2926] rounded-xl text-sm font-medium no-underline hover:bg-[#F8F6F1] transition-colors">
          ◎ Ask the coach
        </Link>
        <Link href="/outcome" className="inline-flex items-center gap-2 px-6 py-3 bg-transparent border border-[#E8E3DA] text-[#2D2926] rounded-xl text-sm font-medium no-underline hover:bg-[#F8F6F1] transition-colors">
          🎯 Log my outcome
        </Link>
      </div>
    </div>
  )
}
