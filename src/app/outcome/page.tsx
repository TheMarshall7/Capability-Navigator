'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { Btn } from '@/components/ui/Btn'
import { Card } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Textarea'

type MoveStatus = 'yes' | 'in_progress' | 'not_yet'
type SalaryChange = 'increased' | 'same' | 'decreased' | 'unknown'

export default function OutcomePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [pathwayTitle, setPathwayTitle] = useState('')

  // Form state
  const [madeTheMove, setMadeTheMove] = useState<MoveStatus | ''>('')
  const [originalRole, setOriginalRole] = useState('')
  const [newRole, setNewRole] = useState('')
  const [timeTaken, setTimeTaken] = useState('')
  const [salaryChange, setSalaryChange] = useState<SalaryChange | ''>('')
  const [salaryPct, setSalaryPct] = useState('')
  const [whatWorked, setWhatWorked] = useState('')
  const [whatDidnt, setWhatDidnt] = useState('')
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null)
  const [isPublic, setIsPublic] = useState(false)
  const [headline, setHeadline] = useState('')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/auth'); return }

        const [{ data: existing }, { data: topPathway }] = await Promise.all([
          supabase.from('outcomes').select('*').eq('user_id', user.id).maybeSingle(),
          supabase.from('career_pathways').select('title').eq('user_id', user.id)
            .order('capability_overlap', { ascending: false }).limit(1).maybeSingle(),
        ])

        if (topPathway?.title) setPathwayTitle(topPathway.title)

        if (existing) {
          setMadeTheMove(existing.made_the_move || '')
          setOriginalRole(existing.original_role || '')
          setNewRole(existing.new_role || '')
          setTimeTaken(existing.time_taken_months?.toString() || '')
          setSalaryChange(existing.salary_change || '')
          setSalaryPct(existing.salary_change_pct?.toString() || '')
          setWhatWorked(existing.what_worked || '')
          setWhatDidnt(existing.what_didnt || '')
          setWouldRecommend(existing.would_recommend ?? null)
          setIsPublic(existing.is_public ?? false)
          setHeadline(existing.headline || '')
        }
      } catch (err) {
        setError('Failed to load your outcome data.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSubmit = async () => {
    if (!madeTheMove) { setError('Please select your current status.'); return }
    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/outcomes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pathway_title: pathwayTitle || null,
          made_the_move: madeTheMove,
          original_role: originalRole || null,
          new_role: newRole || null,
          time_taken_months: timeTaken ? parseInt(timeTaken) : null,
          salary_change: salaryChange || null,
          salary_change_pct: salaryPct ? parseInt(salaryPct) : null,
          what_worked: whatWorked || null,
          what_didnt: whatDidnt || null,
          would_recommend: wouldRecommend,
          is_public: madeTheMove === 'yes' ? isPublic : false,
          headline: madeTheMove === 'yes' && isPublic ? (headline || null) : null,
        }),
      })

      if (!res.ok) {
        const { error: apiError } = await res.json()
        throw new Error(apiError || 'Failed to save')
      }

      setSaved(true)
    } catch (err: any) {
      setError(err.message || 'Failed to save your outcome. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const pill = (value: string, current: string, label: string, set: (v: any) => void) => (
    <div onClick={() => set(value)}
      className="px-4 py-2.5 rounded-full cursor-pointer text-sm transition-all select-none"
      style={{ border: `1.5px solid ${current === value ? '#E07A5F' : '#E8E3DA'}`, background: current === value ? '#FDF0EA' : '#fff', color: current === value ? '#E07A5F' : '#7A756F', fontWeight: current === value ? 600 : 400 }}>
      {label}
    </div>
  )

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center text-[#7A756F]">Loading...</div>
  )

  if (saved) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      <div className="text-5xl mb-4">🎯</div>
      <h2 className="text-2xl font-semibold mb-3" style={{ fontFamily: 'var(--font-lora)' }}>
        {madeTheMove === 'yes' ? 'Congratulations — and thank you.' : 'Thanks for updating us.'}
      </h2>
      <p className="text-[#7A756F] max-w-sm leading-relaxed mb-6">
        {madeTheMove === 'yes'
          ? 'Your transition data helps the platform show future users what real moves look like — including the timeline and what actually worked.'
          : 'We\'ll be here when you\'re ready. Keep working through your roadmap and check back in.'}
      </p>
      <div className="flex gap-3">
        <Btn onClick={() => router.push('/dashboard')}>Back to dashboard</Btn>
        <Btn variant="outline" onClick={() => router.push('/coach')}>Talk to coach</Btn>
      </div>
    </div>
  )

  return (
    <div className="max-w-[600px] mx-auto px-6 py-12">
      <div className="mb-8">
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#EBF5F3] text-[#3D8A7A]">
          Transition Tracking
        </span>
        <h1 className="text-3xl mt-3 mb-2" style={{ fontFamily: 'var(--font-lora)' }}>
          Did you make the move?
        </h1>
        <p className="text-[#7A756F] leading-relaxed">
          Your honest data helps us show future users what real transitions look like — including how long they take and what actually works.
          {pathwayTitle && <span className="block mt-1 text-sm">Tracking: <strong>{pathwayTitle}</strong></span>}
        </p>
      </div>

      <div className="flex flex-col gap-7">
        {/* Move status */}
        <div>
          <label className="block font-medium text-[15px] mb-3">Where are you right now?</label>
          <div className="flex flex-wrap gap-2">
            {pill('yes', madeTheMove, '✓ I made the move', setMadeTheMove)}
            {pill('in_progress', madeTheMove, '⟳ In progress', setMadeTheMove)}
            {pill('not_yet', madeTheMove, '◯ Not yet', setMadeTheMove)}
          </div>
        </div>

        {/* Conditional fields for those who moved */}
        {madeTheMove === 'yes' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-[15px] mb-2">Your original role</label>
                <input value={originalRole} onChange={e => setOriginalRole(e.target.value)}
                  placeholder="e.g. Secondary Teacher"
                  className="w-full px-4 py-3 border border-[#E8E3DA] rounded-xl text-sm outline-none focus:border-[#E07A5F] transition-colors" />
              </div>
              <div>
                <label className="block font-medium text-[15px] mb-2">Your new role</label>
                <input value={newRole} onChange={e => setNewRole(e.target.value)}
                  placeholder="e.g. Learning Designer"
                  className="w-full px-4 py-3 border border-[#E8E3DA] rounded-xl text-sm outline-none focus:border-[#E07A5F] transition-colors" />
              </div>
            </div>

            <div>
              <label className="block font-medium text-[15px] mb-3">How long did it take?</label>
              <div className="flex flex-wrap gap-2">
                {[['1', '< 1 month'], ['3', '1–3 months'], ['6', '3–6 months'], ['9', '6–9 months'], ['12', '9–12 months'], ['18', '12–18 months'], ['24', '18+ months']].map(([v, l]) => (
                  <div key={v} onClick={() => setTimeTaken(v)}
                    className="px-3 py-2 rounded-full cursor-pointer text-sm transition-all"
                    style={{ border: `1.5px solid ${timeTaken === v ? '#E07A5F' : '#E8E3DA'}`, background: timeTaken === v ? '#FDF0EA' : '#fff', color: timeTaken === v ? '#E07A5F' : '#7A756F', fontWeight: timeTaken === v ? 600 : 400 }}>
                    {l}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-medium text-[15px] mb-3">How did your salary change?</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {pill('increased', salaryChange, '↑ Increased', setSalaryChange)}
                {pill('same', salaryChange, '→ Stayed the same', setSalaryChange)}
                {pill('decreased', salaryChange, '↓ Decreased', setSalaryChange)}
                {pill('unknown', salaryChange, 'Prefer not to say', setSalaryChange)}
              </div>
              {salaryChange === 'increased' || salaryChange === 'decreased' ? (
                <div className="flex items-center gap-2 mt-2">
                  <input type="number" value={salaryPct} onChange={e => setSalaryPct(e.target.value)}
                    placeholder="Approx %"
                    className="w-28 px-4 py-2.5 border border-[#E8E3DA] rounded-xl text-sm outline-none focus:border-[#E07A5F] transition-colors" />
                  <span className="text-sm text-[#7A756F]">% approximate change (optional)</span>
                </div>
              ) : null}
            </div>
          </>
        )}

        {/* What worked — shown for yes and in_progress */}
        {(madeTheMove === 'yes' || madeTheMove === 'in_progress') && (
          <>
            <div>
              <label className="block font-medium text-[15px] mb-2">What's actually working?</label>
              <Textarea value={whatWorked} onChange={e => setWhatWorked(e.target.value)}
                placeholder="Courses, networking, reframing your experience, applying to specific sectors..." />
            </div>
            <div>
              <label className="block font-medium text-[15px] mb-2">What hasn't worked, or what's been harder than expected?</label>
              <Textarea value={whatDidnt} onChange={e => setWhatDidnt(e.target.value)}
                placeholder="Be honest — this is the data future users actually need." />
            </div>
          </>
        )}

        {/* Would recommend — only for those who moved */}
        {madeTheMove === 'yes' && (
          <div>
            <label className="block font-medium text-[15px] mb-3">Would you recommend Capability Navigator to someone in your position?</label>
            <div className="flex gap-2">
              {pill('true', wouldRecommend?.toString() ?? '', 'Yes', () => setWouldRecommend(true))}
              {pill('false', wouldRecommend?.toString() ?? '', 'No', () => setWouldRecommend(false))}
            </div>
          </div>
        )}

        {/* Public sharing opt-in — only when move completed */}
        {madeTheMove === 'yes' && (
          <div className="p-4 rounded-xl border border-[#E8E3DA] bg-[#F8F6F1]">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={e => setIsPublic(e.target.checked)}
                className="mt-1 accent-[#3D8A7A]"
              />
              <div>
                <span className="font-medium text-[15px] block mb-1">Share my story anonymously to help others</span>
                <span className="text-xs text-[#7A756F] leading-relaxed">
                  Your name and details are never shown. Only the move, the timeline, and what worked.
                </span>
              </div>
            </label>
            {isPublic && (
              <div className="mt-4 pl-7">
                <input
                  value={headline}
                  onChange={e => setHeadline(e.target.value)}
                  placeholder="Sum up your move in one line (optional)"
                  className="w-full px-4 py-3 border border-[#E8E3DA] rounded-xl text-sm outline-none focus:border-[#E07A5F] transition-colors bg-white"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="mt-6 text-sm text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex gap-3 mt-8">
        <Btn variant="outline" onClick={() => router.push('/dashboard')}>Back</Btn>
        <Btn onClick={handleSubmit} loading={saving} disabled={!madeTheMove}>
          {saved ? '✓ Saved' : 'Save outcome'}
        </Btn>
      </div>

      <p className="text-xs text-[#7A756F] mt-4 leading-relaxed">
        Your data is anonymised before being used to build transition insights. Individual responses are never shared.
      </p>
    </div>
  )
}
