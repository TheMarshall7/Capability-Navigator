'use client'
import type { CoachMessage } from './types'
import { COACH_STARTERS } from './types'

interface CoachChatProps {
  messages: CoachMessage[]
  userName: string
  error: string
  onStarterSelect: (text: string) => void
  bottomRef: React.RefObject<HTMLDivElement>
}

export default function CoachChat({ messages, userName, error, onStarterSelect, bottomRef }: CoachChatProps) {
  const isEmpty = messages.length === 0

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="max-w-[680px] mx-auto">
        {isEmpty && (
          <div className="text-center mb-10">
            <div className="text-4xl mb-3">◎</div>
            <h2 className="text-xl font-semibold mb-2" style={{ fontFamily: 'var(--font-lora)' }}>
              {userName ? `Hi ${userName}` : 'Hi there'} — what&apos;s on your mind?
            </h2>
            <p className="text-sm text-[#7A756F] mb-6 leading-relaxed max-w-sm mx-auto">
              I know your capability profile. Ask me anything about your transition — what to do next, how to position yourself, how to handle a specific situation.
            </p>
            <div className="flex flex-col gap-2 max-w-sm mx-auto">
              {COACH_STARTERS.map(s => (
                <button key={s} onClick={() => onStarterSelect(s)}
                  className="text-sm text-left px-4 py-3 bg-white border border-[#E8E3DA] rounded-xl hover:border-[#E07A5F] hover:bg-[#FDF0EA] transition-all cursor-pointer text-[#2D2926]">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`mb-5 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 bg-[#FDF0EA] rounded-lg flex items-center justify-center text-sm mr-3 mt-1 flex-shrink-0">◎</div>
            )}
            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-[#E07A5F] text-white rounded-br-sm'
                : msg.error
                  ? 'bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] rounded-bl-sm'
                  : 'bg-white border border-[#E8E3DA] text-[#2D2926] rounded-bl-sm'
            }`}>
              {msg.content || (
                <span className="flex gap-1 items-center text-[#7A756F]">
                  <span className="w-1.5 h-1.5 bg-[#7A756F] rounded-full coach-pulse" />
                  <span className="w-1.5 h-1.5 bg-[#7A756F] rounded-full coach-pulse coach-pulse-delay-1" />
                  <span className="w-1.5 h-1.5 bg-[#7A756F] rounded-full coach-pulse coach-pulse-delay-2" />
                </span>
              )}
            </div>
          </div>
        ))}

        {error && (
          <div className="text-sm text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}
