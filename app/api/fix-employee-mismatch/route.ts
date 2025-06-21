import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/postgresql-server'

export async function POST(request: NextRequest) {
  try {
    const { query, transaction } = createClient()

    console.log('🔧 Fixing employee ID mismatch for user rasvickys...')
    
    // Check current user data
    const { data: currentUser, error: userError } = await supabase
      .from('user_accounts')
      .select('*')
      .eq('username', 'rasvickys')
      .single()
    
    if (userError) {
      console.error('Error fetching user:', userError)
      return NextResponse.json({ error: 'User not found', details: userError }, { status: 404 })
    }
    
    console.log('Current user data:', currentUser)
    
    // Update user account to match task assignments (employee_id = 22)
    const { data: updateResult, error: updateError } = await supabase
      .from('user_accounts')
      .update({ employee_id: 22 })
      .eq('username', 'rasvickys')
      .select()
    
    if (updateError) {
      console.error('Update failed:', updateError)
      return NextResponse.json({ error: 'Update failed', details: updateError }, { status: 500 })
    }
    
    console.log('✅ Updated user account:', updateResult)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Employee ID updated from 6 to 22',
      before: currentUser,
      after: updateResult[0]
    })
    
  } catch (error) {
    console.error('Script error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 })
  }
} 