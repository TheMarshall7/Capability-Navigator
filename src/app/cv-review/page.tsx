'use client'
import { useState, useEffect, useRef, useCallback, useMemo, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { Btn } from '@/components/ui/Btn'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { locateHighlight } from '@/lib/cv-highlight-locate'
import type {
  CvReviewCategory,
  CvReviewHighlight,
  CvReviewResult,
  CvReviewTab,
  LocatedCvReviewHighlight,
} from '@/types/cv-review'

const CATEGORY_LABELS: Record<CvReviewCategory, string> = {
  impact: 'Impact',
  clarity: 'Clarity',
  transferable_skill: 'Transferable skill',
  missing_evidence: 'Missing evidence',
  weak_language: 'Language',
  formatting: 'Formatting',
}

const STORAGE_TEXT = 'cv-review-text'
const STORAGE_DATA = 'cv-review-data'
const STORAGE_STATUS = 'cv-review-status'
const STORAGE_HIGHLIGHTS = 'cv-review-highlights'
const POLL_MS = 300
const WAIT_MS = 55_000

function isReviewableText(text: string): boolean {
  const t = text.trim()
  if (t.length < 80) return false
  if (/^\[.*uploaded/i.test(t) || t.startsWith('[PDF') || t.startsWith('[Word')) return false
  return true
}

function emptyReview(highlights: CvReviewHighlight[] = []): CvReviewResult {
  return {
    overview: {
      summary: '',
      strengthsSummary: [],
      improvementsSummary: [],
    },
    sections: [],
    highlights,
  }
}

function parseStoredReview(): CvReviewResult | null {
  const raw = sessionStorage.getItem(STORAGE_DATA)
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as CvReviewResult
      if (parsed?.highlights && parsed?.overview) return parsed
    } catch { /* fall through */ }
  }
  const legacy = sessionStorage.getItem(STORAGE_HIGHLIGHTS)
  if (legacy) {
    try {
      const highlights = JSON.parse(legacy) as CvReviewHighlight[]
      if (Array.isArray(highlights)) return emptyReview(highlights)
    } catch { /* ignore */ }
  }
  return null
}

function resolveHighlights(
  text: string,
  raw: CvReviewHighlight[],
  tab: CvReviewTab,
): LocatedCvReviewHighlight[] {
  const located: LocatedCvReviewHighlight[] = []
  raw.forEach((h, listIndex) => {
    if (h.type !== tab) return
    const pos = locateHighlight(text, h.quote)
    if (!pos) return
    located.push({ ...h, start: pos.start, end: pos.end, listIndex })
  })
  located.sort((a, b) => a.start - b.start)
  return located
}

