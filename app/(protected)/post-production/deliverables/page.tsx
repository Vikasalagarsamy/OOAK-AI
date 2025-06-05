"use client"

import React, { useState, useEffect } from "react"
import { format } from "date-fns"
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Upload,
  Settings,
  Package,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  PlayCircle,
  ArrowUpRight,
  ArrowDownRight,
  User,
  UserCheck,
  Building,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"

import {
  getDeliverables,
  createDeliverable,
  updateDeliverable,
  deleteDeliverable,
  getServicePackages,
  bulkImportDeliverables,
  getEmployees,
  getDeliverableCategories,
  getDeliverableTypes,
  getDeliverableNames,
  getFilteredDeliverableNames,
} from "@/actions/deliverables-actions"
import type { 
  Deliverable, 
  DeliverableFormData, 
  DeliverableFilters, 
  ServicePackage,
  PackageType
} from "@/types/deliverables"

const CATEGORY_COLORS = {
  Main: "bg-blue-100 text-blue-800",
  Optional: "bg-purple-100 text-purple-800",
}

const TYPE_COLORS = {
  Photo: "bg-green-100 text-green-800",
  Video: "bg-orange-100 text-orange-800",
}

const STATUS_COLORS: Record<number, string> = {
  1: "bg-green-100 text-green-800",
  0: "bg-red-100 text-red-800",
}

const TIMING_ICONS = {
  days: "📅",
  hr: "⏰",
  min: "⏱️",
}

const PACKAGE_COLORS = {
  basic: "bg-gray-100 text-gray-800",
  premium: "bg-yellow-100 text-yellow-800",
  elite: "bg-red-100 text-red-800",
}

