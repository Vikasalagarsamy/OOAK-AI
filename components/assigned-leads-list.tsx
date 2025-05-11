"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Trash2, Tag, ArrowUpDown, Search, Eye, RefreshCw } from "lucide-react"
import { ReassignLeadDialog } from "./reassign-lead-dialog"
import { DeleteLeadDialog } from "./delete-lead-dialog"
import { getAssignedLeads, getLeadSources } from "@/actions/manage-lead-actions"
import type { Lead } from "@/types/lead"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function AssignedLeadsList() {
  const router = useRouter()
  const { toast } = useToast()
  const [leads, setLeads] = useState<Lead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [leadSources, setLeadSources] = useState<{ id: number; name: string }[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [sourceFilter, setSourceFilter] = useState<string>("all")
  const [sortField, setSortField] = useState<keyof Lead>("updated_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  const fetchLeads = async () => {
    setLoading(true)
    try {
      const [leadsData, sourcesData] = await Promise.all([getAssignedLeads(), getLeadSources()])
      setLeads(leadsData)
      setFilteredLeads(leadsData)
      setLeadSources(sourcesData)
    } catch (error) {
      console.error("Error fetching leads:", error)
      toast({
        title: "Error",
        description: "Failed to load leads. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [])

  useEffect(() => {
    // Apply filters and sorting
    let result = [...leads]

    // Apply source filter
    if (sourceFilter !== "all") {
      result = result.filter((lead) => lead.lead_source_id?.toString() === sourceFilter)
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (lead) =>
          lead.client_name?.toLowerCase().includes(term) ||
          lead.lead_number?.toLowerCase().includes(term) ||
          lead.assigned_to_name?.toLowerCase().includes(term) ||
          lead.lead_source_name?.toLowerCase().includes(term),
      )
    }

    // Apply sorting
    result.sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]

      if (aValue === undefined || aValue === null) return sortDirection === "asc" ? -1 : 1
      if (bValue === undefined || bValue === null) return sortDirection === "asc" ? 1 : -1

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }

      return sortDirection === "asc" ? (aValue < bValue ? -1 : 1) : bValue < aValue ? -1 : 1
    })

    setFilteredLeads(result)
  }, [leads, sourceFilter, searchTerm, sortField, sortDirection])

  const handleReassignClick = (lead: Lead) => {
    setSelectedLead(lead)
    setReassignDialogOpen(true)
  }

  const handleDeleteClick = (lead: Lead) => {
    setSelectedLead(lead)
    setDeleteDialogOpen(true)
  }

  const handleViewDetailsClick = (lead: Lead) => {
    router.push(`/sales/lead/${lead.id}`)
  }

  const handleLeadReassigned = (success: boolean) => {
    if (success) {
      toast({
        title: "Success",
        description: "Lead reassigned successfully",
      })
      fetchLeads()
    }
    setReassignDialogOpen(false)
  }

  const handleLeadDeleted = () => {
    toast({
      title: "Success",
      description: "Lead deleted successfully",
    })
    fetchLeads()
    setDeleteDialogOpen(false)
  }

  const handleSort = (field: keyof Lead) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assigned Leads</CardTitle>
        <CardDescription>Leads that have been assigned to sales representatives</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filter by source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {leadSources.map((source) => (
                <SelectItem key={source.id} value={source.id.toString()}>
                  {source.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {leads.length === 0 ? "No assigned leads found" : "No leads match your filters"}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <div className="flex items-center cursor-pointer" onClick={() => handleSort("lead_number")}>
                    Lead #
                    {sortField === "lead_number" && (
                      <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === "asc" ? "rotate-180" : ""}`} />
                    )}
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center cursor-pointer" onClick={() => handleSort("client_name")}>
                    Client
                    {sortField === "client_name" && (
                      <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === "asc" ? "rotate-180" : ""}`} />
                    )}
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center cursor-pointer" onClick={() => handleSort("assigned_to_name")}>
                    Assigned To
                    {sortField === "assigned_to_name" && (
                      <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === "asc" ? "rotate-180" : ""}`} />
                    )}
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center cursor-pointer" onClick={() => handleSort("lead_source_name")}>
                    Source
                    {sortField === "lead_source_name" && (
                      <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === "asc" ? "rotate-180" : ""}`} />
                    )}
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center cursor-pointer" onClick={() => handleSort("created_at")}>
                    Date
                    {sortField === "created_at" && (
                      <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === "asc" ? "rotate-180" : ""}`} />
                    )}
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center cursor-pointer" onClick={() => handleSort("status")}>
                    Status
                    {sortField === "status" && (
                      <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === "asc" ? "rotate-180" : ""}`} />
                    )}
                  </div>
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>{lead.lead_number}</TableCell>
                  <TableCell>{lead.client_name}</TableCell>
                  <TableCell>{lead.assigned_to_name || "Unknown"}</TableCell>
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
                  <TableCell>{new Date(lead.created_at || "").toLocaleDateString()}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {lead.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <span className="sr-only">Open menu</span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4"
                          >
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="12" cy="5" r="1" />
                            <circle cx="12" cy="19" r="1" />
                          </svg>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetailsClick(lead)}>
                          <Eye className="mr-2 h-4 w-4" />
                          <span>View Details</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleReassignClick(lead)}>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          <span>Re-assign</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteClick(lead)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