function buildDocumentNodes(
  text: string,
  highlights: LocatedCvReviewHighlight[],
  activeListIndex: number,
  tab: CvReviewTab,
  markRefs: React.MutableRefObject<Map<number, HTMLElement>>,
  onMarkClick: (listIndex: number) => void,
): ReactNode[] {
  if (highlights.length === 0) return [text]

  const nodes: ReactNode[] = []
  let pos = 0

  highlights.forEach((h) => {
    if (h.start > pos) nodes.push(text.slice(pos, h.start))
    const isActive = h.listIndex === activeListIndex
    const isStrong = tab === 'strong'
    nodes.push(
      <mark
        key={`${h.start}-${h.listIndex}`}
        ref={(el) => {
          if (el) markRefs.current.set(h.listIndex, el)
          else markRefs.current.delete(h.listIndex)
        }}
        onClick={() => onMarkClick(h.listIndex)}
        className={`rounded px-0.5 cursor-pointer transition-opacity ${isActive ? 'cv-highlight-active' : ''}`}
        style={{
          background: isStrong
            ? isActive ? 'rgba(61, 138, 122, 0.45)' : 'rgba(61, 138, 122, 0.18)'
            : isActive ? 'rgba(232, 168, 56, 0.5)' : 'rgba(232, 168, 56, 0.2)',
          opacity: isActive ? 1 : 0.7,
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
  const markRefs = useRef<Map<number, HTMLElement>>(new Map())
  const listRefs = useRef<Map<number, HTMLElement>>(new Map())

  const [loading, setLoading] = useState(true)
  const [cvText, setCvText] = useState('')
  const [review, setReview] = useState<CvReviewResult | null>(null)
  const [tab, setTab] = useState<CvReviewTab>('strong')
  const [activeListIndex, setActiveListIndex] = useState<number | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]))
  const [analysisError, setAnalysisError] = useState('')
  const [loadError, setLoadError] = useState('')

  const skipToQuestionnaire = useCallback(() => {
    router.replace('/questionnaire')
  }, [router])

  const persistReview = useCallback((data: CvReviewResult) => {
    sessionStorage.setItem(STORAGE_DATA, JSON.stringify(data))
    sessionStorage.setItem(STORAGE_HIGHLIGHTS, JSON.stringify(data.highlights))
    sessionStorage.setItem(STORAGE_STATUS, 'done')
  }, [])

  const fetchReview = useCallback(async (text: string): Promise<{ review: CvReviewResult | null; error?: string }> => {
    sessionStorage.setItem(STORAGE_STATUS, 'loading')
    sessionStorage.removeItem(STORAGE_DATA)
    sessionStorage.removeItem(STORAGE_HIGHLIGHTS)

    try {
      const res = await fetch('/api/cv-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      let data: CvReviewResult & { error?: string }
      try {
        data = await res.json()
      } catch {
        sessionStorage.setItem(STORAGE_STATUS, 'error')
        return { review: null, error: `Server returned an invalid response (${res.status}).` }
      }

      if (!res.ok) {
        sessionStorage.setItem(STORAGE_STATUS, 'error')
        return { review: null, error: data.error || `Review failed (${res.status}).` }
      }

      if (!data.highlights || !data.overview) {
        sessionStorage.setItem(STORAGE_STATUS, 'error')
        return { review: null, error: 'Received an incomplete review from the server.' }
      }

      persistReview(data)
      return { review: data }
    } catch (err: unknown) {
      sessionStorage.setItem(STORAGE_STATUS, 'error')
      return {
        review: null,
        error: err instanceof Error ? err.message : 'Review request failed.',
      }
    }
  }, [persistReview])

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

          if (cvError) throw new Error('Could not load your CV text. Please try again.')
          text = cv?.extracted_text || ''
        }

        if (!isReviewableText(text)) {
          skipToQuestionnaire()
          return
        }

        if (!cancelled) setCvText(text)

        const poll = async (): Promise<CvReviewResult | null> => {
          while (!cancelled && Date.now() - started < WAIT_MS) {
            const status = sessionStorage.getItem(STORAGE_STATUS)
            if (status === 'done') return parseStoredReview()
            if (status === 'error') return null
            if (!status || status === 'loading') {
              await new Promise(r => setTimeout(r, POLL_MS))
              continue
            }
            break
          }
          return null
        }

        let reviewData = await poll()
        let reviewError: string | undefined

        if (!reviewData && !cancelled) {
          const result = await fetchReview(text)
          reviewData = result.review
          reviewError = result.error
        }

        if (cancelled) return

        if (!reviewData) {
          setAnalysisError(
            reviewError || 'AI analysis is unavailable — check GEMINI_API_KEY is set in your environment.',
          )
          setReview(null)
        } else {
          setAnalysisError('')
          setReview(reviewData)
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

  const highlights = review?.highlights ?? []
  const strongHighlights = useMemo(() => highlights.filter(h => h.type === 'strong'), [highlights])
  const improveHighlights = useMemo(() => highlights.filter(h => h.type === 'improve'), [highlights])
  const tabHighlights = useMemo(() => highlights.filter(h => h.type === tab), [highlights, tab])
  const tabLocated = useMemo(
    () => resolveHighlights(cvText, highlights, tab),
    [cvText, highlights, tab],
  )

  const tabListIndices = useMemo(
    () => tabHighlights.map((h) => highlights.indexOf(h)),
    [tabHighlights, highlights],
  )

  useEffect(() => {
    setActiveListIndex(tabListIndices[0] ?? null)
  }, [tab, tabListIndices])

  const scrollToListItem = useCallback((listIndex: number) => {
    setActiveListIndex(listIndex)
    listRefs.current.get(listIndex)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    markRefs.current.get(listIndex)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])

  const toggleSection = (idx: number) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-6">
        <div className="w-8 h-8 border-2 border-[#E8E3DA] rounded-full animate-spin mb-4" style={{ borderTopColor: '#E07A5F' }} />
        <p className="text-[#7A756F] text-sm">Reviewing your CV in depth…</p>
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
    <div className="max-w-[900px] mx-auto px-6 py-10">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl mb-2" style={{ fontFamily: 'var(--font-lora)' }}>CV review</h1>
          <p className="text-[#7A756F] text-sm leading-relaxed">
            {strongHighlights.length} strengths · {improveHighlights.length} improvements
            {review?.sections.length ? ` · ${review.sections.length} sections analysed` : ''}
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

      {analysisError && (
        <Card className="mb-4 !bg-[#FEF7E8] !border-[#E8A838]">
          <p className="text-sm leading-relaxed text-[#2D2926] mb-4">{analysisError}</p>
          <div className="flex gap-3 flex-wrap">
            <Btn size="sm" variant="outline" onClick={() => {
              setLoading(true)
              setAnalysisError('')
              fetchReview(cvText).then(result => {
                if (result.review) {
                  setReview(result.review)
                  setAnalysisError('')
                } else {
                  setAnalysisError(result.error || 'Analysis still unavailable. Try again later.')
                }
                setLoading(false)
              })
            }}>
              Retry analysis
            </Btn>
            <Btn size="sm" onClick={skipToQuestionnaire}>Continue to questions →</Btn>
          </div>
        </Card>
      )}

      {review?.overview.summary && (
        <Card className="mb-4">
          <h2 className="text-lg mb-3" style={{ fontFamily: 'var(--font-lora)' }}>Overall assessment</h2>
          <p className="text-[#2D2926] leading-relaxed mb-4">{review.overview.summary}</p>
          <div className="grid md:grid-cols-2 gap-4">
            {review.overview.strengthsSummary.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#3D8A7A] mb-2">Key strengths</p>
                <ul className="text-sm text-[#2D2926] space-y-1.5 list-disc pl-4">
                  {review.overview.strengthsSummary.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
            {review.overview.improvementsSummary.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#E8A838] mb-2">Priority improvements</p>
                <ul className="text-sm text-[#2D2926] space-y-1.5 list-disc pl-4">
                  {review.overview.improvementsSummary.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
          </div>
        </Card>
      )}

      {review && review.sections.length > 0 && (
        <div className="mb-6 space-y-2">
          <h2 className="text-lg mb-2" style={{ fontFamily: 'var(--font-lora)' }}>Section breakdown</h2>
          {review.sections.map((section, idx) => (
            <Card key={idx} className="!py-4">
              <button
                type="button"
                onClick={() => toggleSection(idx)}
                className="w-full flex items-center justify-between text-left bg-transparent border-none cursor-pointer p-0"
              >
                <span className="font-medium text-[#2D2926]">{section.name}</span>
                <span className="text-[#7A756F] text-sm">{expandedSections.has(idx) ? '−' : '+'}</span>
              </button>
              {expandedSections.has(idx) && (
                <p className="text-sm text-[#2D2926] leading-relaxed mt-3 pt-3 border-t border-[#E8E3DA]">
                  {section.assessment}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}

      {!analysisError && review && (
        <>
          <div className="flex bg-[#F8F6F1] rounded-xl p-1 mb-4">
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
                {t === 'strong' ? `What's strong (${strongHighlights.length})` : `What to improve (${improveHighlights.length})`}
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-4 mb-6">
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {tabHighlights.map((h) => {
                const listIndex = highlights.indexOf(h)
                const isActive = activeListIndex === listIndex
                const anchored = Boolean(locateHighlight(cvText, h.quote))
                return (
                  <Card
                    key={listIndex}
                    className={`!py-4 cursor-pointer transition-all ${isActive ? '!border-[#E07A5F] !shadow-sm' : ''}`}
                    onClick={() => scrollToListItem(listIndex)}
                  >
                    <div
                      ref={(el) => {
                        if (el) listRefs.current.set(listIndex, el)
                        else listRefs.current.delete(listIndex)
                      }}
                    >
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge color={tab === 'strong' ? 'teal' : 'warn'}>
                          {CATEGORY_LABELS[h.category] || h.category}
                        </Badge>
                        {h.section && (
                          <span className="text-xs text-[#7A756F]">{h.section}</span>
                        )}
                        {!anchored && (
                          <span className="text-xs text-[#7A756F] italic">not located in CV</span>
                        )}
                      </div>
                      <blockquote className="text-sm text-[#7A756F] border-l-2 border-[#E8E3DA] pl-3 mb-2 italic leading-relaxed">
                        &ldquo;{h.quote}&rdquo;
                      </blockquote>
                      <p className="text-sm text-[#2D2926] leading-relaxed">{h.label}</p>
                      {h.suggestion && (
                        <p className="text-sm text-[#3D8A7A] mt-2 leading-relaxed">
                          <span className="font-medium">Try instead: </span>{h.suggestion}
                        </p>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>

            <Card className="!p-6 md:!p-8 lg:sticky lg:top-6 lg:self-start max-h-[520px] overflow-y-auto">
              <p className="text-xs text-[#7A756F] mb-3 uppercase tracking-wide font-medium">
                Your CV — click a highlight
              </p>
              <div
                className="text-[14px] leading-[1.85] text-[#2D2926] whitespace-pre-wrap"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                {buildDocumentNodes(
                  cvText,
                  tabLocated,
                  activeListIndex ?? -1,
                  tab,
                  markRefs,
                  scrollToListItem,
                )}
              </div>
            </Card>
          </div>

          <div className="flex justify-end mb-6">
            <Btn onClick={skipToQuestionnaire}>Continue to questions →</Btn>
          </div>
        </>
      )}

      {analysisError && (
        <Card className="mb-6 !p-8 md:!p-10">
          <div
            className="text-[15px] leading-[1.85] text-[#2D2926] whitespace-pre-wrap"
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          >
            {cvText}
          </div>
        </Card>
      )}

      <style>{`
        @keyframes cv-highlight-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(224, 122, 95, 0); }
          50% { box-shadow: 0 0 0 4px rgba(224, 122, 95, 0.2); }
        }
        .cv-highlight-active { animation: cv-highlight-pulse 1.2s ease-in-out 1; }
      `}</style>
    </div>
  )
}
