"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Eye, RefreshCw, Tag, MoreHorizontal, Trash2, ClipboardList } from "lucide-react"
import { ReassignLeadDialog } from "./reassign-lead-dialog"
import { DeleteLeadDialog } from "./delete-lead-dialog"
import { getAssignedLeads, getLeadSources } from "@/actions/manage-lead-actions"
import type { Lead } from "@/types/lead"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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
      result = result.filter((lead) => {
        if (lead.lead_source_id) {
          return lead.lead_source_id.toString() === sourceFilter
        }
        // Fall back to string matching if needed
        if (lead.lead_source && leadSources.length > 0) {
          const source = leadSources.find((s) => s.id.toString() === sourceFilter)
          return source && lead.lead_source.toLowerCase() === source.name.toLowerCase()
        }
        return false
      })
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (lead) =>
          lead.client_name?.toLowerCase().includes(term) ||
          lead.lead_number?.toLowerCase().includes(term) ||
          lead.assigned_to_name?.toLowerCase().includes(term) ||
          lead.lead_source?.toLowerCase().includes(term) ||
          lead.lead_source_name?.toLowerCase().includes(term) ||
          lead.company_name?.toLowerCase().includes(term) ||
          lead.branch_name?.toLowerCase().includes(term),
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
  }, [leads, sourceFilter, searchTerm, sortField, sortDirection, leadSources])

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
      fetchLeads() // Refresh the lead list
    }
    setReassignDialogOpen(false)
  }

  const handleLeadDeleted = () => {
    fetchLeads() // Refresh the lead list
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

  const getSourceDisplayName = (lead: Lead) => {
    if (lead.lead_source_name) {
      return lead.lead_source_name
    }
    if (lead.lead_source) {
      return lead.lead_source
    }
    return "Not specified"
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
            <div className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
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
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center cursor-pointer" onClick={() => handleSort("client_name")}>
                    Client
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center cursor-pointer" onClick={() => handleSort("company_name")}>
                    Company/Branch
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center cursor-pointer" onClick={() => handleSort("assigned_to_name")}>
                    Assigned To
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center cursor-pointer" onClick={() => handleSort("lead_source")}>
                    Source
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center cursor-pointer" onClick={() => handleSort("created_at")}>
                    Date
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center cursor-pointer" onClick={() => handleSort("status")}>
                    Status
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>{lead.lead_number}</TableCell>
                  <TableCell>{lead.client_name}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{lead.company_name || "Unknown Company"}</span>
                      {lead.branch_name && <span className="text-xs text-muted-foreground">{lead.branch_name}</span>}
                    </div>
                  </TableCell>
                  <TableCell>{lead.assigned_to_name || "Not assigned"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      {getSourceDisplayName(lead)}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(lead.created_at || "").toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant="default">{lead.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <div className="flex items-center justify-end gap-2">
                        {/* View Details Button */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => router.push(`/sales/lead/${lead.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View Details</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View Details</p>
                          </TooltipContent>
                        </Tooltip>

                        {/* Update Status Button */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => router.push(`/sales/lead/${lead.id}/status`)}
                            >
                              <ClipboardList className="h-4 w-4" />
                              <span className="sr-only">Update Status</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Update Status</p>
                          </TooltipContent>
                        </Tooltip>

                        {/* Reassign Button */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleReassignClick(lead)}
                            >
                              <RefreshCw className="h-4 w-4" />
                              <span className="sr-only">Reassign</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Reassign Lead</p>
                          </TooltipContent>
                        </Tooltip>

                        {/* Delete Button */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteClick(lead)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Delete Lead</p>
                          </TooltipContent>
                        </Tooltip>

                        {/* More Options Dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">More Options</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/sales/lead/${lead.id}/edit`)}>
                              Edit Lead
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/sales/lead/${lead.id}/notes`)}>
                              View Notes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/sales/lead/${lead.id}/activities`)}>
                              View Activities
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/sales/lead/${lead.id}/documents`)}>
                              View Documents
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Dialogs */}
        {selectedLead && (
          <>
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
          </>
        )}
      </CardContent>
    </Card>
  )
}
