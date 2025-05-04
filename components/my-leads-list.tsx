"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ArrowUpDown, ChevronDown, Eye, Mail, Phone, Search, Loader2 } from "lucide-react"
import { getMyLeads } from "@/actions/my-leads-actions"
import { useToast } from "@/components/ui/use-toast"

export function MyLeadsList() {
  const router = useRouter()
  const { toast } = useToast()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortField, setSortField] = useState("created_at")
  const [sortDirection, setSortDirection] = useState("desc")

  const fetchLeads = async () => {
    try {
      setLoading(true)
      const result = await getMyLeads()

      if (result.error) {
        setError(result.error)
        setLeads([])
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      } else {
        setLeads(result.data || [])
        setError(null)
      }
    } catch (err) {
      const errorMessage = err.message || "Failed to fetch leads"
      setError(errorMessage)
      setLeads([])
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [])

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const filteredLeads = leads
    .filter((lead) => {
      // Status filter
      if (statusFilter !== "all" && lead.status !== statusFilter) {
        return false
      }

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        return (
          (lead.client_name && lead.client_name.toLowerCase().includes(searchLower)) ||
          (lead.company_name && lead.company_name.toLowerCase().includes(searchLower)) ||
          (lead.branch_name && lead.branch_name.toLowerCase().includes(searchLower)) ||
          (lead.lead_number && lead.lead_number.toLowerCase().includes(searchLower)) ||
          (lead.client_email && lead.client_email.toLowerCase().includes(searchLower)) ||
          (lead.client_phone && lead.client_phone.includes(searchTerm)) ||
          (lead.lead_source_name && lead.lead_source_name.toLowerCase().includes(searchLower))
        )
      }

      return true
    })
    .sort((a, b) => {
      // Handle null values
      if (a[sortField] === null && b[sortField] === null) return 0
      if (a[sortField] === null) return 1
      if (b[sortField] === null) return -1

      // Sort based on field type
      if (typeof a[sortField] === "string") {
        const comparison = a[sortField].localeCompare(b[sortField])
        return sortDirection === "asc" ? comparison : -comparison
      } else {
        const comparison = a[sortField] < b[sortField] ? -1 : a[sortField] > b[sortField] ? 1 : 0
        return sortDirection === "asc" ? comparison : -comparison
      }
    })

  const getStatusBadge = (status) => {
    const statusConfig = {
      NEW: { label: "New", className: "bg-blue-100 text-blue-800" },
      CONTACTED: { label: "Contacted", className: "bg-purple-100 text-purple-800" },
      QUALIFIED: { label: "Qualified", className: "bg-green-100 text-green-800" },
      PROPOSAL: { label: "Proposal", className: "bg-yellow-100 text-yellow-800" },
      NEGOTIATION: { label: "Negotiation", className: "bg-orange-100 text-orange-800" },
      WON: { label: "Won", className: "bg-emerald-100 text-emerald-800" },
      LOST: { label: "Lost", className: "bg-red-100 text-red-800" },
      REJECTED: { label: "Rejected", className: "bg-gray-100 text-gray-800" },
    }

    const config = statusConfig[status] || { label: status, className: "bg-gray-100 text-gray-800" }

    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Loading your leads...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>There was a problem loading your leads</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-destructive/10 p-4 text-destructive">
            <p>{error}</p>
          </div>
          <Button onClick={fetchLeads} variant="outline" className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (leads.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Leads</CardTitle>
          <CardDescription>Leads assigned to you</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-dashed p-8 text-center">
            <h3 className="text-lg font-medium">No leads assigned to you</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              You don't have any leads assigned to you at the moment.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Leads</CardTitle>
        <CardDescription>Leads assigned to you</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leads..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="NEW">New</SelectItem>
                <SelectItem value="CONTACTED">Contacted</SelectItem>
                <SelectItem value="QUALIFIED">Qualified</SelectItem>
                <SelectItem value="PROPOSAL">Proposal</SelectItem>
                <SelectItem value="NEGOTIATION">Negotiation</SelectItem>
                <SelectItem value="WON">Won</SelectItem>
                <SelectItem value="LOST">Lost</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("lead_number")}
                      className="flex items-center gap-1 font-medium"
                    >
                      Lead #
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("client_name")}
                      className="flex items-center gap-1 font-medium"
                    >
                      Client
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("company_name")}
                      className="flex items-center gap-1 font-medium"
                    >
                      Company
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("status")}
                      className="flex items-center gap-1 font-medium"
                    >
                      Status
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("created_at")}
                      className="flex items-center gap-1 font-medium"
                    >
                      Created
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.lead_number || "N/A"}</TableCell>
                    <TableCell>{lead.client_name || "N/A"}</TableCell>
                    <TableCell>
                      <div>
                        {lead.company_name || "N/A"}
                        {lead.branch_name && <div className="text-xs text-muted-foreground">{lead.branch_name}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {lead.client_email && (
                          <a
                            href={`mailto:${lead.client_email}`}
                            className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                          >
                            <Mail className="mr-1 h-3 w-3" />
                            {lead.client_email}
                          </a>
                        )}
                        {lead.client_phone && (
                          <a
                            href={`tel:${lead.client_phone}`}
                            className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                          >
                            <Phone className="mr-1 h-3 w-3" />
                            {lead.client_phone}
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(lead.status)}</TableCell>
                    <TableCell>{new Date(lead.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            Actions <ChevronDown className="ml-1 h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/sales/lead/${lead.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="text-sm text-muted-foreground">
            Showing {filteredLeads.length} of {leads.length} leads
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
