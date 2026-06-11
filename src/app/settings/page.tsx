'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { Btn } from '@/components/ui/Btn'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

export default function SettingsPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('')
  const [cvFile, setCvFile] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [deletingCV, setDeletingCV] = useState(false)
  const [cvDeleteError, setCvDeleteError] = useState('')
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      setEmail(user.email || '')
      const { data } = await supabase.from('users').select('name').eq('id', user.id).single()
      if (data?.name) setName(data.name)
      const { data: cv } = await supabase.from('cv_uploads').select('file_name').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle()
      if (cv) setCvFile(cv.file_name)
    }
    load()
  }, [])

  const saveProfile = async () => {
    setSaving(true)
    setSaveError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('users').update({ name }).eq('id', user.id)
      if (error) throw error
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const deleteCV = async () => {
    setDeletingCV(true)
    setCvDeleteError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error: dbError } = await supabase.from('cv_uploads').delete().eq('user_id', user.id)
      if (dbError) throw dbError
      const { data: files } = await supabase.storage.from('cv-uploads').list(user.id)
      if (files?.length) {
        await supabase.storage.from('cv-uploads').remove(files.map(f => `${user.id}/${f.name}`))
      }
      setCvFile(null)
    } catch (err: any) {
      setCvDeleteError(err.message || 'Failed to delete CV. Please try again.')
    } finally {
      setDeletingCV(false)
    }
  }

  const deleteAccount = async () => {
    setDeletingAccount(true)
    try {
      const res = await fetch('/api/delete-account', { method: 'DELETE' })
      if (!res.ok) throw new Error('Deletion failed')
      await supabase.auth.signOut()
      router.push('/')
    } catch (err) {
      console.error(err)
      // Sign out anyway even if deletion partially failed
      await supabase.auth.signOut()
      router.push('/')
    } finally {
      setDeletingAccount(false)
    }
  }

  return (
    <div className="page-shell-narrow max-w-[540px]">
      <h1 className="page-title mb-1">Account settings</h1>
      <p className="text-[#7A756F] mb-8">You are always in control of your profile and data.</p>

      {/* Profile */}
      <Card className="mb-5">
        <div className="font-semibold mb-5">Profile details</div>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-[#7A756F] block mb-1.5">Full name</label>
            <Input value={name} onChange={e => { setName(e.target.value); setSaved(false) }} />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#7A756F] block mb-1.5">Email</label>
            <Input value={email} readOnly className="!bg-[#F8F6F1] !text-[#7A756F]" />
            <p className="text-xs text-[#7A756F] mt-1">Email cannot be changed here. Contact support if needed.</p>
          </div>
        </div>
        <div className="mt-5">
          {saveError && <div className="text-sm text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-4 py-3 mb-3">{saveError}</div>}
          {saved ? (
            <div className="text-sm text-[#3D8A7A] font-medium">✓ Saved successfully</div>
          ) : (
            <Btn onClick={saveProfile} loading={saving}>Save changes</Btn>
          )}
        </div>
      </Card>

      {/* Data */}
      <Card className="mb-5">
        <div className="font-semibold mb-4">Your data</div>

        <div className="flex justify-between items-center py-4 border-b border-[#E8E3DA]">
          <div>
            <div className="text-sm font-medium">Uploaded CV</div>
            <div className="text-xs text-[#7A756F] mt-0.5">{cvFile || 'No CV uploaded'}</div>
            {cvDeleteError && <div className="text-xs text-[#DC2626] mt-1">{cvDeleteError}</div>}
          </div>
          {cvFile ? (
            <Btn size="sm" variant="danger" onClick={deleteCV} loading={deletingCV}>Delete</Btn>
          ) : (
            <Btn size="sm" variant="outline" onClick={() => router.push('/cv-upload')}>Upload</Btn>
          )}
        </div>

        <div className="flex justify-between items-center py-4">
          <div>
            <div className="text-sm font-medium">Capability profile</div>
            <div className="text-xs text-[#7A756F] mt-0.5">Regenerate from your latest CV and answers</div>
          </div>
          <Btn size="sm" variant="outline" onClick={() => router.push('/generating')}>Regenerate</Btn>
        </div>
      </Card>

      {/* Danger zone */}
      <Card className="mb-5" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
        <div className="font-semibold text-[#DC2626] mb-2">Danger zone</div>
        <p className="text-sm text-[#7A756F] mb-4 leading-relaxed">
          Deleting your account permanently removes all your data. This cannot be undone. We do not keep backups of personal data.
        </p>
        {confirmDelete ? (
          <div className="flex gap-3">
            <Btn variant="danger" size="sm" onClick={deleteAccount} loading={deletingAccount}>Yes, delete my account</Btn>
            <Btn variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Btn>
          </div>
        ) : (
          <Btn variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>Delete my account</Btn>
        )}
      </Card>

      {/* Privacy note */}
      <div className="p-4 bg-[#FDF0EA] rounded-xl">
        <p className="text-sm text-[#7A756F] leading-relaxed">
          🔒 We do not sell your personal data. We do not share it with employers. AI suggestions are guidance — not a judgement of your worth or potential.
        </p>
      </div>
    </div>
  )
}
