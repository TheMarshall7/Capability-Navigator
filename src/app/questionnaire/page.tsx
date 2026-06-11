'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { Btn } from '@/components/ui/Btn'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { ProgressBar } from '@/components/ui/ProgressBar'

const SECTIONS = [
  { title: 'Basic Career Context', qs: [
    { k: 'role', l: 'What is your current or most recent role?', t: 'text', ph: 'e.g. Secondary School Teacher' },
    { k: 'years', l: 'How many years of work experience do you have?', t: 'radio', opts: ['Less than 1 year', '1–3 years', '4–7 years', '8–15 years', '15+ years'] },
    { k: 'situation', l: 'Which best describes your current situation?', t: 'radio', opts: ['I am happy but curious about future options', 'I want progression in my current field', 'I want a career change', 'I am returning to work', 'I am a student or graduate', 'I am unemployed', 'I feel stuck and unsure what comes next'] },
    { k: 'city', l: 'Where are you based?', t: 'text', ph: 'City, Country' },
    { k: 'arrangements', l: 'What working arrangements would you consider?', t: 'multi', opts: ['Remote', 'Hybrid', 'Office-based', 'Flexible hours', 'Part-time', 'Full-time', 'Freelance/contract', 'I am open to anything'] },
  ]},
  { title: 'Aspiration & Direction', qs: [
    { k: 'fiveYears', l: 'If you could be doing any kind of work in 5 years, what would it be?', t: 'area', ph: 'Describe freely — no wrong answers.' },
    { k: 'curious', l: 'Are there any careers, industries or fields you are curious about?', t: 'area', ph: 'Even vague curiosity is useful.' },
    { k: 'matters', l: 'What matters most to you in your next chapter?', t: 'multi', max: 3, opts: ['Higher salary', 'Better work-life balance', 'More meaningful work', 'More creativity', 'More stability', 'More flexibility', 'More responsibility', 'More independence', 'Learning and growth', 'Leadership opportunities', 'Starting my own business', 'Escaping my current industry'] },
  ]},
  { title: 'Energy & Motivation', qs: [
    { k: 'energises', l: 'Which activities give you energy?', t: 'multi', max: 5, opts: ['Solving problems', 'Helping people', 'Teaching or explaining', 'Building things', 'Creating things', 'Leading teams', 'Organising work', 'Researching ideas', 'Analysing data', 'Selling or persuading', 'Writing', 'Designing', 'Fixing things', 'Learning new skills', 'Working with technology', 'Supporting others', 'Managing projects', 'Performing or presenting'] },
    { k: 'drains', l: 'Which activities drain your energy?', t: 'multi', max: 5, opts: ['Solving problems', 'Helping people', 'Teaching or explaining', 'Building things', 'Creating things', 'Leading teams', 'Organising work', 'Researching ideas', 'Analysing data', 'Selling or persuading', 'Writing', 'Designing', 'Fixing things', 'Learning new skills', 'Working with technology', 'Supporting others', 'Managing projects', 'Performing or presenting'] },
    { k: 'proud', l: 'At work, what are you most proud of?', t: 'area', ph: 'A project, a moment, an impact.' },
    { k: 'helpWith', l: 'What do people regularly come to you for help with?', t: 'area', ph: 'Colleagues, friends, family — what do they instinctively ask you for?' },
  ]},
  { title: 'Hobbies & Hidden Capabilities', qs: [
    { k: 'hobbies', l: 'What hobbies, interests or passions do you regularly spend time on?', t: 'area', ph: 'Be specific — the more detail the better.' },
    { k: 'projects', l: 'Have you worked on any personal, creative, or side projects outside your main job?', t: 'area', ph: 'Anything counts — no matter how informal.' },
    { k: 'volunteer', l: 'Do you volunteer, coach, mentor, organise or contribute to any communities?', t: 'area', ph: 'Any community involvement, paid or unpaid.' },
    { k: 'selfLearn', l: 'What topics do you find yourself learning about even when nobody is paying you?', t: 'area', ph: 'YouTube rabbit holes, books, podcasts — what do you seek out?' },
    { k: 'moneyNoObject', l: 'If money was not a factor, how would you spend your working week?', t: 'area', ph: "Don't filter this answer." },
  ]},
  { title: 'Work Style', qs: [
    { k: 'environment', l: 'What kind of environment suits you best?', t: 'radio', opts: ['Highly structured', 'Mostly structured', 'Balanced', 'Mostly flexible', 'Highly flexible'] },
    { k: 'workPref', l: 'How do you prefer to work?', t: 'radio', opts: ['Mostly alone', 'In a small team', 'In a large team', 'Leading others', 'A mixture'] },
    { k: 'uncertainty', l: 'How comfortable are you with uncertainty? (1 = prefer stability, 5 = enjoy ambiguity)', t: 'scale' },
    { k: 'personality', l: 'Which sounds most like you?', t: 'radio', opts: ['Planner', 'Improviser', 'A mixture of both'] },
  ]},
  { title: 'Change & Upskilling', qs: [
    { k: 'openToRetrain', l: 'How open are you to retraining or upskilling?', t: 'radio', opts: ['Not open right now', 'Slightly open', 'Open if the path is clear', 'Very open', 'I am ready to retrain seriously'] },
    { k: 'learningTime', l: 'How much time could you realistically dedicate to learning each week?', t: 'radio', opts: ['Less than 1 hour', '1–3 hours', '4–7 hours', '8–15 hours', '15+ hours'] },
    { k: 'salaryStep', l: 'Would you take a temporary step back in salary or seniority to move toward work you really want?', t: 'radio', opts: ['Yes', 'No', 'Maybe', 'It depends on the opportunity'] },
    { k: 'timeline', l: 'Which best describes your timeline?', t: 'radio', opts: ['I need a new job immediately', 'I can spend 3–6 months preparing', 'I can spend 6–12 months retraining', 'I am planning for the long term'] },
  ]},
  { title: 'Self-Perception', qs: [
    { k: 'betterThanMost', l: 'What do you think you are better at than most people?', t: 'area', ph: "Don't be modest — this is important." },
    { k: 'overlooked', l: 'What strength or capability do you think is most overlooked in your current or previous roles?', t: 'area', ph: 'What do you wish people noticed more?' },
    { k: 'idealFuture', l: 'If you had to describe your ideal future in one sentence, what would it be?', t: 'area', ph: 'One sentence. Don\'t overthink it.' },
  ]},
]

