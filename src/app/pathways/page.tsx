
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

function DifficultyDot({ d }: { d: string }) {
  const colors: Record<string, string> = { Low: '#3D8A7A', Medium: '#E8A838', High: '#E07A5F' }
  return <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: colors[d] || '#7A756F' }} />
}

export default async function PathwaysPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: pathways } = await supabase
    .from('career_pathways')
    .select('*')
    .eq('user_id', user.id)
    .order('capability_overlap', { ascending: false })

  if (!pathways || pathways.length === 0) redirect('/generating')

  return (
    <div className="max-w-[860px] mx-auto px-6 py-10">
      <div className="mb-8">
        <Badge color="teal">Based on your capability profile</Badge>
        <h1 className="text-3xl mt-3 mb-3" style={{ fontFamily: 'var(--font-lora)' }}>Your suggested pathways</h1>
        <p className="text-[#7A756F] max-w-xl leading-relaxed">
          Realistic directions based on your existing capabilities. The overlap percentage shows how much of each role you can already do — not how much you are "worth".
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {pathways.map((p, i) => {
          const missing: string[] = p.missing_skills_json || []
          return (
            <Card key={p.id} className="!border-l-4" style={{ borderLeftColor: i === 0 ? '#E07A5F' : '#E8E3DA' }}>
              <div className="flex justify-between items-start flex-wrap gap-3 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-xl font-semibold">{p.title}</h3>
                    {i === 0 && <Badge color="accent">Top match</Badge>}
                  </div>
                  <p className="text-sm text-[#7A756F] leading-relaxed max-w-lg">{p.match_reason}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-3xl font-bold text-[#E07A5F]">{p.capability_overlap}%</div>
                  <div className="text-xs text-[#7A756F]">current overlap</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="bg-[#E8E3DA] rounded-full h-1.5 mb-4 overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${p.capability_overlap}%`, background: i === 0 ? '#E07A5F' : '#3D8A7A' }} />
              </div>

              <div className="flex gap-6 flex-wrap mb-4">
                <div>
                  <div className="text-xs text-[#7A756F] mb-1">Difficulty</div>
                  <div className="text-sm font-medium flex items-center">
                    <DifficultyDot d={p.difficulty} />
                    <span style={{ color: p.difficulty === 'Low' ? '#3D8A7A' : p.difficulty === 'High' ? '#E07A5F' : '#E8A838' }}>{p.difficulty}</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#7A756F] mb-1">Timeline</div>
                  <div className="text-sm font-medium">{p.estimated_transition_time}</div>
                </div>
              </div>

              {missing.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs font-semibold text-[#7A756F] mb-2">CAPABILITY GAPS</div>
                  <div className="flex flex-wrap gap-2">
                    {missing.map(m => (
                      <span key={m} className="text-xs px-3 py-1 rounded-full" style={{ background: '#FEF7E8', color: '#E8A838' }}>{m}</span>
                    ))}
                  </div>
                </div>
              )}

              {p.first_step && (
                <div className="p-3 rounded-xl mb-4" style={{ background: '#FDF0EA' }}>
                  <div className="text-xs font-bold text-[#E07A5F] mb-1.5">FIRST STEP</div>
                  <div className="text-sm text-[#2D2926] leading-relaxed">{p.first_step}</div>
                </div>
              )}

              <Link href={`/roadmap/${p.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#E07A5F] text-white rounded-xl text-sm font-medium no-underline hover:bg-[#C96848] transition-colors">
                View full roadmap →
              </Link>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
