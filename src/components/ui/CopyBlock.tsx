'use client'

import { type ReactNode } from 'react'

export function CopyBlock({ text, label }: { text: string; label?: string }) {
  const copy = () => navigator.clipboard?.writeText(text).catch(() => {})
  return (
    <div className="border border-[#E8E3DA] rounded-xl overflow-hidden mt-4">
      <div className="flex justify-between items-center px-4 py-2.5 bg-[#F8F6F1] border-b border-[#E8E3DA]">
        <span className="text-xs font-semibold text-[#7A756F] tracking-wide">{label || 'COPY THIS'}</span>
        <button onClick={copy} className="text-xs px-3 py-1 rounded-full border border-[#E8E3DA] text-[#7A756F] hover:bg-white transition-colors cursor-pointer bg-transparent">
          Copy
        </button>
      </div>
      <div className="p-4 text-sm text-[#2D2926] leading-relaxed whitespace-pre-line font-serif">{text}</div>
    </div>
  )
}