export default function DeliverablesPage() {
  const [deliverables, setDeliverables] = useState<Deliverable[]>([])
  const [filteredDeliverables, setFilteredDeliverables] = useState<Deliverable[]>([])
  const [packages, setPackages] = useState<ServicePackage[]>([])
  const [employees, setEmployees] = useState<{ id: number; name: string; department?: string }[]>([])
  const [categories, setCategories] = useState<string[]>(["Main", "Optional"])
  const [types, setTypes] = useState<string[]>(["Photo", "Video"])
  const [availableDeliverableNames, setAvailableDeliverableNames] = useState<{ id: number; name: string; category: string; type: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [packageFilter, setPackageFilter] = useState<string>("all")
  const [selectedDeliverable, setSelectedDeliverable] = useState<Deliverable | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")

  // Form state
  const [formData, setFormData] = useState<DeliverableFormData>({
    deliverable_cat: "Main",
    deliverable_type: "Photo",
    deliverable_id: undefined,
    deliverable_name: "",
    process_name: "",
    has_customer: false,
    has_employee: false,
    has_qc: false,
    has_vendor: false,
    sort_order: 0,
    timing_type: "days",
    skippable: false,
    has_download_option: false,
    has_task_process: true,
    has_upload_folder_path: false,
    process_starts_from: 0,
    status: 1,
    employee: [],
    basic_price: 0,
    premium_price: 0,
    elite_price: 0,
    package_included: {
      basic: false,
      premium: false,
      elite: false,
    },
  })

  // Load deliverables and packages
  useEffect(() => {
    loadDeliverables()
    loadPackages()
    loadEmployees()
    loadCategories()
    loadTypes()
  }, [])

  // Load filtered deliverable names when category or type changes
  useEffect(() => {
    console.log(`🔄 Form data changed - Category: ${formData.deliverable_cat}, Type: ${formData.deliverable_type}`)
    if (formData.deliverable_cat && formData.deliverable_type) {
      console.log(`📞 Calling loadFilteredDeliverableNames with: ${formData.deliverable_cat}, ${formData.deliverable_type}`)
      loadFilteredDeliverableNames(formData.deliverable_cat, formData.deliverable_type)
    } else {
      console.log("⚠️ Category or type is missing, not loading deliverable names")
    }
  }, [formData.deliverable_cat, formData.deliverable_type])

  // Filter deliverables
  useEffect(() => {
    let filtered = deliverables

    // Text search
    if (searchTerm) {
      filtered = filtered.filter(deliverable =>
        deliverable.deliverable_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deliverable.process_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(deliverable => deliverable.deliverable_cat === categoryFilter)
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(deliverable => deliverable.deliverable_type === typeFilter)
    }

    // Package filter
    if (packageFilter !== "all") {
      filtered = filtered.filter(deliverable => 
        deliverable.package_included[packageFilter as PackageType]
      )
    }

    // Tab filter
    if (activeTab !== "all") {
      if (activeTab === "main") {
        filtered = filtered.filter(deliverable => deliverable.deliverable_cat === "Main")
      } else if (activeTab === "optional") {
        filtered = filtered.filter(deliverable => deliverable.deliverable_cat === "Optional")
      } else if (activeTab === "photo") {
        filtered = filtered.filter(deliverable => deliverable.deliverable_type === "Photo")
      } else if (activeTab === "video") {
        filtered = filtered.filter(deliverable => deliverable.deliverable_type === "Video")
      }
    }

    setFilteredDeliverables(filtered)
  }, [deliverables, searchTerm, categoryFilter, typeFilter, packageFilter, activeTab])

  async function loadDeliverables() {
    setLoading(true)
    try {
      const data = await getDeliverables()
      setDeliverables(data)
    } catch (error) {
      console.error("Error loading deliverables:", error)
      toast({
        title: "Error",
        description: "Failed to load deliverables",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function loadPackages() {
    try {
      const data = await getServicePackages()
      setPackages(data)
    } catch (error) {
      console.error("Error loading packages:", error)
    }
  }

  async function loadEmployees() {
    try {
      const data = await getEmployees()
      setEmployees(data)
    } catch (error) {
      console.error("Error loading employees:", error)
    }
  }

  async function loadCategories() {
    try {
      const data = await getDeliverableCategories()
      setCategories(data)
    } catch (error) {
      console.error("Error loading categories:", error)
    }
  }

  async function loadTypes() {
    try {
      const data = await getDeliverableTypes()
      setTypes(data)
    } catch (error) {
      console.error("Error loading types:", error)
    }
  }

  async function loadFilteredDeliverableNames(category: string, type: string) {
    try {
      console.log(`Loading deliverable names for category: ${category}, type: ${type}`)
      const data = await getFilteredDeliverableNames(category, type)
      console.log(`Received ${data.length} deliverable names:`, data)
      setAvailableDeliverableNames(data)
    } catch (error) {
      console.error("Error loading filtered deliverable names:", error)
      setAvailableDeliverableNames([])
      toast({
        title: "Error",
        description: "Failed to load deliverable names. Please ensure the deliverable_master table exists.",
        variant: "destructive",
      })
    }
  }

  function resetForm() {
    setFormData({
      deliverable_cat: "Main",
      deliverable_type: "Photo",
      deliverable_id: undefined,
      deliverable_name: "",
      process_name: "",
      has_customer: false,
      has_employee: false,
      has_qc: false,
      has_vendor: false,
      sort_order: 0,
      timing_type: "days",
      skippable: false,
      has_download_option: false,
      has_task_process: true,
      has_upload_folder_path: false,
      process_starts_from: 0,
      status: 1,
      employee: [],
      basic_price: 0,
      premium_price: 0,
      elite_price: 0,
      package_included: {
        basic: false,
        premium: false,
        elite: false,
      },
    })
    setAvailableDeliverableNames([])
  }

  async function handleCreate() {
    if (!formData.deliverable_id || !formData.deliverable_name.trim() || !formData.process_name.trim()) {
      toast({
        title: "Error",
        description: "Category, type, deliverable name, and process name are required",
        variant: "destructive",
      })
      return
    }

    try {
      const result = await createDeliverable(formData)
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        setIsCreateDialogOpen(false)
        resetForm()
        loadDeliverables()
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating deliverable:", error)
      toast({
        title: "Error",
        description: "Failed to create deliverable",
        variant: "destructive",
      })
    }
  }

  async function handleEdit() {
    if (!selectedDeliverable || !formData.deliverable_id || !formData.deliverable_name.trim() || !formData.process_name.trim()) {
      toast({
        title: "Error",
        description: "Category, type, deliverable name, and process name are required",
        variant: "destructive",
      })
      return
    }

    try {
      const result = await updateDeliverable(selectedDeliverable.id, formData)
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        setIsEditDialogOpen(false)
        setSelectedDeliverable(null)
        resetForm()
        loadDeliverables()
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating deliverable:", error)
      toast({
        title: "Error",
        description: "Failed to update deliverable",
        variant: "destructive",
      })
    }
  }

  async function handleDelete() {
    if (!selectedDeliverable) return

    try {
      const result = await deleteDeliverable(selectedDeliverable.id)
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        setIsDeleteDialogOpen(false)
        setSelectedDeliverable(null)
        loadDeliverables()
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting deliverable:", error)
      toast({
        title: "Error",
        description: "Failed to delete deliverable",
        variant: "destructive",
      })
    }
  }

  function openEditDialog(deliverable: Deliverable) {
    setSelectedDeliverable(deliverable)
    const formDataToSet = {
      deliverable_cat: deliverable.deliverable_cat,
      deliverable_type: deliverable.deliverable_type,
      deliverable_id: deliverable.deliverable_id,
      deliverable_name: deliverable.deliverable_name,
      process_name: deliverable.process_name,
      has_customer: deliverable.has_customer,
      has_employee: deliverable.has_employee,
      has_qc: deliverable.has_qc,
      has_vendor: deliverable.has_vendor,
      link: deliverable.link,
      sort_order: deliverable.sort_order,
      timing_type: deliverable.timing_type,
      tat: deliverable.tat,
      tat_value: deliverable.tat_value,
      buffer: deliverable.buffer,
      skippable: deliverable.skippable,
      employee: deliverable.employee,
      has_download_option: deliverable.has_download_option,
      has_task_process: deliverable.has_task_process,
      has_upload_folder_path: deliverable.has_upload_folder_path,
      process_starts_from: deliverable.process_starts_from,
      status: deliverable.status,
      basic_price: deliverable.basic_price || 0,
      premium_price: deliverable.premium_price || 0,
      elite_price: deliverable.elite_price || 0,
      on_start_template: deliverable.on_start_template,
      on_complete_template: deliverable.on_complete_template,
      on_correction_template: deliverable.on_correction_template,
      input_names: deliverable.input_names,
      stream: deliverable.stream,
      stage: deliverable.stage,
      package_included: deliverable.package_included,
    }
    
    setFormData(formDataToSet)
    
    // Load filtered deliverable names for the current category and type
    if (deliverable.deliverable_cat && deliverable.deliverable_type) {
      loadFilteredDeliverableNames(deliverable.deliverable_cat, deliverable.deliverable_type)
    }
    
    setIsEditDialogOpen(true)
  }

  function openCreateDialog() {
    resetForm()
    // Load initial filtered deliverable names for default category/type
    console.log("Opening create dialog, loading deliverable names for Main/Photo")
    loadFilteredDeliverableNames("Main", "Photo")
    setIsCreateDialogOpen(true)
  }

  function openDeleteDialog(deliverable: Deliverable) {
    setSelectedDeliverable(deliverable)
    setIsDeleteDialogOpen(true)
  }

  const getStats = () => {
    const total = deliverables.length
    const main = deliverables.filter(d => d.deliverable_cat === "Main").length
    const optional = deliverables.filter(d => d.deliverable_cat === "Optional").length
    const photo = deliverables.filter(d => d.deliverable_type === "Photo").length
    const video = deliverables.filter(d => d.deliverable_type === "Video").length
    const active = deliverables.filter(d => d.status === 1).length

    return { total, main, optional, photo, video, active }
  }

  const stats = getStats()

  const getStakeholderIcons = (deliverable: Deliverable) => {
    const icons = []
    if (deliverable.has_customer) icons.push(<User key="customer" className="h-3 w-3 text-blue-600" />)
    if (deliverable.has_employee) icons.push(<Users key="employee" className="h-3 w-3 text-green-600" />)
    if (deliverable.has_qc) icons.push(<CheckCircle key="qc" className="h-3 w-3 text-purple-600" />)
    if (deliverable.has_vendor) icons.push(<Building key="vendor" className="h-3 w-3 text-orange-600" />)
    return icons
  }

  // Debug: Log available deliverable names when they change
  useEffect(() => {
    console.log("Available deliverable names updated:", availableDeliverableNames)
  }, [availableDeliverableNames])

  // Debug function to test the API directly
  async function testDeliverableMasterAPI() {
    try {
      console.log("🔍 Testing deliverable master API...")
      
      // Test the direct function
      const { getDeliverableMasterByCategoryAndType } = await import("@/actions/deliverable-master-actions")
      const result = await getDeliverableMasterByCategoryAndType("Optional", "Photo")
      
      console.log("✅ Direct API call result:", result)
      toast({
        title: "API Test Result",
        description: `Found ${result.length} deliverables. Check console for details.`,
      })
    } catch (error) {
      console.error("❌ API test failed:", error)
      toast({
        title: "API Test Failed", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Post Production Deliverables</h1>
          <p className="text-muted-foreground">Manage workflow processes and package deliverables</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={testDeliverableMasterAPI}>
            🔍 Test API
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Deliverable
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Main</CardTitle>
            <PlayCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.main}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Optional</CardTitle>
            <Package className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.optional}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Photo</CardTitle>
            <span className="text-lg">📸</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.photo}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Video</CardTitle>
            <span className="text-lg">🎥</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.video}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search deliverables..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Main">Main</SelectItem>
            <SelectItem value="Optional">Optional</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Photo">📸 Photo</SelectItem>
            <SelectItem value="Video">🎥 Video</SelectItem>
          </SelectContent>
        </Select>
        <Select value={packageFilter} onValueChange={setPackageFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Package" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Packages</SelectItem>
            <SelectItem value="basic">Basic</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
            <SelectItem value="elite">Elite</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
          <TabsTrigger value="main">Main ({stats.main})</TabsTrigger>
          <TabsTrigger value="optional">Optional ({stats.optional})</TabsTrigger>
          <TabsTrigger value="photo">Photo ({stats.photo})</TabsTrigger>
          <TabsTrigger value="video">Video ({stats.video})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Deliverables ({filteredDeliverables.length})</CardTitle>
              <CardDescription>
                Manage post-production workflow processes and deliverables
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading deliverables...</p>
                  </div>
                </div>
              ) : filteredDeliverables.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No deliverables found</h3>
                  <p className="text-muted-foreground mb-4">
                    {deliverables.length === 0 
                      ? "Get started by adding your first deliverable process."
                      : "Try adjusting your search or filters."}
                  </p>
                  {deliverables.length === 0 && (
                    <Button onClick={openCreateDialog}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Deliverable
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Deliverable</TableHead>
                      <TableHead>Process</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Stakeholders</TableHead>
                      <TableHead>Timing</TableHead>
                      <TableHead>Packages</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDeliverables.map((deliverable) => (
                      <TableRow key={deliverable.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{deliverable.deliverable_name}</div>
                            {deliverable.deliverable_id && (
                              <div className="text-sm text-muted-foreground">ID: {deliverable.deliverable_id}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{deliverable.process_name}</div>
                          {deliverable.stream && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              {deliverable.stream === "UP" ? (
                                <ArrowUpRight className="h-3 w-3 mr-1" />
                              ) : (
                                <ArrowDownRight className="h-3 w-3 mr-1" />
                              )}
                              {deliverable.stream} {deliverable.stage}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={CATEGORY_COLORS[deliverable.deliverable_cat]}>
                            {deliverable.deliverable_cat}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={TYPE_COLORS[deliverable.deliverable_type]}>
                            {deliverable.deliverable_type === "Photo" ? "📸" : "🎥"} {deliverable.deliverable_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            {getStakeholderIcons(deliverable)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {deliverable.tat && (
                            <div className="flex items-center">
                              <span className="mr-1">{TIMING_ICONS[deliverable.timing_type]}</span>
                              {deliverable.tat} {deliverable.timing_type}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(deliverable.package_included).map(([pkg, included]) => 
                              included && (
                                <Badge key={pkg} className={PACKAGE_COLORS[pkg as PackageType]} variant="outline">
                                  {pkg}
                                </Badge>
                              )
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={STATUS_COLORS[deliverable.status]}>
                            {deliverable.status === 1 ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Settings className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openEditDialog(deliverable)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openDeleteDialog(deliverable)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Deliverable Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Deliverable</DialogTitle>
            <DialogDescription>
              Create a new post-production deliverable process. Select category and type first to see available deliverable names.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* First Row: Category and Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="deliverable_cat">Category *</Label>
                <Select 
                  value={formData.deliverable_cat} 
                  onValueChange={(value) => setFormData({ ...formData, deliverable_cat: value as "Main" | "Optional", deliverable_id: undefined, deliverable_name: "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="deliverable_type">Type *</Label>
                <Select 
                  value={formData.deliverable_type} 
                  onValueChange={(value) => setFormData({ ...formData, deliverable_type: value as "Photo" | "Video", deliverable_id: undefined, deliverable_name: "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {types.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type === "Photo" ? "📸" : "🎥"} {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Second Row: Deliverable Name and Process Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="deliverable_name">Deliverable Name *</Label>
                <Select 
                  value={formData.deliverable_id?.toString() || ""} 
                  onValueChange={(value) => {
                    const selectedDeliverable = availableDeliverableNames.find(d => d.id.toString() === value)
                    if (selectedDeliverable) {
                      setFormData({ 
                        ...formData, 
                        deliverable_id: selectedDeliverable.id,
                        deliverable_name: selectedDeliverable.name
                      })
                    }
                  }}
                  disabled={availableDeliverableNames.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      availableDeliverableNames.length > 0 
                        ? "Select deliverable name" 
                        : formData.deliverable_cat && formData.deliverable_type 
                          ? "No deliverables found - Run SQL script to create deliverable_master table"
                          : "Select category and type first"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDeliverableNames.length > 0 ? (
                      availableDeliverableNames.map((deliverable) => (
                        <SelectItem key={deliverable.id} value={deliverable.id.toString()}>
                          {deliverable.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1 text-sm text-muted-foreground">
                        {formData.deliverable_cat && formData.deliverable_type 
                          ? "No deliverables found. Please run the deliverable_master table creation script in Supabase SQL Editor."
                          : "Select category and type first"
                        }
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="process_name">Process Name *</Label>
                <Input
                  id="process_name"
                  value={formData.process_name}
                  onChange={(e) => setFormData({ ...formData, process_name: e.target.value })}
                  placeholder="Enter process name"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="tat">TAT</Label>
                <Input
                  id="tat"
                  type="number"
                  value={formData.tat || ""}
                  onChange={(e) => setFormData({ ...formData, tat: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="timing_type">Timing Type</Label>
                <Select value={formData.timing_type} onValueChange={(value) => setFormData({ ...formData, timing_type: value as "days" | "hr" | "min" })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="days">📅 Days</SelectItem>
                    <SelectItem value="hr">⏰ Hours</SelectItem>
                    <SelectItem value="min">⏱️ Minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Stakeholders */}
            <div>
              <Label className="text-sm font-medium">Stakeholders</Label>
              <div className="flex space-x-6 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has_customer"
                    checked={formData.has_customer}
                    onCheckedChange={(checked) => setFormData({ ...formData, has_customer: !!checked })}
                  />
                  <Label htmlFor="has_customer" className="text-sm">👤 Customer</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has_employee"
                    checked={formData.has_employee}
                    onCheckedChange={(checked) => setFormData({ ...formData, has_employee: !!checked })}
                  />
                  <Label htmlFor="has_employee" className="text-sm">👥 Employee</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has_qc"
                    checked={formData.has_qc}
                    onCheckedChange={(checked) => setFormData({ ...formData, has_qc: !!checked })}
                  />
                  <Label htmlFor="has_qc" className="text-sm">✅ QC</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has_vendor"
                    checked={formData.has_vendor}
                    onCheckedChange={(checked) => setFormData({ ...formData, has_vendor: !!checked })}
                  />
                  <Label htmlFor="has_vendor" className="text-sm">🏢 Vendor</Label>
                </div>
              </div>
              
              {/* Employee Selection - Show when Employee stakeholder is checked */}
              {formData.has_employee && (
                <div className="mt-4">
                  <Label className="text-sm font-medium">Assign Employees</Label>
                  <div className="mt-2 max-h-32 overflow-y-auto border rounded-md p-2">
                    {employees.length > 0 ? (
                      employees.map((employee) => (
                        <div key={employee.id} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            id={`employee-${employee.id}`}
                            checked={formData.employee?.includes(employee.id) || false}
                            onCheckedChange={(checked) => {
                              const currentEmployees = formData.employee || []
                              if (checked) {
                                setFormData({
                                  ...formData,
                                  employee: [...currentEmployees, employee.id]
                                })
                              } else {
                                setFormData({
                                  ...formData,
                                  employee: currentEmployees.filter(id => id !== employee.id)
                                })
                              }
                            }}
                          />
                          <Label htmlFor={`employee-${employee.id}`} className="text-sm cursor-pointer">
                            {employee.name}
                            {employee.department && (
                              <span className="text-muted-foreground ml-1">({employee.department})</span>
                            )}
                          </Label>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No employees available</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Package Inclusion */}
            <div>
              <Label className="text-sm font-medium">Include in Packages</Label>
              <div className="flex space-x-6 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="basic_package"
                    checked={formData.package_included.basic}
                    onCheckedChange={(checked) => 
                      setFormData({
                        ...formData,
                        package_included: {
                          ...formData.package_included,
                          basic: !!checked
                        }
                      })
                    }
                  />
                  <Label htmlFor="basic_package" className="text-sm">Basic</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="premium_package"
                    checked={formData.package_included.premium}
                    onCheckedChange={(checked) => 
                      setFormData({
                        ...formData,
                        package_included: {
                          ...formData.package_included,
                          premium: !!checked
                        }
                      })
                    }
                  />
                  <Label htmlFor="premium_package" className="text-sm">Premium</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="elite_package"
                    checked={formData.package_included.elite}
                    onCheckedChange={(checked) => 
                      setFormData({
                        ...formData,
                        package_included: {
                          ...formData.package_included,
                          elite: !!checked
                        }
                      })
                    }
                  />
                  <Label htmlFor="elite_package" className="text-sm">Elite</Label>
                </div>
              </div>
            </div>

            {/* Process Options */}
            <div>
              <Label className="text-sm font-medium">Process Options</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="skippable"
                    checked={formData.skippable}
                    onCheckedChange={(checked) => setFormData({ ...formData, skippable: !!checked })}
                  />
                  <Label htmlFor="skippable" className="text-sm">Skippable *</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has_download_option"
                    checked={formData.has_download_option}
                    onCheckedChange={(checked) => setFormData({ ...formData, has_download_option: !!checked })}
                  />
                  <Label htmlFor="has_download_option" className="text-sm">Has File Download Option *</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has_task_process"
                    checked={formData.has_task_process}
                    onCheckedChange={(checked) => setFormData({ ...formData, has_task_process: !!checked })}
                  />
                  <Label htmlFor="has_task_process" className="text-sm">Has Task Process Option *</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has_upload_folder_path"
                    checked={formData.has_upload_folder_path}
                    onCheckedChange={(checked) => setFormData({ ...formData, has_upload_folder_path: !!checked })}
                  />
                  <Label htmlFor="has_upload_folder_path" className="text-sm">Has Upload Folder Path Option *</Label>
                </div>
              </div>
            </div>

            {/* Template Configuration */}
            <div>
              <Label className="text-sm font-medium">Template Configuration</Label>
              <div className="grid grid-cols-1 gap-4 mt-2">
                <div>
                  <Label htmlFor="on_start_template">Interact Template Name On Start</Label>
                  <Input
                    id="on_start_template"
                    value={formData.on_start_template || ""}
                    onChange={(e) => setFormData({ ...formData, on_start_template: e.target.value })}
                    placeholder="Enter template name for process start"
                  />
                </div>
                <div>
                  <Label htmlFor="on_complete_template">Interact Template Name On Complete</Label>
                  <Input
                    id="on_complete_template"
                    value={formData.on_complete_template || ""}
                    onChange={(e) => setFormData({ ...formData, on_complete_template: e.target.value })}
                    placeholder="Enter template name for process completion"
                  />
                </div>
              </div>
            </div>

            {/* Process Pricing */}
            <div>
              <Label className="text-sm font-medium">Process Pricing</Label>
              <p className="text-xs text-muted-foreground mb-3">
                Set individual process prices for each package tier. Total deliverable cost will be calculated by summing all process prices.
              </p>
              <div className="grid grid-cols-3 gap-4 mt-2">
                <div>
                  <Label htmlFor="basic_price">Basic Process Price</Label>
                  <Input
                    id="basic_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.basic_price || ""}
                    onChange={(e) => setFormData({ ...formData, basic_price: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="premium_price">Premium Process Price</Label>
                  <Input
                    id="premium_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.premium_price || ""}
                    onChange={(e) => setFormData({ ...formData, premium_price: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="elite_price">Elite Process Price</Label>
                  <Input
                    id="elite_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.elite_price || ""}
                    onChange={(e) => setFormData({ ...formData, elite_price: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create Deliverable</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Deliverable Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Deliverable</DialogTitle>
            <DialogDescription>
              Update the deliverable process information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* First Row: Category and Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-deliverable_cat">Category *</Label>
                <Select 
                  value={formData.deliverable_cat} 
                  onValueChange={(value) => setFormData({ ...formData, deliverable_cat: value as "Main" | "Optional", deliverable_id: undefined, deliverable_name: "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-deliverable_type">Type *</Label>
                <Select 
                  value={formData.deliverable_type} 
                  onValueChange={(value) => setFormData({ ...formData, deliverable_type: value as "Photo" | "Video", deliverable_id: undefined, deliverable_name: "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {types.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type === "Photo" ? "📸" : "🎥"} {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Second Row: Deliverable Name and Process Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-deliverable_name">Deliverable Name *</Label>
                <Select 
                  value={formData.deliverable_id?.toString() || ""} 
                  onValueChange={(value) => {
                    const selectedDeliverable = availableDeliverableNames.find(d => d.id.toString() === value)
                    if (selectedDeliverable) {
                      setFormData({ 
                        ...formData, 
                        deliverable_id: selectedDeliverable.id,
                        deliverable_name: selectedDeliverable.name
                      })
                    }
                  }}
                  disabled={availableDeliverableNames.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      availableDeliverableNames.length > 0 
                        ? "Select deliverable name" 
                        : formData.deliverable_cat && formData.deliverable_type 
                          ? "No deliverables found - Run SQL script to create deliverable_master table"
                          : "Select category and type first"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDeliverableNames.length > 0 ? (
                      availableDeliverableNames.map((deliverable) => (
                        <SelectItem key={deliverable.id} value={deliverable.id.toString()}>
                          {deliverable.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1 text-sm text-muted-foreground">
                        {formData.deliverable_cat && formData.deliverable_type 
                          ? "No deliverables found. Please run the deliverable_master table creation script in Supabase SQL Editor."
                          : "Select category and type first"
                        }
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="process_name">Process Name *</Label>
                <Input
                  id="process_name"
                  value={formData.process_name}
                  onChange={(e) => setFormData({ ...formData, process_name: e.target.value })}
                  placeholder="Enter process name"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-tat">TAT</Label>
                <Input
                  id="edit-tat"
                  type="number"
                  value={formData.tat || ""}
                  onChange={(e) => setFormData({ ...formData, tat: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
              <div>
                <Label htmlFor="edit-timing_type">Timing Type</Label>
                <Select value={formData.timing_type} onValueChange={(value) => setFormData({ ...formData, timing_type: value as "days" | "hr" | "min" })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="days">📅 Days</SelectItem>
                    <SelectItem value="hr">⏰ Hours</SelectItem>
                    <SelectItem value="min">⏱️ Minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-sort_order">Sort Order</Label>
                <Input
                  id="edit-sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
                />
              </div>
            </div>

            {/* Stakeholders */}
            <div>
              <Label className="text-sm font-medium">Stakeholders</Label>
              <div className="flex space-x-6 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-has_customer"
                    checked={formData.has_customer}
                    onCheckedChange={(checked) => setFormData({ ...formData, has_customer: !!checked })}
                  />
                  <Label htmlFor="edit-has_customer" className="text-sm">👤 Customer</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-has_employee"
                    checked={formData.has_employee}
                    onCheckedChange={(checked) => setFormData({ ...formData, has_employee: !!checked })}
                  />
                  <Label htmlFor="edit-has_employee" className="text-sm">👥 Employee</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-has_qc"
                    checked={formData.has_qc}
                    onCheckedChange={(checked) => setFormData({ ...formData, has_qc: !!checked })}
                  />
                  <Label htmlFor="edit-has_qc" className="text-sm">✅ QC</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-has_vendor"
                    checked={formData.has_vendor}
                    onCheckedChange={(checked) => setFormData({ ...formData, has_vendor: !!checked })}
                  />
                  <Label htmlFor="edit-has_vendor" className="text-sm">🏢 Vendor</Label>
                </div>
              </div>
              
              {/* Employee Selection - Show when Employee stakeholder is checked */}
              {formData.has_employee && (
                <div className="mt-4">
                  <Label className="text-sm font-medium">Assign Employees</Label>
                  <div className="mt-2 max-h-32 overflow-y-auto border rounded-md p-2">
                    {employees.length > 0 ? (
                      employees.map((employee) => (
                        <div key={employee.id} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            id={`edit-employee-${employee.id}`}
                            checked={formData.employee?.includes(employee.id) || false}
                            onCheckedChange={(checked) => {
                              const currentEmployees = formData.employee || []
                              if (checked) {
                                setFormData({
                                  ...formData,
                                  employee: [...currentEmployees, employee.id]
                                })
                              } else {
                                setFormData({
                                  ...formData,
                                  employee: currentEmployees.filter(id => id !== employee.id)
                                })
                              }
                            }}
                          />
                          <Label htmlFor={`edit-employee-${employee.id}`} className="text-sm cursor-pointer">
                            {employee.name}
                            {employee.department && (
                              <span className="text-muted-foreground ml-1">({employee.department})</span>
                            )}
                          </Label>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No employees available</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Package Inclusion */}
            <div>
              <Label className="text-sm font-medium">Include in Packages</Label>
              <div className="flex space-x-6 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-basic_package"
                    checked={formData.package_included.basic}
                    onCheckedChange={(checked) => 
                      setFormData({
                        ...formData,
                        package_included: {
                          ...formData.package_included,
                          basic: !!checked
                        }
                      })
                    }
                  />
                  <Label htmlFor="edit-basic_package" className="text-sm">Basic</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-premium_package"
                    checked={formData.package_included.premium}
                    onCheckedChange={(checked) => 
                      setFormData({
                        ...formData,
                        package_included: {
                          ...formData.package_included,
                          premium: !!checked
                        }
                      })
                    }
                  />
                  <Label htmlFor="edit-premium_package" className="text-sm">Premium</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-elite_package"
                    checked={formData.package_included.elite}
                    onCheckedChange={(checked) => 
                      setFormData({
                        ...formData,
                        package_included: {
                          ...formData.package_included,
                          elite: !!checked
                        }
                      })
                    }
                  />
                  <Label htmlFor="edit-elite_package" className="text-sm">Elite</Label>
                </div>
              </div>
            </div>

            {/* Process Options */}
            <div>
              <Label className="text-sm font-medium">Process Options</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-skippable"
                    checked={formData.skippable}
                    onCheckedChange={(checked) => setFormData({ ...formData, skippable: !!checked })}
                  />
                  <Label htmlFor="edit-skippable" className="text-sm">Skippable *</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-has_download_option"
                    checked={formData.has_download_option}
                    onCheckedChange={(checked) => setFormData({ ...formData, has_download_option: !!checked })}
                  />
                  <Label htmlFor="edit-has_download_option" className="text-sm">Has File Download Option *</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-has_task_process"
                    checked={formData.has_task_process}
                    onCheckedChange={(checked) => setFormData({ ...formData, has_task_process: !!checked })}
                  />
                  <Label htmlFor="edit-has_task_process" className="text-sm">Has Task Process Option *</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-has_upload_folder_path"
                    checked={formData.has_upload_folder_path}
                    onCheckedChange={(checked) => setFormData({ ...formData, has_upload_folder_path: !!checked })}
                  />
                  <Label htmlFor="edit-has_upload_folder_path" className="text-sm">Has Upload Folder Path Option *</Label>
                </div>
              </div>
            </div>

            {/* Template Configuration */}
            <div>
              <Label className="text-sm font-medium">Template Configuration</Label>
              <div className="grid grid-cols-1 gap-4 mt-2">
                <div>
                  <Label htmlFor="edit-on_start_template">Interact Template Name On Start</Label>
                  <Input
                    id="edit-on_start_template"
                    value={formData.on_start_template || ""}
                    onChange={(e) => setFormData({ ...formData, on_start_template: e.target.value })}
                    placeholder="Enter template name for process start"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-on_complete_template">Interact Template Name On Complete</Label>
                  <Input
                    id="edit-on_complete_template"
                    value={formData.on_complete_template || ""}
                    onChange={(e) => setFormData({ ...formData, on_complete_template: e.target.value })}
                    placeholder="Enter template name for process completion"
                  />
                </div>
              </div>
            </div>

            {/* Process Pricing */}
            <div>
              <Label className="text-sm font-medium">Process Pricing</Label>
              <p className="text-xs text-muted-foreground mb-3">
                Set individual process prices for each package tier. Total deliverable cost will be calculated by summing all process prices.
              </p>
              <div className="grid grid-cols-3 gap-4 mt-2">
                <div>
                  <Label htmlFor="edit-basic_price">Basic Process Price</Label>
                  <Input
                    id="edit-basic_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.basic_price || ""}
                    onChange={(e) => setFormData({ ...formData, basic_price: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-premium_price">Premium Process Price</Label>
                  <Input
                    id="edit-premium_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.premium_price || ""}
                    onChange={(e) => setFormData({ ...formData, premium_price: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-elite_price">Elite Process Price</Label>
                  <Input
                    id="edit-elite_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.elite_price || ""}
                    onChange={(e) => setFormData({ ...formData, elite_price: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { 
              setIsEditDialogOpen(false); 
              setSelectedDeliverable(null); 
              resetForm(); 
            }}>
              Cancel
            </Button>
            <Button onClick={handleEdit}>Update Deliverable</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Deliverable</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedDeliverable?.deliverable_name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDeleteDialogOpen(false); setSelectedDeliverable(null); }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 