type Answers = Record<string, string | string[] | number>

function Field({ q, val, onChange }: { q: typeof SECTIONS[0]['qs'][0]; val: any; onChange: (v: any) => void }) {
  if (q.t === 'text') return <Input placeholder={'ph' in q ? q.ph : undefined} value={val || ''} onChange={e => onChange(e.target.value)} />
  if (q.t === 'area') return <Textarea placeholder={'ph' in q ? q.ph : undefined} value={val || ''} onChange={e => onChange(e.target.value)} />
  if (q.t === 'radio') return (
    <div className="flex flex-col gap-2">
      {q.opts!.map(o => (
        <label key={o} onClick={() => onChange(o)}
          className="flex items-center gap-3 px-4 py-3 border rounded-xl cursor-pointer transition-all"
          style={{ borderColor: val === o ? '#E07A5F' : '#E8E3DA', background: val === o ? '#FDF0EA' : '#fff' }}>
          <input type="radio" checked={val === o} onChange={() => {}} style={{ accentColor: '#E07A5F' }} />
          <span className="text-[15px]">{o}</span>
        </label>
      ))}
    </div>
  )
  if (q.t === 'multi') {
    const vs: string[] = val || []
    const toggle = (o: string) => {
      const next = vs.includes(o) ? vs.filter(x => x !== o) : [...vs, o]
      if (!(q as any).max || next.length <= (q as any).max) onChange(next)
    }
    return (
      <div className="flex flex-wrap gap-2">
        {q.opts!.map(o => {
          const sel = vs.includes(o)
          return <div key={o} onClick={() => toggle(o)}
            className="px-4 py-2 rounded-full cursor-pointer text-sm transition-all"
            style={{ border: `1.5px solid ${sel ? '#E07A5F' : '#E8E3DA'}`, background: sel ? '#FDF0EA' : '#fff', color: sel ? '#E07A5F' : '#7A756F', fontWeight: sel ? 600 : 400 }}>{o}</div>
        })}
      </div>
    )
  }
  if (q.t === 'scale') {
    const v = val || 3
    return (
      <div>
        <div className="flex gap-3 mb-2">
          {[1, 2, 3, 4, 5].map(n => (
            <div key={n} onClick={() => onChange(n)}
              className="w-11 h-11 rounded-xl flex items-center justify-center cursor-pointer font-semibold transition-all"
              style={{ border: `1.5px solid ${v === n ? '#E07A5F' : '#E8E3DA'}`, background: v === n ? '#E07A5F' : '#fff', color: v === n ? '#fff' : '#7A756F' }}>
              {n}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-[#7A756F]"><span>Prefer stability</span><span>Enjoy ambiguity</span></div>
      </div>
    )
  }
  return null
}

export default function QuestionnairePage() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  // Load existing answers
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase.from('questionnaire_answers').select('question_key, answer_value').eq('user_id', user.id)
      if (data?.length) {
        const loaded: Answers = {}
        data.forEach(r => {
          try { loaded[r.question_key] = JSON.parse(r.answer_value) }
          catch { loaded[r.question_key] = r.answer_value }
        })
        setAnswers(loaded)
      }
    })
  }, [])

  const saveSection = async (nextStep: number | null) => {
    setSaving(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const section = SECTIONS[step]
      const rows = section.qs
        .filter(q => answers[q.k] !== undefined && answers[q.k] !== '')
        .map(q => ({
          user_id: user.id,
          question_key: q.k,
          answer_value: JSON.stringify(answers[q.k]),
        }))

      if (rows.length) {
        // Upsert answers using question_key as conflict target
        for (const row of rows) {
          await supabase.from('questionnaire_answers').upsert(row, { onConflict: 'user_id,question_key' })
        }
      }

      if (nextStep === null) {
        router.push('/generating')
      } else {
        setStep(nextStep)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } catch (err: any) {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const section = SECTIONS[step]

  return (
    <div className="page-shell-narrow">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-[#7A756F] font-medium">Section {step + 1} of {SECTIONS.length}</span>
        <span className="text-sm text-[#E07A5F] font-semibold">{Math.round((step / SECTIONS.length) * 100)}% complete</span>
      </div>
      <ProgressBar value={step} max={SECTIONS.length} />

      <h2 className="text-2xl mt-8 mb-7" style={{ fontFamily: 'var(--font-lora)' }}>{section.title}</h2>

      <div className="flex flex-col gap-7">
        {section.qs.map(q => (
          <div key={q.k}>
            <label className="block font-medium mb-3 text-[15px] leading-snug">
              {q.l}
              {(q as any).max && <span className="text-[#7A756F] font-normal text-sm"> (choose up to {(q as any).max})</span>}
            </label>
            <Field q={q} val={answers[q.k]} onChange={v => setAnswers(a => ({ ...a, [q.k]: v }))} />
          </div>
        ))}
      </div>

      {error && <div className="mt-4 text-sm text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-4 py-3">{error}</div>}

      <div className="flex justify-between mt-10">
        <Btn variant="outline" onClick={() => step > 0 ? setStep(s => s - 1) : router.push('/cv-upload')}>← Back</Btn>
        <Btn onClick={() => saveSection(step < SECTIONS.length - 1 ? step + 1 : null)} loading={saving}>
          {step < SECTIONS.length - 1 ? 'Next section →' : 'Generate my profile →'}
        </Btn>
      </div>
    </div>
  )
}
