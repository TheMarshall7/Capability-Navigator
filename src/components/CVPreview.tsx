'use client'
import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Btn } from '@/components/ui/Btn'
import type { CvDraftContent } from '@/app/api/cv-builder/route'

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
  const lines: string[] = [
    content.headline,
    '',
    content.summary,
    '',
    'EXPERIENCE',
  ]

  for (const exp of content.experience) {
    lines.push(`${exp.company} | ${exp.title} | ${exp.dates}`)
    for (const bullet of exp.bullets) {
      lines.push(`• ${bullet}`)
    }
    lines.push('')
  }

  lines.push('SKILLS')
  lines.push(`Core: ${content.skills.core.join(', ')}`)
  lines.push(`Developing: ${content.skills.developing.join(', ')}`)

  return lines.join('\n').trim()
}

function formatExperienceBlock(exp: CvDraftContent['experience'][0]): string {
  const lines = [`${exp.company} | ${exp.title} | ${exp.dates}`]
  for (const bullet of exp.bullets) {
    lines.push(`• ${bullet}`)
  }
  return lines.join('\n')
}

function SectionCopy({ label, text }: { label: string; text: string }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle')
  const handleCopy = async () => {
    const ok = await copyText(text)
    setStatus(ok ? 'copied' : 'failed')
    setTimeout(() => setStatus('idle'), 2000)
  }
  const labelText = status === 'copied' ? 'Copied' : status === 'failed' ? 'Copy failed' : label
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="text-xs px-3 py-1 rounded-full border border-[#E8E3DA] text-[#7A756F] hover:bg-[#F8F6F1] transition-colors cursor-pointer bg-transparent"
      style={status === 'failed' ? { color: '#DC2626', borderColor: '#FECACA' } : undefined}
    >
      {labelText}
    </button>
  )
}

interface CVPreviewProps {
  content: CvDraftContent
  onRegenerate: () => void
  regenerating?: boolean
}

export default function CVPreview({ content, onRegenerate, regenerating }: CVPreviewProps) {
  const [fullCopyStatus, setFullCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle')

  const handleCopyFull = async () => {
    const ok = await copyText(formatFullCvPlainText(content))
    setFullCopyStatus(ok ? 'copied' : 'failed')
    setTimeout(() => setFullCopyStatus('idle'), 2000)
  }

  const fullCopyLabel =
    fullCopyStatus === 'copied' ? 'Copied full CV' :
    fullCopyStatus === 'failed' ? 'Copy failed — try again' :
    'Copy full CV'

  const skillsText = `Core: ${content.skills.core.join(', ')}\nDeveloping: ${content.skills.developing.join(', ')}`

  return (
    <div>
      <Card className="mb-5 !bg-[#FEF7E8] !border-[#E8A838]">
        <div className="text-xs font-bold tracking-widest text-[#E8A838] mb-2">WHAT CHANGED AND WHY</div>
        <p className="text-sm text-[#2D2926] leading-relaxed">{content.tailoring_notes}</p>
      </Card>

      <Card className="mb-5 !p-8 md:!p-10">
        <div className="flex justify-between items-start gap-3 mb-4">
          <div className="text-xs font-bold tracking-widest text-[#7A756F]">HEADLINE</div>
          <SectionCopy label="Copy" text={content.headline} />
        </div>
        <p className="text-lg font-semibold leading-relaxed mb-8" style={{ fontFamily: 'var(--font-lora)' }}>
          {content.headline}
        </p>

        <div className="flex justify-between items-start gap-3 mb-3">
          <div className="text-xs font-bold tracking-widest text-[#7A756F]">SUMMARY</div>
          <SectionCopy label="Copy" text={content.summary} />
        </div>
        <p className="text-[15px] leading-[1.85] text-[#2D2926] mb-8">{content.summary}</p>

        <div className="text-xs font-bold tracking-widest text-[#7A756F] mb-4">EXPERIENCE</div>
        <div className="flex flex-col gap-6 mb-8">
          {content.experience.map((exp, i) => (
            <div key={i} className="border-b border-[#E8E3DA] last:border-0 pb-6 last:pb-0">
              <div className="flex justify-between items-start gap-3 mb-2">
                <div>
                  <div className="font-semibold text-[#2D2926]">{exp.title}</div>
                  <div className="text-sm text-[#7A756F]">{exp.company} · {exp.dates}</div>
                </div>
                <SectionCopy label="Copy" text={formatExperienceBlock(exp)} />
              </div>
              <ul className="mt-3 flex flex-col gap-2 pl-0 list-none">
                {exp.bullets.map((bullet, j) => (
                  <li key={j} className="text-sm text-[#2D2926] leading-relaxed flex gap-2">
                    <span className="text-[#E07A5F] flex-shrink-0">•</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-start gap-3 mb-3">
          <div className="text-xs font-bold tracking-widest text-[#7A756F]">SKILLS</div>
          <SectionCopy label="Copy" text={skillsText} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs font-semibold text-[#3D8A7A] mb-2">Core</div>
            <div className="flex flex-wrap gap-2">
              {content.skills.core.map(skill => (
                <span key={skill} className="text-xs px-3 py-1 rounded-full bg-[#EBF5F3] text-[#3D8A7A]">{skill}</span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-[#E8A838] mb-2">Developing</div>
            <div className="flex flex-wrap gap-2">
              {content.skills.developing.map(skill => (
                <span key={skill} className="text-xs px-3 py-1 rounded-full bg-[#FEF7E8] text-[#E8A838]">{skill}</span>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Btn
          onClick={handleCopyFull}
          variant={fullCopyStatus === 'failed' ? 'outline' : 'primary'}
        >
          {fullCopyLabel}
        </Btn>
        <Btn variant="outline" onClick={onRegenerate} loading={regenerating}>Regenerate</Btn>
      </div>
    </div>
  )
}
