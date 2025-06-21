"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/postgresql-client-unified"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { Search, Eye, DollarSign, User, Clock, History } from "lucide-react"
import Link from "next/link"

interface Quotation {
  id: number
  quotation_number: string
  client_name: string
  bride_name: string
  groom_name: string
  total_amount: number
  workflow_status: string
  created_at: string
  created_by: string
}

export default function WorkflowHistoryPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [filteredQuotations, setFilteredQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchQuotations()
  }, [])

  useEffect(() => {
    // Filter quotations based on search term
    if (!searchTerm.trim()) {
      setFilteredQuotations(quotations)
    } else {
      const filtered = quotations.filter(quotation =>
        quotation.quotation_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quotation.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quotation.bride_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quotation.groom_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredQuotations(filtered)
    }
  }, [searchTerm, quotations])

  const fetchQuotations = async () => {
    try {
      const { query, transaction } = createClient()
      const { data, error } = await supabase
        .from('quotations')
        .select('id, quotation_number, client_name, bride_name, groom_name, total_amount, workflow_status, created_at, created_by')
        .order('created_at', { ascending: false })

      if (error) throw error
      setQuotations((data as unknown as Quotation[]) || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load quotations",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
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

  const getStatusCounts = () => {
    const counts = quotations.reduce((acc, quotation) => {
      const status = quotation.workflow_status || 'draft'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    return counts
  }

  const statusCounts = getStatusCounts()

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Workflow History</h1>
        <p className="text-gray-600">Track quotation workflow progress and view detailed histories</p>
      </div>

      {/* Status Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
        {Object.entries(statusCounts).map(([status, count]) => (
          <Card key={status} className="text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-900">{count}</div>
              <div className="text-sm text-gray-600 capitalize">{status.replace('_', ' ')}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by quotation number, client name, bride or groom..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Quotations Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Quotations</CardTitle>
          <CardDescription>
            {filteredQuotations.length} of {quotations.length} quotations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredQuotations.length === 0 ? (
            <div className="text-center py-8">
              <History className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">
                {searchTerm ? "No quotations match your search criteria." : "No quotations found."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Quotation #</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Client</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Created</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuotations.map((quotation) => (
                    <tr key={quotation.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {quotation.quotation_number}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-gray-900 font-medium">{quotation.client_name}</div>
                        <div className="text-sm text-gray-600">
                          {quotation.bride_name} & {quotation.groom_name}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-900">
                        {formatCurrency(quotation.total_amount)}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(quotation.workflow_status)}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {formatDate(quotation.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <Link href={`/sales/quotations/${quotation.id}/history`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View History
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 