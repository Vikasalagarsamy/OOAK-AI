"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Plus, Search, Filter, MoreHorizontal, Eye, Edit, Trash2, Send, Download, Calendar, Users, Package, Check, Settings, Share, ExternalLink, AlertTriangle, CheckCircle, Clock, XCircle, BarChart3, ThumbsUp, ThumbsDown, DollarSign, UserCheck, ArrowRight, Table as TableIcon, Lock } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { getQuotations, getQuotationsByStatus, getQuotationsCountByStatus, updateQuotationStatus, deleteQuotation, initializeQuotationsTable, type SavedQuotation } from "@/actions/quotations-actions"
import { getQuotationServices, getQuotationDeliverables } from "@/actions/quotation-data-actions"
import { QuotationWorkflowPipeline } from "@/components/quotation-workflow-pipeline"
import { 
  getQuotationsByWorkflowStatus,
  submitQuotationForApproval,
  approveQuotation,
  rejectQuotation,
  markPaymentReceived,
  createPostSaleConfirmation,
  updateQuotationWorkflowStatus,
  getWorkflowAnalytics,
  getPendingApprovals,
  getPendingConfirmations
} from "@/actions/quotation-workflow-actions"
import { getCurrentUser } from "@/actions/auth-actions"
import { getWorkflowPermissions, WORKFLOW_STATUS_LABELS, WORKFLOW_STATUS_COLORS } from "@/types/quotation-workflow"
import type { EnhancedQuotation, WorkflowStatus } from "@/types/quotation-workflow"
import { TestNotificationButton } from "@/components/test-notification-button"
import { PostSaleConfirmationDialog, type PostSaleConfirmationData } from "@/components/post-sale-confirmation-dialog"

