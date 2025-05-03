"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Loader2, UserPlus, Trash2 } from "lucide-react"
import { AssignLeadDialog } from "./assign-lead-dialog"
import { DeleteLeadDialog } from "./delete-lead-dialog"
import { getLeads } from "@/actions/lead-actions"
import type { Lead } from "@/types/lead"
import dynamic from "next/dynamic"

export function UnassignedLeadsList() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  const fetchLeads = async () => {
    setLoading(true)
    try {
      const data = await getLeads()
      // Filter for unassigned leads and ensure no null values
      const unassignedLeads = data
        .filter((lead) => lead) // Filter out null/undefined leads
        .filter((lead) => !lead.assigned_to || lead.status === "unassigned")
      setLeads(unassignedLeads)
    } catch (error) {
      console.error("Error fetching leads:", error)
      setLeads([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [])

  const handleAssignClick = (lead: Lead) => {
    setSelectedLead(lead)
    setAssignDialogOpen(true)
  }

  const handleDeleteClick = (lead: Lead) => {
    setSelectedLead(lead)
    setDeleteDialogOpen(true)
  }

  const handleLeadAssigned = () => {
    fetchLeads()
  }

  const handleLeadDeleted = () => {
    fetchLeads()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Unassigned Leads</CardTitle>
        <CardDescription>Leads that have not been assigned to any sales representative</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No unassigned leads found</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map(
                (lead) =>
                  lead && (
                    <TableRow key={lead.id}>
                      <TableCell>{lead.lead_number}</TableCell>
                      <TableCell>{lead.client_name}</TableCell>
                      <TableCell>{lead.created_at ? new Date(lead.created_at).toLocaleDateString() : "N/A"}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Unassigned
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" onClick={() => handleAssignClick(lead)}>
                            <UserPlus className="h-4 w-4 mr-1" />
                            Assign
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteClick(lead)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ),
              )}
            </TableBody>
          </Table>
        )}

        <AssignLeadDialog
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          lead={selectedLead}
          onAssigned={handleLeadAssigned}
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

const UnassignedLeadsListWithNoSSR = dynamic(() => Promise.resolve(UnassignedLeadsList), { ssr: false })
