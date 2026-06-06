import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// GET /api/milestones?pathwayId=xxx
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const pathwayId = req.nextUrl.searchParams.get('pathwayId')
    if (!pathwayId) return NextResponse.json({ error: 'pathwayId required' }, { status: 400 })

    const { data, error } = await supabase
      .from('milestones')
      .select('*')
      .eq('user_id', user.id)
      .eq('pathway_id', pathwayId)
      .order('phase')
      .order('sort_order')

    if (error) throw error
    return NextResponse.json({ milestones: data || [] })
  } catch (err: any) {
    console.error('[milestones GET]', err)
    return NextResponse.json({ error: 'Failed to fetch milestones' }, { status: 500 })
  }
}

// POST /api/milestones — seed milestones from roadmap JSON
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { pathwayId, items } = await req.json()
    if (!pathwayId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'pathwayId and items required' }, { status: 400 })
    }

    // Verify pathway belongs to this user
    const { data: pathway } = await supabase
      .from('career_pathways')
      .select('id')
      .eq('id', pathwayId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!pathway) return NextResponse.json({ error: 'Pathway not found' }, { status: 404 })

    // Check if milestones already exist — don't duplicate
    const { data: existing } = await supabase
      .from('milestones')
      .select('id')
      .eq('pathway_id', pathwayId)
      .eq('user_id', user.id)
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({ message: 'Milestones already seeded' })
    }

    const rows = items.map((item: { label: string; phase: string; sort_order: number }) => ({
      user_id: user.id,
      pathway_id: pathwayId,
      label: item.label,
      phase: item.phase,
      sort_order: item.sort_order,
      completed: false,
    }))

    const { data, error } = await supabase.from('milestones').insert(rows).select()
    if (error) throw error

    return NextResponse.json({ milestones: data })
  } catch (err: any) {
    console.error('[milestones POST]', err)
    return NextResponse.json({ error: 'Failed to seed milestones' }, { status: 500 })
  }
}

// PATCH /api/milestones — toggle a single milestone
export async function PATCH(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { id, completed } = await req.json()
    if (!id || completed === undefined) {
      return NextResponse.json({ error: 'id and completed required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('milestones')
      .update({
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      })
      .eq('id', id)
      .eq('user_id', user.id) // RLS double-check
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ milestone: data })
  } catch (err: any) {
    console.error('[milestones PATCH]', err)
    return NextResponse.json({ error: 'Failed to update milestone' }, { status: 500 })
  }
}
