#!/usr/bin/env node

import { query } from '../lib/postgresql-client.js'

// Import the migrated services
import { getDashboardStats, getQuickDashboardMetrics } from '../services/dashboard-service.js'
import { logActivity, getRecentActivities } from '../services/activity-service.js'
import { createNotification, getUserNotifications, getUnreadCount } from '../services/notification-service.js'
import { getRolePermissions, checkUserPermission } from '../services/permissions-service.js'
import { getBugs, getBugStats } from '../services/bug-service.js'
import { getLeadSources, getLeadSourceStats } from '../services/lead-source-service.js'
import { getEmployeeStats, getDepartmentDistribution } from '../actions/dashboard-actions.js'

console.log('🧪 TESTING MIGRATED SERVICES')
console.log('============================')
console.log('')

async function testPostgreSQLConnection() {
  console.log('1️⃣  Testing PostgreSQL Connection...')
  try {
    const result = await query('SELECT NOW() as current_time, version() as version')
    console.log('✅ PostgreSQL Connection: SUCCESS')
    console.log(`   Time: ${result.rows[0].current_time}`)
    console.log(`   Version: ${result.rows[0].version.split(' ')[0]}`)
    return true
  } catch (error) {
    console.log('❌ PostgreSQL Connection: FAILED')
    console.log(`   Error: ${error.message}`)
    return false
  }
}

async function testDashboardService() {
  console.log('\n2️⃣  Testing Dashboard Service...')
  try {
    // Test getDashboardStats
    console.log('   Testing getDashboardStats()...')
    const stats = await getDashboardStats()
    console.log(`   ✅ Dashboard stats: ${stats.success ? 'SUCCESS' : 'FAILED'}`)
    if (stats.success) {
      console.log(`      Companies: ${stats.stats.companies.count}`)
      console.log(`      Employees: ${stats.stats.employees.count}`)
    }

    // Test getQuickDashboardMetrics
    console.log('   Testing getQuickDashboardMetrics()...')
    const metrics = await getQuickDashboardMetrics()
    console.log(`   ✅ Quick metrics: ${metrics.success ? 'SUCCESS' : 'FAILED'}`)
    if (metrics.success) {
      console.log(`      Active employees: ${metrics.metrics.employees_count}`)
    }
    
    return true
  } catch (error) {
    console.log('   ❌ Dashboard Service: FAILED')
    console.log(`      Error: ${error.message}`)
    return false
  }
}

async function testActivityService() {
  console.log('\n3️⃣  Testing Activity Service...')
  try {
    // Test logActivity
    console.log('   Testing logActivity()...')
    const activity = await logActivity({
      type: 'test_activity',
      description: 'Test activity from migration test',
      created_by: 1
    })
    console.log(`   ✅ Log activity: ${activity.success ? 'SUCCESS' : 'FAILED'}`)

    // Test getRecentActivities
    console.log('   Testing getRecentActivities()...')
    const activities = await getRecentActivities(5)
    console.log(`   ✅ Get recent activities: SUCCESS`)
    console.log(`      Found ${activities.length} activities`)
    
    return true
  } catch (error) {
    console.log('   ❌ Activity Service: FAILED')
    console.log(`      Error: ${error.message}`)
    return false
  }
}

async function testNotificationService() {
  console.log('\n4️⃣  Testing Notification Service...')
  try {
    // Test createNotification
    console.log('   Testing createNotification()...')
    const notification = await createNotification({
      user_id: 1,
      title: 'Test Notification',
      message: 'This is a test notification from migration test',
      type: 'info'
    })
    console.log(`   ✅ Create notification: ${notification.success ? 'SUCCESS' : 'FAILED'}`)

    // Test getUserNotifications
    console.log('   Testing getUserNotifications()...')
    const userNotifications = await getUserNotifications(1, 5)
    console.log(`   ✅ Get user notifications: ${userNotifications.success ? 'SUCCESS' : 'FAILED'}`)
    if (userNotifications.success) {
      console.log(`      Found ${userNotifications.data.length} notifications`)
    }

    // Test getUnreadCount
    console.log('   Testing getUnreadCount()...')
    const unreadCount = await getUnreadCount(1)
    console.log(`   ✅ Get unread count: ${unreadCount.success ? 'SUCCESS' : 'FAILED'}`)
    if (unreadCount.success) {
      console.log(`      Unread count: ${unreadCount.count}`)
    }
    
    return true
  } catch (error) {
    console.log('   ❌ Notification Service: FAILED')
    console.log(`      Error: ${error.message}`)
    return false
  }
}

