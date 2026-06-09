'use client'

interface CoachHeaderProps {
  hasMessages: boolean
  onClearHistory: () => void
}

export default function CoachHeader({ hasMessages, onClearHistory }: CoachHeaderProps) {
  return (
    <div className="border-b border-[#E8E3DA] bg-white px-6 py-4 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-[#FDF0EA] rounded-xl flex items-center justify-center text-base">◎</div>
        <div>
          <div className="font-semibold text-[15px]">Career Coach</div>
          <div className="text-xs text-[#7A756F]">Personalized to your capability profile</div>
        </div>
      </div>
      {hasMessages && (
        <button onClick={onClearHistory}
          className="text-xs text-[#7A756F] hover:text-[#DC2626] bg-transparent border-none cursor-pointer px-3 py-1.5 rounded-lg hover:bg-[#FEF2F2] transition-colors">
          Clear history
        </button>
      )}
    </div>
  )
}
