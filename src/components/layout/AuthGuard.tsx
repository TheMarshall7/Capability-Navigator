'use client'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

const PROTECTED = [
  '/dashboard', '/cv-upload', '/cv-review', '/cv-builder', '/questionnaire',
  '/generating', '/profile', '/pathways',
  '/roadmap', '/feedback', '/share', '/settings',
  '/coach', '/outcome',
]

export default function AuthGuard() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    if (pathname === '/auth') {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) router.replace('/dashboard')
      })
      return
    }

    const isProtected = PROTECTED.some(p => pathname?.startsWith(p))
    if (!isProtected) return

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace('/auth')
    })
  }, [pathname, router])

  return null
}
