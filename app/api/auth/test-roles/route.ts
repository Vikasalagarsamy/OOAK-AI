import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/postgresql-client'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

export async function GET(request: NextRequest) {
  try {
    console.log('🎭 Testing role-based menu permissions...')
    
    const client = await pool.connect()
    
    // Get all users with their roles
    const usersQuery = `
      SELECT 
        ua.id,
        ua.username,
        ua.email,
        ua.is_active,
        e.first_name,
        e.last_name,
        r.id as role_id,
        r.title as role_title,
        r.description as role_description
      FROM user_accounts ua
      LEFT JOIN employees e ON ua.employee_id = e.id
      LEFT JOIN roles r ON ua.role_id = r.id
      WHERE ua.is_active = true
      ORDER BY r.id ASC, ua.username ASC
    `
    
    const usersResult = await client.query(usersQuery)
    
    // For each user, determine their menu access based on role
    const usersWithMenus = await Promise.all(usersResult.rows.map(async (user) => {
      let menuAccess = []
      
      // Define role-based menu access rules
      switch (user.role_title) {
        case 'Administrator':
          menuAccess = [
            'Dashboard', 'Organization (All)', 'People & HR (All)', 
            'Sales & Revenue (All)', 'Events (All)', 'Reports (All)', 
            'Admin (All)', 'Task Management (All)'
          ]
          break
          
        case 'Admin Head':
          menuAccess = [
            'Dashboard', 'Organization (Most)', 'People & HR (All)', 
            'Reports (All)', 'Admin (Limited)'
          ]
          break
          
        case 'Sales Head':
          menuAccess = [
            'Dashboard', 'Sales & Revenue (All)', 'People & HR (View Only)', 
            'Events (All)', 'Reports (Sales)'
          ]
          break
          
        case 'Sales Manager':
          menuAccess = [
            'Dashboard', 'Sales & Revenue (Team)', 'Events (Limited)',
            'Reports (Own Team)'
          ]
          break
          
        case 'Sales Executive':
          menuAccess = [
            'Dashboard', 'Sales & Revenue (Own Leads)', 'Events (View)'
          ]
          break
          
        default:
          menuAccess = ['Dashboard (Basic)']
      }
      
      return {
        ...user,
        menuAccess,
        accessLevel: user.role_title === 'Administrator' ? 'Full Admin' :
                    user.role_title === 'Admin Head' ? 'High Admin' :
                    user.role_title === 'Sales Head' ? 'Department Head' :
                    user.role_title === 'Sales Manager' ? 'Team Manager' :
                    user.role_title === 'Sales Executive' ? 'Individual Contributor' :
                    'Basic User'
      }
    }))
    
    client.release()
    
    console.log(`✅ Role testing data prepared for ${usersWithMenus.length} users`)
    
    return NextResponse.json({
      success: true,
      message: 'Role-based menu access testing data',
      users: usersWithMenus,
      testInstructions: {
        howToTest: [
          "1. Note the different users and their roles below",
          "2. Go to /login and try logging in with different users",
          "3. Use 'admin123' as password for all test users",
          "4. Observe how the menu changes based on role",
          "5. Try accessing restricted areas to see permission blocks"
        ],
        availableTestUsers: usersWithMenus.map(u => ({
          username: u.username,
          role: u.role_title,
          expectedAccess: u.accessLevel
        }))
      },
      metadata: {
        timestamp: new Date().toISOString(),
        source: "Direct PostgreSQL",
        totalUsers: usersWithMenus.length
      }
    })
    
  } catch (error: any) {
    console.error('❌ Role testing error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get role testing data', 
        details: error.message 
      },
      { status: 500 }
    )
  }
} 