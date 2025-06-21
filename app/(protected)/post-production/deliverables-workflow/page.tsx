"use client"

import React, { useState, useEffect } from "react"
import { Plus, Search, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
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
  getDeliverableWorkflows,
  createDeliverableWorkflow,
  updateDeliverableWorkflow,
  deleteDeliverableWorkflow,
  getDeliverableCatalogForWorkflow,
} from "@/actions/deliverable-workflow-actions"
import type {
  DeliverableWorkflow,
  DeliverableWorkflowFormData,
  DeliverableWorkflowDetails,
  DeliverableCatalog,
  DeliverableCategory,
  DeliverableType,
  TimingType,
  StreamType
} from "@/types/deliverable-catalog"

export default function WorkflowPage() {
  const [workflows, setWorkflows] = useState<DeliverableWorkflowDetails[]>([])
  const [catalog, setCatalog] = useState<DeliverableCatalog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedWorkflow, setSelectedWorkflow] = useState<DeliverableWorkflowDetails | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Form filters for deliverable selection
  const [selectedCategory, setSelectedCategory] = useState<DeliverableCategory | "">("")
  const [selectedType, setSelectedType] = useState<DeliverableType | "">("")

  // Form state with all comprehensive fields
  const [formData, setFormData] = useState<DeliverableWorkflowFormData>({
    deliverable_catalog_id: 0,
    process_name: "",
    process_description: "",
    sort_order: 0,
    has_customer: false,
    has_employee: false,
    has_qc: false,
    has_vendor: false,
    timing_type: "days",
    tat: 0,
    tat_value: 0,
    buffer: 0,
    skippable: false,
    has_download_option: false,
    has_task_process: true,
    has_upload_folder_path: false,
    process_starts_from: 0,
    on_start_template: "",
    on_complete_template: "",
    on_correction_template: "",
    employee: [],
    input_names: [],
    link: "",
    stream: "UP",
    stage: "",
    process_basic_price: 0,
    process_premium_price: 0,
    process_elite_price: 0,
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [workflowData, catalogData] = await Promise.all([
        getDeliverableWorkflows(),
        getDeliverableCatalogForWorkflow()
      ])
      setWorkflows(workflowData)
      setCatalog(catalogData)
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredWorkflows = workflows.filter(workflow =>
    workflow.deliverable_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workflow.process_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Filter deliverables based on selected category and type
  const filteredDeliverables = catalog.filter(item => {
    const categoryMatch = !selectedCategory || item.deliverable_category === selectedCategory
    const typeMatch = !selectedType || item.deliverable_type === selectedType
    return categoryMatch && typeMatch
  })

  function resetForm() {
    setFormData({
      deliverable_catalog_id: 0,
      process_name: "",
      process_description: "",
      sort_order: 0,
      has_customer: false,
      has_employee: false,
      has_qc: false,
      has_vendor: false,
      timing_type: "days",
      tat: 0,
      tat_value: 0,
      buffer: 0,
      skippable: false,
      has_download_option: false,
      has_task_process: true,
      has_upload_folder_path: false,
      process_starts_from: 0,
      on_start_template: "",
      on_complete_template: "",
      on_correction_template: "",
      employee: [],
      input_names: [],
      link: "",
      stream: "UP",
      stage: "",
      process_basic_price: 0,
      process_premium_price: 0,
      process_elite_price: 0,
    })
    setSelectedCategory("")
    setSelectedType("")
  }

  async function handleCreate() {
    if (!formData.deliverable_catalog_id || !formData.process_name.trim()) {
      toast({
        title: "Error",
        description: "Deliverable and process name are required",
        variant: "destructive",
      })
      return
    }

    try {
      const result = await createDeliverableWorkflow(formData)
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        setIsCreateDialogOpen(false)
        resetForm()
        loadData()
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating workflow:", error)
      toast({
        title: "Error",
        description: "Failed to create workflow",
        variant: "destructive",
      })
    }
  }

  function openCreateDialog() {
    resetForm()
    setIsCreateDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Loading workflows...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deliverable Workflows</h1>
          <p className="text-muted-foreground">
            Manage workflow processes for your deliverables
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Workflow
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workflows ({workflows.length})</CardTitle>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4" />
            <Input
              placeholder="Search workflows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredWorkflows.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {workflows.length === 0 
                  ? "No workflows found. Create your first workflow process." 
                  : "No workflows match your search."}
              </p>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorkflows.map((workflow) => (
                  <TableRow key={workflow.id}>
                    <TableCell className="font-medium">
                      {workflow.deliverable_name}
                    </TableCell>
                    <TableCell>{workflow.process_name}</TableCell>
                    <TableCell>
                      <Badge variant={workflow.deliverable_category === "Main" ? "default" : "secondary"}>
                        {workflow.deliverable_category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={workflow.deliverable_type === "Photo" ? "default" : "outline"}>
                        {workflow.deliverable_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        {workflow.has_customer && <Badge variant="outline">Customer</Badge>}
                        {workflow.has_employee && <Badge variant="outline">Employee</Badge>}
                        {workflow.has_qc && <Badge variant="outline">QC</Badge>}
                        {workflow.has_vendor && <Badge variant="outline">Vendor</Badge>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Comprehensive Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Workflow</DialogTitle>
            <DialogDescription>
              Create a new workflow process for an existing deliverable.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
              {/* 1. Deliverable Category */}
              <div>
                <Label htmlFor="deliverable_category">1. Deliverable Category *</Label>
                <Select
                  value={selectedCategory}
                  onValueChange={(value) => {
                    setSelectedCategory(value as DeliverableCategory)
                    // Reset deliverable selection when category changes
                    setFormData({ ...formData, deliverable_catalog_id: 0 })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Main">Main</SelectItem>
                    <SelectItem value="Optional">Optional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 2. Deliverable Type */}
              <div>
                <Label htmlFor="deliverable_type">2. Deliverable Type *</Label>
                <Select
                  value={selectedType}
                  onValueChange={(value) => {
                    setSelectedType(value as DeliverableType)
                    // Reset deliverable selection when type changes
                    setFormData({ ...formData, deliverable_catalog_id: 0 })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Photo">Photo</SelectItem>
                    <SelectItem value="Video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 3. Deliverable Name */}
              <div>
                <Label htmlFor="deliverable">3. Deliverable Name *</Label>
                <Select
                  value={formData.deliverable_catalog_id.toString()}
                  onValueChange={(value) => setFormData({ ...formData, deliverable_catalog_id: parseInt(value) })}
                  disabled={!selectedCategory || !selectedType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !selectedCategory || !selectedType 
                        ? "Select category and type first" 
                        : filteredDeliverables.length === 0
                        ? "No deliverables found"
                        : "Select deliverable"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredDeliverables.map((item) => (
                      <SelectItem key={item.id} value={item.id.toString()}>
                        {item.deliverable_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCategory && selectedType && filteredDeliverables.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    No deliverables found for {selectedCategory} - {selectedType}
                  </p>
                )}
              </div>

              {/* 4. Process Name */}
              <div>
                <Label htmlFor="process_name">4. Process Name *</Label>
                <Input
                  id="process_name"
                  value={formData.process_name}
                  onChange={(e) => setFormData({ ...formData, process_name: e.target.value })}
                  placeholder="Enter process name"
                />
              </div>

              <div>
                <Label htmlFor="process_description">Process Description</Label>
                <Textarea
                  id="process_description"
                  value={formData.process_description}
                  onChange={(e) => setFormData({ ...formData, process_description: e.target.value })}
                  placeholder="Enter process description"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            {/* Stakeholder Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Stakeholder Configuration</h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has_customer"
                    checked={formData.has_customer}
                    onCheckedChange={(checked) => setFormData({ ...formData, has_customer: checked as boolean })}
                  />
                  <Label htmlFor="has_customer">Has Customer</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has_employee"
                    checked={formData.has_employee}
                    onCheckedChange={(checked) => setFormData({ ...formData, has_employee: checked as boolean })}
                  />
                  <Label htmlFor="has_employee">Has Employee</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has_qc"
                    checked={formData.has_qc}
                    onCheckedChange={(checked) => setFormData({ ...formData, has_qc: checked as boolean })}
                  />
                  <Label htmlFor="has_qc">Has QC</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has_vendor"
                    checked={formData.has_vendor}
                    onCheckedChange={(checked) => setFormData({ ...formData, has_vendor: checked as boolean })}
                  />
                  <Label htmlFor="has_vendor">Has Vendor</Label>
                </div>
              </div>
            </div>

            {/* Timing Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Timing Configuration</h3>

              <div>
                <Label htmlFor="timing_type">Timing Type</Label>
                <Select
                  value={formData.timing_type}
                  onValueChange={(value) => setFormData({ ...formData, timing_type: value as TimingType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="days">Days</SelectItem>
                    <SelectItem value="hr">Hours</SelectItem>
                    <SelectItem value="min">Minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tat">TAT</Label>
                <Input
                  id="tat"
                  type="number"
                  value={formData.tat || ""}
                  onChange={(e) => setFormData({ ...formData, tat: parseInt(e.target.value) || undefined })}
                />
              </div>

              <div>
                <Label htmlFor="tat_value">TAT Value</Label>
                <Input
                  id="tat_value"
                  type="number"
                  value={formData.tat_value || ""}
                  onChange={(e) => setFormData({ ...formData, tat_value: parseInt(e.target.value) || undefined })}
                />
              </div>

              <div>
                <Label htmlFor="buffer">Buffer</Label>
                <Input
                  id="buffer"
                  type="number"
                  value={formData.buffer || ""}
                  onChange={(e) => setFormData({ ...formData, buffer: parseInt(e.target.value) || undefined })}
                />
              </div>
            </div>

            {/* Process Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Process Options</h3>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="skippable"
                    checked={formData.skippable}
                    onCheckedChange={(checked) => setFormData({ ...formData, skippable: checked as boolean })}
                  />
                  <Label htmlFor="skippable">Skippable</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has_download_option"
                    checked={formData.has_download_option}
                    onCheckedChange={(checked) => setFormData({ ...formData, has_download_option: checked as boolean })}
                  />
                  <Label htmlFor="has_download_option">Has Download Option</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has_task_process"
                    checked={formData.has_task_process}
                    onCheckedChange={(checked) => setFormData({ ...formData, has_task_process: checked as boolean })}
                  />
                  <Label htmlFor="has_task_process">Has Task Process</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has_upload_folder_path"
                    checked={formData.has_upload_folder_path}
                    onCheckedChange={(checked) => setFormData({ ...formData, has_upload_folder_path: checked as boolean })}
                  />
                  <Label htmlFor="has_upload_folder_path">Has Upload Folder Path</Label>
                </div>
              </div>

              <div>
                <Label htmlFor="process_starts_from">Process Starts From</Label>
                <Input
                  id="process_starts_from"
                  type="number"
                  value={formData.process_starts_from}
                  onChange={(e) => setFormData({ ...formData, process_starts_from: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            {/* Templates */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Templates</h3>

              <div>
                <Label htmlFor="on_start_template">On Start Template</Label>
                <Textarea
                  id="on_start_template"
                  value={formData.on_start_template}
                  onChange={(e) => setFormData({ ...formData, on_start_template: e.target.value })}
                  placeholder="Template for process start"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="on_complete_template">On Complete Template</Label>
                <Textarea
                  id="on_complete_template"
                  value={formData.on_complete_template}
                  onChange={(e) => setFormData({ ...formData, on_complete_template: e.target.value })}
                  placeholder="Template for process completion"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="on_correction_template">On Correction Template</Label>
                <Textarea
                  id="on_correction_template"
                  value={formData.on_correction_template}
                  onChange={(e) => setFormData({ ...formData, on_correction_template: e.target.value })}
                  placeholder="Template for corrections"
                  rows={2}
                />
              </div>
            </div>

            {/* Additional Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Additional Settings</h3>

              <div>
                <Label htmlFor="link">Link</Label>
                <Input
                  id="link"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="Enter link URL"
                />
              </div>

              <div>
                <Label htmlFor="stream">Stream</Label>
                <Select
                  value={formData.stream}
                  onValueChange={(value) => setFormData({ ...formData, stream: value as StreamType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UP">UP</SelectItem>
                    <SelectItem value="DOWN">DOWN</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="stage">Stage</Label>
                <Input
                  id="stage"
                  value={formData.stage}
                  onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                  placeholder="Enter stage"
                />
              </div>

              {/* Process Pricing */}
              <div>
                <Label htmlFor="process_basic_price">Process Basic Price</Label>
                <Input
                  id="process_basic_price"
                  type="number"
                  step="0.01"
                  value={formData.process_basic_price || ""}
                  onChange={(e) => setFormData({ ...formData, process_basic_price: parseFloat(e.target.value) || undefined })}
                />
              </div>

              <div>
                <Label htmlFor="process_premium_price">Process Premium Price</Label>
                <Input
                  id="process_premium_price"
                  type="number"
                  step="0.01"
                  value={formData.process_premium_price || ""}
                  onChange={(e) => setFormData({ ...formData, process_premium_price: parseFloat(e.target.value) || undefined })}
                />
              </div>

              <div>
                <Label htmlFor="process_elite_price">Process Elite Price</Label>
                <Input
                  id="process_elite_price"
                  type="number"
                  step="0.01"
                  value={formData.process_elite_price || ""}
                  onChange={(e) => setFormData({ ...formData, process_elite_price: parseFloat(e.target.value) || undefined })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create Workflow</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 