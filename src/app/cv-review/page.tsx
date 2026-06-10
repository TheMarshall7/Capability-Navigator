'use client'
import { useState, useEffect, useRef, useCallback, useMemo, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { Btn } from '@/components/ui/Btn'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

type Tab = 'strong' | 'improve'
type Category = 'impact' | 'clarity' | 'transferable_skill' | 'missing_evidence' | 'weak_language' | 'formatting'

interface CvHighlight {
  quote: string
  type: Tab
  label: string
  category: Category
}

interface LocatedHighlight extends CvHighlight {
  start: number
  end: number
}

const CATEGORY_LABELS: Record<Category, string> = {
  impact: 'Impact',
  clarity: 'Clarity',
  transferable_skill: 'Transferable skill',
  missing_evidence: 'Missing evidence',
  weak_language: 'Language',
  formatting: 'Formatting',
}

const STORAGE_TEXT = 'cv-review-text'
const STORAGE_STATUS = 'cv-review-status'
const STORAGE_HIGHLIGHTS = 'cv-review-highlights'
const POLL_MS = 300
const WAIT_MS = 20_000

function isReviewableText(text: string): boolean {
  const t = text.trim()
  if (t.length < 80) return false
  if (/^\[.*uploaded/i.test(t) || t.startsWith('[PDF') || t.startsWith('[Word')) return false
  return true
}

function locateHighlight(text: string, quote: string): { start: number; end: number } | null {
  const idx = text.toLowerCase().indexOf(quote.toLowerCase())
  if (idx === -1) return null
  return { start: idx, end: idx + quote.length }
}

function resolveHighlights(text: string, raw: CvHighlight[], tab: Tab): LocatedHighlight[] {
  const located = raw
    .filter(h => h.type === tab)
    .map(h => {
      const pos = locateHighlight(text, h.quote)
      if (!pos) return null
      return { ...h, start: pos.start, end: pos.end }
    })
    .filter((h): h is LocatedHighlight => h !== null)
    .sort((a, b) => a.start - b.start)

  const nonOverlapping: LocatedHighlight[] = []
  let lastEnd = 0
  for (const h of located) {
    if (h.start >= lastEnd) {
      nonOverlapping.push(h)
      lastEnd = h.end
    }
  }
  return nonOverlapping
}

function buildDocumentNodes(
  text: string,
  highlights: LocatedHighlight[],
  activeIndex: number,
  tab: Tab,
  activeRef: React.RefObject<HTMLElement>,
): ReactNode[] {
  if (highlights.length === 0) return [text]

  const nodes: ReactNode[] = []
  let pos = 0

  highlights.forEach((h, i) => {
    if (h.start > pos) nodes.push(text.slice(pos, h.start))
    const isActive = i === activeIndex
    const isStrong = tab === 'strong'
    nodes.push(
      <mark
        key={`${h.start}-${i}`}
        ref={isActive ? activeRef : undefined}
        className={isActive ? 'cv-highlight-active rounded px-0.5' : 'rounded px-0.5'}
        style={{
          background: isStrong
            ? isActive ? 'rgba(61, 138, 122, 0.35)' : 'rgba(61, 138, 122, 0.12)'
            : isActive ? 'rgba(232, 168, 56, 0.4)' : 'rgba(232, 168, 56, 0.15)',
          opacity: isActive ? 1 : 0.45,
          color: 'inherit',
        }}
      >
        {text.slice(h.start, h.end)}
      </mark>
    )
    pos = h.end
  })

  if (pos < text.length) nodes.push(text.slice(pos))
  return nodes
}

export default function CVReviewPage() {
  const router = useRouter()
  const supabase = createClient()
  const activeRef = useRef<HTMLElement>(null!)

  const [loading, setLoading] = useState(true)
  const [cvText, setCvText] = useState('')
  const [rawHighlights, setRawHighlights] = useState<CvHighlight[]>([])
  const [tab, setTab] = useState<Tab>('strong')
  const [activeIndex, setActiveIndex] = useState(0)
  const [showFallback, setShowFallback] = useState(false)
  const [analysisError, setAnalysisError] = useState('')
  const [loadError, setLoadError] = useState('')

  const skipToQuestionnaire = useCallback(() => {
    router.replace('/questionnaire')
  }, [router])

  const fetchReview = useCallback(async (text: string): Promise<{ highlights: CvHighlight[] | null; error?: string }> => {
    sessionStorage.setItem(STORAGE_STATUS, 'loading')
    sessionStorage.removeItem(STORAGE_HIGHLIGHTS)

    try {
      const res = await fetch('/api/cv-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      let data: { highlights?: CvHighlight[]; error?: string }
      try {
        data = await res.json()
      } catch {
        sessionStorage.setItem(STORAGE_STATUS, 'error')
        return { highlights: null, error: `Server returned an invalid response (${res.status}).` }
      }

      if (!res.ok) {
        sessionStorage.setItem(STORAGE_STATUS, 'error')
        return { highlights: null, error: data.error || `Review failed (${res.status}).` }
      }

      const highlights = Array.isArray(data.highlights) ? data.highlights : []
      sessionStorage.setItem(STORAGE_HIGHLIGHTS, JSON.stringify(highlights))
      sessionStorage.setItem(STORAGE_STATUS, 'done')
      return { highlights }
    } catch (err: unknown) {
      sessionStorage.setItem(STORAGE_STATUS, 'error')
      return {
        highlights: null,
        error: err instanceof Error ? err.message : 'Review request failed.',
      }
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const started = Date.now()

    const init = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) { router.replace('/auth'); return }

        let text = sessionStorage.getItem(STORAGE_TEXT) || ''
        if (!text) {
          const { data: cv, error: cvError } = await supabase
            .from('cv_uploads')
            .select('extracted_text')
            .eq('user_id', user.id)
            .maybeSingle()

          if (cvError) {
            throw new Error('Could not load your CV text. Please try again.')
          }
          text = cv?.extracted_text || ''
        }

        if (!isReviewableText(text)) {
          skipToQuestionnaire()
          return
        }

        if (!cancelled) setCvText(text)

        const poll = async (): Promise<CvHighlight[] | null> => {
          while (!cancelled && Date.now() - started < WAIT_MS) {
            const status = sessionStorage.getItem(STORAGE_STATUS)

            if (status === 'done') {
              const stored = sessionStorage.getItem(STORAGE_HIGHLIGHTS)
              if (stored) {
                try { return JSON.parse(stored) as CvHighlight[] } catch { return null }
              }
            }

            if (status === 'error') return null

            if (!status || status === 'loading') {
              await new Promise(r => setTimeout(r, POLL_MS))
              continue
            }

            break
          }
          return null
        }

        let highlights = await poll()
        let reviewError: string | undefined

        if (!highlights && !cancelled) {
          const result = await fetchReview(text)
          highlights = result.highlights
          reviewError = result.error
        }

        if (cancelled) return

        if (!highlights) {
          setAnalysisError(
            reviewError ||
            'AI analysis is unavailable — check GEMINI_API_KEY is set in your environment.',
          )
          setRawHighlights([])
        } else {
          setAnalysisError('')
          setRawHighlights(highlights)
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Failed to load CV review.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    init()
    return () => { cancelled = true }
  }, [supabase, router, skipToQuestionnaire, fetchReview])

  const tabHighlights = useMemo(
    () => resolveHighlights(cvText, rawHighlights, tab),
    [cvText, rawHighlights, tab],
  )

  useEffect(() => {
    setActiveIndex(0)
  }, [tab])

  useEffect(() => {
    if (!loading && tabHighlights.length < 2) {
      setShowFallback(true)
    } else {
      setShowFallback(false)
    }
  }, [loading, tabHighlights.length])

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [activeIndex, tab, loading])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (showFallback || loading || tabHighlights.length < 2) return
      if (e.key === 'ArrowRight') {
        setActiveIndex(i => Math.min(i + 1, tabHighlights.length - 1))
      } else if (e.key === 'ArrowLeft') {
        setActiveIndex(i => Math.max(i - 1, 0))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showFallback, loading, tabHighlights.length])

  const active = tabHighlights[activeIndex]
  const isLastImprove = tab === 'improve' && activeIndex === tabHighlights.length - 1 && tabHighlights.length >= 2

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-6">
        <div className="w-8 h-8 border-2 border-[#E8E3DA] rounded-full animate-spin mb-4" style={{ borderTopColor: '#E07A5F' }} />
        <p className="text-[#7A756F] text-sm">Reviewing your CV…</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="max-w-[600px] mx-auto px-6 py-16 text-center">
        <Card className="!py-10">
          <h1 className="text-2xl mb-3" style={{ fontFamily: 'var(--font-lora)' }}>Could not load review</h1>
          <p className="text-sm text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-4 py-3 mb-6 leading-relaxed">
            {loadError}
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Btn onClick={() => { setLoadError(''); setLoading(true); window.location.reload() }}>Try again</Btn>
            <Btn variant="outline" onClick={skipToQuestionnaire}>Continue to questions →</Btn>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-[780px] mx-auto px-6 py-10">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl mb-2" style={{ fontFamily: 'var(--font-lora)' }}>CV review</h1>
          <p className="text-[#7A756F] text-sm leading-relaxed">
            An expert read of what&apos;s working — and what your capability profile will help sharpen.
          </p>
        </div>
        <button
          type="button"
          onClick={skipToQuestionnaire}
          className="text-sm text-[#7A756F] hover:text-[#2D2926] bg-transparent border-none cursor-pointer underline-offset-2 hover:underline flex-shrink-0 mt-1"
        >
          Skip review
        </button>
      </div>

      <div className="flex bg-[#F8F6F1] rounded-xl p-1 mb-6">
        {(['strong', 'improve'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium cursor-pointer border-none transition-all"
            style={{
              background: tab === t ? '#fff' : 'transparent',
              color: tab === t ? '#2D2926' : '#7A756F',
            }}
          >
            {t === 'strong' ? "What's strong" : 'What to improve'}
          </button>
        ))}
      </div>

      {(analysisError || showFallback) && (
        <Card className={`mb-4 ${analysisError ? '!bg-[#FEF7E8] !border-[#E8A838]' : ''}`}>
          <p className="text-sm leading-relaxed text-[#2D2926] mb-4">
            {analysisError ||
              "We couldn't anchor enough highlights in your CV text — your capability profile will still give you a full picture."}
          </p>
          <div className="flex gap-3 flex-wrap">
            {analysisError && (
              <Btn size="sm" variant="outline" onClick={() => {
                setLoading(true)
                setAnalysisError('')
                fetchReview(cvText).then(result => {
                  if (result.highlights?.length) {
                    setRawHighlights(result.highlights)
                    setAnalysisError('')
                  } else {
                    setAnalysisError(result.error || 'Analysis still unavailable. Try again later.')
                  }
                  setLoading(false)
                })
              }}>
                Retry analysis
              </Btn>
            )}
            <Btn size="sm" onClick={skipToQuestionnaire}>Continue to questions →</Btn>
          </div>
        </Card>
      )}

      {showFallback || analysisError ? (
        <Card className="mb-6 !p-8 md:!p-10" style={{ maxWidth: 680, margin: '0 auto' }}>
          <div
            className="text-[15px] leading-[1.85] text-[#2D2926] whitespace-pre-wrap"
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          >
            {cvText}
          </div>
        </Card>
      ) : (
        <>
          <Card className="mb-4 !p-8 md:!p-10" style={{ maxWidth: 680, margin: '0 auto' }}>
            <div
              className="text-[15px] leading-[1.85] text-[#2D2926] whitespace-pre-wrap"
              style={{ fontFamily: 'var(--font-dm-sans)' }}
            >
              {buildDocumentNodes(cvText, tabHighlights, activeIndex, tab, activeRef)}
            </div>
          </Card>

          {active && (
            <Card className="mb-6">
              <div className="mb-2">
                <Badge color={tab === 'strong' ? 'teal' : 'warn'}>
                  {CATEGORY_LABELS[active.category] || active.category}
                </Badge>
              </div>
              <p className="text-[#2D2926] leading-relaxed">{active.label}</p>
              {isLastImprove && (
                <p className="text-sm text-[#7A756F] mt-4 pt-4 border-t border-[#E8E3DA] leading-relaxed">
                  This is exactly what your capability profile is built to fix.
                </p>
              )}
            </Card>
          )}

          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous highlight"
                disabled={activeIndex === 0}
                onClick={() => setActiveIndex(i => Math.max(0, i - 1))}
                className="w-10 h-10 rounded-xl border border-[#E8E3DA] bg-white text-[#2D2926] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#F8F6F1] transition-colors"
              >
                ←
              </button>
              <button
                type="button"
                aria-label="Next highlight"
                disabled={activeIndex >= tabHighlights.length - 1}
                onClick={() => setActiveIndex(i => Math.min(tabHighlights.length - 1, i + 1))}
                className="w-10 h-10 rounded-xl border border-[#E8E3DA] bg-white text-[#2D2926] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#F8F6F1] transition-colors"
              >
                →
              </button>
              <span className="text-sm text-[#7A756F] ml-2">
                {activeIndex + 1} of {tabHighlights.length}
              </span>
            </div>
            <Btn onClick={skipToQuestionnaire}>Continue to questions →</Btn>
          </div>
        </>
      )}

      <style>{`
        @keyframes cv-highlight-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(224, 122, 95, 0); }
          50% { box-shadow: 0 0 0 4px rgba(224, 122, 95, 0.15); }
        }
        .cv-highlight-active { animation: cv-highlight-pulse 1.2s ease-in-out 1; }
      `}</style>
    </div>
  )
}
