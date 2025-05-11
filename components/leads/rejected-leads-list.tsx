"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { RefreshCw, Building, MapPin, Calendar, AlertCircle, ArrowRight } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { getRejectedLeads } from "@/actions/rejected-leads-actions"
import { ReassignRejectedLeadModal } from "./reassign-rejected-lead-modal"

interface RejectedLead {
  id: number
  lead_number: string
  client_name: string
  status: string
  company_id: number
  companies: { name: string }
  branch_id: number | null
  branches: { name: string } | null
  reassigned_from_company_id: number | null
  reassigned_from_company: { name: string } | null
  reassigned_from_branch_id: number | null
  reassigned_from_branch: { name: string } | null
  created_at: string
  updated_at: string
  reassigned_at: string | null
  lead_rejections: {
    id: number
    rejection_reason: string
    rejected_at: string
  }[]
}

export function RejectedLeadsList() {
  const { toast } = useToast()
  const router = useRouter()
  const [leads, setLeads] = useState<RejectedLead[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState<RejectedLead | null>(null)
  const [showReassignModal, setShowReassignModal] = useState(false)

  useEffect(() => {
    fetchRejectedLeads()
  }, [])

  const fetchRejectedLeads = async () => {
    setLoading(true)
    try {
      const result = await getRejectedLeads()
      if (result.success) {
        setLeads(result.data)
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to fetch rejected leads",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching rejected leads:", error)
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

  if (leads.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="flex flex-col items-center justify-center gap-2">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
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
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lead</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Current Company/Branch</TableHead>
              <TableHead>Rejection Reason</TableHead>
              <TableHead>Rejected</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => {
              const rejectionInfo = lead.lead_rejections?.[0]

              return (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.lead_number}</TableCell>
                  <TableCell>{lead.client_name}</TableCell>
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
                    <div className="max-w-xs truncate" title={rejectionInfo?.rejection_reason}>
                      {rejectionInfo?.rejection_reason || "No reason provided"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {rejectionInfo?.rejected_at
                          ? formatDistanceToNow(new Date(rejectionInfo.rejected_at), { addSuffix: true })
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
              )
            })}
          </TableBody>
        </Table>
      </div>

      {selectedLead && (
        <ReassignRejectedLeadModal
          lead={{
            id: selectedLead.id,
            lead_number: selectedLead.lead_number,
            client_name: selectedLead.client_name,
            company_id: selectedLead.company_id,
            company_name: selectedLead.companies?.name,
            branch_id: selectedLead.branch_id,
            branch_name: selectedLead.branches?.name,
          }}
          open={showReassignModal}
          onOpenChange={setShowReassignModal}
          onReassignComplete={handleReassignComplete}
          rejectionNotes={selectedLead.lead_rejections?.[0]?.rejection_reason}
        />
      )}
    </div>
  )
}