export default function QuotationPage() {
  const [quotations, setQuotations] = useState<SavedQuotation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("all")
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({})
  const [selectedQuotation, setSelectedQuotation] = useState<SavedQuotation | null>(null)
  const [services, setServices] = useState<any[]>([])
  const [deliverables, setDeliverables] = useState<any[]>([])
  const [dynamicTotals, setDynamicTotals] = useState<Record<number, number>>({})
  
  // Workflow-related state
  const [workflowView, setWorkflowView] = useState(false)
  const [enhancedQuotations, setEnhancedQuotations] = useState<EnhancedQuotation[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [pendingApprovals, setPendingApprovals] = useState<EnhancedQuotation[]>([])
  const [pendingConfirmations, setPendingConfirmations] = useState<EnhancedQuotation[]>([])
  const [workflowAnalytics, setWorkflowAnalytics] = useState<any[]>([])
  
  // Post-sale confirmation dialog state
  const [postSaleDialogOpen, setPostSaleDialogOpen] = useState(false)
  const [quotationForConfirmation, setQuotationForConfirmation] = useState<SavedQuotation | null>(null)
  
  const router = useRouter()

  // Consolidated initial data loading - only run once on mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true)
        console.log("📊 Loading quotations page data...")
        
        // Load all initial data in parallel
        const [quotationsResult, servicesData, deliverablesData, user] = await Promise.all([
          initializeQuotationsTable().then(() => getQuotationsCountByStatus()),
          getQuotationServices(),
          getQuotationDeliverables(),
          getCurrentUser()
        ])

        // Set service and deliverable data
        setServices(servicesData || [])
        setDeliverables(deliverablesData || [])
        setCurrentUser(user)

        // Set status counts
        if (quotationsResult.success && quotationsResult.counts) {
          setStatusCounts(quotationsResult.counts)
        }

        // Load quotations for default tab
        await loadQuotationsForTab("all")
        
        console.log("✅ Quotations page data loaded")
      } catch (error) {
        console.error("❌ Error initializing quotations page:", error)
        toast({
          title: "Error",
          description: "Failed to load quotations data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    initializeData()
  }, []) // Only run once on mount

  // Load quotations when tab changes (but not on initial load)
  useEffect(() => {
    // Don't load on initial mount (handled above) or if still loading
    if (loading) return
    
    console.log("📋 Loading quotations for tab:", activeTab)
    loadQuotationsForTab(activeTab)
  }, [activeTab]) // Only depend on activeTab

  // Load workflow data when workflow view is activated
  useEffect(() => {
    if (workflowView && !loading) {
      console.log("🔄 Loading workflow data...")
      loadWorkflowData()
    }
  }, [workflowView]) // Only depend on workflowView

  // Calculate dynamic totals including services and deliverables
  const calculateDynamicTotals = async (quotationsList: SavedQuotation[]) => {
    const totals: Record<number, number> = {}
    
    for (const quotation of quotationsList) {
      try {
        // Get services total (already stored in total_amount)
        let servicesTotal = quotation.total_amount || 0
        
        // Get deliverables total by calculating from quotation data
        let deliverablesTotal = 0
        
        const quotationData = quotation.quotation_data as any
        if (quotationData?.selected_deliverables && Array.isArray(quotationData.selected_deliverables)) {
          deliverablesTotal = quotationData.selected_deliverables.reduce((sum: number, deliverable: any) => {
            const price = getDeliverablePrice(
              deliverable.deliverable_id, 
              quotation.default_package, 
              deliverable.quantity || 1
            )
            return sum + price
          }, 0)
        }
        
        // Calculate true total
        const trueTotal = servicesTotal + deliverablesTotal
        totals[quotation.id] = trueTotal
        
        console.log(`📊 Quotation ${quotation.id}: Services ₹${servicesTotal} + Deliverables ₹${deliverablesTotal} = ₹${trueTotal}`)
      } catch (error) {
        console.error(`Error calculating total for quotation ${quotation.id}:`, error)
        // Fallback to stored total_amount
        totals[quotation.id] = quotation.total_amount || 0
      }
    }
    
    setDynamicTotals(totals)
  }

  const loadQuotationsForTab = async (tabName: string) => {
    try {
      console.log(`🔍 Loading quotations for tab: ${tabName}`)
      
      // Use the simple API that bypasses authentication issues
      const response = await fetch('/api/quotations-simple')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (result.success && result.quotations) {
        let filteredQuotations = result.quotations
        
        // Apply tab-specific filtering
        switch (tabName) {
          case "active":
            filteredQuotations = result.quotations.filter((q: any) => 
              ['draft', 'sent', 'approved'].includes(q.status)
            )
            break
          case "rejected":
            filteredQuotations = result.quotations.filter((q: any) => 
              ['rejected', 'expired'].includes(q.status)
            )
            break
          case "all":
          default:
            filteredQuotations = result.quotations
            break
        }
        
        setQuotations(filteredQuotations)
        
        // Calculate dynamic totals including deliverables
        await calculateDynamicTotals(filteredQuotations)
        
        console.log(`✅ Loaded ${filteredQuotations.length} quotations for ${tabName}`)
      } else {
        console.error("Error loading quotations:", result.error)
        toast({
          title: "Error",
          description: result.error || "Failed to load quotations",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error loading quotations:", error)
      toast({
        title: "Error",
        description: "Failed to load quotations",
        variant: "destructive",
      })
    }
  }

  const loadCurrentUser = async () => {
    try {
      const user = await getCurrentUser()
      setCurrentUser(user)
    } catch (error) {
      console.error('Error loading current user:', error)
    }
  }

  const convertToEnhancedQuotation = (quotation: SavedQuotation): EnhancedQuotation => ({
    ...quotation,
    workflow_status: (quotation as any).workflow_status || 'draft',
    confirmation_required: true
  })

  const loadWorkflowData = async () => {
    try {
      setLoading(true)
      // Convert existing quotations to enhanced format
      const enhanced: EnhancedQuotation[] = quotations.map(convertToEnhancedQuotation)
      setEnhancedQuotations(enhanced)

      // Load workflow-specific data
      if (currentUser) {
        const [approvalsResult, confirmationsResult, analyticsResult] = await Promise.all([
          getPendingApprovals(),
          getPendingConfirmations(),
          getWorkflowAnalytics()
        ])

        if (approvalsResult.success) setPendingApprovals(approvalsResult.data || [])
        if (confirmationsResult.success) setPendingConfirmations(confirmationsResult.data || [])
        if (analyticsResult.success) setWorkflowAnalytics(analyticsResult.data || [])
      }
    } catch (error) {
      console.error("Error loading workflow data:", error)
      toast({
        title: "Error",
        description: "Failed to load workflow data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePostSaleConfirmation = async (confirmationData: PostSaleConfirmationData) => {
    setLoading(true)
    try {
      const result = await createPostSaleConfirmation(quotationForConfirmation!.id, {
        client_contact_person: confirmationData.client_contact_person,
        confirmation_method: confirmationData.confirmation_method,
        deliverables_confirmed: confirmationData.deliverables_confirmed,
        event_details_confirmed: confirmationData.event_details_confirmed,
        client_expectations: confirmationData.client_expectations
      })

      if (result.success) {
        toast({
          title: "Post-Sale Confirmation Complete",
          description: "The quotation has been confirmed and documented successfully",
        })
        
        // Close dialog and refresh data
        setPostSaleDialogOpen(false)
        setQuotationForConfirmation(null)
        await loadQuotationsForTab(activeTab)
        await loadWorkflowData()
        setSelectedQuotation(null)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to complete post-sale confirmation",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred during confirmation",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleWorkflowAction = async (quotationId: number, action: string, data?: any) => {
    // Special handling for post-sale confirmation
    if (action === 'confirm_post_sale') {
      const quotation = quotations.find(q => q.id === quotationId)
      if (quotation) {
        setQuotationForConfirmation(quotation)
        setPostSaleDialogOpen(true)
        return
      }
    }

    setLoading(true)
    try {
      let result

      switch (action) {
        case 'submit_for_approval':
          result = await submitQuotationForApproval(quotationId)
          break
        case 'approve':
          result = await approveQuotation(quotationId, data?.comments)
          break
        case 'reject':
          result = await rejectQuotation(quotationId, data?.comments || 'Rejected')
          break
        case 'mark_payment_received':
          result = await markPaymentReceived(quotationId, data?.payment_amount || 0, data?.payment_reference || '')
          break
        default:
          result = { success: false, error: 'Unknown action' }
      }

      if (result.success) {
        toast({
          title: "Success",
          description: `${action.replace('_', ' ')} completed successfully`,
        })
        
        // Reload quotations data to reflect changes
        await loadQuotationsForTab(activeTab)
        await loadWorkflowData()
        
        // Close any open dialogs and refresh
        setSelectedQuotation(null)
      } else {
        toast({
          title: "Error",
          description: result.error || `Failed to ${action.replace('_', ' ')}`,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getWorkflowStatusColor = (status: WorkflowStatus) => {
    const colors = {
      draft: 'gray',
      pending_client_confirmation: 'blue',
      pending_approval: 'yellow',
      approved: 'green',
      payment_received: 'purple',
      confirmed: 'emerald',
      rejected: 'red',
      cancelled: 'slate'
    }
    return colors[status] || 'gray'
  }

  const handleStatusUpdate = async (id: string, status: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired') => {
    try {
      const result = await updateQuotationStatus(id, status)
      if (result.success) {
        toast({
          title: "Status Updated",
          description: `Quotation status changed to ${status}`,
        })
        // Reload current tab data
        await loadQuotationsForTab(activeTab)
        // Refresh status counts
        const countsResult = await getQuotationsCountByStatus()
        if (countsResult.success && countsResult.counts) {
          setStatusCounts(countsResult.counts)
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update status",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this quotation?")) {
      return
    }

    try {
      const result = await deleteQuotation(id)
      if (result.success) {
        toast({
          title: "Quotation Deleted",
          description: "Quotation has been successfully deleted",
        })
        // Reload current tab data
        await loadQuotationsForTab(activeTab)
        // Refresh status counts
        const countsResult = await getQuotationsCountByStatus()
        if (countsResult.success && countsResult.counts) {
          setStatusCounts(countsResult.counts)
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete quotation",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting quotation:", error)
      toast({
        title: "Error",
        description: "Failed to delete quotation",
        variant: "destructive",
      })
    }
  }

  // Direct editing is now blocked - users must edit through tasks

  const getServiceName = (serviceId: number) => {
    const service = services.find(s => s.id === serviceId)
    return service ? service.servicename : `Service ${serviceId}`
  }

  const getServicePrice = (serviceId: number, packageType: string, quantity: number) => {
    const service = services.find(s => s.id === serviceId)
    if (!service) return 0
    const priceKey = `${packageType}_price` as keyof typeof service
    const price = service[priceKey] || 0
    return price * quantity
  }

  const getDeliverableName = (deliverableId: number) => {
    const deliverable = deliverables.find(d => d.id === deliverableId)
    return deliverable ? deliverable.deliverable_name : `Deliverable ${deliverableId}`
  }

  const getDeliverablePrice = (deliverableId: number, packageType: string, quantity: number) => {
    const deliverable = deliverables.find(d => d.id === deliverableId)
    if (!deliverable) return 0
    const priceKey = `${packageType}_total_price` as keyof typeof deliverable
    const price = deliverable[priceKey] || 0
    return price * quantity
  }

  const getStatusColor = (status: string) => {
    // Handle workflow statuses first
    if (['draft', 'pending_client_confirmation', 'pending_approval', 'approved', 'payment_received', 'confirmed', 'rejected', 'cancelled'].includes(status)) {
      const workflowColors: Record<string, string> = {
        'draft': 'bg-gray-100 text-gray-800 border-gray-200',
        'pending_client_confirmation': 'bg-blue-100 text-blue-800 border-blue-200',
        'pending_approval': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'approved': 'bg-green-100 text-green-800 border-green-200',
        'payment_received': 'bg-purple-100 text-purple-800 border-purple-200',
        'confirmed': 'bg-emerald-100 text-emerald-800 border-emerald-200',
        'rejected': 'bg-red-100 text-red-800 border-red-200',
        'cancelled': 'bg-slate-100 text-slate-800 border-slate-200'
      }
      return workflowColors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
    }
    
    // Handle regular statuses
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'sent':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'expired':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const copyShareLink = async (quotation: SavedQuotation) => {
    const shareUrl = `${window.location.origin}/quotation/${quotation.slug}`
    
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast({
        title: "Link Copied!",
        description: "Quotation link has been copied to clipboard. You can now share it with your client.",
      })
    } catch (err) {
      console.error('Failed to copy link:', err)
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = shareUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      
      toast({
        title: "Link Copied!",
        description: "Quotation link has been copied to clipboard.",
      })
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading quotations...</p>
          </div>
        </div>
      </div>
    )
  }

  // Render quotations content (shared across tabs)
  function renderQuotationsContent() {
    const filteredQuotations = quotations.filter(quotation => {
      const matchesSearch = quotation.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           quotation.quotation_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           quotation.bride_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           quotation.groom_name.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === "all" || quotation.status === statusFilter
      
      return matchesSearch && matchesStatus
    })

    return (
      <CardContent>
        {/* Search and Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search quotations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {quotations.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {activeTab === "active" ? "No active quotations" :
               activeTab === "rejected" ? "No rejected quotations" :
               "No quotations yet"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {activeTab === "active" ? "All active quotations will appear here" :
               activeTab === "rejected" ? "Rejected and expired quotations will appear here" :
               "Create your first quotation to get started"}
            </p>
            {activeTab !== "rejected" && (
              <Link href="/sales/quotations/generate">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create {activeTab === "all" ? "First" : "New"} Quotation
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quotation #</TableHead>
                <TableHead>Client Details</TableHead>
                <TableHead>Events</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[140px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuotations.map((quotation) => (
                <TableRow key={quotation.id}>
                  <TableCell className="font-medium">
                    {quotation.quotation_number}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{quotation.client_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {quotation.bride_name} & {quotation.groom_name}
                      </p>
                      <p className="text-sm text-muted-foreground">{quotation.mobile}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{quotation.events_count} event(s)</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline" className="capitalize">
                        {quotation.default_package}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      ₹{(dynamicTotals[quotation.id] ?? quotation.total_amount).toLocaleString()}
                    </span>
                    {dynamicTotals[quotation.id] !== undefined && 
                     Math.abs(dynamicTotals[quotation.id] - quotation.total_amount) > 0.01 && (
                      <div className="text-xs text-muted-foreground">
                        (Stored: ₹{quotation.total_amount.toLocaleString()})
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(quotation.workflow_status || quotation.status)}>
                      {quotation.workflow_status ? 
                        WORKFLOW_STATUS_LABELS[quotation.workflow_status as WorkflowStatus] || quotation.workflow_status :
                        quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)
                      }
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(quotation.created_at), 'MMM dd, yyyy')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => copyShareLink(quotation)}
                        className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                      >
                        <Share className="h-4 w-4 mr-1" />
                        Share
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedQuotation(quotation)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled className="text-gray-400">
                            <Lock className="h-4 w-4 mr-2" />
                            Edit (Use Tasks)
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDelete(quotation.id.toString())}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Quotations</h1>
        <div className="flex gap-2">
          <TestNotificationButton />
          <Button 
            variant={workflowView ? "default" : "outline"}
            onClick={() => setWorkflowView(!workflowView)}
          >
            {workflowView ? (
              <>
                <TableIcon className="h-4 w-4 mr-2" />
                List View
              </>
            ) : (
              <>
                <BarChart3 className="h-4 w-4 mr-2" />
                Workflow View
              </>
            )}
          </Button>
          <Link href="/sales/quotations/analytics">
            <Button variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          </Link>
          <Link href="/sales/quotations/generate">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Quotation
            </Button>
          </Link>
        </div>
      </div>

      {workflowView ? (
        <Card>
          <CardHeader>
            <CardTitle>Quotation Workflow Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <QuotationWorkflowPipeline
              quotations={enhancedQuotations}
              userRole={currentUser?.roleName || 'User'}
              onStatusUpdate={handleWorkflowAction}
              isLoading={loading}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Quotations List</CardTitle>
          </CardHeader>
          {renderQuotationsContent()}
        </Card>
      )}

      {/* Quotation Details Dialog */}
      <Dialog open={!!selectedQuotation} onOpenChange={() => setSelectedQuotation(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Quotation Details - {selectedQuotation?.quotation_number}
                </DialogTitle>
                <DialogDescription>
                  Created on {selectedQuotation && format(new Date(selectedQuotation.created_at), 'PPP')}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    if (selectedQuotation) {
                      const shareUrl = `${window.location.origin}/quotation/${selectedQuotation.slug}`
                      window.open(shareUrl, '_blank')
                    }
                  }}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View Public Page
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => selectedQuotation && copyShareLink(selectedQuotation)}
                  className="text-green-600 hover:text-green-700"
                >
                  <Share className="h-4 w-4 mr-1" />
                  Copy Link
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          {selectedQuotation && (
            <div className="space-y-6">
              {/* Workflow Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Workflow Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Badge 
                      variant="outline" 
                      className={`${
                        WORKFLOW_STATUS_COLORS[convertToEnhancedQuotation(selectedQuotation).workflow_status]
                      }`}
                    >
                      {WORKFLOW_STATUS_LABELS[convertToEnhancedQuotation(selectedQuotation).workflow_status]}
                    </Badge>
                    {currentUser && (
                      <div className="flex gap-2">
                        {getWorkflowPermissions(currentUser.roleName, convertToEnhancedQuotation(selectedQuotation).workflow_status).can_submit_for_approval && (
                          <Button 
                            size="sm"
                            onClick={() => handleWorkflowAction(selectedQuotation.id, 'submit_for_approval')}
                          >
                            Submit for Approval
                          </Button>
                        )}
                        {getWorkflowPermissions(currentUser.roleName, convertToEnhancedQuotation(selectedQuotation).workflow_status).can_approve && (
                          <Button 
                            size="sm"
                            variant="default"
                            onClick={() => handleWorkflowAction(selectedQuotation.id, 'approve')}
                          >
                            <ThumbsUp className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                        )}
                        {getWorkflowPermissions(currentUser.roleName, convertToEnhancedQuotation(selectedQuotation).workflow_status).can_reject && (
                          <Button 
                            size="sm"
                            variant="destructive"
                            onClick={() => handleWorkflowAction(selectedQuotation.id, 'reject')}
                          >
                            <ThumbsDown className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        )}
                        {getWorkflowPermissions(currentUser.roleName, convertToEnhancedQuotation(selectedQuotation).workflow_status).can_mark_payment_received && (
                          <Button 
                            size="sm"
                            variant="default"
                            onClick={() => handleWorkflowAction(selectedQuotation.id, 'mark_payment_received')}
                          >
                            <DollarSign className="h-3 w-3 mr-1" />
                            Mark Paid
                          </Button>
                        )}
                        {getWorkflowPermissions(currentUser.roleName, convertToEnhancedQuotation(selectedQuotation).workflow_status).can_confirm_post_sale && (
                          <Button 
                            size="sm"
                            variant="default"
                            onClick={() => handleWorkflowAction(selectedQuotation.id, 'confirm_post_sale')}
                          >
                            <UserCheck className="h-3 w-3 mr-1" />
                            Confirm
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Client Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Client Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Client Name</Label>
                      <p className="font-medium">{selectedQuotation.client_name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Couple Names</Label>
                      <p className="font-medium">{selectedQuotation.bride_name} & {selectedQuotation.groom_name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Mobile</Label>
                      <p className="font-medium">{selectedQuotation.mobile}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                      <p className="font-medium">{selectedQuotation.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Package & Pricing */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Package & Pricing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Default Package</Label>
                      <Badge variant="outline" className="capitalize mt-1">
                        {selectedQuotation.default_package}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Events Count</Label>
                      <p className="font-medium">{selectedQuotation.events_count} event(s)</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Total Amount</Label>
                      <p className="text-xl font-bold text-green-600">
                        ₹{(dynamicTotals[selectedQuotation.id] ?? selectedQuotation.total_amount).toLocaleString()}
                      </p>
                      {dynamicTotals[selectedQuotation.id] !== undefined && 
                       Math.abs(dynamicTotals[selectedQuotation.id] - selectedQuotation.total_amount) > 0.01 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Stored total: ₹{selectedQuotation.total_amount.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Events Breakdown */}
              {selectedQuotation.quotation_data?.events && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Events Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {selectedQuotation.quotation_data.events.map((event, index) => {
                        const packageType = event.selected_package === "default" ? 
                          selectedQuotation.default_package : 
                          event.selected_package
                        
                        return (
                          <div key={event.id} className="border rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-lg font-semibold">Event {index + 1}: {event.event_name}</h4>
                              <Badge variant="outline" className="capitalize">
                                {packageType} Package
                              </Badge>
                            </div>
                            
                            {/* Event Details */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                              <div>
                                <Label className="text-xs font-medium text-muted-foreground uppercase">Date</Label>
                                <p className="font-medium">{format(new Date(event.event_date), 'PPP')}</p>
                              </div>
                              <div>
                                <Label className="text-xs font-medium text-muted-foreground uppercase">Venue</Label>
                                <p className="font-medium">{event.venue_name}</p>
                              </div>
                              <div>
                                <Label className="text-xs font-medium text-muted-foreground uppercase">Time</Label>
                                <p className="font-medium">{event.start_time} - {event.end_time}</p>
                              </div>
                              <div>
                                <Label className="text-xs font-medium text-muted-foreground uppercase">Expected Crowd</Label>
                                <p className="font-medium">{event.expected_crowd} people</p>
                              </div>
                            </div>

                            {/* Services Section */}
                            {event.selected_services.length > 0 && (
                              <div className="mb-6">
                                <div className="flex items-center gap-2 mb-3">
                                  <Settings className="h-4 w-4 text-blue-600" />
                                  <h5 className="font-semibold text-blue-800">Services ({event.selected_services.length})</h5>
                                </div>
                                <div className="grid gap-3">
                                  {event.selected_services.map((serviceItem) => {
                                    const serviceName = getServiceName(serviceItem.id)
                                    const servicePrice = getServicePrice(serviceItem.id, packageType, serviceItem.quantity)
                                    
                                    return (
                                      <div key={serviceItem.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                                        <div className="flex-1">
                                          <p className="font-medium text-blue-900">{serviceName}</p>
                                          <p className="text-sm text-blue-700">
                                            Quantity: {serviceItem.quantity} | Package: {packageType}
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <p className="font-bold text-blue-900">₹{servicePrice.toLocaleString()}</p>
                                          {serviceItem.quantity > 1 && (
                                            <p className="text-xs text-blue-600">
                                              ₹{(servicePrice / serviceItem.quantity).toLocaleString()} × {serviceItem.quantity}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Deliverables Section */}
                            {event.selected_deliverables.length > 0 && (
                              <div className="mb-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <Package className="h-4 w-4 text-green-600" />
                                  <h5 className="font-semibold text-green-800">Deliverables ({event.selected_deliverables.length})</h5>
                                </div>
                                <div className="grid gap-3">
                                  {event.selected_deliverables.map((deliverableItem) => {
                                    const deliverableName = getDeliverableName(deliverableItem.id)
                                    const deliverablePrice = getDeliverablePrice(deliverableItem.id, packageType, deliverableItem.quantity)
                                    
                                    return (
                                      <div key={deliverableItem.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                                        <div className="flex-1">
                                          <p className="font-medium text-green-900">{deliverableName}</p>
                                          <p className="text-sm text-green-700">
                                            Quantity: {deliverableItem.quantity} | Package: {packageType}
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <p className="font-bold text-green-900">₹{deliverablePrice.toLocaleString()}</p>
                                          {deliverableItem.quantity > 1 && (
                                            <p className="text-xs text-green-600">
                                              ₹{(deliverablePrice / deliverableItem.quantity).toLocaleString()} × {deliverableItem.quantity}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Event Total */}
                            <div className="border-t pt-4 mt-4">
                              <div className="flex justify-between items-center">
                                <span className="font-semibold text-gray-700">Event Total:</span>
                                <span className="text-xl font-bold text-primary">
                                  ₹{(
                                    event.selected_services.reduce((total, serviceItem) => 
                                      total + getServicePrice(serviceItem.id, packageType, serviceItem.quantity), 0) +
                                    event.selected_deliverables.reduce((total, deliverableItem) => 
                                      total + getDeliverablePrice(deliverableItem.id, packageType, deliverableItem.quantity), 0)
                                  ).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Post-Sale Confirmation Dialog */}
      <PostSaleConfirmationDialog
        open={postSaleDialogOpen}
        onOpenChange={setPostSaleDialogOpen}
        quotation={quotationForConfirmation}
        onConfirm={handlePostSaleConfirmation}
        loading={loading}
      />
    </div>
  )
} 