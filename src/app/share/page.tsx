'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { Btn } from '@/components/ui/Btn'
import { Card } from '@/components/ui/Card'

type Visibility = 'private' | 'shareable' | 'mentor'

export default function SharePage() {
  const [visibility, setVisibility] = useState<Visibility>('mentor')
  const [shareToken, setShareToken] = useState<string | null>(null)
  const [shareId, setShareId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const shareUrl = shareToken ? `${typeof window !== 'undefined' ? window.location.origin : ''}/p/${shareToken}` : null

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('share_links').select('id, token, visibility').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle()
      if (data) {
        setShareToken(data.token)
        setShareId(data.id)
        setVisibility(data.visibility as Visibility)
      }
      setLoading(false)
    }
    load()
  }, [])

  const createOrUpdate = async (newVis: Visibility) => {
    setSaving(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: report } = await supabase.from('capability_reports').select('id').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle()

      if (shareId) {
        const { error: updateError } = await supabase.from('share_links').update({ visibility: newVis }).eq('id', shareId)
        if (updateError) throw updateError
        setVisibility(newVis)
      } else {
        const { data, error: insertError } = await supabase.from('share_links').insert({ user_id: user.id, report_id: report?.id || null, visibility: newVis }).select('id, token').single()
        if (insertError) throw insertError
        if (data) { setShareToken(data.token); setShareId(data.id); setVisibility(newVis) }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update sharing settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const copy = () => {
    if (shareUrl) navigator.clipboard?.writeText(shareUrl).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <div className="flex items-center justify-center min-h-[50vh] text-[#7A756F]">Loading...</div>

  const visOptions: { key: Visibility; label: string; desc: string }[] = [
    { key: 'private', label: '🔒 Private', desc: 'Only you can see this' },
    { key: 'shareable', label: '🔗 Anyone with link', desc: 'Share read-only' },
    { key: 'mentor', label: '💬 Mentor review', desc: 'Reviewers can leave feedback' },
  ]

  return (
    <div className="max-w-[620px] mx-auto px-6 py-12">
      <h1 className="text-3xl mb-2" style={{ fontFamily: 'var(--font-lora)' }}>Share your profile</h1>
      <p className="text-[#7A756F] mb-8 leading-relaxed">
        Send to a friend, colleague or mentor who knows your work. External validation is one of the most useful things you can collect when exploring a career change.
      </p>

      {error && (
        <div className="mb-4 text-sm text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Visibility */}
      <Card className="mb-5">
        <div className="font-semibold mb-4">Privacy setting</div>
        <div className="flex flex-col gap-3">
          {visOptions.map(v => (
            <label key={v.key} onClick={() => createOrUpdate(v.key)}
              className="flex items-center gap-3 px-4 py-3 border rounded-xl cursor-pointer transition-all"
              style={{ borderColor: visibility === v.key ? '#E07A5F' : '#E8E3DA', background: visibility === v.key ? '#FDF0EA' : '#fff' }}>
              <input type="radio" checked={visibility === v.key} onChange={() => {}} style={{ accentColor: '#E07A5F' }} />
              <div>
                <div className="font-medium text-sm">{v.label}</div>
                <div className="text-xs text-[#7A756F]">{v.desc}</div>
              </div>
              {saving && visibility === v.key && <div className="ml-auto w-4 h-4 border-2 border-[#E07A5F] border-t-transparent rounded-full animate-spin" />}
            </label>
          ))}
        </div>
      </Card>

      {/* Link */}
      {shareToken ? (
        <Card className="mb-5">
          <div className="font-semibold mb-3">Your share link</div>
          <div className="flex gap-2 mb-4">
            <div className="flex-1 px-4 py-3 bg-[#F8F6F1] rounded-xl text-sm text-[#7A756F] border border-[#E8E3DA] break-all">{shareUrl}</div>
            <Btn size="sm" onClick={copy}>{copied ? '✓ Copied' : 'Copy'}</Btn>
          </div>
          <div className="flex gap-2 flex-wrap">
            <a href={`mailto:?subject=My Capability Profile&body=Take a look at my profile: ${shareUrl}`}>
              <Btn variant="outline" size="sm">✉ Email</Btn>
            </a>
            <a href={`https://wa.me/?text=Take a look at my capability profile: ${shareUrl}`} target="_blank" rel="noopener noreferrer">
              <Btn variant="outline" size="sm">💬 WhatsApp</Btn>
            </a>
            <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl || '')}`} target="_blank" rel="noopener noreferrer">
              <Btn variant="outline" size="sm">in LinkedIn</Btn>
            </a>
          </div>
        </Card>
      ) : (
        <Card className="mb-5 text-center py-10">
          <p className="text-[#7A756F] mb-4">No share link yet. Choose a visibility setting above to create one.</p>
          <Btn onClick={() => createOrUpdate('mentor')} loading={saving}>Create share link</Btn>
        </Card>
      )}

      {/* Mentor info */}
      {visibility === 'mentor' && shareToken && (
        <Card className="mb-5" style={{ background: '#EBF5F3', border: '1px solid #3D8A7A' }}>
          <div className="font-semibold text-[#3D8A7A] mb-2">💬 Mentor review enabled</div>
          <p className="text-sm text-[#7A756F] leading-relaxed">
            Anyone with your link can leave validation feedback without creating an account. You'll see their responses on your profile.
          </p>
        </Card>
      )}

      <Btn variant="outline" onClick={() => router.push('/dashboard')}>← Back to dashboard</Btn>
    </div>
  )
}
