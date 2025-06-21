"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Clock, DollarSign, FileText, Send, Users } from 'lucide-react'

/**
 * 🧪 WORKFLOW TESTING INTERFACE
 * ============================
 * 
 * Complete testing interface for the entire business workflow.
 * Allows testing each phase of the process systematically.
 */

export default function WorkflowTestPage() {
  const [testResults, setTestResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  // Prevent hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  // Test Data
  const [testQuotationId, setTestQuotationId] = useState('11') // QT-2025-0011
  const [paymentAmount, setPaymentAmount] = useState('25000')
  const [departmentInstructions, setDepartmentInstructions] = useState(`Department Instructions for Client:

1. EVENT COORDINATION TEAM:
   - Assign senior coordinator for this high-value client
   - Schedule venue visit within 48 hours
   - Prepare detailed timeline with buffer time

2. PHOTOGRAPHY TEAM:
   - Pre-wedding shoot to be prioritized
   - Assign main photographer + assistant
   - Equipment check 2 days before event

3. CATERING TEAM:
   - Food tasting session to be arranged
   - Special dietary requirements to be noted
   - Setup coordination with venue

4. CLIENT EXPECTATIONS:
   - VIP treatment throughout process
   - Regular updates every 2 days
   - Direct contact number for emergencies`)

  const addTestResult = (phase: string, status: 'success' | 'error' | 'pending', message: string, data?: any) => {
    setTestResults(prev => [...prev, {
      id: crypto.randomUUID(), // Use crypto API for unique IDs
      phase,
      status,
      message,
      data,
      timestamp: new Date().toLocaleTimeString()
    }])
  }

  // 🎯 PHASE 1: Test AI Task Generation
  const testAITaskGeneration = async () => {
    setLoading(true)
    addTestResult('AI Tasks', 'pending', 'Creating AI follow-up tasks...')

    try {
      const response = await fetch('/api/ai-tasks/create-followup-sequence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quotationId: parseInt(testQuotationId),
          quotationNumber: `QT-2025-${testQuotationId.padStart(4, '0')}`,
          clientName: 'Test Client',
          totalAmount: 150000,
          status: 'approved',
          taskType: 'post_approval_followup'
        })
      })

      const result = await response.json()
      console.log('🤖 AI Tasks API result:', result)
      
      if (result.success) {
        addTestResult('AI Tasks', 'success', `✅ Created ${result.tasksCreated} AI follow-up tasks`, result)
        if (result.tasksCreated === 0) {
          addTestResult('AI Tasks', 'error', `⚠️ Warning: 0 tasks created - check API logs`)
        }
      } else {
        addTestResult('AI Tasks', 'error', `❌ Failed: ${result.error}`)
        console.error('❌ AI Tasks API error:', result)
      }
    } catch (error) {
      addTestResult('AI Tasks', 'error', `❌ Error: ${error}`)
    }
    
    setLoading(false)
  }

  // 💰 PHASE 2: Test Payment Processing
  const testPaymentProcessing = async () => {
    setLoading(true)
    addTestResult('Payment', 'pending', 'Processing payment and creating instructions...')

    try {
      const response = await fetch('/api/payment-received', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quotationId: parseInt(testQuotationId),
          paymentAmount: parseInt(paymentAmount),
          paymentType: 'advance',
          paymentMethod: 'bank_transfer',
          paymentReference: `PAY-${Date.now()}`,
          paidBy: 'Test Client',
          departmentInstructions: {
            instructions: departmentInstructions,
            created_by: 'Sales Executive',
            priority: 'high'
          }
        })
      })

      const result = await response.json()
      
      if (result.success) {
        addTestResult('Payment', 'success', `✅ Payment processed: ₹${paymentAmount}`, result)
      } else {
        addTestResult('Payment', 'error', `❌ Failed: ${result.error}`)
      }
    } catch (error) {
      addTestResult('Payment', 'error', `❌ Error: ${error}`)
    }
    
    setLoading(false)
  }

  // 📝 PHASE 3: Test Revision Workflow
  const testRevisionWorkflow = async () => {
    setLoading(true)
    addTestResult('Revision', 'pending', 'Creating quotation revision...')

    try {
      const response = await fetch('/api/quotation-revision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalQuotationId: parseInt(testQuotationId),
          revisedQuotationData: {
            services: ['Photography', 'Videography', 'Decoration'],
            total_amount: 175000
          },
          revisionReason: 'Client requested additional videography services',
          revisedBy: 'Sales Executive'
        })
      })

      const result = await response.json()
      
      if (result.success) {
        addTestResult('Revision', 'success', `✅ Revision created: ${result.revision.revision_number}`, result)
      } else {
        addTestResult('Revision', 'error', `❌ Failed: ${result.error}`)
      }
    } catch (error) {
      addTestResult('Revision', 'error', `❌ Error: ${error}`)
    }
    
    setLoading(false)
  }

  // 📋 PHASE 4: Test Instruction Approval
  const testInstructionApproval = async () => {
    setLoading(true)
    addTestResult('Instructions', 'pending', 'Approving department instructions...')

    try {
      // First get the latest instruction ID (in real scenario this would be from UI)
      const instructionId = 1 // This would be dynamic in real implementation
      
      const response = await fetch('/api/instruction-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructionId,
          approval_status: 'approved',
          approverComments: 'Instructions approved. Good detailed planning.',
          approvedBy: 'Sales Head'
        })
      })

      const result = await response.json()
      
      if (result.success) {
        addTestResult('Instructions', 'success', `✅ Instructions approved and routed to teams`, result)
      } else {
        addTestResult('Instructions', 'error', `❌ Failed: ${result.error}`)
      }
    } catch (error) {
      addTestResult('Instructions', 'error', `❌ Error: ${error}`)
    }
    
    setLoading(false)
  }

  const clearResults = () => {
    setTestResults([])
  }

  const setupDatabase = async () => {
    console.log('🔍 Setup Database button clicked!')
    
    try {
      addTestResult('Database Setup', 'pending', '🗄️ Checking database tables...')
      
      // First, get a valid quotation ID
      console.log('📋 Fetching valid quotation...')
      const quotationResponse = await fetch('/api/get-valid-quotation', {
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })
      console.log('📋 Quotation response status:', quotationResponse.status)
      
      if (!quotationResponse.ok) {
        console.error('❌ Quotation API failed:', quotationResponse.status, quotationResponse.statusText)
        addTestResult('Database Setup', 'error', `❌ Quotation API failed: ${quotationResponse.status} ${quotationResponse.statusText}`)
        return
      }
      
      const quotationData = await quotationResponse.json()
      console.log('📋 Quotation data:', quotationData)
      
      if (quotationData.success) {
        console.log('✅ Processing successful quotation data...')
        addTestResult('Database Setup', 'success', `✅ Found valid quotation ID: ${quotationData.validQuotationId} (${quotationData.quotationDetails.quotation_number})`)
        
        // Update the test form with the valid quotation ID
        console.log('🔄 Updating quotation ID in form...')
        setTestQuotationId(quotationData.validQuotationId.toString())
        console.log('✅ Quotation ID updated to:', quotationData.validQuotationId)
      } else {
        console.log('❌ Quotation API returned success=false')
        addTestResult('Database Setup', 'error', `⚠️ No valid quotations found. Please create a quotation first.`)
      }
      
      // Then check database tables
      console.log('🗄️ Checking database tables...')
      const response = await fetch('/api/setup-workflow-tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })
      
      console.log('🗄️ Database API response status:', response.status)
      
      if (!response.ok) {
        console.error('❌ Database API failed:', response.status, response.statusText)
        addTestResult('Database Setup', 'error', `❌ Database API failed: ${response.status} ${response.statusText}`)
        return
      }
      
      const data = await response.json()
      console.log('🗄️ Database API data:', data)
      
      if (data.success) {
        console.log('✅ Processing successful database data...')
        addTestResult('Database Setup', 'success', `✅ ${data.message}`)
        
        console.log('📊 Database results count:', data.results?.length || 0)
        if (data.results) {
          data.results.forEach((result: any, index: number) => {
            console.log(`🔍 Processing table result ${index + 1}:`, result)
            const status = result.status === 'exists' ? '✅' : 
                          result.status === 'creating' ? '⚠️' : '❌'
            console.log(`📝 Adding result for table: ${result.table}`)
            addTestResult('Database Setup', result.status === 'exists' ? 'success' : 'error', `${status} ${result.table}: ${result.message}`)
          })
        }
        
        // If tables need to be created, provide instructions
        const missingTables = data.results?.filter((r: any) => r.status === 'creating')?.length || 0
        console.log('🔧 Missing tables count:', missingTables)
        if (missingTables > 0) {
          console.log('📋 Adding missing tables instructions...')
          addTestResult('Database Setup', 'error', `🔧 Missing ${missingTables} tables. Run this SQL in Supabase dashboard:`)
          addTestResult('Database Setup', 'error', `📄 Copy contents of: supabase/migrations/20250107_safe_workflow_tables.sql`)
        } else {
          console.log('🎉 All tables exist! Database setup complete.')
          addTestResult('Database Setup', 'success', `🎉 All tables exist! Database setup complete.`)
        }
      } else {
        console.log('❌ Database API returned success=false')
        addTestResult('Database Setup', 'error', `❌ Setup failed: ${data.error}`)
      }
    } catch (error) {
      console.error('❌ Setup Database Error:', error)
      addTestResult('Database Setup', 'error', `❌ Failed to setup database: ${(error as Error).message}`)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🧪 Workflow Testing Center</h1>
        <p className="text-gray-600">Test the complete business workflow from quotation approval to accounting/post-sales routing</p>
      </div>

      {/* Test Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>🔧 Test Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Quotation ID</label>
              <Input 
                value={testQuotationId} 
                onChange={(e) => setTestQuotationId(e.target.value)}
                placeholder="11" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Payment Amount (₹)</label>
              <Input 
                value={paymentAmount} 
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="25000" 
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Department Instructions</label>
            <Textarea 
              value={departmentInstructions}
              onChange={(e) => setDepartmentInstructions(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Database Setup */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-orange-700">
            <span className="flex items-center gap-2">🗄️ Database Setup</span>
            <Badge variant="outline" className="text-xs">
              Loading: {loading ? 'true' : 'false'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm mb-2">If tests are failing, the database tables might be missing.</p>
              <p className="text-orange-600 text-xs">Click below to check and setup required workflow tables.</p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={(e) => {
                  console.log('Button click event:', e)
                  console.log('Loading state:', loading)
                  if (loading) {
                    console.log('Button is disabled due to loading state')
                    return
                  }
                  setupDatabase()
                }}
                disabled={loading}
                variant="outline"
                className={`border-orange-300 text-orange-700 hover:bg-orange-100 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Processing...' : 'Setup Database'}
              </Button>
              <Button 
                onClick={() => {
                  console.log('Test button clicked')
                  alert('Test button works!')
                }}
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-600"
              >
                Test
              </Button>
              <Button 
                onClick={async () => {
                  console.log('🔍 Debug AI Tasks button clicked')
                  addTestResult('Debug', 'pending', '🔍 Testing ai_tasks table...')
                  
                  try {
                    const response = await fetch('/api/debug-ai-tasks', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' }
                    })
                    const result = await response.json()
                    
                    if (result.success) {
                      addTestResult('Debug', 'success', `✅ ai_tasks table working - ${result.allTasksCount} records`)
                    } else {
                      addTestResult('Debug', 'error', `❌ ai_tasks issue: ${result.error}`)
                    }
                  } catch (error) {
                    addTestResult('Debug', 'error', `❌ Debug failed: ${(error as Error).message}`)
                  }
                }}
                variant="outline"
                size="sm"
                className="border-blue-300 text-blue-600"
              >
                Debug AI
              </Button>
              {loading && (
                <Button 
                  onClick={() => {
                    console.log('Resetting loading state')
                    setLoading(false)
                  }}
                  variant="outline"
                  size="sm"
                  className="border-red-300 text-red-600"
                >
                  Reset Loading
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Testing Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Phase 1: AI Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testAITaskGeneration}
              disabled={loading}
              className="w-full"
            >
              Test AI Follow-up Generation
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Phase 2: Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testPaymentProcessing}
              disabled={loading}
              className="w-full"
            >
              Test Payment Processing
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Phase 3: Revision
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testRevisionWorkflow}
              disabled={loading}
              className="w-full"
            >
              Test Quote Revision
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Phase 4: Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testInstructionApproval}
              disabled={loading}
              className="w-full"
            >
              Test Instruction Approval
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Test Results */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>📊 Test Results</CardTitle>
          <Button variant="outline" onClick={clearResults}>Clear Results</Button>
        </CardHeader>
        <CardContent>
          {!mounted ? (
            <p className="text-gray-500 text-center py-8">Loading test interface...</p>
          ) : testResults.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No test results yet. Run tests above to see results.</p>
          ) : (
            <div className="space-y-3">
              {testResults.map((result) => (
                <Alert key={result.id} className={`${
                  result.status === 'success' ? 'border-green-200 bg-green-50' :
                  result.status === 'error' ? 'border-red-200 bg-red-50' :
                  'border-yellow-200 bg-yellow-50'
                }`}>
                  <AlertDescription className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                        {result.phase}
                      </Badge>
                      <span>{result.message}</span>
                    </div>
                    <span className="text-sm text-gray-500">{result.timestamp}</span>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>🔗 Quick Access Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" onClick={() => window.open('/tasks/dashboard', '_blank')}>
              📋 Tasks Dashboard
            </Button>
            <Button variant="outline" onClick={() => window.open('/sales/approvals', '_blank')}>
              ✅ Approval Queue
            </Button>
            <Button variant="outline" onClick={() => window.open('/accounting/payments', '_blank')}>
              💰 Accounting
            </Button>
            <Button variant="outline" onClick={() => window.open('/post-sales/confirmations', '_blank')}>
              📞 Post-Sales
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 