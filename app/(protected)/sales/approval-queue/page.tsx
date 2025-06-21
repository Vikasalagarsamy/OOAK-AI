"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/postgresql-client-unified"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { CheckCircle, XCircle, Calendar, DollarSign, User, Clock, Eye, FileText, MessageSquare } from "lucide-react"
import EnhancedQuotationReview from "../../admin/task-management/components/enhanced-quotation-review"

interface Quotation {
  id: number
  quotation_number: string
  client_name: string
  bride_name: string
  groom_name: string
  mobile: string
  email: string
  total_amount: number
  created_at: string
  created_by: string
  quotation_data: any
  status: string
  workflow_status?: string
  slug?: string
  quotation_approvals?: Array<{
    id: number
    approval_status: string
    comments: string
    created_at: string
  }>
  // User information for display
  creator_name?: string
}

export default function SalesApprovalQueuePage() {
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [comments, setComments] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve')
  const [showEnhancedReview, setShowEnhancedReview] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('pending')

  useEffect(() => {
    fetchPendingApprovals()
  }, [activeTab])

  const fetchPendingApprovals = async () => {
    try {
      const { query, transaction } = createClient()
      
      // Get quotations with their approval status and user information
      const { data, error } = await supabase
        .from('quotations')
        .select(`
          *,
          quotation_approvals (
            id,
            approval_status,
            comments,
            created_at
          )
        `)
        .order('created_at', { ascending: false })

      // Process the data to add user names and other improvements
      let processedQuotations: Quotation[] = []
      if (data) {
        processedQuotations = data.map((q: any) => ({
          ...q,
          creator_name: q.created_by && q.created_by !== '00000000-0000-0000-0000-000000000000' 
            ? 'Sales Team Member' // You can fetch from users table if needed
            : 'System Generated',
          // Ensure quotation_approvals is properly sorted
          quotation_approvals: q.quotation_approvals?.sort((a: any, b: any) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        }))
      }

      if (error) throw error
      
      // Filter based on active tab
      const allQuotations = processedQuotations
      let filteredQuotations: Quotation[] = []
      
      if (activeTab === 'pending') {
        // Show quotations that are pending approval based on workflow_status and approval records
        filteredQuotations = allQuotations.filter(q => {
          // Check workflow_status first - this is the primary indicator
          if (q.workflow_status === 'pending_approval') {
            return true
          }
          
          // If no workflow_status, check approval records
          const hasApprovalRecord = q.quotation_approvals && q.quotation_approvals.length > 0
          if (!hasApprovalRecord) {
            // Show if status is draft or pending and no workflow status
            return (q.status === 'draft' || q.status === 'pending') && !q.workflow_status
          }
          
          // If has approval records, check the latest one
          const latestApproval = q.quotation_approvals![0]
          return latestApproval.approval_status === 'pending'
        })
      } else if (activeTab === 'approved') {
        filteredQuotations = allQuotations.filter(q => {
          return q.status === 'approved'
        })
      } else if (activeTab === 'rejected') {
        filteredQuotations = allQuotations.filter(q => {
          return q.status === 'rejected'
        })
      }
      
      setQuotations(filteredQuotations)
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load approvals",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (quotation: Quotation, action: 'approve' | 'reject') => {
    setSelectedQuotation(quotation)
    setActionType(action)
    setComments("")
    setDialogOpen(true)
  }

  const confirmAction = async () => {
    if (!selectedQuotation) return

    setActionLoading(true)
    try {
      // Use our dedicated API endpoint
      const response = await fetch('/api/quotation-approval', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quotationId: selectedQuotation.id,
          action: actionType,
          comments: comments || null
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      toast({
        title: "Success",
        description: result.message,
      })

      // Refresh the list
      await fetchPendingApprovals()
      setDialogOpen(false)
      setSelectedQuotation(null)
      setComments("")

    } catch (error: any) {
      console.error('Error processing approval:', error)
      toast({
        title: "Error",
        description: `Failed to ${actionType} quotation`,
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pending approvals...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quotation Approval Queue</h1>
        <p className="text-gray-600">Review, approve, or reject quotations submitted by the sales team</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending Approval
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Approved
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Rejected
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {quotations.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">
                    No {activeTab} quotations found
                  </h3>
                  <p className="text-sm">
                    {activeTab === 'pending' && "All quotations are currently processed"}
                    {activeTab === 'approved' && "No quotations have been approved yet"}
                    {activeTab === 'rejected' && "No quotations have been rejected yet"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {quotations.map((quotation) => (
                <Card key={quotation.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          {quotation.quotation_number}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {quotation.client_name}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {formatCurrency(quotation.total_amount)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(quotation.created_at)}
                            </span>
                          </div>
                        </CardDescription>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => setShowEnhancedReview(quotation.quotation_number)}
                          variant="outline"
                          size="sm"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Enhanced Review
                        </Button>
                        
                        {activeTab === 'pending' && (
                          <>
                            <Button
                              onClick={() => handleAction(quotation, 'approve')}
                              className="bg-green-600 hover:bg-green-700"
                              size="sm"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              onClick={() => handleAction(quotation, 'reject')}
                              variant="destructive"
                              size="sm"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </>
                        )}
                        
                        {(activeTab === 'approved' || activeTab === 'rejected') && (
                          <Badge variant="outline" className="text-xs">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            {quotation.quotation_approvals?.[0]?.comments || 'No comments'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Bride:</span>
                        <p className="text-gray-600">{quotation.bride_name}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Groom:</span>
                        <p className="text-gray-600">{quotation.groom_name}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Mobile:</span>
                        <p className="text-gray-600">{quotation.mobile}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Created by:</span>
                        <p className="text-gray-600">{quotation.creator_name || 'Sales Team'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Enhanced Review Dialog */}
      {showEnhancedReview && (
        <Dialog open={!!showEnhancedReview} onOpenChange={() => setShowEnhancedReview(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Enhanced Quotation Review - {showEnhancedReview}
              </DialogTitle>
            </DialogHeader>
            <EnhancedQuotationReview 
              quotationNumber={showEnhancedReview}
              onApprove={async (comments: string) => {
                const quotation = quotations.find(q => q.quotation_number === showEnhancedReview)
                if (quotation) {
                  setSelectedQuotation(quotation)
                  setActionType('approve')
                  setComments(comments || '')
                  setShowEnhancedReview(null)
                  setDialogOpen(true)
                }
              }}
              onReject={async (rejectionRemarks: string) => {
                const quotation = quotations.find(q => q.quotation_number === showEnhancedReview)
                if (quotation) {
                  setSelectedQuotation(quotation)
                  setActionType('reject')
                  setComments(rejectionRemarks)
                  setShowEnhancedReview(null)
                  setDialogOpen(true)
                }
              }}
              currentStatus={
                quotations.find(q => q.quotation_number === showEnhancedReview)?.quotation_approvals?.[0]?.approval_status || 'pending'
              }
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Action Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve' : 'Reject'} Quotation
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' 
                ? `Are you sure you want to approve quotation ${selectedQuotation?.quotation_number}? This will move it to the accounting team for payment processing.`
                : `Are you sure you want to reject quotation ${selectedQuotation?.quotation_number}? This will send it back to the sales team.`
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="comments">Comments (optional)</Label>
              <Textarea
                id="comments"
                placeholder={actionType === 'approve' ? "Any approval notes..." : "Reason for rejection..."}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={confirmAction}
                disabled={actionLoading}
                className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
                variant={actionType === 'reject' ? 'destructive' : 'default'}
              >
                {actionLoading ? 'Processing...' : `${actionType === 'approve' ? 'Approve' : 'Reject'} Quotation`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 