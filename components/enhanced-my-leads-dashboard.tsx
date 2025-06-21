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
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  DollarSign,
  TrendingUp,
  Clock,
  Target,
  Heart,
  Zap,
  Users,
  Award,
  AlertTriangle,
  CheckCircle,
  Star,
  CalendarDays,
  MapPin,
  Tag,
  Sparkles,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Lead {
  id: number
  lead_number: string
  client_name: string
  email: string
  phone: string
  status: string
  created_at: string
  updated_at: string
  location: string
  notes: string
  bride_name?: string
  groom_name?: string
  description?: string
  priority: string
  expected_value: number
  budget_range?: string
  last_contact_date?: string
  next_follow_up_date?: string
  days_since_last_contact?: number
  follow_up_urgency: string
  wedding_date?: string
  venue_preference?: string
  guest_count?: number
  conversion_stage: string
  lead_score: number
  tags: string[]
  company_id: number
  company_name: string
  branch_id: number
  branch_name: string
  assigned_to: number
  assigned_employee_name: string
  assigned_employee_surname: string
  assigned_employee_role: string
  call_count: number
  quotation_count: number
  lead_age_days: number
  lead_source: string
  engagement_level: string
  value_category: string
  recommended_action: string
  health_score: number
}

interface Summary {
  total_leads: number
  new_leads: number
  contacted_leads: number
  qualified_leads: number
  urgent_leads: number
  high_priority_leads: number
  overdue_leads: number
  total_pipeline_value: number
  avg_lead_value: number
  new_this_week: number
  contacted_this_week: number
  avg_lead_score: number
  conversion_rate: string
}

interface Insights {
  priority_leads: Lead[]
  high_value_leads: Lead[]
  stale_leads: Lead[]
  wedding_leads: Lead[]
  recent_activity: Lead[]
  requires_attention: Lead[]
}

interface LeadsData {
  success: boolean
  leads: Lead[]
  summary: Summary
  insights: Insights
  employee_info: {
    employee_id: number
    current_user: string
  }
}

