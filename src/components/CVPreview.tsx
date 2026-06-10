'use client'
import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Btn } from '@/components/ui/Btn'
import type { CvDraftContent } from '@/types/cv-builder'

export type { CvDraftContent }

async function copyText(text: string): Promise<boolean> {
  if (!navigator.clipboard?.writeText) return false
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export function formatFullCvPlainText(content: CvDraftContent): string {
  const lines: string[] = []

  // Contact block
  if (content.contact?.name) {
    lines.push(content.contact.name.toUpperCase())
    const contactParts: string[] = []
    if (content.contact.location) contactParts.push(content.contact.location)
    if (content.contact.email) contactParts.push(content.contact.email)
    if (content.contact.phone) contactParts.push(content.contact.phone)
    if (content.contact.linkedin) contactParts.push(content.contact.linkedin)
    if (contactParts.length) lines.push(contactParts.join(' | '))
    lines.push('')
  }

  if (content.headline) {
    lines.push(content.headline)
    lines.push('')
  }

  lines.push('PROFESSIONAL SUMMARY')
  lines.push(content.summary)
  lines.push('')

  if (content.core_skills?.length) {
    lines.push('CORE SKILLS')
    lines.push(content.core_skills.join(' • '))
    lines.push('')
  }

  if (content.relevant_projects?.length) {
    lines.push('CERTIFICATIONS & PROJECTS')
    for (const p of content.relevant_projects) {
      lines.push(`${p.title}: ${p.description}`)
    }
    lines.push('')
  }

  const relevantExp = content.experience?.filter(e => e.tier === 'relevant') ?? []
  const additionalExp = content.experience?.filter(e => e.tier === 'additional') ?? []

  if (relevantExp.length) {
    lines.push('RELEVANT EXPERIENCE')
    for (const exp of relevantExp) {
      const loc = exp.location ? `, ${exp.location}` : ''
      lines.push(`${exp.title} — ${exp.company}${loc}`)
      lines.push(exp.dates)
      for (const bullet of exp.bullets) {
        lines.push(`• ${bullet}`)
      }
      lines.push('')
    }
  }

  if (additionalExp.length) {
    lines.push('ADDITIONAL EXPERIENCE')
    for (const exp of additionalExp) {
      const loc = exp.location ? `, ${exp.location}` : ''
      lines.push(`${exp.title} — ${exp.company}${loc} | ${exp.dates}`)
      for (const bullet of exp.bullets) {
        lines.push(`• ${bullet}`)
      }
    }
    lines.push('')
  }

  if (content.education?.length) {
    lines.push('EDUCATION')
    for (const edu of content.education) {
      lines.push(`${edu.qualification} — ${edu.institution} (${edu.year})`)
      if (edu.notes) lines.push(edu.notes)
    }
    lines.push('')
  }

  if (content.skills?.developing?.length) {
    lines.push('DEVELOPING SKILLS')
    lines.push(content.skills.developing.join(' • '))
    lines.push('')
  }

  return lines.join('\n').trim()
}

function formatCoverLetterText(content: CvDraftContent): string {
  if (!content.cover_letter) return ''
  const lines = [
    content.cover_letter.opening,
    '',
    content.cover_letter.body,
    '',
    content.cover_letter.closing,
  ]
  return lines.join('\n').trim()
}

function SectionCopyBtn({ label, text }: { label: string; text: string }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle')
  const handleCopy = async () => {
    const ok = await copyText(text)
    setStatus(ok ? 'copied' : 'failed')
    setTimeout(() => setStatus('idle'), 2000)
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="text-xs px-3 py-1 rounded-full border border-[#E8E3DA] text-[#7A756F] hover:bg-[#F8F6F1] transition-colors cursor-pointer bg-transparent flex-shrink-0"
      style={status === 'failed' ? { color: '#DC2626', borderColor: '#FECACA' } : undefined}
    >
      {status === 'copied' ? 'Copied' : status === 'failed' ? 'Copy failed' : label}
    </button>
  )
}

function SectionHeader({ label, copyText: text }: { label: string; copyText?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="text-xs font-bold tracking-widest text-[#7A756F]">{label}</div>
      {text && <SectionCopyBtn label="Copy" text={text} />}
    </div>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-4 py-2.5 text-sm font-medium rounded-xl cursor-pointer transition-all duration-150 bg-transparent border-none"
      style={
        active
          ? { background: '#E07A5F', color: '#fff' }
          : { color: '#7A756F' }
      }
    >
      {children}
    </button>
  )
}

type TabId = 'cv' | 'cover' | 'changes' | 'checklist'

// ── Tab 1: Your CV ───────────────────────────────────────────────────────────

function YourCvTab({ content }: { content: CvDraftContent }) {
  const relevantExp = content.experience?.filter(e => e.tier === 'relevant') ?? []
  const additionalExp = content.experience?.filter(e => e.tier === 'additional') ?? []

  const regionLabel: Record<string, string> = {
    UK: 'Formatted for UK — 2-page A4 conventions',
    US: 'Formatted for US — 1–2 page résumé conventions',
    Canada: 'Formatted for Canada — résumé conventions',
    Australia: 'Formatted for Australia',
    EU: 'Formatted for EU — regional conventions applied',
    International: 'International format',
  }
  const badge = regionLabel[content.region_applied] ?? `Formatted for ${content.region_applied}`

  return (
    <div>
      <div className="inline-flex items-center gap-1.5 text-xs text-[#3D8A7A] bg-[#EBF5F3] px-3 py-1 rounded-full mb-6">
        <span>◉</span>
        <span>{badge}</span>
      </div>

      {/* Contact block */}
      {content.contact?.name && (
        <div className="mb-6 pb-6 border-b border-[#E8E3DA]">
          <h2 className="text-xl font-bold text-[#2D2926] mb-1" style={{ fontFamily: 'var(--font-lora)' }}>
            {content.contact.name}
          </h2>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-[#7A756F]">
            {content.contact.location && <span>{content.contact.location}</span>}
            {content.contact.email && <span>{content.contact.email}</span>}
            {content.contact.phone && <span>{content.contact.phone}</span>}
            {content.contact.linkedin && <span>{content.contact.linkedin}</span>}
          </div>
        </div>
      )}

      {/* Headline */}
      <div className="mb-6">
        <SectionHeader label="HEADLINE" copyText={content.headline} />
        <p className="text-[17px] font-semibold leading-relaxed text-[#2D2926]" style={{ fontFamily: 'var(--font-lora)' }}>
          {content.headline}
        </p>
      </div>

      {/* Professional Summary */}
      <div className="mb-6 pb-6 border-b border-[#E8E3DA]">
        <SectionHeader label="PROFESSIONAL SUMMARY" copyText={content.summary} />
        <p className="text-[15px] leading-[1.85] text-[#2D2926]">{content.summary}</p>
      </div>

      {/* Core Skills */}
      {content.core_skills?.length > 0 && (
        <div className="mb-6 pb-6 border-b border-[#E8E3DA]">
          <SectionHeader label="CORE SKILLS" copyText={content.core_skills.join(' • ')} />
          <div className="flex flex-wrap gap-2">
            {content.core_skills.map(skill => (
              <span key={skill} className="text-xs px-3 py-1 rounded-full bg-[#EBF5F3] text-[#3D8A7A]">{skill}</span>
            ))}
          </div>
        </div>
      )}

      {/* Certifications & Projects */}
      {content.relevant_projects?.length > 0 && (
        <div className="mb-6 pb-6 border-b border-[#E8E3DA]">
          <SectionHeader label="CERTIFICATIONS & PROJECTS" />
          <div className="flex flex-col gap-3">
            {content.relevant_projects.map((p, i) => (
              <div key={i}>
                <div className="font-medium text-[#2D2926] text-sm">{p.title}</div>
                <div className="text-sm text-[#7A756F] leading-relaxed">{p.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Relevant Experience */}
      {relevantExp.length > 0 && (
        <div className="mb-6 pb-6 border-b border-[#E8E3DA]">
          <SectionHeader label="RELEVANT EXPERIENCE" />
          <div className="flex flex-col gap-6">
            {relevantExp.map((exp, i) => (
              <div key={i} className="border-b border-[#F0EDE8] last:border-0 pb-5 last:pb-0">
                <div className="flex justify-between items-start gap-3 mb-1">
                  <div>
                    <div className="font-semibold text-[#2D2926]">{exp.title}</div>
                    <div className="text-sm text-[#7A756F]">
                      {exp.company}{exp.location ? `, ${exp.location}` : ''} · {exp.dates}
                    </div>
                  </div>
                  <SectionCopyBtn label="Copy" text={[
                    `${exp.title} — ${exp.company}${exp.location ? `, ${exp.location}` : ''} | ${exp.dates}`,
                    ...exp.bullets.map(b => `• ${b}`)
                  ].join('\n')} />
                </div>
                <ul className="mt-3 flex flex-col gap-2 pl-0 list-none">
                  {exp.bullets.map((bullet, j) => (
                    <li key={j} className="text-sm text-[#2D2926] leading-relaxed flex gap-2">
                      <span className="text-[#E07A5F] flex-shrink-0 mt-0.5">•</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional Experience */}
      {additionalExp.length > 0 && (
        <div className="mb-6 pb-6 border-b border-[#E8E3DA]">
          <SectionHeader label="ADDITIONAL EXPERIENCE" />
          <div className="flex flex-col gap-3">
            {additionalExp.map((exp, i) => (
              <div key={i}>
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <span className="font-medium text-[#2D2926] text-sm">{exp.title}</span>
                    <span className="text-sm text-[#7A756F]"> — {exp.company}{exp.location ? `, ${exp.location}` : ''} · {exp.dates}</span>
                  </div>
                </div>
                {exp.bullets.slice(0, 1).map((bullet, j) => (
                  <p key={j} className="text-sm text-[#7A756F] leading-relaxed mt-1 flex gap-2">
                    <span className="flex-shrink-0">•</span>
                    <span>{bullet}</span>
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {content.education?.length > 0 && (
        <div className="mb-6 pb-6 border-b border-[#E8E3DA]">
          <SectionHeader label="EDUCATION" />
          <div className="flex flex-col gap-3">
            {content.education.map((edu, i) => (
              <div key={i}>
                <div className="font-medium text-[#2D2926] text-sm">{edu.qualification}</div>
                <div className="text-sm text-[#7A756F]">{edu.institution} · {edu.year}</div>
                {edu.notes && <div className="text-xs text-[#7A756F] mt-0.5">{edu.notes}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Developing Skills */}
      {content.skills?.developing?.length > 0 && (
        <div className="mb-2">
          <SectionHeader label="DEVELOPING SKILLS" copyText={content.skills.developing.join(' • ')} />
          <div className="flex flex-wrap gap-2">
            {content.skills.developing.map(skill => (
              <span key={skill} className="text-xs px-3 py-1 rounded-full bg-[#FEF7E8] text-[#E8A838]">{skill}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Tab 2: Cover Letter ──────────────────────────────────────────────────────

function CoverLetterTab({ content }: { content: CvDraftContent }) {
  const cl = content.cover_letter
  if (!cl?.opening && !cl?.body && !cl?.closing) {
    return (
      <div className="text-sm text-[#7A756F] py-8 text-center">
        No cover letter was generated. Try regenerating your CV.
      </div>
    )
  }

  const fullText = formatCoverLetterText(content)

  return (
    <div>
      <div className="flex justify-end mb-4">
        <SectionCopyBtn label="Copy cover letter" text={fullText} />
      </div>
      <div className="flex flex-col gap-5 text-[15px] text-[#2D2926] leading-[1.85]">
        {cl.opening && <p>{cl.opening}</p>}
        {cl.body && <p>{cl.body}</p>}
        {cl.closing && <p>{cl.closing}</p>}
      </div>
    </div>
  )
}

// ── Tab 3: What Changed ──────────────────────────────────────────────────────

function WhatChangedTab({ content }: { content: CvDraftContent }) {
  const hasReframing = content.reframing_examples?.length > 0
  const hasKeywords = content.keyword_mapping?.length > 0

  return (
    <div className="flex flex-col gap-8">
      {/* Tailoring notes */}
      {content.tailoring_notes && (
        <div>
          <div className="text-xs font-bold tracking-widest text-[#7A756F] mb-3">REFRAMING STRATEGY</div>
          <p className="text-[15px] text-[#2D2926] leading-[1.85]">{content.tailoring_notes}</p>
        </div>
      )}

      {/* Before / after examples */}
      {hasReframing && (
        <div>
          <div className="text-xs font-bold tracking-widest text-[#7A756F] mb-3">
            REFRAMING EXAMPLES ({content.reframing_examples.length})
          </div>
          <div className="flex flex-col gap-4">
            {content.reframing_examples.map((ex, i) => (
              <div key={i} className="rounded-xl border border-[#E8E3DA] overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#E8E3DA]">
                  <div className="p-4 bg-[#FEF2F2]">
                    <div className="text-xs font-semibold text-[#DC2626] mb-1.5">BEFORE</div>
                    <p className="text-sm text-[#2D2926] leading-relaxed">{ex.before}</p>
                  </div>
                  <div className="p-4 bg-[#F0FAF8]">
                    <div className="text-xs font-semibold text-[#3D8A7A] mb-1.5">AFTER</div>
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

      {/* Keyword mapping */}
      {hasKeywords && (
        <div>
          <div className="text-xs font-bold tracking-widest text-[#7A756F] mb-3">KEYWORD MAPPING</div>
          <div className="rounded-xl border border-[#E8E3DA] overflow-hidden">
            <div className="grid grid-cols-2 bg-[#F8F6F1] px-4 py-2 border-b border-[#E8E3DA]">
              <div className="text-xs font-semibold text-[#7A756F]">JD KEYWORD</div>
              <div className="text-xs font-semibold text-[#7A756F]">EVIDENCE IN YOUR CV</div>
            </div>
            {content.keyword_mapping.map((km, i) => (
              <div
                key={i}
                className="grid grid-cols-2 px-4 py-3 text-sm border-b border-[#E8E3DA] last:border-0"
              >
                <div className="font-medium text-[#2D2926] pr-3">{km.jd_keyword}</div>
                <div className="text-[#7A756F]">{km.evidence_in_cv}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Employment gaps */}
      {content.gaps_addressed?.length > 0 && (
        <div>
          <div className="text-xs font-bold tracking-widest text-[#7A756F] mb-3">GAPS ADDRESSED</div>
          <div className="flex flex-col gap-3">
            {content.gaps_addressed.map((gap, i) => (
              <div key={i} className="rounded-xl border border-[#E8E3DA] px-4 py-3">
                <div className="text-xs font-semibold text-[#2D2926] mb-1">{gap.period}</div>
                <p className="text-sm text-[#7A756F]">{gap.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!content.tailoring_notes && !hasReframing && !hasKeywords && (
        <div className="text-sm text-[#7A756F] py-8 text-center">
          No change notes were generated. Try regenerating your CV.
        </div>
      )}
    </div>
  )
}

// ── Tab 4: ATS Checklist ─────────────────────────────────────────────────────

function AtsChecklistTab({ content }: { content: CvDraftContent }) {
  const items = content.optimization_checklist
  if (!items?.length) {
    return (
      <div className="text-sm text-[#7A756F] py-8 text-center">
        No checklist was generated. Try regenerating your CV.
      </div>
    )
  }

  const passed = items.filter(c => c.passed).length
  const total = items.length
  const pct = Math.round((passed / total) * 100)

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ background: pct >= 80 ? '#EBF5F3' : pct >= 60 ? '#FEF7E8' : '#FEF2F2', color: pct >= 80 ? '#3D8A7A' : pct >= 60 ? '#E8A838' : '#DC2626' }}
        >
          {pct}%
        </div>
        <div>
          <div className="font-medium text-[#2D2926]">{passed} of {total} checks passed</div>
          <div className="text-sm text-[#7A756F]">
            {pct >= 80 ? 'This CV is well-optimised for ATS.' : pct >= 60 ? 'A few items need attention before applying.' : 'Several items need attention before applying.'}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-start gap-3 px-4 py-3 rounded-xl border"
            style={{ borderColor: item.passed ? '#D1FAE5' : '#FECACA', background: item.passed ? '#F0FDF4' : '#FFF5F5' }}
          >
            <span className="flex-shrink-0 mt-0.5 text-base" style={{ color: item.passed ? '#16A34A' : '#DC2626' }}>
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
  )
}

// ── Main component ───────────────────────────────────────────────────────────

interface CVPreviewProps {
  content: CvDraftContent
  onRegenerate: () => void
  regenerating?: boolean
}

export default function CVPreview({ content, onRegenerate, regenerating }: CVPreviewProps) {
  const [activeTab, setActiveTab] = useState<TabId>('cv')
  const [fullCopyStatus, setFullCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle')

  const hasCoverLetter = !!(content.cover_letter?.opening)
  const hasChanges = !!(content.tailoring_notes || content.reframing_examples?.length || content.keyword_mapping?.length)
  const hasChecklist = !!(content.optimization_checklist?.length)

  const handleCopyFull = async () => {
    const ok = await copyText(formatFullCvPlainText(content))
    setFullCopyStatus(ok ? 'copied' : 'failed')
    setTimeout(() => setFullCopyStatus('idle'), 2000)
  }

  const tabs: { id: TabId; label: string; show: boolean }[] = [
    { id: 'cv', label: 'Your CV', show: true },
    { id: 'cover', label: 'Cover letter', show: hasCoverLetter },
    { id: 'changes', label: 'What changed', show: hasChanges },
    { id: 'checklist', label: 'ATS checklist', show: hasChecklist },
  ]

  const visibleTabs = tabs.filter(t => t.show)

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 mb-1 p-1 bg-[#F8F6F1] rounded-xl w-fit flex-wrap">
        {visibleTabs.map(tab => (
          <TabButton key={tab.id} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </TabButton>
        ))}
      </div>

      {/* Tab content */}
      <Card className="!p-8 md:!p-10">
        {activeTab === 'cv' && <YourCvTab content={content} />}
        {activeTab === 'cover' && <CoverLetterTab content={content} />}
        {activeTab === 'changes' && <WhatChangedTab content={content} />}
        {activeTab === 'checklist' && <AtsChecklistTab content={content} />}
      </Card>

      {/* Action bar */}
      <div className="flex flex-wrap gap-3 mt-4">
        {activeTab === 'cv' && (
          <Btn
            onClick={handleCopyFull}
            variant={fullCopyStatus === 'failed' ? 'outline' : 'primary'}
          >
            {fullCopyStatus === 'copied' ? 'Copied full CV' : fullCopyStatus === 'failed' ? 'Copy failed — try again' : 'Copy full CV'}
          </Btn>
        )}
        {activeTab === 'cover' && hasCoverLetter && (
          <SectionCopyBtn label="Copy cover letter" text={formatCoverLetterText(content)} />
        )}
        <Btn variant="outline" onClick={onRegenerate} loading={regenerating}>
          Regenerate
        </Btn>
      </div>
    </div>
  )
}
