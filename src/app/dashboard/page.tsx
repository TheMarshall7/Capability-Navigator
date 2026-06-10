
import { redirect } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase-server'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Btn } from '@/components/ui/Btn'

const CareerVelocity = dynamic(() => import('./CareerVelocity'))
const WeeklyStepWidget = dynamic(() => import('./WeeklyStepWidget'))

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  // Fetch all user data in parallel
  const [
    { data: userData },
    { data: cvData },
    { data: answersData },
    { data: reportData },
    { data: pathwaysData },
    { data: feedbackData },
    { data: shareData },
    { data: outcomeData },
  ] = await Promise.all([
    supabase.from('users').select('name, email').eq('id', user.id).single(),
    supabase.from('cv_uploads').select('id, file_name, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('questionnaire_answers').select('question_key').eq('user_id', user.id),
    supabase.from('capability_reports').select('id, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('career_pathways').select('id, title, capability_overlap').eq('user_id', user.id).order('capability_overlap', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('feedback').select('id').eq('user_id', user.id).limit(1).maybeSingle(),
    supabase.from('share_links').select('id').eq('user_id', user.id).limit(1).maybeSingle(),
    supabase.from('outcomes').select('made_the_move').eq('user_id', user.id).maybeSingle(),
  ])

  const name = userData?.name || user.email?.split('@')[0] || 'there'
  const answerCount = answersData?.length ?? 0
  const totalQuestions = 28
  const questionnaireComplete = answerCount >= 20 // reasonable threshold

  const steps = [
    { label: 'CV Uploaded', done: !!cvData, href: '/cv-upload' },
    { label: 'Questionnaire', done: questionnaireComplete, href: '/questionnaire' },
    { label: 'Profile Generated', done: !!reportData, href: reportData ? '/profile' : '/generating' },
    { label: 'Feedback Given', done: !!feedbackData, href: '/feedback' },
    { label: 'Profile Shared', done: !!shareData, href: '/share' },
    { label: 'Outcome Logged', done: !!outcomeData, href: '/outcome' },
  ]
  const completedSteps = steps.filter(s => s.done).length
  const completionPct = Math.round((completedSteps / steps.length) * 100)

  const firstName = name.split(' ')[0]
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="max-w-[900px] mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl mb-2" style={{ fontFamily: 'var(--font-lora)' }}>
          {greeting}, {firstName} 👋
        </h1>
        <p className="text-[#7A756F]">
          {reportData
            ? 'Your capability profile is ready. Explore your pathways or share with a mentor.'
            : 'Complete the steps below to generate your capability profile.'}
        </p>
      </div>

      {/* Progress */}
      <Card className="mb-5 !p-5">
        <div className="flex justify-between items-center mb-3">
          <span className="font-semibold text-sm">Profile completion</span>
          <span className="text-sm text-[#E07A5F] font-semibold">{completionPct}%</span>
        </div>
        <ProgressBar value={completionPct} />
        <div className="flex flex-wrap gap-2 mt-4">
          {steps.map(s => (
            <Link key={s.label} href={s.href}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium no-underline transition-all"
              style={{ background: s.done ? '#EBF5F3' : '#F8F6F1', color: s.done ? '#3D8A7A' : '#7A756F', border: `1px solid ${s.done ? '#3D8A7A' : '#E8E3DA'}` }}>
              <span>{s.done ? '✓' : '○'}</span>
              {s.label}
            </Link>
          ))}
        </div>
      </Card>

      {/* Career velocity widget */}
      <CareerVelocity />

      {/* CV Review — shown when CV uploaded */}
      {cvData && (
        <Link
          href={
            reportData && pathwaysData
              ? `/cv-review?reanalyze=1&pathwayId=${pathwaysData.id}`
              : '/cv-review'
          }
          className="no-underline block mb-5"
        >
          <Card className="!border-l-4 !border-l-[#7C6AF0] hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="text-2xl mb-2">◎</div>
                <div className="font-semibold mb-1">CV analyzer</div>
                <div className="text-xs text-[#7A756F] leading-relaxed">
                  {reportData && pathwaysData
                    ? `ATS audit, career-change diagnostics, and reframing advice — reviewed against your ${pathwaysData.title} pathway.`
                    : 'ATS audit, bullet-craft review, career-change diagnostics, and regional conventions — section by section.'}
                </div>
              </div>
              <span className="text-sm font-medium flex-shrink-0" style={{ color: '#7C6AF0' }}>
                {reportData && pathwaysData ? 'Re-analyse CV →' : 'Open analyzer →'}
              </span>
            </div>
          </Card>
        </Link>
      )}

      {/* CV Builder — shown when profile + pathways exist */}
      {reportData && pathwaysData && (
        <Link href={`/cv-builder?pathwayId=${pathwaysData.id}`} className="no-underline block mb-5">
          <Card className="!border-l-4 !border-l-[#E8A838] hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="text-2xl mb-2">✎</div>
                <div className="font-semibold mb-1">Your CV, rewritten for {pathwaysData.title}</div>
                <div className="text-xs text-[#7A756F] leading-relaxed">
                  Pathway-tailored, ATS-safe CV in hybrid career-changer format — with a cover letter and reframing teach-back.
                </div>
              </div>
              <span className="text-sm font-medium text-[#E8A838] flex-shrink-0">Open CV Builder →</span>
            </div>
          </Card>
        </Link>
      )}

      {/* Action cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <Link href="/profile" className="no-underline">
          <Card className="h-full !border-l-4 !border-l-[#E07A5F] hover:shadow-md transition-shadow">
            <div className="text-2xl mb-2">◎</div>
            <div className="font-semibold mb-2">Capability Profile</div>
            <div className="text-xs text-[#7A756F] leading-relaxed mb-4">
              {reportData ? '6 core capabilities · 4 hidden strengths · Work style summary' : 'Not yet generated'}
            </div>
            <span className="text-sm text-[#E07A5F] font-medium">
              {reportData ? 'View profile →' : 'Generate now →'}
            </span>
          </Card>
        </Link>

        <Link href="/coach" className="no-underline">
          <Card className="h-full !border-l-4 !border-l-[#7C6AF0] hover:shadow-md transition-shadow">
            <div className="text-2xl mb-2">◎</div>
            <div className="font-semibold mb-2">Career Coach</div>
            <div className="text-xs text-[#7A756F] leading-relaxed mb-4">
              Ask anything. Personalized to your capability profile and target pathway.
            </div>
            <span className="text-sm font-medium" style={{ color: '#7C6AF0' }}>Talk to coach →</span>
          </Card>
        </Link>

        <Link href={reportData ? '/pathways' : '/generating'} className="no-underline">
          <Card className="h-full !border-l-4 !border-l-[#3D8A7A] hover:shadow-md transition-shadow">
            <div className="text-2xl mb-2">◈</div>
            <div className="font-semibold mb-2">Career Pathways</div>
            <div className="text-xs text-[#7A756F] leading-relaxed mb-4">
              {pathwaysData ? `Top match: ${pathwaysData.title} (${pathwaysData.capability_overlap}%)` : 'Complete your profile to unlock'}
            </div>
            <span className="text-sm text-[#3D8A7A] font-medium">
              {pathwaysData ? 'Explore pathways →' : 'Unlock pathways →'}
            </span>
          </Card>
        </Link>
      </div>

      {/* Outcome prompt — shown only when they have a profile and haven't logged yet */}
      {reportData && !outcomeData && (
        <Card className="mb-5 !bg-[#EBF5F3] !border-[#3D8A7A]">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="font-semibold text-[#3D8A7A] mb-1">🎯 Made the move?</div>
              <p className="text-sm text-[#7A756F] leading-relaxed">
                Log how your transition is going. Your data helps future users see what real career changes look like.
              </p>
            </div>
            <Link href="/outcome">
              <span className="inline-block px-4 py-2 bg-[#3D8A7A] text-white text-sm font-medium rounded-xl no-underline hover:bg-[#2E6B5E] transition-colors">
                Log outcome →
              </span>
            </Link>
          </div>
        </Card>
      )}

      {/* Weekly step widget */}
      <WeeklyStepWidget />

      {/* Quick actions */}
      <Card className="!p-5">
        <div className="font-semibold mb-4 text-sm">Quick actions</div>
        <div className="flex flex-wrap gap-2">
          <Link href="/cv-upload"><Btn variant="outline" size="sm">{cvData ? '↑ Update CV' : '↑ Upload CV'}</Btn></Link>
          {cvData && <Link href="/cv-review"><Btn variant="outline" size="sm">◎ CV analyzer</Btn></Link>}
          <Link href="/questionnaire"><Btn variant="outline" size="sm">✎ {questionnaireComplete ? 'Edit answers' : 'Start questionnaire'}</Btn></Link>
          {reportData && <Link href="/generating"><Btn variant="outline" size="sm">⟳ Regenerate profile</Btn></Link>}
          {reportData && !feedbackData && <Link href="/feedback"><Btn variant="outline" size="sm">◆ Give feedback</Btn></Link>}
        </div>
      </Card>
    </div>
  )
}
