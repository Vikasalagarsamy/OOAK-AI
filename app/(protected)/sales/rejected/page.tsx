'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Calendar, DollarSign, MessageSquare, RefreshCw } from 'lucide-react'

interface RejectedQuotation {
  id: number
  quotation_number: string
  slug?: string
  client_name: string
  bride_name: string
  groom_name: string
  total_amount: number
  status: string
  created_at: string
  quotation_data: any
  quotation_approvals: Array<{
    id: number
    approval_status: string
    comments: string
    created_at: string
    updated_at: string
  }>
}

export default function RejectedQuotationsPage() {
  const [rejectedQuotations, setRejectedQuotations] = useState<RejectedQuotation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRejectedQuotations()
  }, [])

  const fetchRejectedQuotations = async () => {
    try {
      setLoading(true)
      
      // Get all quotations with rejected status
      const response = await fetch('/api/quotations-list?status=rejected')
      if (response.ok) {
        const data = await response.json()
        setRejectedQuotations(data.quotations || [])
      } else {
        console.error('Failed to fetch rejected quotations')
      }
    } catch (error) {
      console.error('Error fetching rejected quotations:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading rejected quotations...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Rejected Quotations</h1>
          <p className="text-gray-600">View and manage rejected quotations with rejection comments</p>
        </div>
        <Button onClick={fetchRejectedQuotations} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {rejectedQuotations.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <AlertCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No rejected quotations!</h3>
            <p className="text-gray-600">All quotations are either approved or pending approval.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {rejectedQuotations.map((quotation) => {
            const latestRejection = quotation.quotation_approvals
              ?.filter(approval => approval.approval_status === 'rejected')
              ?.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0]
            
            return (
              <Card key={quotation.id} className="border-l-4 border-red-500 bg-red-50">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl text-red-800 flex items-center">
                        <AlertCircle className="w-5 h-5 mr-2" />
                        {quotation.quotation_number}
                      </CardTitle>
                      <p className="text-red-600 mt-1">
                        {quotation.bride_name} & {quotation.groom_name}
                      </p>
                      <p className="text-sm text-red-600">
                        Contact: {quotation.client_name}
                      </p>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <Badge className="bg-red-100 text-red-800">
                        REJECTED
                      </Badge>
                      <Badge variant="outline" className="text-red-600">
                        <DollarSign className="w-3 h-3 mr-1" />
                        {formatCurrency(quotation.total_amount)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {/* Rejection Details */}
                  {latestRejection && (
                    <div className="bg-white p-4 rounded-lg border-2 border-red-200 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-red-600" />
                        <h4 className="font-medium text-red-800">Rejection Details</h4>
                      </div>
                      <p className="text-gray-800 mb-2">
                        <strong>Reason:</strong> {latestRejection.comments || 'No specific reason provided'}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        Rejected on: {formatDate(latestRejection.updated_at)}
                      </p>
                    </div>
                  )}

                  {/* Quotation Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-700">Event Details:</p>
                      <p className="text-gray-600">
                        {quotation.quotation_data?.events?.length || 0} event(s)
                      </p>
                      <p className="text-gray-600">
                        Package: {quotation.quotation_data?.default_package || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Created:</p>
                      <p className="text-gray-600">{formatDate(quotation.created_at)}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Status:</p>
                      <p className="text-gray-600 capitalize">{quotation.status}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 mt-4">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        // Use slug if available, otherwise use quotation number
                        const targetSlug = quotation.slug || quotation.quotation_number
                        window.open(`/quotation/${targetSlug}`, '_blank')
                      }}
                    >
                      View Full Quotation
                    </Button>
                    
                    <Button 
                      size="sm" 
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => window.open(`/sales/quotations/edit/${quotation.id}`, '_blank')}
                    >
                      Edit & Revise Quotation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Help Section */}
      <div className="mt-8 bg-gray-50 p-6 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">Managing Rejected Quotations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <p className="font-medium mb-1">Next Steps:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Review rejection comments carefully</li>
              <li>Address specific concerns mentioned</li>
              <li>Create revised quotation with improvements</li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-1">Best Practices:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Contact client to discuss rejection reasons</li>
              <li>Adjust pricing or services based on feedback</li>
              <li>Re-submit with clear improvements noted</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 