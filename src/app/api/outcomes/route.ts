
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { data, error } = await supabase
      .from('outcomes')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) throw error
    return NextResponse.json({ outcome: data })
  } catch (err: any) {
    console.error('[outcomes GET]', err)
    return NextResponse.json({ error: 'Failed to fetch outcome' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const body = await req.json()

    // Validate required field
    if (!body.made_the_move) {
      return NextResponse.json({ error: 'made_the_move is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('outcomes')
      .upsert(
        {
          user_id: user.id,
          pathway_title: body.pathway_title || null,
          made_the_move: body.made_the_move,
          original_role: body.original_role || null,
          new_role: body.new_role || null,
          time_taken_months: body.time_taken_months ? parseInt(body.time_taken_months) : null,
          salary_change: body.salary_change || null,
          salary_change_pct: body.salary_change_pct ? parseInt(body.salary_change_pct) : null,
          what_worked: body.what_worked || null,
          what_didnt: body.what_didnt || null,
          would_recommend: body.would_recommend ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ outcome: data })
  } catch (err: any) {
    console.error('[outcomes POST]', err)
    return NextResponse.json({ error: 'Failed to save outcome' }, { status: 500 })
  }
}
