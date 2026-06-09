
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    const body = await req.json()
    const { error } = await supabase.from('feedback').upsert(
      { user_id: user.id, ...body },
      { onConflict: 'user_id' }
    )
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[feedback]', err)
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 })
  }
}
