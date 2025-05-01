"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import type { Lead } from "@/types/lead"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, RefreshCw, UserPlus, Eye } from "lucide-react"
import { AssignLeadDialog } from "@/components/assign-lead-dialog"
import { useToast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function UnassignedLeadsList() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchUnassignedLeads()
  }, [])

  const fetchUnassignedLeads = async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("leads")
        .select(`
         *,
         companies:company_id(name),
         branches:branch_id(name)
       `)
        .eq("status", "UNASSIGNED")
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      // Transform the data to match the Lead type
      const transformedData: Lead[] = data.map((lead) => ({
        ...lead,
        company_name: lead.companies?.name,
        branch_name: lead.branches?.name,
      }))

      setLeads(transformedData)
    } catch (error) {
      console.error("Error fetching unassigned leads:", error)
      toast({
        title: "Error",
        description: "Failed to fetch unassigned leads. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchUnassignedLeads()
    setRefreshing(false)
  }

  const handleAssignClick = (lead: Lead) => {
    setSelectedLead(lead)
    setIsAssignDialogOpen(true)
  }

  const handleAssignComplete = () => {
    setIsAssignDialogOpen(false)
    setSelectedLead(null)
    fetchUnassignedLeads()
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Unassigned Leads</CardTitle>
            <CardDescription>View and assign leads to sales representatives</CardDescription>
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
              No unassigned leads found. Create a new lead to get started.
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-300px)] rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead Number</TableHead>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.lead_number}</TableCell>
                      <TableCell>{lead.client_name}</TableCell>
                      <TableCell>{lead.company_name}</TableCell>
                      <TableCell>{lead.branch_name || "-"}</TableCell>
                      <TableCell>
                        {lead.lead_source ? (
                          <Badge variant="outline">{lead.lead_source}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground">
                                  {lead.country_code} {lead.phone}
                                </span>
                                {lead.email && <span className="text-xs text-muted-foreground">{lead.email}</span>}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="space-y-1">
                                <p>
                                  <strong>Phone:</strong> {lead.country_code} {lead.phone}
                                </p>
                                {lead.email && (
                                  <p>
                                    <strong>Email:</strong> {lead.email}
                                  </p>
                                )}
                                {lead.is_whatsapp && (
                                  <p>
                                    <strong>WhatsApp:</strong>{" "}
                                    {lead.has_separate_whatsapp
                                      ? `${lead.whatsapp_country_code} ${lead.whatsapp_number}`
                                      : `${lead.country_code} ${lead.phone}`}
                                  </p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="outline" onClick={() => handleAssignClick(lead)}>
                            <UserPlus className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="outline" asChild>
                            <a href={`/sales/lead/${lead.id}`}>
                              <Eye className="h-4 w-4" />
                            </a>
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
        <AssignLeadDialog
          lead={selectedLead}
          open={isAssignDialogOpen}
          onOpenChange={setIsAssignDialogOpen}
          onAssignComplete={handleAssignComplete}
        />
      )}
    </>
  )
}
