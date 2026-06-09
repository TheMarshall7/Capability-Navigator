
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const { data } = await supabase.from('share_links').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
  return NextResponse.json({ links: data || [] })
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    const { visibility, reportId } = await req.json()
    const { data, error } = await supabase
      .from('share_links')
      .upsert({ user_id: user.id, report_id: reportId || null, visibility: visibility || 'mentor' }, { onConflict: 'user_id' })
      .select().single()
    if (error) throw error
    return NextResponse.json({ link: data })
  } catch (err) {
    console.error('[share-links POST]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
