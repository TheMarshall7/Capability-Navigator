'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

const STEPS = [
  'Analysing your CV',
  'Identifying transferable skills',
  'Mapping hidden capabilities',
  'Exploring career pathways',
  'Creating transition roadmap',
  'Finalising your profile',
]

export default function GeneratingPage() {
  const [stepIdx, setStepIdx] = useState(0)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Animate steps while generating
    const stepInterval = setInterval(() => {
      setStepIdx(i => Math.min(i + 1, STEPS.length - 1))
    }, 1200)

    const generate = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/auth'); return }

        // Fetch CV text
        const { data: cvData } = await supabase
          .from('cv_uploads')
          .select('extracted_text')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        // Fetch questionnaire answers
        const { data: answersData } = await supabase
          .from('questionnaire_answers')
          .select('question_key, answer_value')
          .eq('user_id', user.id)

        const questionnaireAnswers: Record<string, any> = {}
        answersData?.forEach(row => {
          try { questionnaireAnswers[row.question_key] = JSON.parse(row.answer_value) }
          catch { questionnaireAnswers[row.question_key] = row.answer_value }
        })

        const res = await fetch('/api/generate-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cvText: cvData?.extracted_text || '',
            questionnaireAnswers,
          }),
        })

        if (res.status === 429) {
          const { error } = await res.json()
          throw new Error(error)
        }
        if (!res.ok) throw new Error('Generation failed. Please try again.')

        clearInterval(stepInterval)
        setStepIdx(STEPS.length - 1)
        setTimeout(() => router.push('/profile'), 600)
      } catch (err: any) {
        clearInterval(stepInterval)
        setError(err.message || 'Something went wrong. Please try again.')
      }
    }

    generate()
    return () => clearInterval(stepInterval)
  }, [])

  if (error) return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
      <div className="text-5xl mb-4">⚠️</div>
      <h2 className="text-2xl mb-3" style={{ fontFamily: 'var(--font-lora)' }}>Something went wrong</h2>
      <p className="text-[#7A756F] mb-6 max-w-sm leading-relaxed">{error}</p>
      <button onClick={() => window.location.reload()}
        className="px-6 py-3 bg-[#E07A5F] text-white rounded-xl cursor-pointer border-none font-medium">
        Try again
      </button>
    </div>
  )

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
      {/* Spinner */}
      <div className="w-16 h-16 border-[3px] border-[#E8E3DA] rounded-full mb-8"
        style={{ borderTopColor: '#E07A5F', animation: 'spin 1.1s linear infinite' }} />

      <h2 className="text-3xl mb-3" style={{ fontFamily: 'var(--font-lora)' }}>
        Building your capability profile
      </h2>
      <p className="text-[#7A756F] mb-10 max-w-[360px] leading-relaxed">
        This usually takes about 30 seconds. We're looking beyond your CV to find what you're genuinely capable of.
      </p>

      <div className="w-full max-w-sm">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-4 py-3 transition-opacity"
            style={{ borderBottom: i < STEPS.length - 1 ? '1px solid #E8E3DA' : 'none', opacity: i <= stepIdx ? 1 : 0.25 }}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs"
              style={{ background: i < stepIdx ? '#3D8A7A' : i === stepIdx ? '#E07A5F' : '#E8E3DA', color: i <= stepIdx ? '#fff' : 'transparent' }}>
              {i < stepIdx ? '✓' : i === stepIdx ? '●' : ''}
            </div>
            <span className="text-sm" style={{ fontWeight: i === stepIdx ? 600 : 400, color: i <= stepIdx ? '#2D2926' : '#7A756F' }}>
              {s}
            </span>
          </div>
        ))}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
