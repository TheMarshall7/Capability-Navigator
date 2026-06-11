'use client'
import { useState } from 'react'
import { Btn } from '@/components/ui/Btn'
import { CopyBlock } from '@/components/ui/CopyBlock'

const WEEKS = [
  { week: 1, phase: 'Identity', title: 'Rename what you do', action: 'Update your LinkedIn headline', detail: 'Change it to describe the capability you\'re moving toward — not the role you\'re leaving.', copy: 'Learning Designer | 8 Years Curriculum & Instructional Design | Open to L&D, EdTech & Corporate Training', copyLabel: 'PASTE THIS AS YOUR HEADLINE', why: 'Recruiters in your target field search daily. Your current headline makes you invisible to every one of them.', effort: '5 min', done: true },
  { week: 2, phase: 'Identity', title: 'Find your people', action: 'Join one L&D community and say hello', detail: 'Pick one: L&D Professionals (LinkedIn) or L&D Collective (Slack). Drop one sentence introducing yourself.', copy: 'Hi — I\'m transitioning from teaching into Learning Design. Excited to connect with people doing this work.', copyLabel: 'USE THIS AS YOUR INTRO', why: '80% of transitions happen through conversations, not applications.', effort: '10 min', done: true },
  { week: 3, phase: 'Identity', title: 'Say one true thing publicly', action: 'Post one observation on LinkedIn', detail: 'Share one thing you learned that applies to L&D. First person. One insight. No pitch.', copy: '8 years teaching English. This week I realised I\'d been doing instructional design all along — I just called it lesson planning.\n\nThe hardest part was never the content. It was figuring out when people were ready to receive it.\n\nThat timing instinct? It\'s the only thing that actually matters in learning design too.', copyLabel: 'DRAFT YOUR POST FROM THIS', why: 'One honest post will get more L&D attention than 50 applications.', effort: '20 min', done: false, current: true },
  { week: 4, phase: 'Identity', title: 'Build your first proof', action: 'Open Articulate Rise. Build a 10-minute module.', detail: 'The topic doesn\'t matter. The artifact is what matters — this is your first portfolio piece.', copy: null, why: 'Every L&D posting asks for tool experience. One afternoon removes that blocker.', effort: '2–3 hrs', done: false },
  { week: 5, phase: 'Visibility', title: 'Have your first real conversation', action: 'Send 3 specific messages to L&D professionals', detail: 'Find 3 people with Learning Designer in their title and message each with a specific observation.', copy: 'Hi [name] — I came across your post about [topic] and it landed. I\'m transitioning from teaching into L&D. Would you be open to 15 minutes sometime?', copyLabel: 'ADAPT THIS MESSAGE', why: 'You need 3 real conversations before you start applying.', effort: '20 min', done: false },
]

export default function WeeklyStepWidget() {
  const [open, setOpen] = useState(false)
  const doneCount = WEEKS.filter(w => w.done).length
  const current = WEEKS.find(w => w.current)
  if (!current) return null

  return (
    <div className="mb-5 border border-[#E8E3DA] rounded-2xl overflow-hidden">
      <div
        onClick={() => setOpen(o => !o)}
        className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-4 sm:p-5 cursor-pointer"
        style={{ background: '#FDF0EA' }}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 bg-[#E07A5F] rounded-xl flex items-center justify-center text-white text-sm flex-shrink-0">◆</div>
          <div className="min-w-0">
            <div className="font-semibold text-[15px]">Your step this week</div>
            <div className="text-sm text-[#7A756F] mt-0.5">{current.title} · {current.effort}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto flex-shrink-0">
          <span className="text-xs px-2.5 py-1 bg-[#E07A5F] text-white rounded-full font-semibold">Week {doneCount + 1} of 16</span>
          <span className="text-[#7A756F] transition-transform" style={{ transform: open ? 'rotate(180deg)' : 'none', display: 'inline-block' }}>↓</span>
        </div>
      </div>

      {open && (
        <div className="p-5 border-t border-[#E8E3DA]">
          <p className="font-medium text-[15px] mb-2">{current.action}</p>
          <p className="text-sm text-[#7A756F] leading-relaxed mb-4">{current.detail}</p>
          {current.copy && <CopyBlock text={current.copy} label={current.copyLabel} />}
          <div className="mt-4 p-4 bg-white border border-[#E8E3DA] rounded-xl border-l-4" style={{ borderLeftColor: '#E07A5F' }}>
            <div className="text-xs font-bold text-[#E07A5F] tracking-widest mb-2">WHY THIS WEEK</div>
            <p className="text-sm text-[#7A756F] leading-relaxed italic" style={{ fontFamily: 'var(--font-lora)' }}>{current.why}</p>
          </div>
          {/* Progress dots */}
          <div className="flex gap-1.5 mt-5 items-center flex-wrap">
            {Array.from({ length: 16 }, (_, i) => {
              const w = WEEKS[i]
              return (
                <div key={i} className="rounded-full transition-all"
                  style={{ width: w?.current ? 14 : 8, height: w?.current ? 14 : 8, background: w?.done ? '#E07A5F' : w?.current ? '#2D2926' : '#E8E3DA', border: w?.current ? '2px solid #E07A5F' : 'none' }} />
              )
            })}
            <span className="text-xs text-[#7A756F] ml-2">week {doneCount + 1} of 16</span>
          </div>
        </div>
      )}
    </div>
  )
}