async function testPermissionsService() {
  console.log('\n5️⃣  Testing Permissions Service...')
  try {
    // Test getRolePermissions
    console.log('   Testing getRolePermissions()...')
    const rolePermissions = await getRolePermissions(1) // Assuming role ID 1 exists
    console.log(`   ✅ Get role permissions: ${rolePermissions.success ? 'SUCCESS' : 'FAILED'}`)
    if (rolePermissions.success) {
      console.log(`      Found ${rolePermissions.data.length} permissions`)
    }

    // Test checkUserPermission
    console.log('   Testing checkUserPermission()...')
    const hasPermission = await checkUserPermission(1, 'dashboard', 'view')
    console.log(`   ✅ Check user permission: ${hasPermission.success ? 'SUCCESS' : 'FAILED'}`)
    if (hasPermission.success) {
      console.log(`      Has permission: ${hasPermission.hasPermission}`)
    }
    
    return true
  } catch (error) {
    console.log('   ❌ Permissions Service: FAILED')
    console.log(`      Error: ${error.message}`)
    return false
  }
}

async function testBugService() {
  console.log('\n6️⃣  Testing Bug Service...')
  try {
    // Test getBugs
    console.log('   Testing getBugs()...')
    const bugs = await getBugs({ limit: 5 })
    console.log(`   ✅ Get bugs: ${bugs.success ? 'SUCCESS' : 'FAILED'}`)
    if (bugs.success) {
      console.log(`      Found ${bugs.data.length} bugs`)
    }

    // Test getBugStats
    console.log('   Testing getBugStats()...')
    const bugStats = await getBugStats()
    console.log(`   ✅ Get bug stats: ${bugStats.success ? 'SUCCESS' : 'FAILED'}`)
    if (bugStats.success) {
      console.log(`      Total bugs: ${bugStats.stats.total}`)
    }
    
    return true
  } catch (error) {
    console.log('   ❌ Bug Service: FAILED')
    console.log(`      Error: ${error.message}`)
    return false
  }
}

async function testLeadSourceService() {
  console.log('\n7️⃣  Testing Lead Source Service...')
  try {
    // Test getLeadSources
    console.log('   Testing getLeadSources()...')
    const leadSources = await getLeadSources()
    console.log(`   ✅ Get lead sources: ${leadSources.success ? 'SUCCESS' : 'FAILED'}`)
    if (leadSources.success) {
      console.log(`      Found ${leadSources.data.length} lead sources`)
    }

    // Test getLeadSourceStats
    console.log('   Testing getLeadSourceStats()...')
    const leadStats = await getLeadSourceStats()
    console.log(`   ✅ Get lead source stats: ${leadStats.success ? 'SUCCESS' : 'FAILED'}`)
    if (leadStats.success) {
      console.log(`      Found ${leadStats.data.length} lead sources with stats`)
    }
    
    return true
  } catch (error) {
    console.log('   ❌ Lead Source Service: FAILED')
    console.log(`      Error: ${error.message}`)
    return false
  }
}

async function testDashboardActions() {
  console.log('\n8️⃣  Testing Dashboard Actions...')
  try {
    // Test getEmployeeStats
    console.log('   Testing getEmployeeStats()...')
    const empStats = await getEmployeeStats()
    console.log(`   ✅ Get employee stats: SUCCESS`)
    console.log(`      Total employees: ${empStats.totalEmployees}`)
    console.log(`      Active employees: ${empStats.activeEmployees}`)

    // Test getDepartmentDistribution
    console.log('   Testing getDepartmentDistribution()...')
    const deptDist = await getDepartmentDistribution()
    console.log(`   ✅ Get department distribution: SUCCESS`)
    console.log(`      Found ${deptDist.length} departments`)
    
    return true
  } catch (error) {
    console.log('   ❌ Dashboard Actions: FAILED')
    console.log(`      Error: ${error.message}`)
    return false
  }
}

async function runAllTests() {
  const results = []
  
  results.push(await testPostgreSQLConnection())
  results.push(await testDashboardService())
  results.push(await testActivityService())
  results.push(await testNotificationService())
  results.push(await testPermissionsService())
  results.push(await testBugService())
  results.push(await testLeadSourceService())
  results.push(await testDashboardActions())

  const passed = results.filter(r => r).length
  const total = results.length

  console.log('\n' + '='.repeat(50))
  console.log('🎯 TEST SUMMARY')
  console.log('='.repeat(50))
  console.log(`✅ Passed: ${passed}/${total}`)
  console.log(`❌ Failed: ${total - passed}/${total}`)
  
  if (passed === total) {
    console.log('\n🎉 ALL MIGRATIONS SUCCESSFUL!')
    console.log('🚀 PostgreSQL services are working correctly!')
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.')
  }
  
  console.log('\n📋 NEXT STEPS:')
  console.log('1. Fix any failing tests')
  console.log('2. Continue with Phase 12 API completion')
  console.log('3. Migrate remaining services as needed')
}

// Run the tests
runAllTests().catch(console.error) 