import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/actions/auth-actions'
import { createClient } from '@/lib/postgresql-client'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<any> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const { id } = resolvedParams
    const { query, transaction } = createClient()

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', currentUser.id) // Ensure user can only delete their own notifications

    if (error) {
      console.error('Error deleting notification:', error)
      return NextResponse.json(
        { error: 'Failed to delete notification' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting notification:', error)
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    )
  }
} 