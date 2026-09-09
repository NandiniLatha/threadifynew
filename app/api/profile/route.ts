import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = createClient()
    
    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: `Unauthorized: ${authError?.message || 'No active session'}` }, { status: 401 })
    }

    const userId = user.id
    const body = await req.json()
    const { name, bio, avatar_url } = body

    // 2. Fetch current user row
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('name, display_name_changed_at')
      .eq('id', userId)
      .single()

    if (userError) {
      return NextResponse.json({ error: `Database error: ${userError.message}` }, { status: 500 })
    }
    
    if (!currentUser) {
      return NextResponse.json({ error: 'User record not found in public.users. Please contact support.' }, { status: 404 })
    }

    // 3. Prepare update payload
    const updatePayload: any = {}
    if (bio !== undefined) updatePayload.bio = bio
    if (avatar_url !== undefined) updatePayload.avatar_url = avatar_url

    // 4. Enforce 14-day rule if name is being changed
    if (name !== undefined && name !== currentUser.name) {
      if (currentUser.display_name_changed_at) {
        const lastChanged = new Date(currentUser.display_name_changed_at)
        const now = new Date()
        const diffTime = Math.abs(now.getTime() - lastChanged.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays < 14) {
          const daysLeft = 14 - diffDays
          return NextResponse.json(
            { error: `You can change your name again in ${daysLeft} days.` },
            { status: 403 }
          )
        }
      }
      
      updatePayload.name = name
      updatePayload.display_name_changed_at = new Date().toISOString()
    }

    // 5. Update user
    if (Object.keys(updatePayload).length > 0) {
      const { error: updateError } = await supabase
        .from('users')
        .update(updatePayload)
        .eq('id', userId)

      if (updateError) {
        throw updateError
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update profile' },
      { status: 500 }
    )
  }
}
