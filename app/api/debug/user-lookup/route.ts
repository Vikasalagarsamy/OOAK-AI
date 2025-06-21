import { NextResponse } from 'next/server'
import { createClient } from '@/lib/postgresql-client'

/**
 * 🔍 DEBUG USER LOOKUP API
 * 
 * This diagnostic endpoint helps debug user lookup issues by showing:
 * - What users exist in the database
 * - Their IDs, usernames, and role_ids
 * - Potential ID mismatches
 */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')
    const userId = searchParams.get('userId')

    const { query, transaction } = createClient()

    // Get all users for overview
    const { data: allUsers, error: allUsersError } = await supabase
      .from('user_accounts')
      .select('id, username, role_id')
      .order('id')

    if (allUsersError) {
      return NextResponse.json({
        error: 'Failed to fetch users',
        details: allUsersError
      }, { status: 500 })
    }

    let specificUser = null
    let userByUsername = null

    // If specific user ID provided, look them up
    if (userId) {
      const { data, error } = await supabase
        .from('user_accounts')
        .select('id, username, role_id')
        .eq('id', userId)
        .single()

      if (!error) {
        specificUser = data
      }
    }

    // If username provided, look them up
    if (username) {
      const { data, error } = await supabase
        .from('user_accounts')
        .select('id, username, role_id')
        .eq('username', username)
        .single()

      if (!error) {
        userByUsername = data
      }
    }

    return NextResponse.json({
      allUsers,
      totalUsers: allUsers?.length || 0,
      specificUser,
      userByUsername,
      searchParams: {
        username,
        userId
      },
      diagnostic: {
        message: 'Check if user ID matches between session and database',
        suggestion: 'Compare session user.id with database user_accounts.id'
      }
    })

  } catch (error) {
    console.error('Debug user lookup error:', error)
    return NextResponse.json({
      error: 'Debug lookup failed',
      details: error
    }, { status: 500 })
  }
} 