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
  MoreHorizontal,
  Trash2,
  Zap,
  Clock,
  Users,
  TrendingUp,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { UpdateLeadStatusDialog } from "@/components/leads/update-lead-status-dialog"
import { SendMessageDialog } from "@/components/leads/send-message-dialog"
import { ScheduleFollowupDialog } from "@/components/leads/schedule-followup-dialog"
import type { Lead } from "@/types/lead"

interface MyLeadsData {
  leads: Lead[]
  stats: {
    totalLeads: number
    byStatus: Record<string, number>
    companies: number
    branches: number
    leadSources: number
  }
  timestamp: number
  cacheTtl: number
  source?: string
  responseTime?: number
  error?: string
}

export function UltraFastMyLeads() {
  const router = useRouter()
  const { toast } = useToast()
  const [data, setData] = useState<MyLeadsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortField, setSortField] = useState<keyof Lead>("created_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [performanceGrade, setPerformanceGrade] = useState<string>("F")
  const [loadTime, setLoadTime] = useState<number>(0)

  // Dialog states
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [updateStatusDialogOpen, setUpdateStatusDialogOpen] = useState(false)
  const [sendMessageDialogOpen, setSendMessageDialogOpen] = useState(false)
  const [scheduleFollowupDialogOpen, setScheduleFollowupDialogOpen] = useState(false)

  // 🚀 CALCULATE PERFORMANCE GRADE
  const calculatePerformanceGrade = (responseTime: number, source: string) => {
    if (source === "memory-cache" && responseTime < 10) return "A+"
    if (responseTime < 50) return "A"
    if (responseTime < 200) return "B"
    if (responseTime < 500) return "C"
    if (responseTime < 1000) return "D"
    return "F"
  }

  const fetchMyLeads = async (bustCache = false) => {
    const startTime = Date.now()
    setLoading(true)
    setError(null)

    try {
      // 🚀 SINGLE ULTRA-FAST BATCH API CALL
      const url = `/api/sales/my-leads/batch${bustCache ? "?bustCache=true" : ""}`
      const response = await fetch(url)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to fetch leads")
      }

      const result = await response.json()
      
      const endTime = Date.now()
      const totalTime = endTime - startTime
      setLoadTime(totalTime)
      
      if (result.success) {
        setData(result.data)
        // Use API responseTime for grading accuracy
        const apiResponseTime = result.data.responseTime || 0
        setPerformanceGrade(calculatePerformanceGrade(apiResponseTime, result.data.source || "unknown"))
        
        console.log(`⚡ Ultra-fast my leads loaded in ${totalTime}ms (API: ${apiResponseTime}ms, ${result.data.source})`)
      } else {
        throw new Error(result.error || "Failed to fetch leads")
      }
    } catch (err: any) {
      console.error("Error fetching leads:", err)
      setError(err.message || "Failed to load leads. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMyLeads()
  }, [])

  const handleSort = (field: keyof Lead) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const handleUpdateStatus = (lead: Lead) => {
    setSelectedLead(lead)
    setUpdateStatusDialogOpen(true)
  }

  const handleSendMessage = (lead: Lead) => {
    setSelectedLead(lead)
    setSendMessageDialogOpen(true)
  }

  const handleScheduleFollowup = (lead: Lead) => {
    setSelectedLead(lead)
    setScheduleFollowupDialogOpen(true)
  }

  const handleDialogComplete = () => {
    // Refresh data with cache busting after any dialog action
    fetchMyLeads(true)
  }

  // 🚀 PERFORMANCE GRADE COLORS
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A+": return "text-green-600 bg-green-50 border-green-200"
      case "A": return "text-green-600 bg-green-50 border-green-200"
      case "B": return "text-blue-600 bg-blue-50 border-blue-200"
      case "C": return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "D": return "text-orange-600 bg-orange-50 border-orange-200"
      default: return "text-red-600 bg-red-50 border-red-200"
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
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
          <Button onClick={() => fetchMyLeads(true)} variant="outline" className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.leads.length === 0) {
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

  // Filter and sort leads
  let filteredLeads = [...data.leads]

  if (searchTerm) {
    const search = searchTerm.toLowerCase()
    filteredLeads = filteredLeads.filter(
      (lead) =>
        lead.lead_number?.toLowerCase().includes(search) ||
        lead.client_name?.toLowerCase().includes(search) ||
        lead.client_email?.toLowerCase().includes(search) ||
        lead.client_phone?.toLowerCase().includes(search) ||
        lead.company_name?.toLowerCase().includes(search) ||
        lead.branch_name?.toLowerCase().includes(search)
    )
  }

  if (statusFilter !== "all") {
    filteredLeads = filteredLeads.filter((lead) => lead.status === statusFilter)
  }

  filteredLeads.sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]

    if (!aValue && !bValue) return 0
    if (!aValue) return 1
    if (!bValue) return -1

    const comparison = aValue > bValue ? 1 : aValue < bValue ? -1 : 0
    return sortDirection === "desc" ? -comparison : comparison
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-500" />
            Ultra-Fast My Leads
          </CardTitle>
          
          {/* 🚀 REAL-TIME PERFORMANCE MONITOR */}
          <div className="flex items-center gap-4 text-sm">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => fetchMyLeads(true)}
              disabled={loading}
              className="flex items-center gap-1"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <div className={`px-2 py-1 rounded border flex items-center gap-1 ${getGradeColor(performanceGrade)}`}>
              <TrendingUp className="h-3 w-3" />
              Grade: {performanceGrade}
            </div>
            <div className="flex items-center gap-1 text-gray-600">
              <Clock className="h-3 w-3" />
              {loadTime}ms{data?.responseTime !== undefined && ` (API: ${data.responseTime}ms)`}
            </div>
            {data?.source && (
              <div className="flex items-center gap-1 text-gray-600">
                <Users className="h-3 w-3" />
                {data.source}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* 🚀 STATS OVERVIEW */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{data.stats.totalLeads}</div>
            <div className="text-xs text-orange-700">Total Leads</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{data.stats.companies}</div>
            <div className="text-xs text-orange-700">Companies</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{data.stats.branches}</div>
            <div className="text-xs text-orange-700">Branches</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{data.stats.leadSources}</div>
            <div className="text-xs text-orange-700">Lead Sources</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{data.stats.byStatus["QUALIFIED"] || 0}</div>
            <div className="text-xs text-orange-700">Qualified</div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Search and Filter */}
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
                <SelectItem value="ASSIGNED">Assigned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Leads Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("lead_number")}
                      className="flex items-center gap-1"
                    >
                      Lead #
                      <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("client_name")}
                      className="flex items-center gap-1"
                    >
                      Client
                      <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>Company/Branch</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("status")}
                      className="flex items-center gap-1"
                    >
                      Status
                      <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("created_at")}
                      className="flex items-center gap-1"
                    >
                      Created
                      <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.lead_number}</TableCell>
                    <TableCell>{lead.client_name}</TableCell>
                    <TableCell>
                      <div>
                        {lead.company_name || "N/A"}
                        {lead.branch_name && (
                          <div className="text-xs text-muted-foreground">{lead.branch_name}</div>
                        )}
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
                    <TableCell>{lead.lead_source_name || "N/A"}</TableCell>
                    <TableCell>{getStatusBadge(lead.status)}</TableCell>
                    <TableCell>
                      {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : "N/A"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
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
        </div>

        {/* Dialogs */}
        {selectedLead && (
          <>
            <UpdateLeadStatusDialog
              lead={selectedLead}
              open={updateStatusDialogOpen}
              onOpenChange={setUpdateStatusDialogOpen}
              onStatusUpdated={handleDialogComplete}
            />
            <SendMessageDialog
              lead={selectedLead}
              open={sendMessageDialogOpen}
              onOpenChange={setSendMessageDialogOpen}
            />
            <ScheduleFollowupDialog
              lead={selectedLead}
              open={scheduleFollowupDialogOpen}
              onOpenChange={setScheduleFollowupDialogOpen}
              onFollowupScheduled={handleDialogComplete}
            />
          </>
        )}
      </CardContent>
    </Card>
  )
} 