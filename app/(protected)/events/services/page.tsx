"use client"

import React, { useState, useEffect } from "react"
import { format } from "date-fns"
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Download,
  Upload,
  Eye,
  Settings,
  Package,
  Star,
  DollarSign,
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
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Checkbox } from "@/components/ui/checkbox"

import {
  getServices,
  createService,
  updateService,
  deleteService,
  bulkImportServices,
  getServicesWithPackages,
} from "@/actions/services-actions"
import type { Service, ServiceFormData, ServiceFilters, ServiceWithPackages } from "@/types/services"
import { SERVICE_CATEGORIES } from "@/types/services"

const STATUS_COLORS = {
  Active: "bg-green-100 text-green-800",
  Inactive: "bg-yellow-100 text-yellow-800",
  Discontinued: "bg-red-100 text-red-800",
}

const CATEGORY_ICONS = {
  Photography: "📸",
  Videography: "🎥",
  Equipment: "⚙️",
  Staffing: "👥",
  Technology: "💻",
  Lighting: "💡",
  Other: "📦",
}

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceWithPackages[]>([])
  const [filteredServices, setFilteredServices] = useState<ServiceWithPackages[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [selectedService, setSelectedService] = useState<ServiceWithPackages | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")

  // Enhanced form state with package pricing
  const [formData, setFormData] = useState<ServiceFormData & {
    basic_price?: number
    premium_price?: number
    elite_price?: number
    package_included?: {
      basic: boolean
      premium: boolean
      elite: boolean
    }
  }>({
    servicename: "",
    status: "Active",
    description: "",
    category: "",
    price: undefined,
    unit: "",
    basic_price: undefined,
    premium_price: undefined,
    elite_price: undefined,
    package_included: {
      basic: false,
      premium: false,
      elite: false,
    },
  })

  // Load services with package pricing
  useEffect(() => {
    loadServices()
  }, [])

  // Filter services
  useEffect(() => {
    let filtered = services

    // Text search
    if (searchTerm) {
      filtered = filtered.filter(service =>
        service.servicename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(service => service.status === statusFilter)
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(service => service.category === categoryFilter)
    }

    // Tab filter
    if (activeTab !== "all") {
      filtered = filtered.filter(service => service.status === activeTab)
    }

    setFilteredServices(filtered)
  }, [services, searchTerm, statusFilter, categoryFilter, activeTab])

  async function loadServices() {
    setLoading(true)
    try {
      const data = await getServicesWithPackages()
      setServices(data)
    } catch (error) {
      console.error("Error loading services:", error)
      toast({
        title: "Error",
        description: "Failed to load services",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setFormData({
      servicename: "",
      status: "Active",
      description: "",
      category: "",
      price: undefined,
      unit: "",
      basic_price: undefined,
      premium_price: undefined,
      elite_price: undefined,
      package_included: {
        basic: false,
        premium: false,
        elite: false,
      },
    })
  }

  async function handleCreate() {
    if (!formData.servicename.trim()) {
      toast({
        title: "Error",
        description: "Service name is required",
        variant: "destructive",
      })
      return
    }

    try {
      const result = await createService(formData)
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        setIsCreateDialogOpen(false)
        resetForm()
        loadServices()
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating service:", error)
      toast({
        title: "Error",
        description: "Failed to create service",
        variant: "destructive",
      })
    }
  }

  async function handleEdit() {
    if (!selectedService || !formData.servicename.trim()) {
      return
    }

    try {
      const result = await updateService(selectedService.id, formData)
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        setIsEditDialogOpen(false)
        setSelectedService(null)
        resetForm()
        loadServices()
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating service:", error)
      toast({
        title: "Error",
        description: "Failed to update service",
        variant: "destructive",
      })
    }
  }

  async function handleDelete() {
    if (!selectedService) return

    try {
      const result = await deleteService(selectedService.id)
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        setIsDeleteDialogOpen(false)
        setSelectedService(null)
        loadServices()
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting service:", error)
      toast({
        title: "Error",
        description: "Failed to delete service",
        variant: "destructive",
      })
    }
  }

  function openEditDialog(service: ServiceWithPackages) {
    setSelectedService(service)
    setFormData({
      servicename: service.servicename,
      status: service.status,
      description: service.description || "",
      category: service.category || "",
      price: service.price || undefined,
      unit: service.unit || "",
      basic_price: service.basic_price || undefined,
      premium_price: service.premium_price || undefined,
      elite_price: service.elite_price || undefined,
      package_included: service.package_included || {
        basic: false,
        premium: false,
        elite: false,
      },
    })
    setIsEditDialogOpen(true)
  }

  function openDeleteDialog(service: ServiceWithPackages) {
    setSelectedService(service)
    setIsDeleteDialogOpen(true)
  }

  // Sample import data from the screenshots
  const sampleImportData = [
    { servicename: "CANDID PHOTOGRAPHY", category: "Photography" },
    { servicename: "CONVENTIONAL PHOTOGRAPHY", category: "Photography" },
    { servicename: "CANDID VIDEOGRAPHY", category: "Videography" },
    { servicename: "CONVENTIONAL VIDEOGRAPHY", category: "Videography" },
    { servicename: "HELICAM / DRONE", category: "Technology" },
    { servicename: "LIVE STREAMING", category: "Technology" },
    { servicename: "LED TV - 49 INCH", category: "Equipment" },
    { servicename: "LED WALL - 8 FT X 6 FT", category: "Lighting" },
    { servicename: "LED WALL - 12 FT X 8 FT", category: "Lighting" },
    { servicename: "LED TV - 55 INCH", category: "Equipment" },
    { servicename: "MIXING UNIT", category: "Equipment" },
    { servicename: "CRANE", category: "Equipment" },
    { servicename: "360 DEGREE VR", category: "Technology" },
    { servicename: "PHOTO BOOTH", category: "Equipment" },
    { servicename: "IN-HOUSE SUPERVISOR", category: "Staffing" },
    { servicename: "DATA MANAGER", category: "Staffing" },
    { servicename: "PHOTOGRAPHY ASSISTANT", category: "Staffing" },
    { servicename: "CINEMATOGRAPHY ASSISTANT", category: "Staffing" },
    { servicename: "FREELANCER SUPERVISOR", category: "Staffing" },
    { servicename: "EQUIPMENT RENTAL", category: "Other" },
    { servicename: "360 DEGREE SPIN VIDEO", category: "Technology" },
  ]

  async function handleSampleImport() {
    try {
      const result = await bulkImportServices(sampleImportData)
      if (result.success) {
        toast({
          title: "Success",
          description: `${result.message}. Imported ${result.imported} services.`,
        })
        setIsImportDialogOpen(false)
        loadServices()
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error importing services:", error)
      toast({
        title: "Error",
        description: "Failed to import services",
        variant: "destructive",
      })
    }
  }

  const getStats = () => {
    const total = services.length
    const active = services.filter(s => s.status === "Active").length
    const inactive = services.filter(s => s.status === "Inactive").length
    const categories = new Set(services.map(s => s.category).filter(Boolean)).size

    return { total, active, inactive, categories }
  }

  const stats = getStats()

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Event Services</h1>
          <p className="text-muted-foreground">Manage your event services catalog</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import Data
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Service
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Services</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Services</CardTitle>
            <Star className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Services</CardTitle>
            <Settings className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.inactive}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.categories}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {SERVICE_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {CATEGORY_ICONS[category]} {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({services.length})</TabsTrigger>
          <TabsTrigger value="Active">Active ({stats.active})</TabsTrigger>
          <TabsTrigger value="Inactive">Inactive ({stats.inactive})</TabsTrigger>
          <TabsTrigger value="Discontinued">
            Discontinued ({services.filter(s => s.status === "Discontinued").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Services ({filteredServices.length})</CardTitle>
              <CardDescription>
                Manage your event services catalog
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading services...</p>
                  </div>
                </div>
              ) : filteredServices.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
                  <p className="text-muted-foreground mb-4">
                    {services.length === 0 
                      ? "Get started by adding your first service or importing existing data."
                      : "Try adjusting your search or filters."}
                  </p>
                  {services.length === 0 && (
                    <div className="flex gap-2 justify-center">
                      <Button onClick={() => setIsImportDialogOpen(true)} variant="outline">
                        <Upload className="mr-2 h-4 w-4" />
                        Import Sample Data
                      </Button>
                      <Button onClick={() => setIsCreateDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Service
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Basic Price</TableHead>
                      <TableHead className="text-center">Premium Price</TableHead>
                      <TableHead className="text-center">Elite Price</TableHead>
                      <TableHead>Packages</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredServices.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{service.servicename}</div>
                            {service.description && (
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {service.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {service.category && (
                            <div className="flex items-center">
                              <span className="mr-1">
                                {CATEGORY_ICONS[service.category as keyof typeof CATEGORY_ICONS]}
                              </span>
                              {service.category}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={STATUS_COLORS[service.status]}>
                            {service.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {service.basic_price ? (
                            <div className="flex items-center justify-center">
                              <DollarSign className="h-3 w-3 mr-1" />
                              {service.basic_price.toLocaleString()}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {service.premium_price ? (
                            <div className="flex items-center justify-center">
                              <DollarSign className="h-3 w-3 mr-1" />
                              {service.premium_price.toLocaleString()}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {service.elite_price ? (
                            <div className="flex items-center justify-center">
                              <DollarSign className="h-3 w-3 mr-1" />
                              {service.elite_price.toLocaleString()}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {service.package_included?.basic && (
                              <Badge variant="outline" className="bg-gray-100 text-gray-800">
                                Basic
                              </Badge>
                            )}
                            {service.package_included?.premium && (
                              <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                                Premium
                              </Badge>
                            )}
                            {service.package_included?.elite && (
                              <Badge variant="outline" className="bg-red-100 text-red-800">
                                Elite
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(service.created_at), "MMM d, yyyy")}
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
                              <DropdownMenuItem onClick={() => openEditDialog(service)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openDeleteDialog(service)}
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

      {/* Create Service Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Service</DialogTitle>
            <DialogDescription>
              Create a new service for your events catalog with package pricing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="servicename">Service Name *</Label>
              <Input
                id="servicename"
                value={formData.servicename}
                onChange={(e) => setFormData({ ...formData, servicename: e.target.value })}
                placeholder="Enter service name"
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {CATEGORY_ICONS[category]} {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Service description..."
                rows={3}
              />
            </div>
            
            {/* Package Pricing Section */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium text-sm">Package Pricing</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="basic_price">Basic Price</Label>
                  <Input
                    id="basic_price"
                    type="number"
                    value={formData.basic_price || ""}
                    onChange={(e) => setFormData({ ...formData, basic_price: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="premium_price">Premium Price</Label>
                  <Input
                    id="premium_price"
                    type="number"
                    value={formData.premium_price || ""}
                    onChange={(e) => setFormData({ ...formData, premium_price: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="elite_price">Elite Price</Label>
                  <Input
                    id="elite_price"
                    type="number"
                    value={formData.elite_price || ""}
                    onChange={(e) => setFormData({ ...formData, elite_price: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="0"
                  />
                </div>
              </div>
              
              {/* Package Inclusion */}
              <div>
                <Label className="text-sm font-medium">Include in Packages</Label>
                <div className="flex space-x-6 mt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="basic_package"
                      checked={formData.package_included?.basic || false}
                      onCheckedChange={(checked) => 
                        setFormData({
                          ...formData,
                          package_included: {
                            basic: !!checked,
                            premium: formData.package_included?.premium || false,
                            elite: formData.package_included?.elite || false,
                          }
                        })
                      }
                    />
                    <Label htmlFor="basic_package" className="text-sm">Basic</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="premium_package"
                      checked={formData.package_included?.premium || false}
                      onCheckedChange={(checked) => 
                        setFormData({
                          ...formData,
                          package_included: {
                            basic: formData.package_included?.basic || false,
                            premium: !!checked,
                            elite: formData.package_included?.elite || false,
                          }
                        })
                      }
                    />
                    <Label htmlFor="premium_package" className="text-sm">Premium</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="elite_package"
                      checked={formData.package_included?.elite || false}
                      onCheckedChange={(checked) => 
                        setFormData({
                          ...formData,
                          package_included: {
                            basic: formData.package_included?.basic || false,
                            premium: formData.package_included?.premium || false,
                            elite: !!checked,
                          }
                        })
                      }
                    />
                    <Label htmlFor="elite_package" className="text-sm">Elite</Label>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Legacy Price</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price || ""}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="hour, day, event"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as any })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Discontinued">Discontinued</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create Service</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Service Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>
              Update the service information and package pricing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-servicename">Service Name *</Label>
              <Input
                id="edit-servicename"
                value={formData.servicename}
                onChange={(e) => setFormData({ ...formData, servicename: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {CATEGORY_ICONS[category]} {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            
            {/* Package Pricing Section */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium text-sm">Package Pricing</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-basic_price">Basic Price</Label>
                  <Input
                    id="edit-basic_price"
                    type="number"
                    value={formData.basic_price || ""}
                    onChange={(e) => setFormData({ ...formData, basic_price: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-premium_price">Premium Price</Label>
                  <Input
                    id="edit-premium_price"
                    type="number"
                    value={formData.premium_price || ""}
                    onChange={(e) => setFormData({ ...formData, premium_price: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-elite_price">Elite Price</Label>
                  <Input
                    id="edit-elite_price"
                    type="number"
                    value={formData.elite_price || ""}
                    onChange={(e) => setFormData({ ...formData, elite_price: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="0"
                  />
                </div>
              </div>
              
              {/* Package Inclusion */}
              <div>
                <Label className="text-sm font-medium">Include in Packages</Label>
                <div className="flex space-x-6 mt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-basic_package"
                      checked={formData.package_included?.basic || false}
                      onCheckedChange={(checked) => 
                        setFormData({
                          ...formData,
                          package_included: {
                            basic: !!checked,
                            premium: formData.package_included?.premium || false,
                            elite: formData.package_included?.elite || false,
                          }
                        })
                      }
                    />
                    <Label htmlFor="edit-basic_package" className="text-sm">Basic</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-premium_package"
                      checked={formData.package_included?.premium || false}
                      onCheckedChange={(checked) => 
                        setFormData({
                          ...formData,
                          package_included: {
                            basic: formData.package_included?.basic || false,
                            premium: !!checked,
                            elite: formData.package_included?.elite || false,
                          }
                        })
                      }
                    />
                    <Label htmlFor="edit-premium_package" className="text-sm">Premium</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-elite_package"
                      checked={formData.package_included?.elite || false}
                      onCheckedChange={(checked) => 
                        setFormData({
                          ...formData,
                          package_included: {
                            basic: formData.package_included?.basic || false,
                            premium: formData.package_included?.premium || false,
                            elite: !!checked,
                          }
                        })
                      }
                    />
                    <Label htmlFor="edit-elite_package" className="text-sm">Elite</Label>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-price">Legacy Price</Label>
                <Input
                  id="edit-price"
                  type="number"
                  value={formData.price || ""}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
              <div>
                <Label htmlFor="edit-unit">Unit</Label>
                <Input
                  id="edit-unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as any })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Discontinued">Discontinued</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setSelectedService(null); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleEdit}>Update Service</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Service Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Service</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedService?.servicename}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDeleteDialogOpen(false); setSelectedService(null); }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Import Services Data</DialogTitle>
            <DialogDescription>
              Import your existing services from the previous CRM system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Sample Data Available</h4>
              <p className="text-sm text-blue-700 mb-3">
                We have prepared {sampleImportData.length} services from your previous system for import:
              </p>
              <ul className="text-xs text-blue-600 space-y-1 max-h-32 overflow-y-auto">
                {sampleImportData.slice(0, 10).map((item, index) => (
                  <li key={index}>• {item.servicename} ({item.category})</li>
                ))}
                {sampleImportData.length > 10 && (
                  <li className="font-medium">... and {sampleImportData.length - 10} more</li>
                )}
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSampleImport}>
              <Upload className="mr-2 h-4 w-4" />
              Import Sample Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 