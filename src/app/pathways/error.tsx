'use client'
import { useEffect } from 'react'
import Link from 'next/link'

const MESSAGES: Record<string, string> = {
  dashboard: "We couldn't load your dashboard. Your data is safe — this is a temporary issue.",
  profile: "We couldn't load your capability profile. Try regenerating it from the dashboard.",
  pathways: "We couldn't load your career pathways. They may need to be regenerated.",
}

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  // Derive friendly message from the pathname, fallback to generic
  const pathname = typeof window !== 'undefined' ? window.location.pathname.replace('/', '') : ''
  const friendly = MESSAGES[pathname] || 'Something went wrong loading this page.'

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      <div className="text-5xl mb-4">⚠️</div>
      <h2 className="text-2xl font-semibold mb-3" style={{ fontFamily: 'var(--font-lora)' }}>
        Failed to load
      </h2>
      <p className="text-[#7A756F] mb-6 max-w-sm leading-relaxed">{friendly}</p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-5 py-2.5 bg-[#E07A5F] text-white rounded-xl cursor-pointer border-none font-medium text-sm">
          Try again
        </button>
        <Link
          href="/dashboard"
          className="px-5 py-2.5 border border-[#E8E3DA] rounded-xl text-[#2D2926] no-underline font-medium text-sm hover:bg-[#F8F6F1] transition-colors">
          Dashboard
        </Link>
      </div>
    </div>
  )
}
