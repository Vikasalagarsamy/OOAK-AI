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
import {
  ArrowUpDown,
  ChevronDown,
  Eye,
  Mail,
  Phone,
  Search,
  Loader2,
  RefreshCw,
  AlertCircle,
  Calendar,
  MessageSquare,
  ClipboardList,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { UpdateLeadStatusDialog } from "@/components/leads/update-lead-status-dialog"
import { SendMessageDialog } from "@/components/leads/send-message-dialog"
import { ScheduleFollowupDialog } from "@/components/leads/schedule-followup-dialog"

// Mock data for preview environment - with assigned_to set to simulate current user
const MOCK_LEADS = [
  {
    id: 1,
    lead_number: "L0012",
    client_name: "Arun",
    email: "arun@example.com",
    phone: "+91 9876543210",
    company_name: "Tech Solutions",
    branch_name: "Chennai Branch",
    status: "ASSIGNED",
    created_at: "2025-05-11T16:33:01.528Z",
    updated_at: "2025-05-11T16:33:01.528Z",
    assigned_to: 87, // This would be the current user's employee ID
    lead_source: "Website",
    location: "Chennai",
  },
  {
    id: 2,
    lead_number: "L0013",
    client_name: "Priya",
    email: "priya@example.com",
    phone: "+91 9876543211",
    company_name: "Digital Marketing Inc",
    branch_name: "Bangalore Branch",
    status: "NEW",
    created_at: "2025-05-10T14:22:01.528Z",
    updated_at: "2025-05-10T14:22:01.528Z",
    assigned_to: 87, // This would be the current user's employee ID
    lead_source: "Referral",
    location: "Bangalore",
  },
  {
    id: 3,
    lead_number: "L0014",
    client_name: "Raj",
    email: "raj@example.com",
    phone: "+91 9876543212",
    company_name: "Global Services",
    branch_name: "Mumbai Branch",
    status: "QUALIFIED",
    created_at: "2025-05-09T11:15:01.528Z",
    updated_at: "2025-05-09T11:15:01.528Z",
    assigned_to: 87, // This would be the current user's employee ID
    lead_source: "Trade Show",
    location: "Mumbai",
  },
]

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
  const [authError, setAuthError] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [noEmployeeIdError, setNoEmployeeIdError] = useState(false)

  // Dialog states
  const [selectedLead, setSelectedLead] = useState(null)
  const [updateStatusDialogOpen, setUpdateStatusDialogOpen] = useState(false)
  const [sendMessageDialogOpen, setSendMessageDialogOpen] = useState(false)
  const [scheduleFollowupDialogOpen, setScheduleFollowupDialogOpen] = useState(false)

  async function fetchLeads() {
    setLoading(true)
    setError(null)
    setAuthError(false)
    setNoEmployeeIdError(false)

    try {
      // Check if we're in preview mode (v0 environment)
      if (typeof window !== "undefined" && window.location.hostname.includes("vusercontent.com")) {
        // Use mock data in preview mode
        setIsPreviewMode(true)
        setLeads(MOCK_LEADS)
        setLoading(false)
        return
      }

      const response = await fetch("/api/leads/my-leads")

      if (response.status === 401) {
        setAuthError(true)
        setLoading(false)
        return
      }

      if (response.status === 403) {
        setNoEmployeeIdError(true)
        setLoading(false)
        return
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to fetch leads")
      }

      const data = await response.json()
      setLeads(data || [])
    } catch (err) {
      console.error("Error fetching leads:", err)
      setError(err.message || "Failed to load leads. Please try again.")
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

  const handleUpdateStatus = (lead) => {
    setSelectedLead(lead)
    setUpdateStatusDialogOpen(true)
  }

  const handleSendMessage = (lead) => {
    setSelectedLead(lead)
    setSendMessageDialogOpen(true)
  }

  const handleScheduleFollowup = (lead) => {
    setSelectedLead(lead)
    setScheduleFollowupDialogOpen(true)
  }

  const handleLeadUpdated = () => {
    fetchLeads()
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
          (lead.email && lead.email.toLowerCase().includes(searchLower)) ||
          (lead.phone && lead.phone.includes(searchTerm)) ||
          (lead.lead_source && lead.lead_source.toLowerCase().includes(searchLower)) ||
          (lead.location && lead.location.toLowerCase().includes(searchLower))
        )
      }

      return true
    })
    .sort((a, b) => {
      // Handle null values or missing fields
      if (!a[sortField] && !b[sortField]) return 0
      if (!a[sortField]) return 1
      if (!b[sortField]) return -1

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
      ASSIGNED: { label: "Assigned", className: "bg-teal-100 text-teal-800" },
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
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (authError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Authentication Required</CardTitle>
          <CardDescription>You must be logged in to view your leads</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-amber-50 p-4 border border-amber-200">
            <p className="text-amber-800">Your session may have expired or you need to log in again.</p>
          </div>
          <div className="flex gap-4 mt-4">
            <Button onClick={() => window.location.reload()} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Page
            </Button>
            <Button onClick={() => router.push("/login")}>Log In Again</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (noEmployeeIdError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Account Not Linked</CardTitle>
          <CardDescription>Your user account is not linked to an employee record</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access Restricted</AlertTitle>
            <AlertDescription>
              Your user account is not linked to an employee record in the system. Please contact your administrator to
              link your account to an employee record to view leads.
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={() => router.push("/dashboard")} variant="outline">
              Return to Dashboard
            </Button>
          </div>
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
          {isPreviewMode && (
            <div className="mt-2 text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-md inline-block">Preview Mode</div>
          )}
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
    <>
      <Card>
        <CardHeader>
          <CardTitle>My Leads</CardTitle>
          <CardDescription>Leads assigned to you</CardDescription>
          {isPreviewMode && (
            <div className="mt-2 text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-md inline-block">
              Preview Mode - Using Sample Data
            </div>
          )}
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
                  <SelectItem value="ASSIGNED">Assigned</SelectItem>
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
                        onClick={() => handleSort("lead_source")}
                        className="flex items-center gap-1 font-medium"
                      >
                        Source
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </TableHead>
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
                          {lead.email && (
                            <a
                              href={`mailto:${lead.email}`}
                              className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                            >
                              <Mail className="mr-1 h-3 w-3" />
                              {lead.email}
                            </a>
                          )}
                          {lead.phone && (
                            <a
                              href={`tel:${lead.phone}`}
                              className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                            >
                              <Phone className="mr-1 h-3 w-3" />
                              {lead.phone}
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{lead.lead_source || "N/A"}</TableCell>
                      <TableCell>{getStatusBadge(lead.status)}</TableCell>
                      <TableCell>{lead.created_at ? new Date(lead.created_at).toLocaleDateString() : "N/A"}</TableCell>
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
                            <DropdownMenuItem onClick={() => handleUpdateStatus(lead)}>
                              <ClipboardList className="mr-2 h-4 w-4" />
                              Update Status
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSendMessage(lead)}>
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Send Message
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleScheduleFollowup(lead)}>
                              <Calendar className="mr-2 h-4 w-4" />
                              Schedule Follow-up
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

      {/* Dialogs */}
      {selectedLead && (
        <>
          <UpdateLeadStatusDialog
            lead={selectedLead}
            open={updateStatusDialogOpen}
            onOpenChange={setUpdateStatusDialogOpen}
            onStatusUpdated={handleLeadUpdated}
          />

          <SendMessageDialog lead={selectedLead} open={sendMessageDialogOpen} onOpenChange={setSendMessageDialogOpen} />

          <ScheduleFollowupDialog
            lead={selectedLead}
            open={scheduleFollowupDialogOpen}
            onOpenChange={setScheduleFollowupDialogOpen}
            onFollowupScheduled={handleLeadUpdated}
          />
        </>
      )}
    </>
  )
}
