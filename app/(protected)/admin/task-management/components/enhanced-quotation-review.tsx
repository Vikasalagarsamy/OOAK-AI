"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { toast } from 'sonner'
import { 
  Calendar,
  MapPin,
  Users,
  Clock,
  DollarSign,
  FileText,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  Eye,
  Package
} from 'lucide-react'

interface QuotationDetails {
  id: string
  quotation_number: string
  client_name: string
  bride_name: string
  groom_name: string
  mobile: string
  email: string
  total_amount: number
  status: string
  created_at: string
  quotation_data: {
    events: Array<{
      event_name: string
      event_date: string
      event_location: string
      venue_name: string
      start_time: string
      end_time: string
      expected_crowd: string
      selected_package: string
      selected_services: Array<{ id: number; quantity: number }>
      selected_deliverables: Array<{ id: number; quantity: number }>
    }>
    default_package: string
  }
  // Task context if created from task completion
  task_context?: {
    task_title: string
    client_requirements: string
    budget_range: string
    timeline: string
    urgency: string
    completion_notes: string
  }
}

interface EnhancedQuotationReviewProps {
  quotationNumber: string
  onApprove: (comments: string) => Promise<void>
  onReject: (rejectionRemarks: string) => Promise<void>
  currentStatus: string
}

export default function EnhancedQuotationReview({ 
  quotationNumber, 
  onApprove, 
  onReject, 
  currentStatus 
}: EnhancedQuotationReviewProps) {
  const [quotationDetails, setQuotationDetails] = useState<QuotationDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [rejectionRemarks, setRejectionRemarks] = useState("")
  const [approvalComments, setApprovalComments] = useState("")
  const [services, setServices] = useState<any[]>([])
  const [deliverables, setDeliverables] = useState<any[]>([])

  useEffect(() => {
    loadQuotationDetails()
    loadServicesAndDeliverables()
  }, [quotationNumber])

  const loadQuotationDetails = async () => {
    try {
      // Fetch quotation details from database
      const response = await fetch(`/api/quotation-details?quotationNumber=${quotationNumber}`)
      if (!response.ok) {
        throw new Error('Failed to fetch quotation details')
      }
      
      const data = await response.json()
      console.log('🔧 Quotation details loaded:', data.quotation)
      console.log('🔧 Package being used:', data.quotation?.quotation_data?.default_package)
      setQuotationDetails(data.quotation)
    } catch (error) {
      console.error('Error loading quotation details:', error)
      toast.error('Failed to load quotation details')
    } finally {
      setLoading(false)
    }
  }

  const loadServicesAndDeliverables = async () => {
    try {
      // Load services and deliverables for displaying names and prices
      const [servicesRes, deliverablesRes] = await Promise.all([
        fetch('/api/services'),
        fetch('/api/deliverables')
      ])
      
      if (servicesRes.ok) {
        const servicesData = await servicesRes.json()
        console.log('🔧 Services loaded:', servicesData)
        setServices(servicesData.services || [])
      } else {
        console.error('❌ Services API error:', servicesRes.status)
      }
      
      if (deliverablesRes.ok) {
        const deliverablesData = await deliverablesRes.json()
        console.log('🔧 Deliverables loaded:', deliverablesData)
        setDeliverables(deliverablesData.deliverables || [])
      } else {
        console.error('❌ Deliverables API error:', deliverablesRes.status)
      }
    } catch (error) {
      console.error('❌ Error loading services/deliverables:', error)
    }
  }

  const handleApprove = async () => {
    try {
      await onApprove(approvalComments || 'Quote approved')
      setShowApproveDialog(false)
      setApprovalComments("")
    } catch (error) {
      toast.error('Failed to approve quotation')
    }
  }

  const handleReject = async () => {
    if (!rejectionRemarks.trim()) {
      toast.error('Please provide rejection remarks')
      return
    }
    
    try {
      await onReject(rejectionRemarks)
      setShowRejectDialog(false)
      setRejectionRemarks("")
    } catch (error) {
      toast.error('Failed to reject quotation')
    }
  }

  const getServiceName = (serviceId: number) => {
    const service = services.find(s => s.id === serviceId)
    return service?.servicename || `Service ${serviceId}`
  }

  const getDeliverableName = (deliverableId: number) => {
    const deliverable = deliverables.find(d => d.id === deliverableId)
    return deliverable?.deliverable_name || `Deliverable ${deliverableId}`
  }

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading quotation details...</p>
        </div>
      </div>
    )
  }

  if (!quotationDetails) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load quotation details</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Status and Quick Summary */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-primary">Quotation Review</CardTitle>
              <p className="text-muted-foreground font-mono text-lg">#{quotationDetails.quotation_number}</p>
            </div>
            <div className="text-right">
              <Badge 
                variant={
                  currentStatus === 'approved' ? 'default' :
                  currentStatus === 'rejected' ? 'destructive' :
                  'secondary'
                }
                className="text-sm px-3 py-1 mb-2"
              >
                {currentStatus.replace('_', ' ').toUpperCase()}
              </Badge>
              <div className="text-3xl font-bold text-primary">
                {formatCurrency(quotationDetails.total_amount)}
              </div>
              <div className="text-sm text-muted-foreground">
                {quotationDetails.quotation_data.events.length} Event{quotationDetails.quotation_data.events.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Client Information */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Users className="h-5 w-5" />
            Client Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-sm font-medium text-blue-600 mb-1">Wedding Couple</p>
                <p className="font-bold text-lg text-gray-800">{quotationDetails.bride_name} & {quotationDetails.groom_name}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-sm font-medium text-blue-600 mb-1">Primary Contact</p>
                <p className="font-semibold text-gray-800">{quotationDetails.client_name}</p>
                <p className="text-sm text-gray-600 mt-1">{quotationDetails.mobile}</p>
                <p className="text-sm text-gray-600">{quotationDetails.email}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-sm font-medium text-blue-600 mb-1">Quotation Details</p>
                <p className="text-sm text-gray-600">Created: {formatDate(quotationDetails.created_at)}</p>
                <p className="text-sm text-gray-600">Events: {quotationDetails.quotation_data.events.length}</p>
                <p className="text-sm text-gray-600">Package: {quotationDetails.quotation_data.default_package}</p>
              </div>
              <div className="bg-gradient-to-r from-green-100 to-blue-100 p-4 rounded-lg shadow-sm border-2 border-green-200">
                <p className="text-sm font-medium text-green-700 mb-1">Total Investment</p>
                <p className="font-bold text-2xl text-green-800">{formatCurrency(quotationDetails.total_amount)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Context (if available) */}
      {quotationDetails.task_context && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <FileText className="h-5 w-5" />
              Original Task Context
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-blue-700">Task:</p>
                <p className="text-blue-600">{quotationDetails.task_context.task_title}</p>
              </div>
              <div>
                <p className="font-medium text-blue-700">Budget Range:</p>
                <p className="text-blue-600">{quotationDetails.task_context.budget_range}</p>
              </div>
              <div>
                <p className="font-medium text-blue-700">Timeline:</p>
                <p className="text-blue-600">{quotationDetails.task_context.timeline}</p>
              </div>
              <div>
                <p className="font-medium text-blue-700">Urgency:</p>
                <p className="text-blue-600">{quotationDetails.task_context.urgency}</p>
              </div>
              <div className="md:col-span-2">
                <p className="font-medium text-blue-700">Client Requirements:</p>
                <p className="text-blue-600">{quotationDetails.task_context.client_requirements}</p>
              </div>
              {quotationDetails.task_context.completion_notes && (
                <div className="md:col-span-2">
                  <p className="font-medium text-blue-700">Completion Notes:</p>
                  <p className="text-blue-600">{quotationDetails.task_context.completion_notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Events Details */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-purple-100 to-pink-100">
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <Calendar className="h-5 w-5" />
            Event Details ({quotationDetails.quotation_data.events.length} Events)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {quotationDetails.quotation_data.events.map((event, index) => (
              <div key={index} className="border-2 border-purple-200 rounded-xl p-6 bg-gradient-to-br from-white to-purple-50">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="font-bold text-xl text-purple-900">{event.event_name}</h4>
                  <Badge variant="outline" className="capitalize text-purple-700 border-purple-300 px-3 py-1">
                    {quotationDetails.quotation_data.default_package} Package
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="font-medium">{formatDate(event.event_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Time</p>
                      <p className="font-medium">{event.start_time} - {event.end_time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Venue</p>
                      <p className="font-medium">{event.venue_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Expected Crowd</p>
                      <p className="font-medium">{event.expected_crowd}</p>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{event.event_location}</p>
                  </div>
                </div>

                {/* Services for this event */}
                {event.selected_services.length > 0 && (
                  <div className="mb-4">
                    <h5 className="font-medium mb-3 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Services ({event.selected_services.length})
                    </h5>
                    <div className="space-y-2">
                      {event.selected_services.map((service, sIndex) => {
                        const serviceData = services.find(s => s.id === service.id)
                        const serviceName = serviceData?.servicename || `Service ${service.id}`
                        
                        // Get price based on package type
                        let servicePrice = 0
                        if (serviceData) {
                          const packageType = quotationDetails.quotation_data.default_package
                          switch (packageType) {
                            case 'basic':
                              servicePrice = serviceData.basic_price || 0
                              break
                            case 'premium':
                              servicePrice = serviceData.premium_price || 0
                              break
                            case 'elite':
                              servicePrice = serviceData.elite_price || 0
                              break
                            default:
                              servicePrice = serviceData.basic_price || 0
                          }
                          console.log(`🔧 Service ${serviceName} (${packageType}): ₹${servicePrice}`)
                        }
                        
                        const totalPrice = servicePrice * service.quantity
                        
                        return (
                          <div key={sIndex} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{serviceName}</p>
                              <p className="text-sm text-gray-600">
                                {formatCurrency(servicePrice)} × {service.quantity} = {formatCurrency(totalPrice)}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-green-700 border-green-300">
                              Qty: {service.quantity}
                            </Badge>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Deliverables for this event */}
                {event.selected_deliverables.length > 0 && (
                  <div>
                    <h5 className="font-medium mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Deliverables ({event.selected_deliverables.length})
                    </h5>
                    <div className="space-y-2">
                      {event.selected_deliverables.map((deliverable, dIndex) => {
                        const deliverableData = deliverables.find(d => d.id === deliverable.id)
                        const deliverableName = deliverableData?.deliverable_name || `Deliverable ${deliverable.id}`
                        
                        // Get price based on package type
                        let deliverablePrice = 0
                        if (deliverableData) {
                          switch (quotationDetails.quotation_data.default_package) {
                            case 'basic':
                              deliverablePrice = deliverableData.basic_price || 0
                              break
                            case 'premium':
                              deliverablePrice = deliverableData.premium_price || 0
                              break
                            case 'elite':
                              deliverablePrice = deliverableData.elite_price || 0
                              break
                            default:
                              deliverablePrice = deliverableData.basic_price || 0
                          }
                        }
                        
                        const totalPrice = deliverablePrice * deliverable.quantity
                        
                        return (
                          <div key={dIndex} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{deliverableName}</p>
                              <p className="text-sm text-gray-600">
                                {formatCurrency(deliverablePrice)} × {deliverable.quantity} = {formatCurrency(totalPrice)}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-blue-700 border-blue-300">
                              Qty: {deliverable.quantity}
                            </Badge>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons - Only show if pending approval */}
      {(currentStatus === 'pending_approval' || currentStatus === 'pending') && (
        <Card>
          <CardHeader>
            <CardTitle>Review Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Approve Quotation
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Approve Quotation</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Approving quotation for {formatCurrency(quotationDetails.total_amount)}
                      </p>
                      <Textarea
                        placeholder="Add approval comments (optional)..."
                        value={approvalComments}
                        onChange={(e) => setApprovalComments(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleApprove}>
                        Confirm Approval
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Reject Quotation
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reject Quotation</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Provide Detailed Feedback</AlertTitle>
                      <AlertDescription>
                        Your rejection remarks will be sent to the sales resource for revision.
                        Please be specific about what needs to be changed.
                      </AlertDescription>
                    </Alert>
                    <div>
                      <label className="text-sm font-medium">Rejection Remarks *</label>
                      <Textarea
                        placeholder="Please specify what needs to be revised in this quotation..."
                        value={rejectionRemarks}
                        onChange={(e) => setRejectionRemarks(e.target.value)}
                        className="mt-1"
                        rows={4}
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                        Cancel
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={handleReject}
                        disabled={!rejectionRemarks.trim()}
                      >
                        Confirm Rejection
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Status Info */}
      {currentStatus === 'approved' && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Quotation Approved</AlertTitle>
          <AlertDescription>
            This quotation has been approved and is ready to be sent to the client.
          </AlertDescription>
        </Alert>
      )}

      {currentStatus === 'rejected' && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Quotation Rejected</AlertTitle>
          <AlertDescription>
            This quotation has been rejected and sent back to the sales resource for revision.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
} 