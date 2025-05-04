"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { createClient } from "@/lib/supabase"
import { AssignLeadDialog } from "@/components/assign-lead-dialog"
import { formatDistanceToNow } from "date-fns"
import type { Lead } from "@/types/lead"
import { Phone, Mail, Tag, MapPin } from "lucide-react"

export function UnassignedLeadsList() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)

  useEffect(() => {
    fetchUnassignedLeads()
  }, [])

  const fetchUnassignedLeads = async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      // First, fetch the leads with companies and branches
      const { data: leadsData, error: leadsError } = await supabase
        .from("leads")
        .select(`
          *,
          companies(name),
          branches(name, location)
        `)
        .eq("status", "UNASSIGNED")
        .order("created_at", { ascending: false })

      if (leadsError) {
        throw leadsError
      }

      // Transform the initial data
      let transformedLeads = leadsData.map((lead) => ({
        ...lead,
        company_name: lead.companies?.name,
        branch_name: lead.branches?.name,
        branch_location: lead.branches?.location,
      }))

      // If there are leads with lead_source_id, try to fetch the lead source names
      const leadsWithSourceIds = transformedLeads.filter((lead) => lead.lead_source_id)

      if (leadsWithSourceIds.length > 0) {
        try {
          // Check if lead_sources table exists
          const { count, error: countError } = await supabase
            .from("lead_sources")
            .select("*", { count: "exact", head: true })

          if (!countError && count !== null) {
            // Table exists, fetch lead source names
            const sourceIds = [...new Set(leadsWithSourceIds.map((lead) => lead.lead_source_id))]

            const { data: sourcesData, error: sourcesError } = await supabase
              .from("lead_sources")
              .select("id, name")
              .in("id", sourceIds)

            if (!sourcesError && sourcesData) {
              // Create a map of id to name
              const sourceMap = new Map(sourcesData.map((source) => [source.id, source.name]))

              // Update the leads with source names
              transformedLeads = transformedLeads.map((lead) => ({
                ...lead,
                lead_source_name: lead.lead_source_id ? sourceMap.get(lead.lead_source_id) : undefined,
              }))
            }
          }
        } catch (sourceError) {
          console.error("Error fetching lead sources:", sourceError)
          // Continue without lead source names
        }
      }

      setLeads(transformedLeads)
    } catch (error) {
      console.error("Error fetching unassigned leads:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignClick = (lead: Lead) => {
    setSelectedLead(lead)
    setIsAssignDialogOpen(true)
  }

  const handleAssignComplete = () => {
    setIsAssignDialogOpen(false)
    setSelectedLead(null)
    fetchUnassignedLeads() // Refresh the list
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown"
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch (error) {
      console.error("Error formatting date:", error)
      return dateString
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Unassigned Leads</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No unassigned leads found.</p>
            <Button className="mt-4" onClick={() => router.push("/sales/create-lead")}>
              Create New Lead
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead Number</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.lead_number}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{lead.client_name}</span>
                        <div className="flex flex-col text-xs text-muted-foreground mt-1">
                          {lead.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {lead.country_code} {lead.phone}
                            </span>
                          )}
                          {lead.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {lead.email}
                            </span>
                          )}
                          {lead.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {lead.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{lead.company_name}</span>
                        {lead.branch_name && <span className="text-xs text-muted-foreground">{lead.branch_name}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {lead.lead_source_name ? (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          {lead.lead_source_name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">Not specified</span>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(lead.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" onClick={() => handleAssignClick(lead)}>
                          Assign
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => router.push(`/sales/lead/${lead.id}`)}>
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {selectedLead && (
          <AssignLeadDialog
            lead={selectedLead}
            open={isAssignDialogOpen}
            onOpenChange={setIsAssignDialogOpen}
            onAssignComplete={handleAssignComplete}
          />
        )}
      </CardContent>
    </Card>
  )
}
