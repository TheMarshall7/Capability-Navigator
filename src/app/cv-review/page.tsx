'use client'
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type ReactNode,
  Suspense,
} from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
  ats_risk: 'ATS risk',
  career_change: 'Career change',
  regional: 'Regional',
}

const STORAGE_TEXT = 'cv-review-text'
const STORAGE_DATA = 'cv-review-data'
const STORAGE_STATUS = 'cv-review-status'
const STORAGE_HIGHLIGHTS = 'cv-review-highlights'
const POLL_MS = 300
const WAIT_MS = 55_000

type ReportTab = 'overview' | 'highlights' | 'career' | 'ats'

function isReviewableText(text: string): boolean {
  const t = text.trim()
  if (t.length < 80) return false
  if (/^\[.*uploaded/i.test(t) || t.startsWith('[PDF') || t.startsWith('[Word')) return false
  return true
}

function emptyReview(highlights: CvReviewHighlight[] = []): CvReviewResult {
  return {
    overview: { summary: '', strengthsSummary: [], improvementsSummary: [] },
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

// ── Tab components ────────────────────────────────────────────────────────────

function OverviewTab({ review, skipToQuestionnaire }: { review: CvReviewResult; skipToQuestionnaire: () => void }) {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]))

  const toggleSection = (idx: number) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  return (
    <div>
      {review.overview.summary && (
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

      {review.sections.length > 0 && (
        <div className="mb-4 space-y-2">
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

      {review.regional_notes && (
        <Card className="mb-4 !bg-[#F8F6F1]">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#7A756F] mb-1">Regional conventions</p>
          <p className="text-sm text-[#2D2926] leading-relaxed">{review.regional_notes}</p>
        </Card>
      )}

      <div className="flex justify-end">
        <Btn onClick={skipToQuestionnaire}>Continue to questions →</Btn>
      </div>
    </div>
  )
}

function HighlightsTab({
  cvText,
  review,
  tab,
  setTab,
  skipToQuestionnaire,
}: {
  cvText: string
  review: CvReviewResult
  tab: CvReviewTab
  setTab: (t: CvReviewTab) => void
  skipToQuestionnaire: () => void
}) {
  const markRefs = useRef<Map<number, HTMLElement>>(new Map())
  const listRefs = useRef<Map<number, HTMLElement>>(new Map())
  const [activeListIndex, setActiveListIndex] = useState<number | null>(null)

  const highlights = review.highlights
  const strongHighlights = useMemo(() => highlights.filter(h => h.type === 'strong'), [highlights])
  const improveHighlights = useMemo(() => highlights.filter(h => h.type === 'improve'), [highlights])
  const tabHighlights = useMemo(() => highlights.filter(h => h.type === tab), [highlights, tab])
  const tabLocated = useMemo(() => resolveHighlights(cvText, highlights, tab), [cvText, highlights, tab])

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

  return (
    <div>
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
            {buildDocumentNodes(cvText, tabLocated, activeListIndex ?? -1, tab, markRefs, scrollToListItem)}
          </div>
        </Card>
      </div>

      <div className="flex justify-end mb-6">
        <Btn onClick={skipToQuestionnaire}>Continue to questions →</Btn>
      </div>
    </div>
  )
}

function CareerChangeTab({ review }: { review: CvReviewResult }) {
  const cc = review.career_change
  const reframing = review.reframing_opportunities
  const keywordGaps = review.keyword_gaps

  if (!cc && !reframing?.length && !keywordGaps?.length) {
    return (
      <div className="text-sm text-[#7A756F] py-8 text-center">
        Career-change analysis was not included in this review. Try re-running the analysis from the dashboard.
      </div>
    )
  }

  const formatLabels: Record<string, string> = {
    hybrid: 'Hybrid (combination) format — recommended for career-changers',
    chronological: 'Reverse-chronological — missing career-change pivot work',
    functional: 'Functional (skills-only) — not recommended: ATS and recruiters distrust it',
    unclear: 'Format unclear from text',
  }

  const formatColors: Record<string, { bg: string; text: string; border: string }> = {
    hybrid: { bg: '#F0FAF8', text: '#3D8A7A', border: '#D1FAE5' },
    chronological: { bg: '#FEF7E8', text: '#E8A838', border: '#FDE68A' },
    functional: { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
    unclear: { bg: '#F8F6F1', text: '#7A756F', border: '#E8E3DA' },
  }

  const fc = cc ? (formatColors[cc.format] ?? formatColors.unclear) : null

  return (
    <div className="flex flex-col gap-6">
      {cc && (
        <div>
          <h3 className="text-lg mb-3" style={{ fontFamily: 'var(--font-lora)' }}>Career-change diagnostics</h3>
          <div
            className="rounded-xl border px-4 py-3 mb-4 text-sm font-medium"
            style={{ background: fc!.bg, color: fc!.text, borderColor: fc!.border }}
          >
            {formatLabels[cc.format] ?? cc.format}
          </div>

          <div className="space-y-4">
            <Card className="!py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#7A756F] mb-2">Summary / pivot formula</p>
              <p className="text-sm text-[#2D2926] leading-relaxed">{cc.summary_quality || '—'}</p>
            </Card>
            <Card className="!py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#7A756F] mb-2">Transition evidence</p>
              <p className="text-sm text-[#2D2926] leading-relaxed">{cc.transition_evidence || '—'}</p>
            </Card>
            <div className="grid grid-cols-2 gap-3">
              <div
                className="rounded-xl border px-3 py-2.5 text-sm"
                style={cc.jargon_translation_needed
                  ? { background: '#FEF7E8', borderColor: '#FDE68A', color: '#92400E' }
                  : { background: '#F0FAF8', borderColor: '#D1FAE5', color: '#166534' }}
              >
                <span className="font-medium">Jargon translation: </span>
                {cc.jargon_translation_needed ? 'Needed — old-field language detected' : 'Good — target language used'}
              </div>
              <div
                className="rounded-xl border px-3 py-2.5 text-sm"
                style={cc.cover_letter_recommended
                  ? { background: '#EDE9FE', borderColor: '#DDD6FE', color: '#5B21B6' }
                  : { background: '#F8F6F1', borderColor: '#E8E3DA', color: '#7A756F' }}
              >
                <span className="font-medium">Cover letter: </span>
                {cc.cover_letter_recommended ? 'Strongly recommended for this pivot' : 'Optional'}
              </div>
            </div>
          </div>
        </div>
      )}

      {reframing && reframing.length > 0 && (
        <div>
          <h3 className="text-lg mb-3" style={{ fontFamily: 'var(--font-lora)' }}>
            Reframing opportunities ({reframing.length})
          </h3>
          <div className="flex flex-col gap-4">
            {reframing.map((ex, i) => (
              <div key={i} className="rounded-xl border border-[#E8E3DA] overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#E8E3DA]">
                  <div className="p-4 bg-[#FEF2F2]">
                    <div className="text-xs font-semibold text-[#DC2626] mb-1.5">YOUR TEXT (BEFORE)</div>
                    <p className="text-sm text-[#2D2926] leading-relaxed italic">&ldquo;{ex.before}&rdquo;</p>
                  </div>
                  <div className="p-4 bg-[#F0FAF8]">
                    <div className="text-xs font-semibold text-[#3D8A7A] mb-1.5">REFRAMED (AFTER)</div>
                    <p className="text-sm text-[#2D2926] leading-relaxed">{ex.after}</p>
                  </div>
                </div>
                {ex.why && (
                  <div className="px-4 py-3 bg-[#F8F6F1] border-t border-[#E8E3DA]">
                    <span className="text-xs font-semibold text-[#7A756F]">WHY: </span>
                    <span className="text-xs text-[#7A756F]">{ex.why}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {keywordGaps && keywordGaps.length > 0 && (
        <div>
          <h3 className="text-lg mb-3" style={{ fontFamily: 'var(--font-lora)' }}>
            Keyword gaps vs your target pathway
          </h3>
          <div className="rounded-xl border border-[#E8E3DA] overflow-hidden">
            <div className="grid grid-cols-2 bg-[#F8F6F1] px-4 py-2 border-b border-[#E8E3DA]">
              <div className="text-xs font-semibold text-[#7A756F]">MISSING SKILL / KEYWORD</div>
              <div className="text-xs font-semibold text-[#7A756F]">RECOMMENDATION</div>
            </div>
            {keywordGaps.map((gap, i) => (
              <div
                key={i}
                className="grid grid-cols-2 px-4 py-3 text-sm border-b border-[#E8E3DA] last:border-0"
              >
                <div className="font-medium text-[#2D2926] pr-3">{gap.skill}</div>
                <div className="text-[#7A756F]">{gap.note}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function AtsChecklistTab({ review }: { review: CvReviewResult }) {
  const checklist = review.optimization_checklist
  const atsRisks = review.ats_risks

  if ((!checklist || checklist.length === 0) && (!atsRisks || atsRisks.length === 0)) {
    return (
      <div className="text-sm text-[#7A756F] py-8 text-center">
        ATS analysis was not included in this review. Try re-running the analysis from the dashboard.
      </div>
    )
  }

  const passed = checklist?.filter(c => c.passed).length ?? 0
  const total = checklist?.length ?? 0
  const pct = total > 0 ? Math.round((passed / total) * 100) : 0

  const criticalRisks = atsRisks?.filter(r => r.severity === 'critical') ?? []
  const warningRisks = atsRisks?.filter(r => r.severity === 'warning') ?? []

  return (
    <div className="flex flex-col gap-6">
      {checklist && checklist.length > 0 && (
        <div>
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{
                background: pct >= 80 ? '#EBF5F3' : pct >= 60 ? '#FEF7E8' : '#FEF2F2',
                color: pct >= 80 ? '#3D8A7A' : pct >= 60 ? '#E8A838' : '#DC2626',
              }}
            >
              {pct}%
            </div>
            <div>
              <div className="font-medium text-[#2D2926]">{passed} of {total} checks passed</div>
              <div className="text-sm text-[#7A756F]">
                {pct >= 80
                  ? 'This CV is well-optimised for ATS and recruiters.'
                  : pct >= 60
                  ? 'A few items need attention before applying.'
                  : 'Several important items need attention before applying.'}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {checklist.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 px-4 py-3 rounded-xl border"
                style={{
                  borderColor: item.passed ? '#D1FAE5' : '#FECACA',
                  background: item.passed ? '#F0FDF4' : '#FFF5F5',
                }}
              >
                <span
                  className="flex-shrink-0 mt-0.5 text-base font-bold"
                  style={{ color: item.passed ? '#16A34A' : '#DC2626' }}
                >
                  {item.passed ? '✓' : '✗'}
                </span>
                <div>
                  <div className="text-sm text-[#2D2926]">{item.item}</div>
                  {item.note && <div className="text-xs text-[#7A756F] mt-0.5">{item.note}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(criticalRisks.length > 0 || warningRisks.length > 0) && (
        <div>
          <h3 className="text-lg mb-3" style={{ fontFamily: 'var(--font-lora)' }}>ATS risk details</h3>
          {criticalRisks.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#DC2626] mb-2">Critical — fix before applying</p>
              <div className="flex flex-col gap-2">
                {criticalRisks.map((risk, i) => (
                  <div key={i} className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3">
                    <p className="text-sm text-[#2D2926]">{risk.issue}</p>
                    {risk.quote && (
                      <p className="text-xs text-[#7A756F] mt-1 italic">&ldquo;{risk.quote}&rdquo;</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {warningRisks.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#E8A838] mb-2">Warnings — recommended fixes</p>
              <div className="flex flex-col gap-2">
                {warningRisks.map((risk, i) => (
                  <div key={i} className="rounded-xl border border-[#FDE68A] bg-[#FEF7E8] px-4 py-3">
                    <p className="text-sm text-[#2D2926]">{risk.issue}</p>
                    {risk.quote && (
                      <p className="text-xs text-[#7A756F] mt-1 italic">&ldquo;{risk.quote}&rdquo;</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

function CVReviewContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [cvText, setCvText] = useState('')
  const [review, setReview] = useState<CvReviewResult | null>(null)
  const [reportTab, setReportTab] = useState<ReportTab>('overview')
  const [highlightTab, setHighlightTab] = useState<CvReviewTab>('strong')
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

  const fetchReview = useCallback(async (
    text: string,
    pathwayId?: string,
  ): Promise<{ review: CvReviewResult | null; error?: string }> => {
    sessionStorage.setItem(STORAGE_STATUS, 'loading')
    sessionStorage.removeItem(STORAGE_DATA)
    sessionStorage.removeItem(STORAGE_HIGHLIGHTS)

    try {
      const res = await fetch('/api/cv-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, ...(pathwayId ? { pathwayId } : {}) }),
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
    const reanalyze = searchParams.get('reanalyze') === '1'
    const pathwayId = searchParams.get('pathwayId') || undefined

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

        let reviewData: CvReviewResult | null = null
        let reviewError: string | undefined

        if (reanalyze) {
          // Skip cache and force a fresh pathway-aware analysis
          const result = await fetchReview(text, pathwayId)
          reviewData = result.review
          reviewError = result.error
        } else {
          // Poll for in-flight result from cv-upload page
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

          reviewData = await poll()

          if (!reviewData && !cancelled) {
            const result = await fetchReview(text, pathwayId)
            reviewData = result.review
            reviewError = result.error
          }
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
          // If pathway-aware, default to career change tab
          if (pathwayId && reviewData.pathway_title) {
            setReportTab('career')
          }
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
  }, [supabase, router, searchParams, skipToQuestionnaire, fetchReview])

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

  const highlights = review?.highlights ?? []
  const strongCount = highlights.filter(h => h.type === 'strong').length
  const improveCount = highlights.filter(h => h.type === 'improve').length
  const hasCareerData = !!(review?.career_change || review?.reframing_opportunities?.length || review?.keyword_gaps?.length)
  const hasAtsData = !!(review?.optimization_checklist?.length || review?.ats_risks?.length)

  const reportTabs: { id: ReportTab; label: string; show: boolean }[] = [
    { id: 'overview', label: 'Overview', show: true },
    { id: 'highlights', label: `Highlights (${strongCount + improveCount})`, show: highlights.length > 0 },
    { id: 'career', label: 'Career change', show: hasCareerData },
    { id: 'ats', label: 'ATS checklist', show: hasAtsData },
  ]
  const visibleTabs = reportTabs.filter(t => t.show)

  return (
    <div className="max-w-[900px] mx-auto px-6 py-10">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl mb-1" style={{ fontFamily: 'var(--font-lora)' }}>CV review</h1>
          <div className="flex flex-wrap gap-2 items-center">
            {review?.region_inferred && (
              <span className="inline-flex items-center gap-1 text-xs text-[#3D8A7A] bg-[#EBF5F3] px-2.5 py-1 rounded-full">
                ◉ {review.region_inferred} conventions applied
              </span>
            )}
            {review?.pathway_title && (
              <span className="inline-flex items-center gap-1 text-xs text-[#7C6AF0] bg-[#EDE9FE] px-2.5 py-1 rounded-full">
                ◎ Reviewed against: {review.pathway_title}
              </span>
            )}
            {!review?.region_inferred && (
              <p className="text-[#7A756F] text-sm">
                {strongCount > 0 || improveCount > 0
                  ? `${strongCount} strengths · ${improveCount} improvements${review?.sections.length ? ` · ${review.sections.length} sections` : ''}`
                  : 'Loading analysis…'}
              </p>
            )}
          </div>
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
              const pathwayId = searchParams.get('pathwayId') || undefined
              fetchReview(cvText, pathwayId).then(result => {
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

      {review && (
        <>
          {/* Tab bar */}
          <div className="flex gap-1 mb-1 p-1 bg-[#F8F6F1] rounded-xl w-fit flex-wrap">
            {visibleTabs.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setReportTab(t.id)}
                className="px-4 py-2.5 text-sm font-medium rounded-xl cursor-pointer transition-all duration-150 bg-transparent border-none"
                style={reportTab === t.id
                  ? { background: '#E07A5F', color: '#fff' }
                  : { color: '#7A756F' }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="mt-2">
            {reportTab === 'overview' && (
              <OverviewTab review={review} skipToQuestionnaire={skipToQuestionnaire} />
            )}
            {reportTab === 'highlights' && (
              <HighlightsTab
                cvText={cvText}
                review={review}
                tab={highlightTab}
                setTab={setHighlightTab}
                skipToQuestionnaire={skipToQuestionnaire}
              />
            )}
            {reportTab === 'career' && <CareerChangeTab review={review} />}
            {reportTab === 'ats' && <AtsChecklistTab review={review} />}
          </div>
        </>
      )}

      {analysisError && !review && (
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

export default function CVReviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-6">
        <div className="w-8 h-8 border-2 border-[#E8E3DA] rounded-full animate-spin mb-4" style={{ borderTopColor: '#E07A5F' }} />
        <p className="text-[#7A756F] text-sm">Loading…</p>
      </div>
    }>
      <CVReviewContent />
    </Suspense>
  )
}
