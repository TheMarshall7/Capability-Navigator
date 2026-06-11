'use client'

interface CoachInputBarProps {
  input: string
  streaming: boolean
  inputRef: React.RefObject<HTMLTextAreaElement>
  onInputChange: (value: string) => void
  onSend: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
}

export default function CoachInputBar({
  input, streaming, inputRef, onInputChange, onSend, onKeyDown,
}: CoachInputBarProps) {
  return (
    <div className="border-t border-[#E8E3DA] bg-white px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] flex-shrink-0">
      <div className="max-w-[680px] mx-auto flex gap-3 items-end">
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => onInputChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask anything about your transition..."
          rows={1}
          disabled={streaming}
          className="flex-1 px-4 py-3 border border-[#E8E3DA] rounded-xl text-sm resize-none outline-none focus:border-[#E07A5F] transition-colors leading-relaxed disabled:opacity-50"
          style={{ maxHeight: 120, fontFamily: 'var(--font-dm-sans)' }}
        />
        <button
          onClick={onSend}
          disabled={!input.trim() || streaming}
          className="w-10 h-10 bg-[#E07A5F] rounded-xl flex items-center justify-center text-white border-none cursor-pointer flex-shrink-0 hover:bg-[#C96848] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          {streaming
            ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full coach-spin" />
            : <span style={{ fontSize: 16 }}>↑</span>}
        </button>
      </div>
      <p className="text-xs text-[#7A756F] text-center mt-2">Enter to send · Shift+Enter for new line</p>
    </div>
  )
}
