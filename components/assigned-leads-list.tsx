"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Loader2, UserCheck, Trash2 } from "lucide-react"
import { ReassignLeadDialog } from "./reassign-lead-dialog"
import { DeleteLeadDialog } from "./delete-lead-dialog"
import { getAssignedLeads } from "@/actions/manage-lead-actions"
import type { Lead } from "@/types/lead"

export function AssignedLeadsList() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  const fetchLeads = async () => {
    setLoading(true)
    try {
      const data = await getAssignedLeads()
      setLeads(data)
    } catch (error) {
      console.error("Error fetching leads:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [])

  const handleReassignClick = (lead: Lead) => {
    setSelectedLead(lead)
    setReassignDialogOpen(true)
  }

  const handleDeleteClick = (lead: Lead) => {
    setSelectedLead(lead)
    setDeleteDialogOpen(true)
  }

  const handleLeadReassigned = (success: boolean) => {
    if (success) {
      fetchLeads()
    }
    setReassignDialogOpen(false)
  }

  const handleLeadDeleted = () => {
    fetchLeads()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assigned Leads</CardTitle>
        <CardDescription>Leads that have been assigned to sales representatives</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No assigned leads found</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>{lead.lead_number}</TableCell>
                  <TableCell>{lead.client_name}</TableCell>
                  <TableCell>{lead.assigned_to_name || "Unknown"}</TableCell>
                  <TableCell>{new Date(lead.created_at || "").toLocaleDateString()}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Assigned
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleReassignClick(lead)}>
                        <UserCheck className="h-4 w-4 mr-1" />
                        Reassign
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteClick(lead)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <ReassignLeadDialog
          open={reassignDialogOpen}
          onOpenChange={setReassignDialogOpen}
          lead={selectedLead}
          onReassignComplete={handleLeadReassigned}
        />

        <DeleteLeadDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          lead={selectedLead}
          onDeleted={handleLeadDeleted}
        />
      </CardContent>
    </Card>
  )
}
