"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { CheckCircle, XCircle, Calendar, DollarSign, User, Clock } from "lucide-react"

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
}

export default function SalesApprovalsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [comments, setComments] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve')

  useEffect(() => {
    fetchPendingApprovals()
  }, [])

  const fetchPendingApprovals = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('quotations')
        .select('*')
        .eq('workflow_status', 'pending_approval')
        .order('created_at', { ascending: false })

      if (error) throw error
      setQuotations((data as unknown as Quotation[]) || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load pending approvals",
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
      const supabase = createClient()
      const newStatus = actionType === 'approve' ? 'approved' : 'rejected'

      // Update quotation status
      const { error: updateError } = await supabase
        .from('quotations')
        .update({ workflow_status: newStatus })
        .eq('id', selectedQuotation.id)

      if (updateError) throw updateError

      // Log to workflow history
      const { error: historyError } = await supabase
        .from('quotation_workflow_history')
        .insert({
          quotation_id: selectedQuotation.id,
          action: actionType === 'approve' ? 'approved' : 'rejected',
          performed_by: '550e8400-e29b-41d4-a716-446655440000', // TODO: Get actual user ID
          comments: comments || null
        })

      if (historyError) {
        console.warn('Failed to log workflow history:', historyError)
      }

      toast({
        title: "Success",
        description: `Quotation ${actionType}d successfully`,
      })

      // Remove from list
      setQuotations(quotations.filter(q => q.id !== selectedQuotation.id))
      setDialogOpen(false)
      setSelectedQuotation(null)

    } catch (error: any) {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quotations Pending Approval</h1>
        <p className="text-gray-600">Review and approve or reject quotations submitted by the sales team</p>
      </div>

      {quotations.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
            <p className="text-gray-600">No quotations pending approval at the moment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {quotations.map((quotation) => (
            <Card key={quotation.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {quotation.quotation_number}
                      <Badge variant="secondary">Pending Approval</Badge>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {quotation.client_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {formatCurrency(quotation.total_amount)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDate(quotation.created_at)}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleAction(quotation, 'approve')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleAction(quotation, 'reject')}
                      variant="destructive"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
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
                    <p className="text-gray-600">{quotation.created_by}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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