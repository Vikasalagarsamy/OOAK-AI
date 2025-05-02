"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import type { Lead } from "@/types/lead"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, RefreshCw, UserPlus, Eye, Trash2 } from "lucide-react"
import { ReassignLeadDialog } from "@/components/reassign-lead-dialog"
import { DeleteLeadDialog } from "@/components/delete-lead-dialog"
import { useToast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"

export function AssignedLeadsList() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isReassignDialogOpen, setIsReassignDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchAssignedLeads()
  }, [])

  const fetchAssignedLeads = async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("leads")
        .select(`
          *,
          companies:company_id(name),
          branches:branch_id(name),
          employees:assigned_to(id, first_name, last_name)
        `)
        .eq("status", "ASSIGNED")
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      // Transform the data to match the Lead type
      const transformedData: Lead[] = data.map((lead) => ({
        ...lead,
        company_name: lead.companies?.name,
        branch_name: lead.branches?.name,
        assigned_to_name: lead.employees ? `${lead.employees.first_name} ${lead.employees.last_name}` : undefined,
      }))

      setLeads(transformedData)
    } catch (error) {
      console.error("Error fetching assigned leads:", error)
      toast({
        title: "Error",
        description: "Failed to fetch assigned leads. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAssignedLeads()
    setRefreshing(false)
  }

  const handleReassignClick = (lead: Lead) => {
    setSelectedLead(lead)
    setIsReassignDialogOpen(true)
  }

  const handleDeleteClick = (lead: Lead) => {
    setSelectedLead(lead)
    setIsDeleteDialogOpen(true)
  }

  const handleReassignComplete = () => {
    setIsReassignDialogOpen(false)
    setSelectedLead(null)
    fetchAssignedLeads()
  }

  const handleDeleteComplete = () => {
    setIsDeleteDialogOpen(false)
    setSelectedLead(null)
    fetchAssignedLeads()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ASSIGNED":
        return <Badge variant="outline">Assigned</Badge>
      case "FOLLOW_UP":
        return <Badge variant="secondary">Follow Up</Badge>
      case "QUOTED":
        return <Badge variant="default">Quoted</Badge>
      case "CONVERTED":
        return <Badge variant="success">Converted</Badge>
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Assigned Leads</CardTitle>
            <CardDescription>View and manage assigned leads</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-2 hidden md:inline">Refresh</span>
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No assigned leads found. Assign leads to see them here.
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-300px)] rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead Number</TableHead>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.lead_number}</TableCell>
                      <TableCell>{lead.client_name}</TableCell>
                      <TableCell>{lead.company_name}</TableCell>
                      <TableCell>
                        {lead.lead_source ? (
                          <Badge variant="outline">{lead.lead_source}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{lead.assigned_to_name}</TableCell>
                      <TableCell>{getStatusBadge(lead.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="outline" onClick={() => handleReassignClick(lead)}>
                            <UserPlus className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="outline" asChild>
                            <a href={`/sales/lead/${lead.id}`}>
                              <Eye className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => handleDeleteClick(lead)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {selectedLead && (
        <>
          <ReassignLeadDialog
            lead={selectedLead}
            open={isReassignDialogOpen}
            onOpenChange={setIsReassignDialogOpen}
            onReassignComplete={handleReassignComplete}
          />
          <DeleteLeadDialog
            lead={selectedLead}
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            onDeleteComplete={handleDeleteComplete}
          />
        </>
      )}
    </>
  )
}
