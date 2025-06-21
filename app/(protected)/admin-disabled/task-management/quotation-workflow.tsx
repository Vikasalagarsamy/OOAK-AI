"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import QuoteRevisionForm from './components/quote-revision-form'
import EnhancedQuotationReview from './components/enhanced-quotation-review'
import { toast } from 'sonner'
import { 
  FileText, 
  Send, 
  CheckCircle, 
  XCircle, 
  MessageCircle, 
  AlertCircle,
  RefreshCw,
  Clock,
  CheckCircle2,
  Ban,
  Eye
} from 'lucide-react'

interface QuotationAction {
  id: string
  type: 'approval' | 'rejection' | 'revision' | 'client_response'
  status: 'approved' | 'rejected' | 'needs_revision' | 'accepted' | 'declined'
  message: string
  timestamp: string
  actor: string
}

interface Quotation {
  id: string
  clientName: string
  amount: number
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'sent_to_client' | 'client_accepted' | 'client_declined' | 'closed'
  createdAt: string
  lastUpdated: string
  salesPerson: string
  rejectionRemarks?: string
  revisionCount: number
  actions: QuotationAction[]
  clientWhatsApp: string
}

interface QuotationWorkflowProps {
  initialQuote: Quotation
}

export default function QuotationWorkflow({ initialQuote }: QuotationWorkflowProps) {
  const [activeQuotation, setActiveQuotation] = useState<Quotation>(initialQuote)

  const [rejectionRemark, setRejectionRemark] = useState("")
  const [showRejectionDialog, setShowRejectionDialog] = useState(false)
  const [showRevisionForm, setShowRevisionForm] = useState(false)
  const [showEnhancedReview, setShowEnhancedReview] = useState(false)

  // Function to handle approval
  const handleApproval = async (comments: string = 'Quote approved') => {
    try {
      // Call the approval API to update database
      const response = await fetch('/api/quotation-approval', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quotationId: activeQuotation.id,
          action: 'approve',
          comments: comments
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to approve quotation in database')
      }

      // Update local state
      setActiveQuotation(prev => ({
        ...prev,
        status: 'approved',
        lastUpdated: new Date().toISOString(),
        actions: [
          ...prev.actions,
          {
            id: Date.now().toString(),
            type: 'approval',
            status: 'approved',
            message: comments,
            timestamp: new Date().toISOString(),
            actor: 'Sales Head'
          }
        ]
      }))
      toast.success('Quote approved successfully and saved to database')
    } catch (error) {
      console.error('Approval error:', error)
      toast.error('Failed to approve quote')
      throw error
    }
  }

  // Function to handle rejection
  const handleRejection = async (rejectionRemarks: string) => {
    try {
      // Call the rejection API to update database
      const response = await fetch('/api/quotation-approval', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quotationId: activeQuotation.id,
          action: 'reject',
          comments: rejectionRemarks
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to reject quotation in database')
      }

      // Update local state
      setActiveQuotation(prev => ({
        ...prev,
        status: 'rejected',
        rejectionRemarks: rejectionRemarks,
        lastUpdated: new Date().toISOString(),
        actions: [
          ...prev.actions,
          {
            id: Date.now().toString(),
            type: 'rejection',
            status: 'rejected',
            message: rejectionRemarks,
            timestamp: new Date().toISOString(),
            actor: 'Sales Head'
          }
        ]
      }))
      setShowRejectionDialog(false)
      toast.info('Quote rejected - Awaiting revision')
      
      // TODO: Send notification to sales resource about rejection
      await sendRejectionNotification(activeQuotation.id, rejectionRemarks)
    } catch (error) {
      console.error('Rejection error:', error)
      toast.error('Failed to reject quote')
      throw error
    }
  }

  // Function to send rejection notification to sales resource
  const sendRejectionNotification = async (quotationId: string, remarks: string) => {
    try {
      // TODO: Implement notification system
      console.log('📧 Sending rejection notification for quotation:', quotationId)
      console.log('📝 Rejection remarks:', remarks)
    } catch (error) {
      console.warn('Failed to send rejection notification:', error)
    }
  }

  // Function to handle revision submission
  const handleRevisionSubmit = async (revisionData: { newAmount: number; revisionNotes: string }) => {
    try {
      setActiveQuotation(prev => ({
        ...prev,
        status: 'pending_approval',
        amount: revisionData.newAmount,
        revisionCount: prev.revisionCount + 1,
        lastUpdated: new Date().toISOString(),
        actions: [
          ...prev.actions,
          {
            id: Date.now().toString(),
            type: 'revision',
            status: 'needs_revision',
            message: `Revised amount to ₹${revisionData.newAmount.toLocaleString()}. Notes: ${revisionData.revisionNotes}`,
            timestamp: new Date().toISOString(),
            actor: prev.salesPerson
          }
        ]
      }))
      setShowRevisionForm(false)
      toast.success('Revision submitted for approval')
    } catch (error) {
      toast.error('Failed to submit revision')
    }
  }

  // Function to send quotation via WhatsApp
  const sendQuotationViaWhatsApp = async (quotation: Quotation) => {
    try {
      const response = await fetch('/api/send-quotation-whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quotationId: quotation.id,
          clientWhatsApp: quotation.clientWhatsApp,
          amount: quotation.amount,
          clientName: quotation.clientName,
          salesPerson: quotation.salesPerson
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send quotation via WhatsApp')
      }

      const result = await response.json()

      setActiveQuotation(prev => ({
        ...prev,
        status: 'sent_to_client',
        lastUpdated: new Date().toISOString(),
        actions: [
          ...prev.actions,
          {
            id: Date.now().toString(),
            type: 'approval',
            status: 'approved',
            message: `Quotation sent to client via WhatsApp (ID: ${result.messageId})`,
            timestamp: new Date().toISOString(),
            actor: 'System'
          }
        ]
      }))
      toast.success('Quote sent to client via WhatsApp')
    } catch (error) {
      console.error('Error sending quotation:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to send quote via WhatsApp')
    }
  }

  return (
    <div className="space-y-8">
      {/* View Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Quotation #{activeQuotation.id}</CardTitle>
            <div className="flex items-center gap-4">
              <Button
                variant={showEnhancedReview ? "outline" : "default"}
                size="sm"
                onClick={() => setShowEnhancedReview(!showEnhancedReview)}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                {showEnhancedReview ? 'Basic View' : 'Detailed Review'}
              </Button>
              <Badge variant={
                activeQuotation.status === 'rejected' ? 'destructive' :
                activeQuotation.status === 'approved' ? 'default' :
                'secondary'
              }>
                {activeQuotation.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Client</p>
              <p className="font-medium">{activeQuotation.clientName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="font-medium">₹{activeQuotation.amount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sales Person</p>
              <p className="font-medium">{activeQuotation.salesPerson}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Revision Count</p>
              <p className="font-medium">{activeQuotation.revisionCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Review Component */}
      {showEnhancedReview && (
        <EnhancedQuotationReview
          quotationNumber={activeQuotation.id}
          onApprove={handleApproval}
          onReject={handleRejection}
          currentStatus={activeQuotation.status}
        />
      )}

      {/* Basic View (Original) */}
      {!showEnhancedReview && (
        <div className="space-y-8">

      {/* Action History */}
      <Card>
        <CardHeader>
          <CardTitle>Action History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeQuotation.actions.map(action => (
              <div key={action.id} className="flex items-start gap-4 border-b pb-4">
                <div className={`p-2 rounded-full ${
                  action.status === 'approved' ? 'bg-green-100' :
                  action.status === 'rejected' ? 'bg-red-100' :
                  'bg-orange-100'
                }`}>
                  {action.status === 'approved' ? <CheckCircle className="h-5 w-5 text-green-600" /> :
                   action.status === 'rejected' ? <XCircle className="h-5 w-5 text-red-600" /> :
                   <AlertCircle className="h-5 w-5 text-orange-600" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{action.actor}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(action.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-sm mt-1">{action.message}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Available Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {activeQuotation.status === 'pending_approval' && (
              <>
                <Button 
                  variant="default" 
                  className="flex items-center gap-2"
                  onClick={() => handleApproval()}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve
                </Button>
                <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="flex items-center gap-2">
                      <Ban className="h-4 w-4" />
                      Reject
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Reject Quotation</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <Textarea
                        placeholder="Enter rejection remarks..."
                        value={rejectionRemark}
                        onChange={(e) => setRejectionRemark(e.target.value)}
                      />
                      <Button 
                        variant="destructive" 
                        onClick={() => handleRejection(rejectionRemark)}
                        disabled={!rejectionRemark.trim()}
                      >
                        Confirm Rejection
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}

            {activeQuotation.status === 'approved' && (
              <Button 
                variant="default" 
                className="flex items-center gap-2"
                onClick={() => sendQuotationViaWhatsApp(activeQuotation)}
              >
                <Send className="h-4 w-4" />
                Send to Client via WhatsApp
              </Button>
            )}

            {activeQuotation.status === 'rejected' && (
              <Button 
                variant="default" 
                className="flex items-center gap-2"
                onClick={() => setShowRevisionForm(true)}
              >
                <RefreshCw className="h-4 w-4" />
                Start Revision
              </Button>
            )}

            {activeQuotation.status === 'sent_to_client' && (
              <Button variant="outline" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Awaiting Client Response
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Revision Form Dialog */}
      {showRevisionForm && (
        <Dialog open={showRevisionForm} onOpenChange={setShowRevisionForm}>
          <DialogContent className="max-w-2xl">
            <QuoteRevisionForm
              quotationId={activeQuotation.id}
              currentAmount={activeQuotation.amount}
              rejectionRemarks={activeQuotation.rejectionRemarks || ''}
              onSubmitRevision={handleRevisionSubmit}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Status Alerts */}
      {activeQuotation.status === 'rejected' && !showRevisionForm && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Quotation Rejected</AlertTitle>
          <AlertDescription>
            {activeQuotation.rejectionRemarks}
          </AlertDescription>
        </Alert>
      )}

      {activeQuotation.status === 'sent_to_client' && (
        <Alert>
          <MessageCircle className="h-4 w-4" />
          <AlertTitle>WhatsApp Notification Sent</AlertTitle>
          <AlertDescription>
            Quotation has been sent to client's WhatsApp ({activeQuotation.clientWhatsApp})
          </AlertDescription>
        </Alert>
      )}
        </div>
      )}
    </div>
  )
} 