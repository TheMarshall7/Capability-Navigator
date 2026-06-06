import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { shareLinkId, agreementLevel, perceivedStrengths, suggestedCareerDirection } = await req.json()
    if (!shareLinkId || !agreementLevel) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    const supabase = createClient()
    const { data: link } = await supabase
      .from('share_links').select('id, visibility').eq('id', shareLinkId).single()
    if (!link || link.visibility !== 'mentor') {
      return NextResponse.json({ error: 'Not found or not mentor-enabled' }, { status: 404 })
    }
    const { error } = await supabase.from('mentor_feedback').insert({
      share_link_id: shareLinkId,
      agreement_level: agreementLevel,
      perceived_strengths: perceivedStrengths || null,
      suggested_career_direction: suggestedCareerDirection || null,
    })
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[mentor-feedback]', err)
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 })
  }
}
