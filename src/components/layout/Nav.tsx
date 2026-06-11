'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { Btn } from '@/components/ui/Btn'
import type { User } from '@supabase/supabase-js'
import type { ReactNode } from 'react'

const PROTECTED = ['/dashboard', '/cv-upload', '/cv-review', '/cv-builder', '/questionnaire', '/generating', '/profile', '/pathways', '/roadmap', '/feedback', '/share', '/settings', '/coach', '/outcome']

function NavLink({
  href,
  children,
  onNavigate,
}: {
  href: string
  children: ReactNode
  onNavigate?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="flex items-center min-h-[44px] w-full md:w-auto text-sm text-[#7A756F] hover:text-[#2D2926] px-3 py-2 no-underline md:min-h-0"
    >
      {children}
    </Link>
  )
}

export default function Nav() {
  const [user, setUser] = useState<User | null>(null)
  const [name, setName] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
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

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  const signOut = async () => {
    setMenuOpen(false)
    await supabase.auth.signOut()
    router.push('/')
  }

  const closeMenu = () => setMenuOpen(false)

  const authLinks = user && isAuth ? (
    <>
      <NavLink href="/transitions" onNavigate={closeMenu}>Transitions</NavLink>
      <NavLink href="/dashboard" onNavigate={closeMenu}>Dashboard</NavLink>
      <NavLink href="/coach" onNavigate={closeMenu}>Coach</NavLink>
      <NavLink href="/settings" onNavigate={closeMenu}>Settings</NavLink>
      <button
        onClick={signOut}
        className="flex items-center min-h-[44px] w-full md:w-auto text-sm text-[#7A756F] hover:text-[#2D2926] px-3 py-2 bg-transparent border-none cursor-pointer text-left md:min-h-0"
      >
        Sign out
      </button>
      <div className="hidden md:flex w-8 h-8 rounded-full bg-[#FDF0EA] items-center justify-center text-[#E07A5F] text-sm font-semibold flex-shrink-0">
        {(name || user.email || '?')[0].toUpperCase()}
      </div>
    </>
  ) : (
    <>
      <NavLink href="/transitions" onNavigate={closeMenu}>Transitions</NavLink>
      <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto px-3 md:px-0">
        <Btn variant="outline" size="sm" className="w-full md:w-auto" onClick={() => { closeMenu(); router.push('/auth') }}>Log in</Btn>
        <Btn size="sm" className="w-full md:w-auto" onClick={() => { closeMenu(); router.push('/auth') }}>Get started</Btn>
      </div>
    </>
  )

  return (
    <nav className="bg-white border-b border-[#E8E3DA] sticky top-0 z-50">
      <div className="px-4 sm:px-6 flex items-center justify-between h-16">
        <Link href={isAuth ? '/dashboard' : '/'} className="flex items-center gap-2.5 no-underline min-w-0">
          <div className="w-8 h-8 bg-[#E07A5F] rounded-lg flex items-center justify-center text-white text-base flex-shrink-0">◎</div>
          <span className="hidden sm:inline text-[17px] font-semibold text-[#2D2926] truncate" style={{ fontFamily: 'var(--font-lora), serif' }}>
            Capability Navigator
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-2">
          {authLinks}
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          className="md:hidden flex items-center justify-center w-11 h-11 rounded-lg border border-[#E8E3DA] bg-transparent cursor-pointer text-[#2D2926]"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(o => !o)}
        >
          <span className="text-lg leading-none">{menuOpen ? '✕' : '☰'}</span>
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-[#E8E3DA] bg-white px-2 py-2 flex flex-col">
          {authLinks}
        </div>
      )}
    </nav>
  )
}
