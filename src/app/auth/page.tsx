'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { Btn } from '@/components/ui/Btn'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

export default function AuthPage() {
  const [mode, setMode] = useState<'signup' | 'login'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleAuth = async () => {
    if (!email || !password) { setError('Please fill in all fields.'); return }
    if (mode === 'signup' && !name) { setError('Please enter your name.'); return }
    setLoading(true)
    setError('')

    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email, password,
          options: {
            data: { name },
            emailRedirectTo: `${window.location.origin}/api/auth/callback`,
          },
        })
        if (signUpError) throw signUpError
        // The database trigger (handle_new_user) creates the users row automatically.
        // If email confirmation is disabled in Supabase dashboard, session is
        // returned immediately. Otherwise show the "check your email" screen.
        if (data.session) {
          router.push('/dashboard')
        } else {
          setConfirmed(true)
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) throw signInError
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (confirmed) return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">✉️</div>
        <h2 className="text-2xl font-semibold mb-3" style={{ fontFamily: 'var(--font-lora)' }}>Check your email</h2>
        <p className="text-[#7A756F] leading-relaxed mb-6">
          We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
        </p>
        <p className="text-sm text-[#7A756F]">
          No email?{' '}
          <button onClick={() => setConfirmed(false)} className="text-[#E07A5F] cursor-pointer bg-transparent border-none underline">
            Try again
          </button>
        </p>
      </div>
    </div>
  )

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#FDF0EA] rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">◎</div>
          <h1 className="page-title mb-2">
            {mode === 'signup' ? 'Create your profile' : 'Welcome back'}
          </h1>
          <p className="text-[#7A756F]">
            {mode === 'signup' ? 'Start discovering what you\'re capable of.' : 'Continue your capability journey.'}
          </p>
        </div>

        <Card>
          {/* Tab switcher */}
          <div className="flex bg-[#F8F6F1] rounded-xl p-1 mb-6">
            {(['signup', 'login'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError('') }}
                className="flex-1 py-2 rounded-lg text-sm font-medium cursor-pointer border-none transition-all"
                style={{ background: mode === m ? '#fff' : 'transparent', color: mode === m ? '#2D2926' : '#7A756F', boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,.08)' : 'none' }}>
                {m === 'signup' ? 'Sign up' : 'Log in'}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {mode === 'signup' && (
              <Input placeholder="Full name" value={name} onChange={e => setName(e.target.value)} />
            )}
            <Input placeholder="Email address" type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAuth()} />
            <Input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAuth()} />

            {error && (
              <div className="text-sm text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <Btn className="w-full justify-center mt-1" size="lg" onClick={handleAuth} loading={loading}>
              {mode === 'signup' ? 'Create my profile →' : 'Log in →'}
            </Btn>
          </div>

          <p className="text-xs text-[#7A756F] text-center mt-4 leading-relaxed">
            By continuing you agree to our terms. We do not sell personal data. You can delete your account at any time.
          </p>
        </Card>
      </div>
    </div>
  )
}
