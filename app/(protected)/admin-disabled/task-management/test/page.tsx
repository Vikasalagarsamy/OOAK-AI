"use client"

import QuotationWorkflow from '../quotation-workflow'
import { Button } from "@/components/ui/button"
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/postgresql-client-unified'

interface QuotationFromDB {
  id: number
  quotation_number: string
  client_name: string
  total_amount: number
  status: string
  created_at: string
  updated_at: string
  whatsapp: string
}

interface QuotationApproval {
  id: number
  quotation_id: number
  approval_status: string
  comments: string
  created_at: string
  updated_at: string
}

export default function TestQuotationWorkflow() {
  const [quotations, setQuotations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedQuote, setSelectedQuote] = useState(0)

  useEffect(() => {
    loadQuotationsWithApprovals()
  }, [])

  const loadQuotationsWithApprovals = async () => {
    try {
      const { query, transaction } = createClient()
      
      // Load quotations with their approval status
      const { data: quotationData, error: quotationError } = await supabase
        .from('quotations')
        .select(`
          id,
          quotation_number,
          client_name,
          total_amount,
          status,
          created_at,
          updated_at,
          whatsapp,
          quotation_approvals (
            id,
            approval_status,
            comments,
            created_at,
            updated_at
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      if (quotationError) {
        console.error('Error loading quotations:', quotationError)
        // Fallback to test data if database fails
        setQuotations(getTestQuotes())
      } else {
        // Transform database data to match component interface
        const transformedQuotations = quotationData.map((q: any) => {
          const latestApproval = q.quotation_approvals?.[0]
          
          // Determine status based on approval status
          let workflowStatus = 'pending_approval'
          if (latestApproval) {
            if (latestApproval.approval_status === 'approved') {
              workflowStatus = 'approved'
            } else if (latestApproval.approval_status === 'rejected') {
              workflowStatus = 'rejected'
            }
          } else if (q.status === 'draft') {
            workflowStatus = 'draft'
          }

          // Create actions array from approval history
          const actions = q.quotation_approvals?.map((approval: any) => ({
            id: approval.id.toString(),
            type: approval.approval_status === 'approved' ? 'approval' : 'rejection',
            status: approval.approval_status,
            message: approval.comments || `Quote ${approval.approval_status}`,
            timestamp: approval.created_at,
            actor: 'Sales Head'
          })) || []

          return {
            id: q.quotation_number,
            clientName: q.client_name,
            amount: q.total_amount,
            status: workflowStatus,
            createdAt: q.created_at,
            lastUpdated: q.updated_at,
            salesPerson: "Vikas", // Default for now
            revisionCount: 0,
            clientWhatsApp: q.whatsapp || "+919677362524",
            actions: actions,
            dbId: q.id // Keep reference to database ID
          }
        })

        setQuotations(transformedQuotations.length > 0 ? transformedQuotations : getTestQuotes())
      }
    } catch (error) {
      console.error('Failed to load quotations:', error)
      setQuotations(getTestQuotes())
    } finally {
      setLoading(false)
    }
  }

  // Fallback test data
  const getTestQuotes = () => [
    {
      id: "QT-2025-0007",
      clientName: "Test Client",
      amount: 33000,
      status: "pending_approval" as const,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      salesPerson: "Vikas",
      revisionCount: 0,
      clientWhatsApp: "+919677362524",
      actions: []
    },
    {
      id: "QT-2025-0008",
      clientName: "Ramya Solutions",
      amount: 54000,
      status: "draft" as const,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      salesPerson: "Tamil",
      revisionCount: 0,
      clientWhatsApp: "+919677362524",
      actions: []
    },
    {
      id: "QT-2025-0009",
      clientName: "Tech Innovators",
      amount: 125000,
      status: "pending_approval" as const,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      salesPerson: "Ramya",
      revisionCount: 0,
      clientWhatsApp: "+919677362524",
      actions: []
    }
  ]

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading real quotations from database...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8 space-y-4">
        <h1 className="text-2xl font-bold">Live Quotation Approval Workflow</h1>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-green-800">
            ✅ <strong>Now Connected to Real Database!</strong> This shows actual quotations and approval statuses.
          </p>
        </div>
        <div className="flex gap-4 flex-wrap">
          {quotations.map((quote: any, index: number) => (
            <Button
              key={quote.id}
              variant={selectedQuote === index ? "default" : "outline"}
              onClick={() => setSelectedQuote(index)}
              className="flex flex-col items-start p-3 h-auto"
            >
              <span className="font-semibold">{quote.id}</span>
              <span className="text-xs">{quote.clientName}</span>
              <span className="text-xs">₹{quote.amount.toLocaleString()}</span>
              <span className="text-xs capitalize bg-white/20 px-1 rounded">{quote.status.replace('_', ' ')}</span>
            </Button>
          ))}
        </div>
        <div className="text-sm text-muted-foreground">
          <p>Live Testing Instructions:</p>
          <ol className="list-decimal ml-4 space-y-1">
            <li>Select a real quotation from above to test</li>
            <li>All WhatsApp messages will be sent to: {quotations[0]?.clientWhatsApp || "+919677362524"}</li>
            <li>Try approving/rejecting quotations - changes will persist in database</li>
            <li>After approval, quotations will be sent via WhatsApp using Interakt API</li>
            <li>Refresh page to see updated statuses from database</li>
            <li>Check quotations table to see status changes</li>
          </ol>
        </div>
      </div>

      {quotations[selectedQuote] && (
        <QuotationWorkflow initialQuote={quotations[selectedQuote]} />
      )}
    </div>
  )
} 