export function EnhancedMyLeadsDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const [data, setData] = useState<LeadsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [stageFilter, setStageFilter] = useState("all")
  const [sortField, setSortField] = useState("health_score")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [selectedTab, setSelectedTab] = useState("overview")

  async function fetchLeads() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/leads/my-leads")

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to fetch leads")
      }

      const leadsData = await response.json()
      setData(leadsData)
    } catch (err: any) {
      console.error("Error fetching leads:", err)
      setError(err.message || "Failed to load leads. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [])

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const filteredLeads = data?.leads?.filter((lead) => {
    // Priority filter
    if (priorityFilter !== "all" && lead.priority !== priorityFilter) {
      return false
    }

    // Stage filter
    if (stageFilter !== "all" && lead.conversion_stage !== stageFilter) {
      return false
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        lead.client_name?.toLowerCase().includes(searchLower) ||
        lead.company_name?.toLowerCase().includes(searchLower) ||
        lead.lead_number?.toLowerCase().includes(searchLower) ||
        lead.email?.toLowerCase().includes(searchLower) ||
        lead.phone?.includes(searchTerm) ||
        lead.location?.toLowerCase().includes(searchLower) ||
        lead.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      )
    }

    return true
  }).sort((a, b) => {
    const aVal = a[sortField as keyof Lead]
    const bVal = b[sortField as keyof Lead]
    
    if (aVal === null || aVal === undefined) return 1
    if (bVal === null || bVal === undefined) return -1
    
    let comparison = 0
    if (typeof aVal === "string" && typeof bVal === "string") {
      comparison = aVal.localeCompare(bVal)
    } else if (typeof aVal === "number" && typeof bVal === "number") {
      comparison = aVal - bVal
    } else {
      comparison = String(aVal).localeCompare(String(bVal))
    }
    
    return sortDirection === "asc" ? comparison : -comparison
  }) || []

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent": return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "high": return <TrendingUp className="h-4 w-4 text-orange-500" />
      case "medium": return <Target className="h-4 w-4 text-yellow-500" />
      case "low": return <Clock className="h-4 w-4 text-green-500" />
      default: return <Target className="h-4 w-4 text-gray-500" />
    }
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    if (score >= 40) return "text-orange-600"
    return "text-red-600"
  }

  const getUrgencyBadge = (urgency: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      overdue: { label: "Overdue", className: "bg-red-100 text-red-800 border-red-200" },
      urgent: { label: "Urgent", className: "bg-orange-100 text-orange-800 border-orange-200" },
      soon: { label: "Soon", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
      scheduled: { label: "Scheduled", className: "bg-green-100 text-green-800 border-green-200" },
    }
    
    const variant = variants[urgency] || variants.scheduled
    return (
      <Badge variant="outline" className={variant.className}>
        {variant.label}
      </Badge>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set"
    return new Date(dateString).toLocaleDateString('en-IN')
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Loading your enhanced leads dashboard...</p>
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
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={fetchLeads} variant="outline" className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!data || !data.success) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with User Info */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Leads Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {data.employee_info.current_user}
          </p>
        </div>
        <Button onClick={fetchLeads} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pipeline</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.summary.total_pipeline_value)}</div>
            <p className="text-xs text-muted-foreground">
              {data.summary.total_leads} leads • Avg {formatCurrency(data.summary.avg_lead_value)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requires Attention</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{data.insights.requires_attention.length}</div>
            <p className="text-xs text-muted-foreground">
              {data.summary.overdue_leads} overdue • {data.summary.urgent_leads} urgent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lead Health</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(data.summary.avg_lead_score)}/100</div>
            <Progress value={data.summary.avg_lead_score} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.conversion_rate}</div>
            <p className="text-xs text-muted-foreground">
              {data.summary.qualified_leads} qualified leads
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Priority Alerts */}
      {data.insights.requires_attention.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Immediate Attention Required</AlertTitle>
          <AlertDescription className="text-red-700">
            You have {data.insights.requires_attention.length} leads that need immediate attention. 
            Check the "Requires Attention" tab below.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="all-leads">All Leads</TabsTrigger>
          <TabsTrigger value="priority" className="relative">
            Priority
            {data.insights.priority_leads.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                {data.insights.priority_leads.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="high-value">High Value</TabsTrigger>
          <TabsTrigger value="weddings">Weddings</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Quick Actions Needed
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.insights.requires_attention.slice(0, 3).map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{lead.client_name}</div>
                      <div className="text-sm text-muted-foreground">{lead.recommended_action}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getPriorityIcon(lead.priority)}
                      <Badge variant="outline" className={getHealthScoreColor(lead.health_score)}>
                        {lead.health_score}
                      </Badge>
                    </div>
                  </div>
                ))}
                {data.insights.requires_attention.length > 3 && (
                  <Button variant="outline" className="w-full" onClick={() => setSelectedTab("priority")}>
                    View All {data.insights.requires_attention.length} Priority Leads
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.insights.recent_activity.slice(0, 3).map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{lead.client_name}</div>
                      <div className="text-sm text-muted-foreground">
                        Last contact: {lead.days_since_last_contact} days ago
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(lead.expected_value)}</div>
                      {getUrgencyBadge(lead.follow_up_urgency)}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="all-leads" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leads..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="interested">Interested</SelectItem>
                <SelectItem value="quotation_sent">Quotation Sent</SelectItem>
                <SelectItem value="negotiation">Negotiation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Leads Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("client_name")}>
                        Client <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("priority")}>
                        Priority <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("expected_value")}>
                        Value <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("health_score")}>
                        Health <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("follow_up_urgency")}>
                        Follow-up <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                      </TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{lead.client_name}</div>
                            <div className="text-sm text-muted-foreground">{lead.lead_number}</div>
                            {lead.tags.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {lead.tags.slice(0, 2).map((tag, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getPriorityIcon(lead.priority)}
                            <span className="capitalize">{lead.priority}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{formatCurrency(lead.expected_value)}</div>
                            <div className="text-sm text-muted-foreground">{lead.budget_range}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${getHealthScoreColor(lead.health_score)}`}>
                              {lead.health_score}
                            </span>
                            <Progress value={lead.health_score} className="w-16 h-2" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {getUrgencyBadge(lead.follow_up_urgency)}
                            {lead.next_follow_up_date && (
                              <div className="text-xs text-muted-foreground">
                                {formatDate(lead.next_follow_up_date)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium text-blue-600">{lead.recommended_action.split(':')[0]}</div>
                            <div className="text-muted-foreground">{lead.recommended_action.split(':')[1]}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Phone className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Mail className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="priority" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Leads Requiring Immediate Attention ({data.insights.requires_attention.length})
              </CardTitle>
              <CardDescription>
                These leads need your immediate attention based on urgency, priority, and health score.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.insights.requires_attention.map((lead) => (
                <Card key={lead.id} className="border-l-4 border-l-red-500">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{lead.client_name}</h3>
                          {getPriorityIcon(lead.priority)}
                          <Badge variant="outline" className={getHealthScoreColor(lead.health_score)}>
                            Health: {lead.health_score}
                          </Badge>
                          {getUrgencyBadge(lead.follow_up_urgency)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <div><strong>Value:</strong> {formatCurrency(lead.expected_value)}</div>
                            <div><strong>Lead Age:</strong> {lead.lead_age_days} days</div>
                            <div><strong>Last Contact:</strong> {lead.days_since_last_contact ? `${lead.days_since_last_contact} days ago` : 'Never'}</div>
                          </div>
                          <div>
                            <div><strong>Next Follow-up:</strong> {formatDate(lead.next_follow_up_date)}</div>
                            <div><strong>Stage:</strong> {lead.conversion_stage}</div>
                            {lead.wedding_date && <div><strong>Wedding:</strong> {formatDate(lead.wedding_date)}</div>}
                          </div>
                        </div>
                        <div className="mt-3 p-3 bg-blue-50 rounded-md">
                          <div className="font-medium text-blue-800">Recommended Action:</div>
                          <div className="text-blue-700">{lead.recommended_action}</div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          <Phone className="h-4 w-4 mr-2" />
                          Call Now
                        </Button>
                        <Button size="sm" variant="outline">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Message
                        </Button>
                        <Button size="sm" variant="outline">
                          <Calendar className="h-4 w-4 mr-2" />
                          Schedule
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="high-value" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                High Value Leads ({data.insights.high_value_leads.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {data.insights.high_value_leads.map((lead) => (
                  <Card key={lead.id} className="border-l-4 border-l-yellow-500">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold">{lead.client_name}</h3>
                          <div className="text-2xl font-bold text-green-600 mt-1">
                            {formatCurrency(lead.expected_value)}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {lead.conversion_stage} • Health: {lead.health_score}/100
                          </div>
                        </div>
                        <div className="text-right">
                          {getPriorityIcon(lead.priority)}
                          <div className="text-sm mt-1">{lead.priority} priority</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weddings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-500" />
                Wedding Leads ({data.insights.wedding_leads.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {data.insights.wedding_leads.map((lead) => (
                  <Card key={lead.id} className="border-l-4 border-l-pink-500">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold">{lead.bride_name} & {lead.groom_name}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 text-sm">
                            <div>
                              <div><strong>Wedding Date:</strong> {formatDate(lead.wedding_date)}</div>
                              <div><strong>Venue:</strong> {lead.venue_preference}</div>
                              <div><strong>Guests:</strong> {lead.guest_count}</div>
                            </div>
                            <div>
                              <div><strong>Budget:</strong> {formatCurrency(lead.expected_value)}</div>
                              <div><strong>Contact:</strong> {lead.client_name}</div>
                              <div><strong>Health Score:</strong> {lead.health_score}/100</div>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4">
                          {getPriorityIcon(lead.priority)}
                          {getUrgencyBadge(lead.follow_up_urgency)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Conversion Rate</span>
                  <span className="font-bold">{data.summary.conversion_rate}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Average Lead Score</span>
                  <span className="font-bold">{Math.round(data.summary.avg_lead_score)}/100</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>New This Week</span>
                  <span className="font-bold">{data.summary.new_this_week}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Contacted This Week</span>
                  <span className="font-bold">{data.summary.contacted_this_week}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lead Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>New Leads</span>
                    <span>{data.summary.new_leads}</span>
                  </div>
                  <Progress value={(data.summary.new_leads / data.summary.total_leads) * 100} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Contacted</span>
                    <span>{data.summary.contacted_leads}</span>
                  </div>
                  <Progress value={(data.summary.contacted_leads / data.summary.total_leads) * 100} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Qualified</span>
                    <span>{data.summary.qualified_leads}</span>
                  </div>
                  <Progress value={(data.summary.qualified_leads / data.summary.total_leads) * 100} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 