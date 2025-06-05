"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { DollarSign, User, Clock, Phone, CheckCircle, Calendar, FileText } from "lucide-react"

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
  workflow_status: string
}

export default function PostSalesConfirmationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  
  // Post-sale confirmation form fields
  const [callDate, setCallDate] = useState("")
  const [callTime, setCallTime] = useState("")
  const [callDuration, setCallDuration] = useState("30")
  const [confirmationMethod, setConfirmationMethod] = useState("phone")
  const [clientSatisfactionRating, setClientSatisfactionRating] = useState("5")
  const [clientExpectations, setClientExpectations] = useState("")
  const [callSummary, setCallSummary] = useState("")
  const [clientConcerns, setClientConcerns] = useState("")
  const [followUpRequired, setFollowUpRequired] = useState(false)
  const [followUpDate, setFollowUpDate] = useState("")

  useEffect(() => {
    fetchPendingConfirmations()
    // Set default date and time
    const now = new Date()
    setCallDate(now.toISOString().split('T')[0])
    setCallTime(now.toTimeString().slice(0, 5))
  }, [])

  const fetchPendingConfirmations = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('quotations')
        .select('*')
        .in('workflow_status', ['payment_received', 'pending_post_sale'])
        .order('created_at', { ascending: false })

      if (error) throw error
      setQuotations((data as unknown as Quotation[]) || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load pending confirmations",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmPostSale = (quotation: Quotation) => {
    setSelectedQuotation(quotation)
    setClientExpectations("")
    setCallSummary("")
    setClientConcerns("")
    setFollowUpRequired(false)
    setFollowUpDate("")
    setDialogOpen(true)
  }

  const confirmPostSale = async () => {
    if (!selectedQuotation) return

    if (!clientExpectations.trim() || !callSummary.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in client expectations and call summary",
        variant: "destructive"
      })
      return
    }

    setActionLoading(true)
    try {
      const supabase = createClient()

      // Create post-sale confirmation record
      const { error: confirmationError } = await supabase
        .from('post_sale_confirmations')
        .insert({
          quotation_id: selectedQuotation.id,
          confirmed_by_user_id: '550e8400-e29b-41d4-a716-446655440000', // TODO: Get actual user ID
          call_date: callDate,
          call_time: callTime,
          call_duration: parseInt(callDuration),
          client_contact_person: selectedQuotation.client_name,
          confirmation_method: confirmationMethod,
          services_confirmed: [],
          deliverables_confirmed: [],
          event_details_confirmed: {
            date_confirmed: true,
            venue_confirmed: true,
            timing_confirmed: true,
            guest_count_confirmed: true,
            special_requirements_confirmed: true
          },
          client_satisfaction_rating: parseInt(clientSatisfactionRating),
          client_expectations: clientExpectations,
          client_concerns: clientConcerns || null,
          call_summary: callSummary,
          follow_up_required: followUpRequired,
          follow_up_date: followUpRequired ? followUpDate : null,
          attachments: []
        })

      if (confirmationError) throw confirmationError

      // Update quotation status
      const { error: updateError } = await supabase
        .from('quotations')
        .update({ workflow_status: 'confirmed' })
        .eq('id', selectedQuotation.id)

      if (updateError) throw updateError

      // Log to workflow history
      const { error: historyError } = await supabase
        .from('quotation_workflow_history')
        .insert({
          quotation_id: selectedQuotation.id,
          action: 'post_sale_confirmed',
          performed_by: '550e8400-e29b-41d4-a716-446655440000', // TODO: Get actual user ID
          comments: `Post-sale confirmation completed. Rating: ${clientSatisfactionRating}/5. Follow-up required: ${followUpRequired ? 'Yes' : 'No'}`
        })

      if (historyError) {
        console.warn('Failed to log workflow history:', historyError)
      }

      toast({
        title: "Success",
        description: "Post-sale confirmation completed successfully",
      })

      // Remove from list
      setQuotations(quotations.filter(q => q.id !== selectedQuotation.id))
      setDialogOpen(false)
      setSelectedQuotation(null)

    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to complete post-sale confirmation",
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
      case 'payment_received':
        return <Badge className="bg-blue-100 text-blue-800">Payment Received</Badge>
      case 'pending_post_sale':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Post-Sale</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading post-sale confirmations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Post-Sale Confirmations</h1>
        <p className="text-gray-600">Complete post-sale confirmations for paid quotations</p>
      </div>

      {quotations.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Phone className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">All confirmations complete!</h3>
            <p className="text-gray-600">No quotations pending post-sale confirmation at the moment.</p>
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
                      onClick={() => handleConfirmPostSale(quotation)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Confirm Post-Sale
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

      {/* Post-Sale Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Post-Sale Confirmation</DialogTitle>
            <DialogDescription>
              Document the post-sale confirmation call for {selectedQuotation?.quotation_number}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Call Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="call_date">Call Date *</Label>
                <Input
                  id="call_date"
                  type="date"
                  value={callDate}
                  onChange={(e) => setCallDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="call_time">Call Time *</Label>
                <Input
                  id="call_time"
                  type="time"
                  value={callTime}
                  onChange={(e) => setCallTime(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="call_duration">Duration (minutes)</Label>
                <Input
                  id="call_duration"
                  type="number"
                  value={callDuration}
                  onChange={(e) => setCallDuration(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="confirmation_method">Method</Label>
                <Select value={confirmationMethod} onValueChange={setConfirmationMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phone">Phone Call</SelectItem>
                    <SelectItem value="video_call">Video Call</SelectItem>
                    <SelectItem value="in_person">In Person</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Client Feedback */}
            <div>
              <Label htmlFor="client_satisfaction_rating">Client Satisfaction Rating (1-5)</Label>
              <Select value={clientSatisfactionRating} onValueChange={setClientSatisfactionRating}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Very Unsatisfied</SelectItem>
                  <SelectItem value="2">2 - Unsatisfied</SelectItem>
                  <SelectItem value="3">3 - Neutral</SelectItem>
                  <SelectItem value="4">4 - Satisfied</SelectItem>
                  <SelectItem value="5">5 - Very Satisfied</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="client_expectations">Client Expectations *</Label>
              <Textarea
                id="client_expectations"
                placeholder="Document what the client expects from our services..."
                value={clientExpectations}
                onChange={(e) => setClientExpectations(e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="call_summary">Call Summary *</Label>
              <Textarea
                id="call_summary"
                placeholder="Provide a comprehensive summary of the post-sale call..."
                value={callSummary}
                onChange={(e) => setCallSummary(e.target.value)}
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="client_concerns">Client Concerns (if any)</Label>
              <Textarea
                id="client_concerns"
                placeholder="Any concerns or issues raised by the client..."
                value={clientConcerns}
                onChange={(e) => setClientConcerns(e.target.value)}
                rows={2}
              />
            </div>

            {/* Follow-up */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="follow_up_required"
                checked={followUpRequired}
                onChange={(e) => setFollowUpRequired(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="follow_up_required">Follow-up required</Label>
            </div>

            {followUpRequired && (
              <div>
                <Label htmlFor="follow_up_date">Follow-up Date</Label>
                <Input
                  id="follow_up_date"
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                />
              </div>
            )}
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={confirmPostSale}
                disabled={actionLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {actionLoading ? 'Processing...' : 'Confirm Post-Sale'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 