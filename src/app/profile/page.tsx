
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Btn } from '@/components/ui/Btn'
import type { CoreCapability, HiddenStrength } from '@/types'
import { getSimilarTransitions, parseQuestionnaireRole } from '@/lib/transitions'
import SimilarTransitions from '@/components/transitions/SimilarTransitions'

export default async function ProfilePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const [
    { data: userData },
    { data: report },
    { data: roleAnswer },
  ] = await Promise.all([
    supabase.from('users').select('name, email').eq('id', user.id).single(),
    supabase.from('capability_reports').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('questionnaire_answers').select('answer_value')
      .eq('user_id', user.id).eq('question_key', 'role').maybeSingle(),
  ])

  if (!report) redirect('/generating')

  const userRole = parseQuestionnaireRole(roleAnswer?.answer_value)
  const similarTransitions = userRole
    ? await getSimilarTransitions(userRole, 3)
    : []

  const capabilities: CoreCapability[] = report.core_capabilities_json || []
  const hiddenStrengths: HiddenStrength[] = report.hidden_strengths_json || []
  const name = userData?.name || user.email?.split('@')[0] || 'You'

  return (
    <div className="page-shell-medium">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8">
        <div>
          <Badge color="accent">Capability Profile</Badge>
          <h1 className="page-title mt-3 mb-1">{name}</h1>
          <p className="text-[#7A756F]">Generated {new Date(report.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Link href="/share"><Btn variant="outline" size="sm">Share →</Btn></Link>
          <Link href="/pathways"><Btn size="sm">View pathways →</Btn></Link>
        </div>
      </div>

      {/* Summary */}
      <Card className="mb-5 !border-l-4" style={{ borderLeftColor: '#E07A5F' }}>
        <div className="text-xs font-bold tracking-widest text-[#E07A5F] mb-3">CAPABILITY SUMMARY</div>
        <p className="leading-relaxed text-[16px]">{report.summary}</p>
      </Card>

      {/* Core capabilities */}
      {capabilities.length > 0 && (
        <Card className="mb-5">
          <div className="text-xs font-bold tracking-widest text-[#2D2926] mb-5">CORE CAPABILITIES</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {capabilities.map((c) => (
              <div key={c.title} className="p-4 bg-[#F8F6F1] rounded-xl">
                <div className="font-semibold text-[15px] mb-2">{c.title}</div>
                <div className="text-sm text-[#7A756F] leading-relaxed mb-3">{c.explanation}</div>
                {c.evidence && (
                  <div className="text-xs text-[#E07A5F] px-3 py-2 bg-[#FDF0EA] rounded-lg leading-relaxed">📌 {c.evidence}</div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Hidden strengths */}
      {hiddenStrengths.length > 0 && (
        <Card className="mb-5 !border-l-4" style={{ borderLeftColor: '#3D8A7A' }}>
          <div className="text-xs font-bold tracking-widest text-[#3D8A7A] mb-2">HIDDEN STRENGTHS</div>
          <p className="text-sm text-[#7A756F] mb-4 leading-relaxed">Capabilities your CV may underrepresent — and that traditional recruitment systems are likely to miss.</p>
          <div className="flex flex-col gap-3">
            {hiddenStrengths.map((h) => (
              <div key={h.title} className="flex gap-3 p-4 bg-[#EBF5F3] rounded-xl">
                <div className="w-7 h-7 bg-[#3D8A7A] rounded-lg flex items-center justify-center text-white text-xs flex-shrink-0">◈</div>
                <div>
                  <div className="font-semibold text-sm mb-1">{h.title}</div>
                  <div className="text-sm text-[#7A756F] leading-relaxed">{h.explanation}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <SimilarTransitions
        transitions={similarTransitions}
        userRole={userRole}
        variant="profile"
      />

      {/* Work style + CV underrep */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {report.work_style_summary && (
          <Card>
            <div className="text-xs font-bold tracking-widest text-[#2D2926] mb-3">WORK STYLE</div>
            <p className="text-sm text-[#7A756F] leading-relaxed">{report.work_style_summary}</p>
          </Card>
        )}
        {report.cv_underrepresentation_summary && (
          <Card>
            <div className="text-xs font-bold tracking-widest text-[#2D2926] mb-3">WHAT YOUR CV UNDERSELLS</div>
            <p className="text-sm text-[#7A756F] leading-relaxed">{report.cv_underrepresentation_summary}</p>
          </Card>
        )}
      </div>

      <div className="flex gap-3 flex-wrap">
        <Link href="/pathways"><Btn>Explore career pathways →</Btn></Link>
        <Link href="/feedback"><Btn variant="outline">Give feedback</Btn></Link>
        <Link href="/share"><Btn variant="outline">Share with a mentor</Btn></Link>
        <Link href="/generating"><Btn variant="ghost">⟳ Regenerate</Btn></Link>
      </div>
    </div>
  )
}
