"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/postgresql-client-unified"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { DollarSign, User, Clock, CreditCard, FileText, CheckCircle } from "lucide-react"

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
  workflow_status: string
}

export default function AccountingPaymentsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  
  // Payment form fields
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentReference, setPaymentReference] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [paymentNotes, setPaymentNotes] = useState("")

  useEffect(() => {
    fetchPendingPayments()
  }, [])

  const fetchPendingPayments = async () => {
    try {
      const { query, transaction } = createClient()
      const { data, error } = await supabase
        .from('quotations')
        .select('*')
        .in('workflow_status', ['approved', 'pending_payment'])
        .order('created_at', { ascending: false })

      if (error) throw error
      setQuotations((data as unknown as Quotation[]) || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load pending payments",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsPaid = (quotation: Quotation) => {
    setSelectedQuotation(quotation)
    setPaymentAmount(quotation.total_amount.toString())
    setPaymentReference("")
    setPaymentMethod("")
    setPaymentNotes("")
    setDialogOpen(true)
  }

  const confirmPayment = async () => {
    if (!selectedQuotation) return

    if (!paymentAmount || !paymentReference) {
      toast({
        title: "Missing Information",
        description: "Please fill in payment amount and reference",
        variant: "destructive"
      })
      return
    }

    setActionLoading(true)
    try {
      const { query, transaction } = createClient()

      // Update quotation status
      const { error: updateError } = await supabase
        .from('quotations')
        .update({ workflow_status: 'payment_received' })
        .eq('id', selectedQuotation.id)

      if (updateError) throw updateError

      // Log to workflow history
      const { error: historyError } = await supabase
        .from('quotation_workflow_history')
        .insert({
          quotation_id: selectedQuotation.id,
          action: 'payment_received',
          performed_by: '550e8400-e29b-41d4-a716-446655440000', // TODO: Get actual user ID
          comments: `Payment received: ${paymentAmount} | Reference: ${paymentReference} | Method: ${paymentMethod} | Notes: ${paymentNotes}`
        })

      if (historyError) {
        console.warn('Failed to log workflow history:', historyError)
      }

      toast({
        title: "Success",
        description: "Payment marked as received successfully",
      })

      // Remove from list
      setQuotations(quotations.filter(q => q.id !== selectedQuotation.id))
      setDialogOpen(false)
      setSelectedQuotation(null)

    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to mark payment as received",
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case 'pending_payment':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Payment</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment processing queue...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Processing</h1>
        <p className="text-gray-600">Process payments for approved quotations</p>
      </div>

      {quotations.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <CreditCard className="mx-auto h-12 w-12 text-blue-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">All payments processed!</h3>
            <p className="text-gray-600">No quotations pending payment processing at the moment.</p>
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
                      {getStatusBadge(quotation.workflow_status)}
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
                      onClick={() => handleMarkAsPaid(quotation)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Mark as Paid
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
                    <span className="font-medium text-gray-700">Email:</span>
                    <p className="text-gray-600">{quotation.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Payment Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mark Payment as Received</DialogTitle>
            <DialogDescription>
              Record payment details for quotation {selectedQuotation?.quotation_number}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="payment_amount">Payment Amount *</Label>
              <Input
                id="payment_amount"
                type="number"
                placeholder="Enter payment amount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="payment_reference">Payment Reference *</Label>
              <Input
                id="payment_reference"
                placeholder="Transaction ID, check number, etc."
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="payment_method">Payment Method</Label>
              <Input
                id="payment_method"
                placeholder="Bank transfer, cash, card, etc."
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="payment_notes">Additional Notes</Label>
              <Textarea
                id="payment_notes"
                placeholder="Any additional payment notes..."
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={confirmPayment}
                disabled={actionLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {actionLoading ? 'Processing...' : 'Confirm Payment'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 