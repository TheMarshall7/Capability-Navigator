'use client'
import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('[GlobalError]', error) }, [error])

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      <div className="text-5xl mb-4">⚠️</div>
      <h2 className="text-2xl font-semibold mb-3" style={{ fontFamily: 'var(--font-lora)' }}>
        Something went wrong
      </h2>
      <p className="text-[#7A756F] mb-6 max-w-sm leading-relaxed">
        {error.message || 'An unexpected error occurred. Please try again.'}
      </p>
      <div className="flex gap-3">
        <button onClick={reset}
          className="px-6 py-3 bg-[#E07A5F] text-white rounded-xl cursor-pointer border-none font-medium">
          Try again
        </button>
        <a href="/dashboard"
          className="px-6 py-3 border border-[#E8E3DA] rounded-xl text-[#2D2926] no-underline font-medium hover:bg-[#F8F6F1] transition-colors">
          Go to dashboard
        </a>
      </div>
    </div>
  )
}
