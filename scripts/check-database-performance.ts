/**
 * 🔍 DATABASE PERFORMANCE CHECKER
 * 
 * This script checks if ultra-fast indexes are applied
 * and measures their performance impact
 */

import { createClient } from '@/lib/supabase'

interface IndexCheck {
  name: string
  exists: boolean
  expectedSpeedup: string
}

interface PerformanceTest {
  query: string
  description: string
  timeWithoutIndex: number
  timeWithIndex: number
  improvement: string
}

export async function checkDatabasePerformance() {
  const supabase = createClient()
  console.log('🔍 CHECKING DATABASE PERFORMANCE...')
  console.log('=====================================')

  // 1. Check if critical indexes exist
  const indexChecks: IndexCheck[] = [
    {
      name: 'idx_user_accounts_email_fast',
      exists: false,
      expectedSpeedup: '100ms → 5ms (20x faster)'
    },
    {
      name: 'idx_user_accounts_login_composite',
      exists: false,
      expectedSpeedup: '100ms → 5ms (20x faster)'
    },
    {
      name: 'idx_roles_title_permissions',
      exists: false,
      expectedSpeedup: '50ms → 1ms (50x faster)'
    },
    {
      name: 'mv_user_roles_fast',
      exists: false,
      expectedSpeedup: '100ms → 2ms (50x faster)'
    }
  ]

  console.log('📊 CHECKING INDEXES:')
  
  // Check if indexes exist
  for (const check of indexChecks) {
    try {
      if (check.name.startsWith('mv_')) {
        // Check materialized view
        const { data, error } = await supabase
          .from('mv_user_roles_fast')
          .select('user_id')
          .limit(1)
        check.exists = !error
      } else {
        // Check index
        const { data, error } = await supabase.rpc('check_index_exists', {
          index_name: check.name
        })
        check.exists = data === true
      }
    } catch (error) {
      check.exists = false
    }

    const status = check.exists ? '✅' : '❌'
    const impact = check.exists ? 'APPLIED' : 'MISSING'
    console.log(`  ${status} ${check.name}: ${impact}`)
    console.log(`     Expected speedup: ${check.expectedSpeedup}`)
  }

  console.log('')

  // 2. Test actual query performance
  console.log('⚡ PERFORMANCE TESTS:')
  
  const tests: PerformanceTest[] = []

  // Test login query performance
  try {
    const startTime = Date.now()
    const { data: loginTest } = await supabase
      .from('user_accounts')
      .select('id, email, password_hash, role_id')
      .eq('email', 'test@example.com')
      .single()
    
    const loginTime = Date.now() - startTime
    
    tests.push({
      query: 'Login Query',
      description: 'Email lookup for authentication',
      timeWithoutIndex: 100, // Estimated
      timeWithIndex: loginTime,
      improvement: loginTime < 10 ? '🔥 EXCELLENT' : loginTime < 50 ? '⚡ GOOD' : '🐌 NEEDS INDEXES'
    })
  } catch (error) {
    // Ignore errors for this test
  }

  // Test role permissions query
  try {
    const startTime = Date.now()
    const { data: roleTest } = await supabase
      .from('roles')
      .select('title, permissions')
      .eq('title', 'Administrator')
      .single()
    
    const roleTime = Date.now() - startTime
    
    tests.push({
      query: 'Role Permissions',
      description: 'Permission lookup for authorization',
      timeWithoutIndex: 50, // Estimated
      timeWithIndex: roleTime,
      improvement: roleTime < 5 ? '🔥 EXCELLENT' : roleTime < 20 ? '⚡ GOOD' : '🐌 NEEDS INDEXES'
    })
  } catch (error) {
    // Ignore errors for this test
  }

  tests.forEach(test => {
    console.log(`  📈 ${test.query}: ${test.timeWithIndex}ms ${test.improvement}`)
    console.log(`     ${test.description}`)
  })

  console.log('')

  // 3. Overall recommendation
  const missingIndexes = indexChecks.filter(check => !check.exists)
  
  if (missingIndexes.length === 0) {
    console.log('🎉 ALL OPTIMIZATIONS APPLIED!')
    console.log('   Your database is ultra-fast!')
    console.log('   Expected page load: <50ms')
  } else {
    console.log('⚠️  PERFORMANCE IMPROVEMENTS NEEDED:')
    console.log(`   Missing ${missingIndexes.length} critical optimizations`)
    console.log('   📋 TO FIX: Run sql/ultra-fast-indexes-minimal.sql')
    console.log('   🎯 Expected improvement: 10-100x faster')
    console.log('')
    console.log('   Missing indexes:')
    missingIndexes.forEach(check => {
      console.log(`   ❌ ${check.name} → ${check.expectedSpeedup}`)
    })
  }

  return {
    indexesApplied: indexChecks.filter(c => c.exists).length,
    totalIndexes: indexChecks.length,
    performanceTests: tests,
    needsOptimization: missingIndexes.length > 0
  }
} 