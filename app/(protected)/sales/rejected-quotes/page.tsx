'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, RefreshCw, Eye, Edit, Calendar, DollarSign } from 'lucide-react'

interface RejectedQuotation {
  id: number
  quotation_number: string
  quotation_data: any
  total_amount: number
  status: string
  created_at: string
  quotation_approvals: {
    approval_status: string
    comments: string
    updated_at: string
  }[]
}

export default function RejectedQuotesPage() {
  const [rejectedQuotations, setRejectedQuotations] = useState<RejectedQuotation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRejectedQuotations()
  }, [])

  const fetchRejectedQuotations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/quotation-rejection-workflow?user_id=00000000-0000-0000-0000-000000000000')
      if (response.ok) {
        const data = await response.json()
        setRejectedQuotations(data.rejectedQuotations || [])
      } else {
        console.error('Failed to fetch rejected quotations')
      }
    } catch (error) {
      console.error('Error fetching rejected quotations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReviseQuotation = async (quotationNumber: string) => {
    try {
      const response = await fetch('/api/quotation-rejection-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'prepare_revision',
          quotationNumber
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.revision_url) {
          window.location.href = data.revision_url
        } else {
          // Fallback to general quotation editing
          window.location.href = `/sales/quotations/generate?edit=${quotationNumber}`
        }
      } else {
        alert('Failed to prepare quotation for revision')
      }
    } catch (error) {
      console.error('Error preparing revision:', error)
      alert('Error preparing quotation for revision')
    }
  }

  const handleViewQuotation = (quotationNumber: string) => {
    window.open(`/quotation/${quotationNumber}`, '_blank')
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Rejected Quotations</h1>
        <p className="text-gray-600">Manage and revise your rejected quotations</p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">All Rejected ({rejectedQuotations.length})</TabsTrigger>
          <TabsTrigger value="recent">Recent Rejections</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6 mt-6">
          {rejectedQuotations.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <AlertCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No rejected quotations!</h3>
                <p className="text-gray-600">All your quotations are either approved or pending approval.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {rejectedQuotations.map((quotation) => {
                const quotationData = quotation.quotation_data || {}
                const latestApproval = quotation.quotation_approvals[0]
                
                return (
                  <Card key={quotation.id} className="border-l-4 border-red-500 bg-red-50">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg text-red-800 flex items-center">
                            <AlertCircle className="w-5 h-5 mr-2" />
                            {quotation.quotation_number}
                          </CardTitle>
                          <p className="text-sm text-red-600 mt-1">
                            Client: {quotationData.client_name || 'Unknown Client'}
                          </p>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <Badge className="bg-red-100 text-red-800">
                            REJECTED
                          </Badge>
                          <Badge variant="outline" className="text-red-600">
                            <DollarSign className="w-3 h-3 mr-1" />
                            ₹{quotation.total_amount?.toLocaleString() || '0'}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      {/* Rejection Details */}
                      <div className="bg-white p-4 rounded border mb-4">
                        <h4 className="font-medium text-red-800 mb-2">Rejection Reason:</h4>
                        <p className="text-sm text-gray-700 mb-2">
                          {latestApproval?.comments || 'No specific reason provided'}
                        </p>
                        <p className="text-xs text-gray-500">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          Rejected on: {new Date(latestApproval?.updated_at || quotation.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Quotation Summary */}
                      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div>
                          <p><strong>Event Date:</strong> {quotationData.event_date || 'Not specified'}</p>
                          <p><strong>Venue:</strong> {quotationData.venue || 'Not specified'}</p>
                        </div>
                        <div>
                          <p><strong>Created:</strong> {new Date(quotation.created_at).toLocaleDateString()}</p>
                          <p><strong>Status:</strong> {quotation.status}</p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-3">
                        <Button 
                          size="sm" 
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleReviseQuotation(quotation.quotation_number)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Revise & Resubmit
                        </Button>
                        
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewQuotation(quotation.quotation_number)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recent" className="space-y-6 mt-6">
          {rejectedQuotations.filter(q => {
            const rejectionDate = new Date(q.quotation_approvals[0]?.updated_at || q.created_at)
            const daysDiff = (Date.now() - rejectionDate.getTime()) / (1000 * 60 * 60 * 24)
            return daysDiff <= 7
          }).length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No recent rejections</h3>
                <p className="text-gray-600">No quotations have been rejected in the last 7 days.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {rejectedQuotations
                .filter(q => {
                  const rejectionDate = new Date(q.quotation_approvals[0]?.updated_at || q.created_at)
                  const daysDiff = (Date.now() - rejectionDate.getTime()) / (1000 * 60 * 60 * 24)
                  return daysDiff <= 7
                })
                .map((quotation) => {
                  const quotationData = quotation.quotation_data || {}
                  const latestApproval = quotation.quotation_approvals[0]
                  
                  return (
                    <Card key={quotation.id} className="border-l-4 border-orange-500 bg-orange-50">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg text-orange-800">
                              {quotation.quotation_number}
                            </CardTitle>
                            <p className="text-sm text-orange-600 mt-1">
                              Client: {quotationData.client_name || 'Unknown Client'}
                            </p>
                          </div>
                          <Badge className="bg-orange-100 text-orange-800">
                            RECENTLY REJECTED
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <div className="bg-white p-3 rounded border mb-3">
                          <p className="text-sm text-gray-700">
                            {latestApproval?.comments || 'No specific reason provided'}
                          </p>
                        </div>

                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => handleReviseQuotation(quotation.quotation_number)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Revise Now
                          </Button>
                          
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewQuotation(quotation.quotation_number)}
                          >
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="mt-8 bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">Need Help?</h3>
        <p className="text-sm text-gray-600 mb-3">
          If you need assistance with revising quotations or understanding rejection reasons, contact the sales manager.
        </p>
        <Button size="sm" variant="outline" onClick={() => fetchRejectedQuotations()}>
          <RefreshCw className="w-4 h-4 mr-1" />
          Refresh List
        </Button>
      </div>
    </div>
  )
} 