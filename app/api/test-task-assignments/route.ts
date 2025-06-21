import { NextRequest, NextResponse } from 'next/server'
import { TaskAssignmentTester } from '@/lib/task-assignment-tests'

/**
 * 🧪 TASK ASSIGNMENT TESTING API
 * 
 * This endpoint runs comprehensive tests to ensure task assignments
 * are working correctly and prevents random assignment bugs
 */

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Running task assignment validation tests...')
    
    const results = await TaskAssignmentTester.runAllTests()
    const report = TaskAssignmentTester.generateReport(results)
    
    console.log('📊 Test Report:', report)
    
    return NextResponse.json({
      success: true,
      message: 'Task assignment tests completed',
      report,
      timestamp: new Date().toISOString(),
      status: report.successRate === 100 ? 'ALL_TESTS_PASSING' : 'SOME_TESTS_FAILING'
    })
    
  } catch (error) {
    console.error('❌ Task assignment test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    
    if (action === 'start_monitoring') {
      console.log('🚨 Starting continuous task assignment monitoring...')
      
      // Start continuous monitoring (in production, this would be a background service)
      TaskAssignmentTester.runContinuousMonitoring()
      
      return NextResponse.json({
        success: true,
        message: 'Continuous monitoring started',
        timestamp: new Date().toISOString()
      })
      
    } else if (action === 'run_single_test') {
      const { testContext } = await request.json()
      
      if (!testContext) {
        return NextResponse.json({
          success: false,
          error: 'Test context required'
        }, { status: 400 })
      }
      
      // Import the validator dynamically to avoid server-side issues
      const { taskAssignmentValidator } = await import('@/lib/task-assignment-validator')
      const result = await taskAssignmentValidator.assignTask(testContext)
      
      return NextResponse.json({
        success: true,
        result,
        timestamp: new Date().toISOString()
      })
      
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid action. Use "start_monitoring" or "run_single_test"'
      }, { status: 400 })
    }
    
  } catch (error) {
    console.error('❌ Task assignment API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 