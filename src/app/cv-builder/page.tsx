'use client'
import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { Btn } from '@/components/ui/Btn'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import CVPreview from '@/components/CVPreview'
import { CvBuilderGenerationProgress } from '@/components/CvBuilderGenerationProgress'
import type { CvDraftContent, CvDraftCore, CvDraftLetter, CvRegion } from '@/types/cv-builder'

interface Pathway {
  id: string
  title: string
  capability_overlap: number
}

type ViewMode = 'input' | 'output'

const REGIONS: { value: CvRegion; label: string }[] = [
  { value: 'UK', label: 'UK (CV, A4, British English)' },
  { value: 'US', label: 'US (Résumé, 1–2 pages)' },
  { value: 'Canada', label: 'Canada (Résumé, 1–2 pages)' },
  { value: 'Australia', label: 'Australia (Résumé, 2–4 pages)' },
  { value: 'EU', label: 'EU / Europe' },
  { value: 'International', label: 'International / Other' },
]

function inferRegion(location: string): CvRegion {
  const loc = location.toLowerCase()
  if (loc.includes('uk') || loc.includes('england') || loc.includes('scotland') || loc.includes('wales') || loc.includes('london') || loc.includes('manchester') || loc.includes('birmingham')) return 'UK'
  if (loc.includes('australia') || loc.includes('sydney') || loc.includes('melbourne')) return 'Australia'
  if (loc.includes('canada') || loc.includes('ontario') || loc.includes('toronto') || loc.includes('vancouver')) return 'Canada'
  if (loc.includes('usa') || loc.includes('united states') || loc.includes('new york') || loc.includes('los angeles')) return 'US'
  return 'UK'
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="mb-4 text-sm text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-4 py-3 flex items-start justify-between gap-3">
      <span className="leading-relaxed">{message}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="text-xs font-medium text-[#DC2626] bg-transparent border border-[#FECACA] rounded-lg px-3 py-1 cursor-pointer hover:bg-white flex-shrink-0"
        >
          Retry
        </button>
      )}
    </div>
  )
}

function WarningBanner({ message }: { message: string }) {
  return (
    <div className="mb-4 text-sm text-[#92400E] bg-[#FEF7E8] border border-[#E8A838] rounded-xl px-4 py-3 leading-relaxed">
      {message}
    </div>
  )
}

function isMissingDraftsTable(err: { code?: string; message?: string }) {
  return (
    err.code === '42P01' ||
    err.code === 'PGRST205' ||
    err.message?.includes('cv_drafts') ||
    err.message?.toLowerCase().includes('does not exist')
  )
}

function isValidDraft(data: unknown): data is CvDraftContent {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  const hasOldShape = typeof d.headline === 'string' && typeof d.summary === 'string' && Array.isArray(d.experience)
  const hasNewShape = typeof d.headline === 'string' && Array.isArray(d.experience)
  return hasOldShape || hasNewShape
}

function upgradeOldDraft(data: Record<string, unknown>): CvDraftContent {
  const skills = (data.skills as { core?: unknown[]; developing?: unknown[] }) || {}
  return {
    contact: {
      name: (data._inputs as Record<string, unknown>)?.name as string || '',
      location: (data._inputs as Record<string, unknown>)?.location as string || '',
    },
    region_applied: 'UK',
    format: 'hybrid',
    headline: (data.headline as string) || '',
    summary: (data.summary as string) || '',
    core_skills: Array.isArray(skills.core) ? skills.core.map(s => String(s)) : [],
    relevant_projects: [],
    experience: Array.isArray(data.experience)
      ? (data.experience as Record<string, unknown>[]).map(e => ({
          company: String(e.company || ''),
          title: String(e.title || ''),
          dates: String(e.dates || ''),
          tier: 'relevant' as const,
          bullets: Array.isArray(e.bullets) ? e.bullets.map(b => String(b)) : [],
        }))
      : [],
    education: [],
    skills: {
      core: Array.isArray(skills.core) ? skills.core.map(s => String(s)) : [],
      developing: Array.isArray(skills.developing) ? skills.developing.map(s => String(s)) : [],
    },
    gaps_addressed: [],
    tailoring_notes: (data.tailoring_notes as string) || '',
    reframing_examples: [],
    keyword_mapping: [],
    optimization_checklist: [],
    cover_letter: { opening: '', body: '', closing: '' },
    _inputs: data._inputs as CvDraftContent['_inputs'],
  }
}

function CVBuilderContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [noProfile, setNoProfile] = useState(false)
  const [pathways, setPathways] = useState<Pathway[]>([])
  const [pathwayId, setPathwayId] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('input')
  const [draft, setDraft] = useState<CvDraftContent | null>(null)

  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [targetRegion, setTargetRegion] = useState<CvRegion>('UK')
  const [historyText, setHistoryText] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [showJdInput, setShowJdInput] = useState(false)

  const [generating, setGenerating] = useState(false)
  const [generatingPhase, setGeneratingPhase] = useState(0)
  const [error, setError] = useState('')
  const [warning, setWarning] = useState('')
  const [loadError, setLoadError] = useState('')
  const [confirmRegenerate, setConfirmRegenerate] = useState(false)
  const [initKey, setInitKey] = useState(0)

  const loadDraftForPathway = useCallback(async (userId: string, pid: string): Promise<{ found: boolean; warning?: string }> => {
    const { data, error: draftError } = await supabase
      .from('cv_drafts')
      .select('content_json')
      .eq('user_id', userId)
      .eq('pathway_id', pid)
      .maybeSingle()

    if (draftError) {
      console.warn('[cv-builder] Draft load failed:', draftError)
      setDraft(null)
      setViewMode('input')
      return {
        found: false,
        warning: isMissingDraftsTable(draftError)
          ? "Draft saving is not set up yet — run migration 004_cv_drafts.sql in Supabase. You can still build a CV below; it just won't be saved between visits."
          : 'Could not load your saved draft. You can still build a new CV below.',
      }
    }

    const raw = data?.content_json
    if (!raw || !isValidDraft(raw)) {
      setDraft(null)
      setViewMode('input')
      return { found: false }
    }

    const content = 'region_applied' in (raw as object)
      ? raw as CvDraftContent
      : upgradeOldDraft(raw as unknown as Record<string, unknown>)

    setDraft(content)
    setViewMode('output')
    if (content._inputs) {
      setName(content._inputs.name || '')
      setLocation(content._inputs.location || '')
      setTargetRole(content._inputs.targetRole || '')
      setTargetRegion(content._inputs.targetRegion || 'UK')
      setHistoryText(content._inputs.historyText || '')
      if (content._inputs.jobDescription) {
        setJobDescription(content._inputs.jobDescription)
        setShowJdInput(true)
      }
    }
    return { found: true }
  }, [supabase])

  const applyPrefill = useCallback((
    userName: string,
    cityAnswer: string,
    cvText: string,
    pathway: Pathway | undefined,
  ) => {
    setName(userName)
    const loc = cityAnswer
    setLocation(loc)
    setTargetRegion(inferRegion(loc))
    if (pathway) setTargetRole(pathway.title)
    if (cvText && !cvText.startsWith('[')) setHistoryText(cvText)
  }, [])

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      setLoading(true)
      setLoadError('')
      setError('')
      setWarning('')

      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) { router.replace('/auth'); return }

        const [
          { data: report, error: reportError },
          { data: pathwayRows, error: pathwaysError },
          { data: userData, error: userError },
          { data: cvData, error: cvError },
          { data: cityAnswer, error: cityError },
        ] = await Promise.all([
          supabase.from('capability_reports').select('id').eq('user_id', user.id)
            .order('created_at', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('career_pathways').select('id, title, capability_overlap')
            .eq('user_id', user.id).order('capability_overlap', { ascending: false }),
          supabase.from('users').select('name, email').eq('id', user.id).single(),
          supabase.from('cv_uploads').select('extracted_text').eq('user_id', user.id).maybeSingle(),
          supabase.from('questionnaire_answers').select('answer_value')
            .eq('user_id', user.id).eq('question_key', 'city').maybeSingle(),
        ])

        if (cancelled) return
        if (reportError || pathwaysError) throw new Error('Failed to load your profile data. Please try again.')
        if (userError) console.warn('[cv-builder] User fetch failed:', userError)
        if (cvError) console.warn('[cv-builder] CV fetch failed:', cvError)
        if (cityError) console.warn('[cv-builder] City answer fetch failed:', cityError)

        if (!report) { setNoProfile(true); return }
        const list = pathwayRows || []
        if (list.length === 0) { setNoProfile(true); return }

        setPathways(list)
        const paramId = searchParams.get('pathwayId')
        const selected = list.find(p => p.id === paramId) || list[0]
        setPathwayId(selected.id)

        let city = ''
        if (cityAnswer?.answer_value) {
          try { city = JSON.parse(cityAnswer.answer_value as string) }
          catch { city = String(cityAnswer.answer_value) }
        }

        const cvText = cvData?.extracted_text || ''
        applyPrefill(userData?.name || '', city, cvText, selected)

        const draftResult = await loadDraftForPathway(user.id, selected.id)
        if (draftResult.warning && !cancelled) setWarning(draftResult.warning)
      } catch (err: unknown) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Failed to load CV Builder. Please try again.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    init()
    return () => { cancelled = true }
  }, [supabase, router, searchParams, loadDraftForPathway, applyPrefill, initKey])

  const handlePathwayChange = async (newId: string) => {
    setPathwayId(newId)
    setError('')
    setWarning('')
    setConfirmRegenerate(false)
    router.replace(`/cv-builder?pathwayId=${newId}`, { scroll: false })
    const pathway = pathways.find(p => p.id === newId)
    if (pathway) setTargetRole(pathway.title)
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) { router.replace('/auth'); return }
      const draftResult = await loadDraftForPathway(user.id, newId)
      if (draftResult.warning) setWarning(draftResult.warning)
      if (!draftResult.found && pathway) setTargetRole(pathway.title)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not switch pathway. Please try again.')
      setViewMode('input')
    }
  }

  const buildPayload = useCallback(() => ({
    pathwayId,
    name,
    location,
    targetRole,
    targetRegion,
    historyText,
    jobDescription: jobDescription.trim() || undefined,
  }), [pathwayId, name, location, targetRole, targetRegion, historyText, jobDescription])

  const generate = async () => {
    if (!historyText.trim()) {
      setError('Please add your work history before building.')
      return
    }
    setGenerating(true)
    setGeneratingPhase(1)
    setError('')
    setWarning('')
    setConfirmRegenerate(false)

    try {
      const basePayload = buildPayload()

      const coreRes = await fetch('/api/cv-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...basePayload, phase: 'core' }),
      })

      let coreData: { core?: CvDraftCore; error?: string }
      try {
        coreData = await coreRes.json()
      } catch {
        throw new Error(`Server returned an invalid response (${coreRes.status}). Please try again.`)
      }

      if (!coreRes.ok) throw new Error(coreData.error || `Request failed (${coreRes.status})`)
      if (!coreData.core?.headline && !coreData.core?.summary) {
        throw new Error('Received an invalid CV from the server. Please try again.')
      }

      setGeneratingPhase(2)

      const letterRes = await fetch('/api/cv-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...basePayload,
          phase: 'letter',
          core: coreData.core,
        }),
      })

      let letterData: { letter?: CvDraftLetter; error?: string }
      try {
        letterData = await letterRes.json()
      } catch {
        throw new Error(`Server returned an invalid response (${letterRes.status}). Please try again.`)
      }

      if (!letterRes.ok) throw new Error(letterData.error || `Request failed (${letterRes.status})`)
      if (!letterData.letter?.cover_letter?.opening) {
        throw new Error('Received an invalid cover letter from the server. Please try again.')
      }

      setGeneratingPhase(3)

      const finalRes = await fetch('/api/cv-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...basePayload,
          phase: 'finalize',
          core: coreData.core,
          letter: letterData.letter,
        }),
      })

      let data: { draft?: unknown; error?: string; warning?: string; saved?: boolean }
      try {
        data = await finalRes.json()
      } catch {
        throw new Error(`Server returned an invalid response (${finalRes.status}). Please try again.`)
      }

      if (!finalRes.ok) throw new Error(data.error || `Request failed (${finalRes.status})`)
      if (!isValidDraft(data.draft)) throw new Error('Received an invalid CV from the server. Please try again.')

      const content = 'region_applied' in (data.draft as object)
        ? data.draft as CvDraftContent
        : upgradeOldDraft(data.draft as unknown as Record<string, unknown>)

      setDraft(content)
      setViewMode('output')
      if (data.saved === false && data.warning) setWarning(data.warning)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate CV. Please try again.')
    } finally {
      setGenerating(false)
      setGeneratingPhase(0)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E8E3DA] rounded-full animate-spin" style={{ borderTopColor: '#E07A5F' }} />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="max-w-[600px] mx-auto px-6 py-16">
        <Card className="!py-10 text-center">
          <h1 className="text-2xl mb-3" style={{ fontFamily: 'var(--font-lora)' }}>Could not load CV Builder</h1>
          <p className="text-sm text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-4 py-3 mb-6 leading-relaxed text-left">{loadError}</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Btn onClick={() => setInitKey(k => k + 1)}>Try again</Btn>
            <Btn variant="outline" onClick={() => router.push('/dashboard')}>← Back to dashboard</Btn>
          </div>
        </Card>
      </div>
    )
  }

  if (noProfile) {
    return (
      <div className="max-w-[600px] mx-auto px-6 py-16 text-center">
        <Card className="!py-12">
          <div className="text-4xl mb-4">◎</div>
          <h1 className="text-2xl mb-3" style={{ fontFamily: 'var(--font-lora)' }}>CV Builder needs your profile first</h1>
          <p className="text-[#7A756F] leading-relaxed mb-6 max-w-md mx-auto">
            The builder translates your experience into the language of your target pathway — but it needs your capability profile to know how.
          </p>
          <Btn onClick={() => router.push('/generating')}>Generate my profile →</Btn>
        </Card>
      </div>
    )
  }

  const selectedPathway = pathways.find(p => p.id === pathwayId)

  return (
    <div className="max-w-[900px] mx-auto px-6 py-10">
      {generating && generatingPhase > 0 && (
        <CvBuilderGenerationProgress phase={generatingPhase} />
      )}
      <div className="mb-8">
        <h1 className="text-3xl mb-2" style={{ fontFamily: 'var(--font-lora)' }}>CV Builder</h1>
        <p className="text-[#7A756F] text-sm leading-relaxed">
          Hybrid career-change format — ATS-optimised, regionally correct, with a cover letter.
        </p>
      </div>

      {error && <ErrorBanner message={error} onRetry={viewMode === 'input' ? generate : undefined} />}
      {warning && <WarningBanner message={warning} />}

      {pathways.length > 1 && (
        <div className="mb-6">
          <label className="text-xs font-semibold text-[#7A756F] tracking-wide mb-2 block">TARGET PATHWAY</label>
          <select
            value={pathwayId}
            onChange={e => handlePathwayChange(e.target.value)}
            className="w-full px-4 py-3 border border-[#E8E3DA] rounded-xl text-[15px] bg-white text-[#2D2926] outline-none focus:border-[#E07A5F] transition-colors cursor-pointer"
          >
            {pathways.map(p => (
              <option key={p.id} value={p.id}>
                {p.title} ({p.capability_overlap}% overlap)
              </option>
            ))}
          </select>
        </div>
      )}

      {viewMode === 'output' && draft ? (
        <>
          <CVPreview
            content={draft}
            onRegenerate={() => setConfirmRegenerate(true)}
            regenerating={generating}
          />
          {confirmRegenerate && !generating && (
            <Card className="mt-4 !bg-[#FEF2F2] !border-[#FECACA]">
              <p className="text-sm text-[#2D2926] mb-4">This will replace your current draft.</p>
              <div className="flex gap-3">
                <Btn size="sm" onClick={generate}>Yes, regenerate</Btn>
                <Btn size="sm" variant="outline" onClick={() => setConfirmRegenerate(false)}>Cancel</Btn>
              </div>
            </Card>
          )}
          <button
            type="button"
            onClick={() => setViewMode('input')}
            className="mt-4 text-sm text-[#7A756F] hover:text-[#2D2926] bg-transparent border-none cursor-pointer underline-offset-2 hover:underline"
          >
            Edit inputs
          </button>
        </>
      ) : (
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-semibold text-[#7A756F] mb-1.5 block">Name</label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#7A756F] mb-1.5 block">Location</label>
              <Input value={location} onChange={e => {
                setLocation(e.target.value)
                setTargetRegion(inferRegion(e.target.value))
              }} placeholder="City, Country" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-semibold text-[#7A756F] mb-1.5 block">Target role</label>
              <Input
                value={targetRole}
                onChange={e => setTargetRole(e.target.value)}
                placeholder={selectedPathway?.title || 'Target role'}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#7A756F] mb-1.5 block">Target region</label>
              <select
                value={targetRegion}
                onChange={e => setTargetRegion(e.target.value as CvRegion)}
                className="w-full px-4 py-3 border border-[#E8E3DA] rounded-xl text-[15px] bg-white text-[#2D2926] outline-none focus:border-[#E07A5F] transition-colors cursor-pointer"
              >
                {REGIONS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="text-xs font-semibold text-[#7A756F] mb-1.5 block">Work history</label>
            <p className="text-xs text-[#7A756F] mb-2">Rough notes are fine. The builder does the rewriting.</p>
            <Textarea
              value={historyText}
              onChange={e => setHistoryText(e.target.value)}
              placeholder="Paste or type your CV, roles, responsibilities, achievements — anything about your work history."
              className="min-h-[200px]"
            />
          </div>
          <div className="mb-6">
            {!showJdInput ? (
              <button
                type="button"
                onClick={() => setShowJdInput(true)}
                className="text-xs text-[#7A756F] hover:text-[#2D2926] bg-transparent border-none cursor-pointer underline-offset-2 hover:underline"
              >
                + Paste a job description to tailor keywords and language (optional)
              </button>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#7A756F]">Job description (optional)</label>
                  <button
                    type="button"
                    onClick={() => { setShowJdInput(false); setJobDescription('') }}
                    className="text-xs text-[#7A756F] bg-transparent border-none cursor-pointer hover:text-[#2D2926]"
                  >
                    Remove
                  </button>
                </div>
                <p className="text-xs text-[#7A756F] mb-2">The builder will mirror the posting's exact keywords and terminology.</p>
                <Textarea
                  value={jobDescription}
                  onChange={e => setJobDescription(e.target.value)}
                  placeholder="Paste the job posting here…"
                  className="min-h-[120px]"
                />
              </div>
            )}
          </div>
          <div>
            <Btn onClick={generate} loading={generating}>
              {generating ? 'Building your CV…' : 'Build my CV →'}
            </Btn>
          </div>
        </Card>
      )}
    </div>
  )
}

export default function CVBuilderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E8E3DA] rounded-full animate-spin" style={{ borderTopColor: '#E07A5F' }} />
      </div>
    }>
      <CVBuilderContent />
    </Suspense>
  )
}
