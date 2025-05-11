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
import { Phone, Mail, Tag, MapPin, RefreshCw } from "lucide-react"

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

      // First, fetch the unassigned leads without using relationships
      const { data: leadsData, error: leadsError } = await supabase
        .from("leads")
        .select("*")
        .eq("status", "UNASSIGNED")
        .order("created_at", { ascending: false })

      if (leadsError) {
        throw leadsError
      }

      // Extract company and branch IDs for separate queries
      const companyIds = [...new Set(leadsData.map((lead) => lead.company_id).filter(Boolean))]
      const branchIds = [...new Set(leadsData.map((lead) => lead.branch_id).filter(Boolean))]
      const reassignedFromCompanyIds = [
        ...new Set(leadsData.map((lead) => lead.reassigned_from_company_id).filter(Boolean)),
      ]
      const reassignedFromBranchIds = [
        ...new Set(leadsData.map((lead) => lead.reassigned_from_branch_id).filter(Boolean)),
      ]

      // Prepare data maps
      const companyMap = new Map()
      const branchMap = new Map()
      const reassignedFromCompanyMap = new Map()
      const reassignedFromBranchMap = new Map()
      const sourceMap = new Map()

      // Fetch companies data
      if (companyIds.length > 0) {
        const { data: companiesData, error: companiesError } = await supabase
          .from("companies")
          .select("id, name")
          .in("id", companyIds)

        if (!companiesError && companiesData) {
          companiesData.forEach((company) => {
            companyMap.set(company.id, company)
          })
        }
      }

      // Fetch branches data
      if (branchIds.length > 0) {
        const { data: branchesData, error: branchesError } = await supabase
          .from("branches")
          .select("id, name, location")
          .in("id", branchIds)

        if (!branchesError && branchesData) {
          branchesData.forEach((branch) => {
            branchMap.set(branch.id, branch)
          })
        }
      }

      // Fetch reassigned from companies data
      if (reassignedFromCompanyIds.length > 0) {
        const { data: reassignedCompaniesData, error: reassignedCompaniesError } = await supabase
          .from("companies")
          .select("id, name")
          .in("id", reassignedFromCompanyIds)

        if (!reassignedCompaniesError && reassignedCompaniesData) {
          reassignedCompaniesData.forEach((company) => {
            reassignedFromCompanyMap.set(company.id, company)
          })
        }
      }

      // Fetch reassigned from branches data
      if (reassignedFromBranchIds.length > 0) {
        const { data: reassignedBranchesData, error: reassignedBranchesError } = await supabase
          .from("branches")
          .select("id, name")
          .in("id", reassignedFromBranchIds)

        if (!reassignedBranchesError && reassignedBranchesData) {
          reassignedBranchesData.forEach((branch) => {
            reassignedFromBranchMap.set(branch.id, branch)
          })
        }
      }

      // Fetch lead sources if needed
      const leadsWithSourceIds = leadsData.filter((lead) => lead.lead_source_id)
      if (leadsWithSourceIds.length > 0) {
        try {
          // Check if lead_sources table exists
          const { count, error: countError } = await supabase
            .from("lead_sources")
            .select("*", { count: "exact", head: true })

          if (!countError && count !== null) {
            // Table exists, fetch lead source names
            const sourceIds = [...new Set(leadsWithSourceIds.map((lead) => lead.lead_source_id).filter(Boolean))]

            if (sourceIds.length > 0) {
              const { data: sourcesData, error: sourcesError } = await supabase
                .from("lead_sources")
                .select("id, name")
                .in("id", sourceIds)

              if (!sourcesError && sourcesData) {
                sourcesData.forEach((source) => {
                  sourceMap.set(source.id, source.name)
                })
              }
            }
          }
        } catch (sourceError) {
          console.error("Error fetching lead sources:", sourceError)
        }
      }

      // Transform the leads data with the fetched related data
      const transformedLeads = leadsData.map((lead) => {
        const company = companyMap.get(lead.company_id)
        const branch = branchMap.get(lead.branch_id)
        const reassignedFromCompany = reassignedFromCompanyMap.get(lead.reassigned_from_company_id)
        const reassignedFromBranch = reassignedFromBranchMap.get(lead.reassigned_from_branch_id)

        return {
          ...lead,
          company_name: company?.name,
          branch_name: branch?.name,
          branch_location: branch?.location,
          reassigned_from_company_name: reassignedFromCompany?.name,
          reassigned_from_branch_name: reassignedFromBranch?.name,
          lead_source_name: lead.lead_source_id ? sourceMap.get(lead.lead_source_id) : lead.lead_source,
        }
      })

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
                  <TableHead>Company/Branch</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id} className={lead.is_reassigned ? "bg-yellow-50" : ""}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-1">
                        {lead.lead_number}
                        {lead.is_reassigned && (
                          <Badge variant="outline" className="ml-1 bg-yellow-100 text-yellow-800 border-yellow-300">
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Reassigned
                          </Badge>
                        )}
                      </div>
                    </TableCell>
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
                        <span className="font-medium">{lead.company_name || "Unknown Company"}</span>
                        {lead.branch_name && <span className="text-xs text-muted-foreground">{lead.branch_name}</span>}

                        {lead.is_reassigned && lead.reassigned_from_company_name && (
                          <div className="mt-1 text-xs text-yellow-700 bg-yellow-50 p-1 rounded border border-yellow-200">
                            <span>Reassigned from: {lead.reassigned_from_company_name}</span>
                            {lead.reassigned_from_branch_name && <span> ({lead.reassigned_from_branch_name})</span>}
                          </div>
                        )}
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
