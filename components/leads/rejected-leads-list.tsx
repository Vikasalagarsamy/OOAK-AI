"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { RefreshCw, Building, MapPin, Calendar, ArrowRight, XCircle, AlertCircle, User } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { getRejectedLeads } from "@/actions/rejected-leads-actions"
import { ReassignRejectedLeadModal } from "./reassign-rejected-lead-modal"

interface RejectedLead {
  id: number
  lead_number: string
  client_name: string
  status: string
  company_id: number
  companies?: { name: string } | null
  branch_id?: number | null
  branches?: { name: string } | null
  created_at: string
  updated_at: string
  rejection_reason?: string
  rejected_at?: string
  rejected_by?: string
}

export function RejectedLeadsList() {
  const { toast } = useToast()
  const router = useRouter()
  const [leads, setLeads] = useState<RejectedLead[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState<RejectedLead | null>(null)
  const [showReassignModal, setShowReassignModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRejectedLeads()
  }, [])

  const fetchRejectedLeads = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getRejectedLeads()
      if (result.success) {
        // Add logging to help debug data issues
        console.log("Rejected leads data:", result.data)
        setLeads(result.data)
      } else {
        setError(result.message || "Failed to fetch rejected leads")
        toast({
          title: "Error",
          description: result.message || "Failed to fetch rejected leads",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching rejected leads:", error)
      setError("An unexpected error occurred")
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReassign = (lead: RejectedLead) => {
    // Log the selected lead to help with debugging
    console.log("Selected lead for reassignment:", lead)
    setSelectedLead(lead)
    setShowReassignModal(true)
  }

  const handleReassignComplete = () => {
    fetchRejectedLeads()
    setShowReassignModal(false)
    setSelectedLead(null)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading rejected leads...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-8 text-center bg-red-50">
        <div className="flex flex-col items-center justify-center gap-2">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <h3 className="text-xl font-semibold">Error Loading Rejected Leads</h3>
          <p className="text-muted-foreground">{error}</p>
          <Button className="mt-4" onClick={fetchRejectedLeads}>
            Try Again
          </Button>
        </div>
      </Card>
    )
  }

  if (leads.length === 0) {
    return (
      <Card className="p-8 text-center bg-gray-50">
        <div className="flex flex-col items-center justify-center gap-2">
          <XCircle className="h-12 w-12 text-muted-foreground" />
          <h3 className="text-xl font-semibold">No Rejected Leads</h3>
          <p className="text-muted-foreground">You don't have any rejected leads that need reassignment.</p>
          <Button className="mt-4" onClick={() => router.push("/sales/my-leads")}>
            Return to My Leads
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button size="sm" variant="outline" onClick={fetchRejectedLeads} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lead</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Current Company/Branch</TableHead>
              <TableHead className="w-1/3">Rejection Reason</TableHead>
              <TableHead>Rejected</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className="font-medium">{lead.lead_number || "N/A"}</TableCell>
                <TableCell>{lead.client_name || "Unknown Client"}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                      <Building className="h-3 w-3 text-muted-foreground" />
                      <span>{lead.companies?.name || "Unknown Company"}</span>
                    </div>
                    {lead.branches && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{lead.branches.name}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-start gap-1">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-sm">
                        {/* Display lead-specific rejection reason */}
                        {lead.rejection_reason || "No reason provided"}
                      </div>
                      {lead.rejected_by && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <User className="h-3 w-3" />
                          <span>Rejected by: {lead.rejected_by}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {lead.rejected_at
                        ? formatDistanceToNow(new Date(lead.rejected_at), { addSuffix: true })
                        : formatDistanceToNow(new Date(lead.updated_at), { addSuffix: true })}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => handleReassign(lead)}>
                    <RefreshCw className="h-3 w-3" />
                    <span>Reassign</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedLead && (
        <ReassignRejectedLeadModal
          lead={{
            id: selectedLead.id,
            lead_number: selectedLead.lead_number || "",
            client_name: selectedLead.client_name || "Unknown Client",
            company_id: selectedLead.company_id,
            company_name: selectedLead.companies?.name || "Unknown Company",
            branch_id: selectedLead.branch_id || null,
            branch_name: selectedLead.branches?.name || null,
          }}
          open={showReassignModal}
          onOpenChange={setShowReassignModal}
          onReassignComplete={handleReassignComplete}
          rejectionNotes={selectedLead.rejection_reason}
        />
      )}
    </div>
  )
}
