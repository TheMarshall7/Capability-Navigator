'use client'
import { useState } from 'react'
import { Btn } from '@/components/ui/Btn'
import { Textarea } from '@/components/ui/Textarea'

export default function MentorFeedbackForm({ shareLinkId, name }: { shareLinkId: string; name: string }) {
  const [agreement, setAgreement] = useState('')
  const [strengths, setStrengths] = useState('')
  const [direction, setDirection] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!agreement) { setError('Please select how accurate the profile feels.'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/mentor-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shareLinkId, agreementLevel: agreement, perceivedStrengths: strengths, suggestedCareerDirection: direction }),
      })
      if (!res.ok) throw new Error('Failed to submit')
      setDone(true)
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (done) return (
    <div className="text-center py-10 px-6 bg-[#EBF5F3] rounded-2xl border border-[#3D8A7A]">
      <div className="text-4xl mb-3">💙</div>
      <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: 'var(--font-lora)' }}>Thank you for your validation</h3>
      <p className="text-sm text-[#7A756F] leading-relaxed">
        Your feedback has been shared with {name}. This kind of external perspective is genuinely valuable — and rare to receive honestly.
      </p>
    </div>
  )

  const pillStyle = (active: boolean) => ({
    padding: '9px 16px', borderRadius: 99, cursor: 'pointer' as const, fontSize: 14,
    border: `1.5px solid ${active ? '#E07A5F' : '#E8E3DA'}`,
    background: active ? '#FDF0EA' : '#fff',
    color: active ? '#E07A5F' : '#7A756F',
    fontWeight: active ? 600 : 400, transition: 'all .15s',
  })

  return (
    <div className="bg-white border border-[#E8E3DA] rounded-2xl overflow-hidden">
      <div className="px-6 py-4 bg-[#F8F6F1] border-b border-[#E8E3DA]">
        <div className="font-semibold text-[15px]">Leave your validation</div>
        <div className="text-sm text-[#7A756F] mt-0.5">No account needed · Takes 2 minutes</div>
      </div>

      <div className="p-6 flex flex-col gap-6">
        <div>
          <label className="block font-medium text-[15px] mb-3">Do these strengths feel accurate to you?</label>
          <div className="flex flex-wrap gap-2">
            {['Strongly agree', 'Mostly agree', 'Unsure', 'Disagree'].map(o => (
              <div key={o} onClick={() => setAgreement(o)} style={pillStyle(agreement === o)}>{o}</div>
            ))}
          </div>
        </div>

        <div>
          <label className="block font-medium text-[15px] mb-2">What strengths do you think this person has?</label>
          <Textarea
            placeholder="Your honest perspective — even if it differs from the AI output."
            value={strengths}
            onChange={e => setStrengths(e.target.value)}
          />
        </div>

        <div>
          <label className="block font-medium text-[15px] mb-2">What career direction could you imagine them thriving in?</label>
          <Textarea
            placeholder="First instinct is often the most useful."
            value={direction}
            onChange={e => setDirection(e.target.value)}
          />
        </div>

        {error && <div className="text-sm text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-4 py-3">{error}</div>}

        <Btn onClick={handleSubmit} loading={saving}>Submit my validation</Btn>
      </div>
    </div>
  )
}
