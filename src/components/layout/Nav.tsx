'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { Btn } from '@/components/ui/Btn'
import type { User } from '@supabase/supabase-js'

const PROTECTED = ['/dashboard', '/cv-upload', '/cv-review', '/cv-builder', '/questionnaire', '/generating', '/profile', '/pathways', '/roadmap', '/feedback', '/share', '/settings', '/coach', '/outcome']

export default function Nav() {
  const [user, setUser] = useState<User | null>(null)
  const [name, setName] = useState('')
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const isAuth = PROTECTED.some(p => pathname?.startsWith(p))

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        supabase.from('users').select('name').eq('id', user.id).single()
          .then(({ data }) => { if (data?.name) setName(data.name) })
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <nav className="bg-white border-b border-[#E8E3DA] px-6 flex items-center justify-between h-16 sticky top-0 z-50">
      <Link href={isAuth ? '/dashboard' : '/'} className="flex items-center gap-2.5 no-underline">
        <div className="w-8 h-8 bg-[#E07A5F] rounded-lg flex items-center justify-center text-white text-base">◎</div>
        <span className="text-[17px] font-semibold text-[#2D2926]" style={{ fontFamily: 'var(--font-lora), serif' }}>
          Capability Navigator
        </span>
      </Link>

      {user && isAuth ? (
        <div className="flex items-center gap-2">
          <Link href="/transitions" className="text-sm text-[#7A756F] hover:text-[#2D2926] px-3 py-2 no-underline">Transitions</Link>
          <Link href="/dashboard" className="text-sm text-[#7A756F] hover:text-[#2D2926] px-3 py-2 no-underline">Dashboard</Link>
          <Link href="/coach" className="text-sm text-[#7A756F] hover:text-[#2D2926] px-3 py-2 no-underline">Coach</Link>
          <Link href="/settings" className="text-sm text-[#7A756F] hover:text-[#2D2926] px-3 py-2 no-underline">Settings</Link>
          <button onClick={signOut} className="text-sm text-[#7A756F] hover:text-[#2D2926] px-3 py-2 bg-transparent border-none cursor-pointer">
            Sign out
          </button>
          <div className="w-8 h-8 rounded-full bg-[#FDF0EA] flex items-center justify-center text-[#E07A5F] text-sm font-semibold">
            {(name || user.email || '?')[0].toUpperCase()}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Link href="/transitions" className="text-sm text-[#7A756F] hover:text-[#2D2926] px-3 py-2 no-underline">Transitions</Link>
          <div className="flex gap-2">
          <Btn variant="outline" size="sm" onClick={() => router.push('/auth')}>Log in</Btn>
          <Btn size="sm" onClick={() => router.push('/auth')}>Get started</Btn>
          </div>
        </div>
      )}
    </nav>
  )
}
