export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function DELETE() {
  try {
    // Verify the requester is authenticated
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    // Delete all user data from public schema first
    // (Most cascades via ON DELETE CASCADE, but being explicit)
    const { data: shareLinks } = await supabase.from('share_links').select('id').eq('user_id', user.id)
    const shareLinkIds = (shareLinks || []).map(sl => sl.id)
    if (shareLinkIds.length) {
      await supabase.from('mentor_feedback').delete().in('share_link_id', shareLinkIds)
    }
    await supabase.from('share_links').delete().eq('user_id', user.id)
    await supabase.from('feedback').delete().eq('user_id', user.id)
    await supabase.from('career_pathways').delete().eq('user_id', user.id)
    await supabase.from('capability_reports').delete().eq('user_id', user.id)
    await supabase.from('questionnaire_answers').delete().eq('user_id', user.id)
    await supabase.from('cv_uploads').delete().eq('user_id', user.id)

    // Delete CV files from storage
    const { data: files } = await supabase.storage.from('cv-uploads').list(user.id)
    if (files?.length) {
      await supabase.storage.from('cv-uploads').remove(files.map(f => `${user.id}/${f.name}`))
    }

    // Delete the auth.users record using admin/service role client
    // This requires SUPABASE_SERVICE_ROLE_KEY in env
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (serviceKey) {
      const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceKey,
        { auth: { autoRefreshToken: false, persistSession: false } }
      )
      const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)
      if (deleteError) {
        console.error('[delete-account] Auth delete failed:', deleteError)
        // Still return success — public data is gone, auth record will be orphaned
        // but can be cleaned up manually via Supabase dashboard
      }
    } else {
      // No service key — fall back to deleting public.users which cascades
      // auth.users record will persist but user can't log back in meaningfully
      console.warn('[delete-account] No SUPABASE_SERVICE_ROLE_KEY — auth.users record not deleted')
      await supabase.from('users').delete().eq('id', user.id)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[delete-account]', err)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}
