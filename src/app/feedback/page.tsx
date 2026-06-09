'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { Btn } from '@/components/ui/Btn'
import { Card } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Textarea'

export default function FeedbackPage() {
  const [accuracy, setAccuracy] = useState(0)
  const [revealed, setRevealed] = useState('')
  const [wouldShare, setWouldShare] = useState('')
  const [mostAccurate, setMostAccurate] = useState('')
  const [wrongOrMissing, setWrongOrMissing] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async () => {
    if (!accuracy) { return }
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      await supabase.from('feedback').upsert({
        user_id: user.id,
        accuracy_score: accuracy,
        revealed_new_possibilities: revealed || null,
        would_share: wouldShare || null,
        most_accurate: mostAccurate || null,
        wrong_or_missing: wrongOrMissing || null,
      }, { onConflict: 'user_id' })
      setDone(true)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (done) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      <div className="text-6xl mb-5">🙌</div>
      <h2 className="text-3xl mb-3" style={{ fontFamily: 'var(--font-lora)' }}>Thank you for your feedback</h2>
      <p className="text-[#7A756F] max-w-sm leading-relaxed mb-8">
        This genuinely helps us improve. The goal is for the profile to feel like a human read you — not an algorithm sorted you.
      </p>
      <div className="flex gap-3">
        <Btn onClick={() => router.push('/dashboard')}>Back to dashboard</Btn>
        <Btn variant="outline" onClick={() => router.push('/share')}>Share profile</Btn>
      </div>
    </div>
  )

  const pillStyle = (active: boolean) => ({
    padding: '10px 20px', border: `1.5px solid ${active ? '#E07A5F' : '#E8E3DA'}`,
    borderRadius: 99, cursor: 'pointer' as const,
    background: active ? '#FDF0EA' : '#fff',
    color: active ? '#E07A5F' : '#7A756F',
    fontWeight: active ? 600 : 400, fontSize: 14, transition: 'all .15s',
  })

  return (
    <div className="max-w-[580px] mx-auto px-6 py-12">
      <h1 className="text-3xl mb-2" style={{ fontFamily: 'var(--font-lora)' }}>How did we do?</h1>
      <p className="text-[#7A756F] mb-8 leading-relaxed">
        Version 1 success is measured by whether you feel understood — not by job applications. Your honest feedback shapes what gets better.
      </p>

      <div className="flex flex-col gap-8">
        {/* Accuracy */}
        <div>
          <label className="block font-medium text-[15px] mb-3">How accurately does this profile describe you?</label>
          <div className="flex gap-3">
            {[1, 2, 3, 4, 5].map(n => (
              <div key={n} onClick={() => setAccuracy(n)}
                className="w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer font-semibold text-base transition-all"
                style={{ border: `1.5px solid ${accuracy === n ? '#E07A5F' : '#E8E3DA'}`, background: accuracy === n ? '#E07A5F' : '#fff', color: accuracy === n ? '#fff' : '#7A756F' }}>
                {n}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-[#7A756F]"><span>Not accurate</span><span>Very accurate</span></div>
        </div>

        {/* Revealed */}
        <div>
          <label className="block font-medium text-[15px] mb-3">Did this reveal strengths or possibilities you hadn't considered?</label>
          <div className="flex gap-2 flex-wrap">
            {['Yes', 'Somewhat', 'No'].map(o => (
              <div key={o} onClick={() => setRevealed(o)} style={pillStyle(revealed === o)}>{o}</div>
            ))}
          </div>
        </div>

        {/* Would share */}
        <div>
          <label className="block font-medium text-[15px] mb-3">Would you share this with a friend, colleague or mentor?</label>
          <div className="flex gap-2 flex-wrap">
            {['Yes', 'Maybe', 'No'].map(o => (
              <div key={o} onClick={() => setWouldShare(o)} style={pillStyle(wouldShare === o)}>{o}</div>
            ))}
          </div>
        </div>

        {/* Text */}
        <div>
          <label className="block font-medium text-[15px] mb-2">What felt most accurate?</label>
          <Textarea placeholder="Anything — even one sentence helps." value={mostAccurate} onChange={e => setMostAccurate(e.target.value)} />
        </div>
        <div>
          <label className="block font-medium text-[15px] mb-2">What felt wrong or missing?</label>
          <Textarea placeholder="Honest criticism makes the next version better." value={wrongOrMissing} onChange={e => setWrongOrMissing(e.target.value)} />
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <Btn variant="outline" onClick={() => router.push('/dashboard')}>Back</Btn>
        <Btn onClick={handleSubmit} loading={saving} disabled={!accuracy}>Submit feedback</Btn>
      </div>
    </div>
  )
}
