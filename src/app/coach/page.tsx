'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import CoachHeader from './_components/CoachHeader'
import CoachChat from './_components/CoachChat'
import CoachInputBar from './_components/CoachInputBar'
import type { CoachMessage } from './_components/types'

export default function CoachPage() {
  const [messages, setMessages] = useState<CoachMessage[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userName, setUserName] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()
  const router = useRouter()

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
      } catch {
        setError('Failed to load your conversation history.')
      } finally {
        setLoading(false)
      }
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || streaming) return

    setInput('')
    setError('')

    const userMsg: CoachMessage = { id: crypto.randomUUID(), role: 'user', content: trimmed }
    const assistantMsg: CoachMessage = { id: crypto.randomUUID(), role: 'assistant', content: '' }

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

      if (!res.ok) throw new Error(`Request failed (${res.status})`)

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

      if (accumulated.includes('[Error:')) {
        setMessages(prev => prev.map(m =>
          m.id === assistantMsg.id ? { ...m, error: true } : m
        ))
      }
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : 'Failed to get a response. Please try again.'
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
      <div className="w-8 h-8 border-2 border-[#E8E3DA] rounded-full coach-spin" style={{ borderTopColor: '#E07A5F' }} />
    </div>
  )

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <CoachHeader hasMessages={messages.length > 0} onClearHistory={clearHistory} />
      <CoachChat
        messages={messages}
        userName={userName}
        error={error}
        onStarterSelect={sendMessage}
        bottomRef={bottomRef}
      />
      <CoachInputBar
        input={input}
        streaming={streaming}
        inputRef={inputRef}
        onInputChange={setInput}
        onSend={() => sendMessage(input)}
        onKeyDown={handleKeyDown}
      />
      <style>{`
        @keyframes coach-spin { to { transform: rotate(360deg); } }
        @keyframes coach-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
        .coach-spin { animation: coach-spin 1s linear infinite; }
        .coach-pulse { animation: coach-pulse 1.4s ease-in-out infinite; }
        .coach-pulse-delay-1 { animation-delay: .2s; }
        .coach-pulse-delay-2 { animation-delay: .4s; }
      `}</style>
    </div>
  )
}
