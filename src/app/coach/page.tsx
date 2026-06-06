'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  error?: boolean
}

const STARTERS = [
  "I'm not sure where to start — what should I do first?",
  "How do I explain my career change to employers?",
  "I'm struggling to find time to work on this. Help.",
  "Should I apply for jobs now or wait until I have more experience?",
]

export default function CoachPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userName, setUserName] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()
  const router = useRouter()

  // Load existing messages and user name
  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/auth'); return }

        const [{ data: userData }, { data: history }] = await Promise.all([
          supabase.from('users').select('name').eq('id', user.id).single(),
          supabase.from('coach_messages').select('id, role, content')
            .eq('user_id', user.id).order('created_at', { ascending: true }).limit(60),
        ])

        if (userData?.name) setUserName(userData.name.split(' ')[0])
        if (history?.length) {
          setMessages(history.map(m => ({ id: m.id, role: m.role as 'user' | 'assistant', content: m.content })))
        }
      } catch (err) {
        setError('Failed to load your conversation history.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || streaming) return

    setInput('')
    setError('')

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: trimmed }
    const assistantMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: '' }

    setMessages(prev => [...prev, userMsg, assistantMsg])
    setStreaming(true)

    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      })

      if (res.status === 429) {
        const { error: rateLimitError } = await res.json()
        setMessages(prev => prev.map(m =>
          m.id === assistantMsg.id ? { ...m, content: rateLimitError, error: true } : m
        ))
        return
      }

      if (!res.ok) {
        throw new Error(`Request failed (${res.status})`)
      }

      // Stream the response
      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        const current = accumulated
        setMessages(prev => prev.map(m =>
          m.id === assistantMsg.id ? { ...m, content: current } : m
        ))
      }

      // Check if stream ended with an error tag
      if (accumulated.includes('[Error:')) {
        setMessages(prev => prev.map(m =>
          m.id === assistantMsg.id ? { ...m, error: true } : m
        ))
      }
    } catch (err: any) {
      const errText = err.message || 'Failed to get a response. Please try again.'
      setMessages(prev => prev.map(m =>
        m.id === assistantMsg.id ? { ...m, content: errText, error: true } : m
      ))
    } finally {
      setStreaming(false)
      inputRef.current?.focus()
    }
  }, [streaming])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const clearHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('coach_messages').delete().eq('user_id', user.id)
      setMessages([])
    } catch {
      setError('Failed to clear conversation.')
    }
  }

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#E8E3DA] rounded-full" style={{ borderTopColor: '#E07A5F', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  const isEmpty = messages.length === 0

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="border-b border-[#E8E3DA] bg-white px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#FDF0EA] rounded-xl flex items-center justify-center text-base">◎</div>
          <div>
            <div className="font-semibold text-[15px]">Career Coach</div>
            <div className="text-xs text-[#7A756F]">Personalized to your capability profile</div>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={clearHistory}
            className="text-xs text-[#7A756F] hover:text-[#DC2626] bg-transparent border-none cursor-pointer px-3 py-1.5 rounded-lg hover:bg-[#FEF2F2] transition-colors">
            Clear history
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-[680px] mx-auto">
          {/* Empty state */}
          {isEmpty && (
            <div className="text-center mb-10">
              <div className="text-4xl mb-3">◎</div>
              <h2 className="text-xl font-semibold mb-2" style={{ fontFamily: 'var(--font-lora)' }}>
                {userName ? `Hi ${userName}` : 'Hi there'} — what's on your mind?
              </h2>
              <p className="text-sm text-[#7A756F] mb-6 leading-relaxed max-w-sm mx-auto">
                I know your capability profile. Ask me anything about your transition — what to do next, how to position yourself, how to handle a specific situation.
              </p>
              <div className="flex flex-col gap-2 max-w-sm mx-auto">
                {STARTERS.map(s => (
                  <button key={s} onClick={() => sendMessage(s)}
                    className="text-sm text-left px-4 py-3 bg-white border border-[#E8E3DA] rounded-xl hover:border-[#E07A5F] hover:bg-[#FDF0EA] transition-all cursor-pointer text-[#2D2926]">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message thread */}
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
                    <span className="w-1.5 h-1.5 bg-[#7A756F] rounded-full" style={{ animation: 'pulse 1.4s ease-in-out infinite' }} />
                    <span className="w-1.5 h-1.5 bg-[#7A756F] rounded-full" style={{ animation: 'pulse 1.4s ease-in-out .2s infinite' }} />
                    <span className="w-1.5 h-1.5 bg-[#7A756F] rounded-full" style={{ animation: 'pulse 1.4s ease-in-out .4s infinite' }} />
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

      {/* Input */}
      <div className="border-t border-[#E8E3DA] bg-white px-4 py-4 flex-shrink-0">
        <div className="max-w-[680px] mx-auto flex gap-3 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your transition..."
            rows={1}
            disabled={streaming}
            className="flex-1 px-4 py-3 border border-[#E8E3DA] rounded-xl text-sm resize-none outline-none focus:border-[#E07A5F] transition-colors leading-relaxed disabled:opacity-50"
            style={{ maxHeight: 120, fontFamily: 'var(--font-dm-sans)' }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || streaming}
            className="w-10 h-10 bg-[#E07A5F] rounded-xl flex items-center justify-center text-white border-none cursor-pointer flex-shrink-0 hover:bg-[#C96848] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            {streaming
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" style={{ animation: 'spin 1s linear infinite' }} />
              : <span style={{ fontSize: 16 }}>↑</span>}
          </button>
        </div>
        <p className="text-xs text-[#7A756F] text-center mt-2">Enter to send · Shift+Enter for new line</p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  )
}
