"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { QuotationWorkflowPipeline } from '@/components/quotation-workflow-pipeline'
import { 
  getQuotationsByWorkflowStatus,
  submitQuotationForApproval,
  approveQuotation,
  rejectQuotation,
  markPaymentReceived,
  createPostSaleConfirmation,
  updateQuotationWorkflowStatus
} from '@/actions/quotation-workflow-actions'
import { getQuotations } from '@/actions/quotations-actions'
import type { EnhancedQuotation } from '@/types/quotation-workflow'
import type { SavedQuotation } from '@/actions/quotations-actions'

export default function TestWorkflowPage() {
  const [quotations, setQuotations] = useState<EnhancedQuotation[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const loadQuotations = async () => {
    setLoading(true)
    try {
      // Get all quotations and map them to Enhanced format
      const result = await getQuotations()
      if (result.success && result.quotations) {
        const enhanced: EnhancedQuotation[] = result.quotations.map((q: SavedQuotation) => ({
          id: q.id,
          client_name: q.client_name,
          bride_name: q.bride_name,
          groom_name: q.groom_name,
          email: q.email,
          mobile: q.mobile,
          total_amount: q.total_amount,
          workflow_status: (q as any).workflow_status || 'draft',
          confirmation_required: true,
          created_at: q.created_at,
          quotation_number: q.quotation_number,
          slug: q.slug,
          default_package: q.default_package,
          status: q.status,
          events_count: q.events_count
        }))
        setQuotations(enhanced)
        setMessage(`Loaded ${enhanced.length} quotations`)
      } else {
        setMessage('Failed to load quotations: ' + (result.error || 'Unknown error'))
      }
    } catch (error: any) {
      setMessage('Error loading quotations: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const testWorkflowAction = async (quotationId: number, action: string, data?: any) => {
    setLoading(true)
    try {
      let result

      switch (action) {
        case 'submit_for_approval':
          result = await submitQuotationForApproval(quotationId)
          break
        case 'approve':
          result = await approveQuotation(quotationId, data?.comments)
          break
        case 'reject':
          result = await rejectQuotation(quotationId, data?.comments || 'Test rejection')
          break
        case 'mark_payment_received':
          result = await markPaymentReceived(quotationId, data?.payment_amount || 1000, data?.payment_reference || 'TEST-REF')
          break
        case 'confirm_post_sale':
          result = await createPostSaleConfirmation(quotationId, {
            client_contact_person: data?.client_contact_person || 'Test Person',
            confirmation_method: data?.confirmation_method || 'phone',
            deliverables_confirmed: {},
            event_details_confirmed: {},
            client_expectations: data?.client_expectations || 'Test expectations'
          })
          break
        default:
          result = { success: false, error: 'Unknown action' }
      }

      if (result.success) {
        setMessage(`✅ ${action} successful!`)
        await loadQuotations() // Reload data
      } else {
        setMessage(`❌ ${action} failed: ${result.error}`)
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const updateToWorkflowStatus = async (quotationId: number, status: any) => {
    setLoading(true)
    try {
      const result = await updateQuotationWorkflowStatus(quotationId, status)
      if (result.success) {
        setMessage(`✅ Status updated to ${status}`)
        await loadQuotations()
      } else {
        setMessage(`❌ Status update failed: ${result.error}`)
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQuotations()
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">🧪 Workflow Test Page</h1>
        <Button onClick={loadQuotations} disabled={loading}>
          {loading ? 'Loading...' : 'Reload Data'}
        </Button>
      </div>

      {message && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm">{message}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>📊 Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Total Quotations: {quotations.length}</p>
            <p>Draft: {quotations.filter(q => q.workflow_status === 'draft').length}</p>
            <p>Pending: {quotations.filter(q => q.workflow_status === 'pending_client_confirmation').length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🧪 Quick Tests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {quotations.length > 0 && (
              <>
                <Button 
                  size="sm" 
                  onClick={() => updateToWorkflowStatus(quotations[0].id, 'pending_client_confirmation')}
                  disabled={loading}
                >
                  Set First to Pending
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => testWorkflowAction(quotations[0].id, 'submit_for_approval')}
                  disabled={loading}
                >
                  Submit for Approval
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>✅ Approval Tests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {quotations.length > 0 && (
              <>
                <Button 
                  size="sm" 
                  onClick={() => testWorkflowAction(quotations[0].id, 'approve', { comments: 'Test approval' })}
                  disabled={loading}
                >
                  Approve First
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => testWorkflowAction(quotations[0].id, 'reject', { comments: 'Test rejection' })}
                  disabled={loading}
                >
                  Reject First
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>💰 Payment Tests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {quotations.length > 0 && (
              <>
                <Button 
                  size="sm" 
                  onClick={() => testWorkflowAction(quotations[0].id, 'mark_payment_received', { 
                    payment_amount: 5000, 
                    payment_reference: 'TEST-001' 
                  })}
                  disabled={loading}
                >
                  Mark Paid
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => testWorkflowAction(quotations[0].id, 'confirm_post_sale', {
                    client_contact_person: 'John Doe',
                    confirmation_method: 'phone',
                    client_expectations: 'Everything looks good!'
                  })}
                  disabled={loading}
                >
                  Confirm Sale
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>🔄 Workflow Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <QuotationWorkflowPipeline
            quotations={quotations}
            userRole="Administrator"
            onStatusUpdate={testWorkflowAction}
            isLoading={loading}
          />
        </CardContent>
      </Card>
    </div>
  )
} 