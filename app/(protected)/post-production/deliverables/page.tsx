"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, MoreHorizontal, Edit, Trash2, Package, FileText, Camera, Video } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  getDeliverableCatalogSummary,
  createDeliverableCatalog,
  updateDeliverableCatalog,
  deleteDeliverableCatalog
} from "@/actions/deliverable-catalog-actions"
import type { 
  DeliverableCatalogSummary,
  DeliverableCatalogFormData
} from "@/types/deliverable-catalog"

export default function DeliverablePage() {
  const [deliverables, setDeliverables] = useState<DeliverableCatalogSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingDeliverable, setEditingDeliverable] = useState<DeliverableCatalogSummary | null>(null)

  // Form state
  const [formData, setFormData] = useState<DeliverableCatalogFormData>({
    deliverable_name: "",
    deliverable_category: "Main",
    deliverable_type: "Photo",
    description: "",
    basic_price: 0,
    premium_price: 0,
    elite_price: 0,
    package_included: {
      basic: false,
      premium: false,
      elite: false
    }
  })

  // Load deliverables
  useEffect(() => {
    loadDeliverables()
  }, [])

  const loadDeliverables = async () => {
    try {
      setIsLoading(true)
      const data = await getDeliverableCatalogSummary()
      setDeliverables(data)
    } catch (error) {
      console.error("Error loading deliverables:", error)
      toast({
        title: "Error",
        description: "Failed to load deliverables",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filter deliverables
  const filteredDeliverables = deliverables.filter(deliverable => {
    const matchesSearch = deliverable.deliverable_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || deliverable.deliverable_type.toLowerCase() === selectedCategory.toLowerCase()
    return matchesSearch && matchesCategory
  })

  // Get statistics
  const totalDeliverables = deliverables.length
  const photoDeliverables = deliverables.filter(d => d.deliverable_type === "Photo").length
  const videoDeliverables = deliverables.filter(d => d.deliverable_type === "Video").length
  const mainDeliverables = deliverables.filter(d => d.deliverable_category === "Main").length

  const resetForm = () => {
    setFormData({
      deliverable_name: "",
      deliverable_category: "Main",
      deliverable_type: "Photo",
      description: "",
      basic_price: 0,
      premium_price: 0,
      elite_price: 0,
      package_included: {
        basic: false,
        premium: false,
        elite: false
      }
    })
  }

  const handleAddDeliverable = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      console.log('Creating deliverable with data:', formData)
      const result = await createDeliverableCatalog(formData)
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        setIsAddDialogOpen(false)
        resetForm()
        loadDeliverables()
      } else {
        console.error('Server action failed:', result.message)
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding deliverable:", error)
      toast({
        title: "Error",
        description: "Failed to add deliverable",
        variant: "destructive",
      })
    }
  }

  const handleEditDeliverable = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDeliverable) return

    try {
      console.log('Updating deliverable with data:', formData)
      const result = await updateDeliverableCatalog(editingDeliverable.id, formData)
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        setIsEditDialogOpen(false)
        setEditingDeliverable(null)
        resetForm()
        loadDeliverables()
      } else {
        console.error('Server action failed:', result.message)
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

  const handleDeleteDeliverable = async (deliverable: DeliverableCatalogSummary) => {
    try {
      const result = await deleteDeliverableCatalog(deliverable.id)
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
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

  const openEditDialog = (deliverable: DeliverableCatalogSummary) => {
    setEditingDeliverable(deliverable)
    setFormData({
      deliverable_name: deliverable.deliverable_name,
      deliverable_category: deliverable.deliverable_category,
      deliverable_type: deliverable.deliverable_type,
      description: deliverable.description || "",
      basic_price: deliverable.basic_price,
      premium_price: deliverable.premium_price,
      elite_price: deliverable.elite_price,
      package_included: deliverable.package_included
    })
    setIsEditDialogOpen(true)
  }

  const renderDeliverableForm = (isEdit = false) => (
    <form onSubmit={isEdit ? handleEditDeliverable : handleAddDeliverable} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="deliverable_name">Deliverable Name *</Label>
        <Input
          id="deliverable_name"
          value={formData.deliverable_name}
          onChange={(e) => setFormData(prev => ({ ...prev, deliverable_name: e.target.value }))}
          placeholder="Enter deliverable name"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="deliverable_category">Category</Label>
          <Select 
            value={formData.deliverable_category} 
            onValueChange={(value: 'Main' | 'Optional') => setFormData(prev => ({ ...prev, deliverable_category: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Main">Main</SelectItem>
              <SelectItem value="Optional">Optional</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="deliverable_type">Type</Label>
          <Select 
            value={formData.deliverable_type} 
            onValueChange={(value: 'Photo' | 'Video') => setFormData(prev => ({ ...prev, deliverable_type: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Photo">📸 Photo</SelectItem>
              <SelectItem value="Video">🎥 Video</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Enter deliverable description"
        />
      </div>

      {/* Package Pricing Section */}
      <div className="space-y-4 border-t pt-4">
        <h4 className="font-medium text-sm">Package Pricing</h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="basic_price">Basic Price (₹)</Label>
            <Input
              id="basic_price"
              type="number"
              value={formData.basic_price || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, basic_price: e.target.value ? Number(e.target.value) : 0 }))}
              placeholder="0"
              min="0"
            />
          </div>
          <div>
            <Label htmlFor="premium_price">Premium Price (₹)</Label>
            <Input
              id="premium_price"
              type="number"
              value={formData.premium_price || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, premium_price: e.target.value ? Number(e.target.value) : 0 }))}
              placeholder="0"
              min="0"
            />
          </div>
          <div>
            <Label htmlFor="elite_price">Elite Price (₹)</Label>
            <Input
              id="elite_price"
              type="number"
              value={formData.elite_price || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, elite_price: e.target.value ? Number(e.target.value) : 0 }))}
              placeholder="0"
              min="0"
            />
          </div>
        </div>
        
        {/* Package Inclusion */}
        <div>
          <Label className="text-sm font-medium">Include in Packages</Label>
          <div className="flex space-x-6 mt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="basic"
                checked={formData.package_included?.basic || false}
                onCheckedChange={(checked) => setFormData(prev => ({ 
                  ...prev, 
                  package_included: { 
                    ...prev.package_included, 
                    basic: checked as boolean 
                  }
                }))}
              />
              <Label htmlFor="basic" className="text-sm">Basic</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="premium"
                checked={formData.package_included?.premium || false}
                onCheckedChange={(checked) => setFormData(prev => ({ 
                  ...prev, 
                  package_included: { 
                    ...prev.package_included, 
                    premium: checked as boolean 
                  }
                }))}
              />
              <Label htmlFor="premium" className="text-sm">Premium</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="elite"
                checked={formData.package_included?.elite || false}
                onCheckedChange={(checked) => setFormData(prev => ({ 
                  ...prev, 
                  package_included: { 
                    ...prev.package_included, 
                    elite: checked as boolean 
                  }
                }))}
              />
              <Label htmlFor="elite" className="text-sm">Elite</Label>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (isEdit) {
              setIsEditDialogOpen(false)
              setEditingDeliverable(null)
            } else {
              setIsAddDialogOpen(false)
            }
            resetForm()
          }}
        >
          Cancel
        </Button>
        <Button type="submit">
          {isEdit ? "Update" : "Add"} Deliverable
        </Button>
      </div>
    </form>
  )

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Deliverables</h1>
          <p className="text-gray-600">Manage your event deliverables catalog</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Import Data
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Deliverable
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Deliverable</DialogTitle>
              </DialogHeader>
              {renderDeliverableForm()}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deliverables</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDeliverables}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Photo Deliverables</CardTitle>
            <Camera className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{photoDeliverables}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Video Deliverables</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{videoDeliverables}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Main Deliverables</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mainDeliverables}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Search deliverables..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="photo">Photo</SelectItem>
                <SelectItem value="video">Video</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Deliverables Table */}
      <Card>
        <CardHeader>
          <CardTitle>Deliverables ({filteredDeliverables.length})</CardTitle>
          <CardDescription>Manage your event deliverables catalog</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deliverable Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Workflows</TableHead>
                <TableHead>Basic Price</TableHead>
                <TableHead>Premium Price</TableHead>
                <TableHead>Elite Price</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-6">
                    Loading deliverables...
                  </TableCell>
                </TableRow>
              ) : filteredDeliverables.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-6">
                    No deliverables found
                  </TableCell>
                </TableRow>
              ) : (
                filteredDeliverables.map((deliverable) => (
                  <TableRow key={deliverable.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        {deliverable.deliverable_type === "Photo" ? (
                          <Camera className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Video className="h-4 w-4 text-purple-500" />
                        )}
                        <span>{deliverable.deliverable_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={deliverable.deliverable_category === "Main" ? "default" : "secondary"}>
                        {deliverable.deliverable_category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {deliverable.deliverable_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {deliverable.workflow_count} process{deliverable.workflow_count !== 1 ? 'es' : ''}
                      </Badge>
                    </TableCell>
                    <TableCell>₹ {deliverable.basic_price.toLocaleString()}</TableCell>
                    <TableCell>₹ {deliverable.premium_price.toLocaleString()}</TableCell>
                    <TableCell>₹ {deliverable.elite_price.toLocaleString()}</TableCell>
                    <TableCell>
                      {new Date(deliverable.created_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(deliverable)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteDeliverable(deliverable)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Deliverable</DialogTitle>
          </DialogHeader>
          {renderDeliverableForm(true)}
        </DialogContent>
      </Dialog>
    </div>
  )
} 