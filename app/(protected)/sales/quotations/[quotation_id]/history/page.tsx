"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/postgresql-client-unified"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Clock, User, MessageSquare, CheckCircle, XCircle, CreditCard, Phone } from "lucide-react"

interface QuotationHistory {
  id: number
  action: string
  performed_at: string
  comments: string | null
  performed_by: string
}

interface Quotation {
  id: number
  quotation_number: string
  client_name: string
  workflow_status: string
  total_amount: number
  created_at: string
}

export default function QuotationHistoryPage() {
  const params = useParams()
  const router = useRouter()
  const quotationId = params.quotation_id as string
  
  const [quotation, setQuotation] = useState<Quotation | null>(null)
  const [history, setHistory] = useState<QuotationHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (quotationId) {
      fetchQuotationAndHistory()
    }
  }, [quotationId])

  const fetchQuotationAndHistory = async () => {
    try {
      const { query, transaction } = createClient()
      
      // Fetch quotation details
      const { data: quotationData, error: quotationError } = await supabase
        .from('quotations')
        .select('id, quotation_number, client_name, workflow_status, total_amount, created_at')
        .eq('id', quotationId)
        .single()

      if (quotationError) throw quotationError
      setQuotation(quotationData as unknown as Quotation)

      // Fetch workflow history
      const { data: historyData, error: historyError } = await supabase
        .from('quotation_workflow_history')
        .select('*')
        .eq('quotation_id', quotationId)
        .order('performed_at', { ascending: true })

      if (historyError) throw historyError
      setHistory((historyData as unknown as QuotationHistory[]) || [])

    } catch (error: any) {
      console.error('Error fetching quotation history:', error)
    } finally {
      setLoading(false)
    }
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'payment_received':
        return <CreditCard className="h-5 w-5 text-blue-600" />
      case 'post_sale_confirmed':
        return <Phone className="h-5 w-5 text-green-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'payment_received':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'post_sale_confirmed':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getActionTitle = (action: string) => {
    switch (action) {
      case 'approved':
        return 'Quotation Approved'
      case 'rejected':
        return 'Quotation Rejected'
      case 'payment_received':
        return 'Payment Received'
      case 'post_sale_confirmed':
        return 'Post-Sale Confirmed'
      case 'submitted':
        return 'Submitted for Approval'
      default:
        return action.charAt(0).toUpperCase() + action.slice(1).replace('_', ' ')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>
      case 'pending_approval':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Approval</Badge>
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      case 'payment_received':
        return <Badge className="bg-blue-100 text-blue-800">Payment Received</Badge>
      case 'confirmed':
        return <Badge className="bg-emerald-100 text-emerald-800">Confirmed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading workflow history...</p>
        </div>
      </div>
    )
  }

  if (!quotation) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Quotation Not Found</h1>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Quotations
        </Button>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Workflow History - {quotation.quotation_number}
            </h1>
            <p className="text-gray-600">Complete timeline of all actions taken on this quotation</p>
          </div>
          <div className="text-right">
            {getStatusBadge(quotation.workflow_status)}
            <p className="text-lg font-semibold text-gray-900 mt-2">
              {formatCurrency(quotation.total_amount)}
            </p>
          </div>
        </div>
      </div>

      {/* Quotation Summary */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Quotation Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="font-medium text-gray-700">Client:</span>
              <p className="text-gray-900">{quotation.client_name}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Amount:</span>
              <p className="text-gray-900">{formatCurrency(quotation.total_amount)}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Status:</span>
              <div className="mt-1">{getStatusBadge(quotation.workflow_status)}</div>
            </div>
            <div>
              <span className="font-medium text-gray-700">Created:</span>
              <p className="text-gray-900">{formatDate(quotation.created_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Timeline</CardTitle>
          <CardDescription>
            {history.length} action{history.length !== 1 ? 's' : ''} recorded
          </CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">No workflow history available for this quotation.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {history.map((item, index) => (
                <div key={item.id} className="relative">
                  {/* Timeline connector */}
                  {index < history.length - 1 && (
                    <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200"></div>
                  )}
                  
                  <div className="flex gap-4">
                    {/* Action Icon */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-50 border-2 border-gray-200 flex items-center justify-center">
                      {getActionIcon(item.action)}
                    </div>
                    
                    {/* Action Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {getActionTitle(item.action)}
                        </h3>
                        <Badge className={getActionColor(item.action)}>
                          {item.action.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          User {item.performed_by.slice(0, 8)}...
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatDate(item.performed_at)}
                        </span>
                      </div>
                      
                      {item.comments && (
                        <div className="bg-gray-50 rounded-lg p-3 mt-2">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-700">{item.comments}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 