import { taskAssignmentValidator, TaskContext } from './task-assignment-validator'

export interface TestCase {
  name: string
  context: TaskContext
  expectedEmployeeId: number
  expectedConfidence: 'high' | 'medium' | 'low'
  shouldHaveWarnings?: boolean
}

export class TaskAssignmentTester {
  
  /**
   * 🧪 COMPREHENSIVE TEST SUITE
   */
  static testCases: TestCase[] = [
    {
      name: 'Quotation Revision - Lead Owner Assignment',
      context: {
        taskType: 'quotation_revision',
        quotationId: 1,
        leadId: 6, // Pradeep's lead assigned to Sridhar K
        clientName: 'Pradeep'
      },
      expectedEmployeeId: 6, // Sridhar K
      expectedConfidence: 'high'
    },
    {
      name: 'Quotation Approval - Sales Head Assignment',
      context: {
        taskType: 'quotation_approval',
        quotationId: 1,
        clientName: 'Pradeep'
      },
      expectedEmployeeId: 7, // Durga Devi (Sales Head)
      expectedConfidence: 'high'
    },
    {
      name: 'Lead Follow-up - Lead Owner Assignment',
      context: {
        taskType: 'lead_follow_up',
        leadId: 6, // Pradeep's lead
        clientName: 'Pradeep'
      },
      expectedEmployeeId: 6, // Sridhar K
      expectedConfidence: 'high'
    },
    {
      name: 'Unknown Task Type - Fallback Assignment',
      context: {
        taskType: 'unknown_task_type',
        clientName: 'Test Client'
      },
      expectedEmployeeId: 6, // Fallback to Sridhar K
      expectedConfidence: 'low',
      shouldHaveWarnings: true
    }
  ]

  /**
   * 🏃‍♂️ RUN ALL TESTS
   */
  static async runAllTests(): Promise<TestResult[]> {
    console.log('🧪 Running Task Assignment Validation Tests...\n')
    
    const results: TestResult[] = []
    
    for (const testCase of this.testCases) {
      console.log(`🔍 Testing: ${testCase.name}`)
      
      try {
        const result = await taskAssignmentValidator.assignTask(testCase.context)
        
        const passed = this.validateTestResult(testCase, result)
        
        results.push({
          testName: testCase.name,
          passed,
          result,
          expected: {
            employeeId: testCase.expectedEmployeeId,
            confidence: testCase.expectedConfidence,
            shouldHaveWarnings: testCase.shouldHaveWarnings
          },
          error: null
        })
        
        console.log(passed ? '✅ PASSED' : '❌ FAILED')
        if (!passed) {
          console.log(`   Expected: Employee ${testCase.expectedEmployeeId}, Confidence: ${testCase.expectedConfidence}`)
          console.log(`   Actual: Employee ${result.employeeId}, Confidence: ${result.confidence}`)
        }
        
      } catch (error) {
        console.log('❌ ERROR:', error)
        results.push({
          testName: testCase.name,
          passed: false,
          result: null,
          expected: {
            employeeId: testCase.expectedEmployeeId,
            confidence: testCase.expectedConfidence,
            shouldHaveWarnings: testCase.shouldHaveWarnings
          },
          error: error instanceof Error ? error.message : String(error)
        })
      }
      
      console.log('') // Empty line for readability
    }
    
    return results
  }

  /**
   * 🔍 VALIDATE TEST RESULT
   */
  private static validateTestResult(testCase: TestCase, result: any): boolean {
    if (result.employeeId !== testCase.expectedEmployeeId) {
      return false
    }
    
    if (result.confidence !== testCase.expectedConfidence) {
      return false
    }
    
    if (testCase.shouldHaveWarnings && (!result.warnings || result.warnings.length === 0)) {
      return false
    }
    
    return true
  }

  /**
   * 📊 GENERATE TEST REPORT
   */
  static generateReport(results: TestResult[]): TestReport {
    const totalTests = results.length
    const passedTests = results.filter(r => r.passed).length
    const failedTests = totalTests - passedTests
    
    return {
      totalTests,
      passedTests,
      failedTests,
      successRate: Math.round((passedTests / totalTests) * 100),
      results
    }
  }

  /**
   * 🚨 CONTINUOUS MONITORING
   */
  static async runContinuousMonitoring(): Promise<void> {
    console.log('🚨 Starting continuous task assignment monitoring...')
    
    setInterval(async () => {
      try {
        const results = await this.runAllTests()
        const report = this.generateReport(results)
        
        if (report.successRate < 100) {
          console.error('🚨 ALERT: Task assignment tests failing!')
          console.error(`Success rate: ${report.successRate}%`)
          console.error('Failed tests:', report.results.filter(r => !r.passed))
          
          // Here you could send alerts, emails, etc.
        } else {
          console.log(`✅ All task assignment tests passing (${report.successRate}%)`)
        }
        
      } catch (error) {
        console.error('❌ Monitoring error:', error)
      }
    }, 60000) // Run every minute
  }
}

export interface TestResult {
  testName: string
  passed: boolean
  result: any
  expected: {
    employeeId: number
    confidence: 'high' | 'medium' | 'low'
    shouldHaveWarnings?: boolean
  }
  error: string | null
}

export interface TestReport {
  totalTests: number
  passedTests: number
  failedTests: number
  successRate: number
  results: TestResult[]
} 