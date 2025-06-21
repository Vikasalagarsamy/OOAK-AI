"use client"

import React, { useState, useEffect } from "react"
import { Plus, Search, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  getDeliverableCatalog,
} from "@/actions/deliverable-catalog-actions"
import {
  getDeliverableWorkflows,
  createDeliverableWorkflow,
  updateDeliverableWorkflow,
  deleteDeliverableWorkflow,
} from "@/actions/deliverable-workflow-actions"
import type {
  DeliverableWorkflow,
  DeliverableWorkflowFormData,
  DeliverableWorkflowDetails,
  DeliverableCatalog
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

  // Form state
  const [formData, setFormData] = useState<DeliverableWorkflowFormData>({
    deliverable_catalog_id: 0,
    process_name: "",
    sort_order: 0,
    has_customer: false,
    has_employee: false,
    has_qc: false,
    has_vendor: false,
    timing_type: "days",
    skippable: false,
    has_download_option: false,
    has_task_process: true,
    has_upload_folder_path: false,
    process_starts_from: 0,
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [workflowData, catalogData] = await Promise.all([
        getDeliverableWorkflows(),
        getDeliverableCatalog()
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

  function resetForm() {
    setFormData({
      deliverable_catalog_id: 0,
      process_name: "",
      sort_order: 0,
      has_customer: false,
      has_employee: false,
      has_qc: false,
      has_vendor: false,
      timing_type: "days",
      skippable: false,
      has_download_option: false,
      has_task_process: true,
      has_upload_folder_path: false,
      process_starts_from: 0,
    })
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

  async function handleEdit() {
    if (!selectedWorkflow || !formData.deliverable_catalog_id || !formData.process_name.trim()) {
      toast({
        title: "Error",
        description: "Deliverable and process name are required",
        variant: "destructive",
      })
      return
    }

    try {
      const result = await updateDeliverableWorkflow(selectedWorkflow.id, formData)
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        setIsEditDialogOpen(false)
        setSelectedWorkflow(null)
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
      console.error("Error updating workflow:", error)
      toast({
        title: "Error",
        description: "Failed to update workflow",
        variant: "destructive",
      })
    }
  }

  async function handleDelete() {
    if (!selectedWorkflow) return

    try {
      const result = await deleteDeliverableWorkflow(selectedWorkflow.id)
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        setIsDeleteDialogOpen(false)
        setSelectedWorkflow(null)
        loadData()
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting workflow:", error)
      toast({
        title: "Error",
        description: "Failed to delete workflow",
        variant: "destructive",
      })
    }
  }

  function openEditDialog(workflow: DeliverableWorkflowDetails) {
    setSelectedWorkflow(workflow)
    setFormData({
      deliverable_catalog_id: workflow.deliverable_catalog_id,
      process_name: workflow.process_name,
      process_description: workflow.process_description,
      sort_order: workflow.sort_order,
      has_customer: workflow.has_customer,
      has_employee: workflow.has_employee,
      has_qc: workflow.has_qc,
      has_vendor: workflow.has_vendor,
      timing_type: workflow.timing_type,
      tat: workflow.tat,
      tat_value: workflow.tat_value,
      buffer: workflow.buffer,
      skippable: workflow.skippable,
      has_download_option: workflow.has_download_option,
      has_task_process: workflow.has_task_process,
      has_upload_folder_path: workflow.has_upload_folder_path,
      process_starts_from: workflow.process_starts_from,
      on_start_template: workflow.on_start_template,
      on_complete_template: workflow.on_complete_template,
      on_correction_template: workflow.on_correction_template,
      employee: workflow.employee,
      input_names: workflow.input_names,
      link: workflow.link,
      stream: workflow.stream,
      stage: workflow.stage,
      process_basic_price: workflow.process_basic_price,
      process_premium_price: workflow.process_premium_price,
      process_elite_price: workflow.process_elite_price,
    })
    setIsEditDialogOpen(true)
  }

  function openCreateDialog() {
    resetForm()
    setIsCreateDialogOpen(true)
  }

  function openDeleteDialog(workflow: DeliverableWorkflowDetails) {
    setSelectedWorkflow(workflow)
    setIsDeleteDialogOpen(true)
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
          <CardTitle>Workflows</CardTitle>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deliverable</TableHead>
                <TableHead>Process</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Stakeholders</TableHead>
                <TableHead>Actions</TableHead>
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
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(workflow)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(workflow)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Workflow</DialogTitle>
            <DialogDescription>
              Create a new workflow process for an existing deliverable.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="deliverable">Deliverable</Label>
              <Select
                value={formData.deliverable_catalog_id.toString()}
                onValueChange={(value) => setFormData({ ...formData, deliverable_catalog_id: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select deliverable" />
                </SelectTrigger>
                <SelectContent>
                  {catalog.map((item) => (
                    <SelectItem key={item.id} value={item.id.toString()}>
                      {item.deliverable_name} ({item.deliverable_category} - {item.deliverable_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="process_name">Process Name</Label>
              <Input
                id="process_name"
                value={formData.process_name}
                onChange={(e) => setFormData({ ...formData, process_name: e.target.value })}
                placeholder="Enter process name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has_customer"
                  checked={formData.has_customer}
                  onCheckedChange={(checked) => setFormData({ ...formData, has_customer: checked as boolean })}
                />
                <Label htmlFor="has_customer">Customer</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has_employee"
                  checked={formData.has_employee}
                  onCheckedChange={(checked) => setFormData({ ...formData, has_employee: checked as boolean })}
                />
                <Label htmlFor="has_employee">Employee</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has_qc"
                  checked={formData.has_qc}
                  onCheckedChange={(checked) => setFormData({ ...formData, has_qc: checked as boolean })}
                />
                <Label htmlFor="has_qc">QC</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has_vendor"
                  checked={formData.has_vendor}
                  onCheckedChange={(checked) => setFormData({ ...formData, has_vendor: checked as boolean })}
                />
                <Label htmlFor="has_vendor">Vendor</Label>
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Workflow</DialogTitle>
            <DialogDescription>
              Update the workflow process details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_deliverable">Deliverable</Label>
              <Select
                value={formData.deliverable_catalog_id.toString()}
                onValueChange={(value) => setFormData({ ...formData, deliverable_catalog_id: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select deliverable" />
                </SelectTrigger>
                <SelectContent>
                  {catalog.map((item) => (
                    <SelectItem key={item.id} value={item.id.toString()}>
                      {item.deliverable_name} ({item.deliverable_category} - {item.deliverable_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit_process_name">Process Name</Label>
              <Input
                id="edit_process_name"
                value={formData.process_name}
                onChange={(e) => setFormData({ ...formData, process_name: e.target.value })}
                placeholder="Enter process name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit_has_customer"
                  checked={formData.has_customer}
                  onCheckedChange={(checked) => setFormData({ ...formData, has_customer: checked as boolean })}
                />
                <Label htmlFor="edit_has_customer">Customer</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit_has_employee"
                  checked={formData.has_employee}
                  onCheckedChange={(checked) => setFormData({ ...formData, has_employee: checked as boolean })}
                />
                <Label htmlFor="edit_has_employee">Employee</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit_has_qc"
                  checked={formData.has_qc}
                  onCheckedChange={(checked) => setFormData({ ...formData, has_qc: checked as boolean })}
                />
                <Label htmlFor="edit_has_qc">QC</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit_has_vendor"
                  checked={formData.has_vendor}
                  onCheckedChange={(checked) => setFormData({ ...formData, has_vendor: checked as boolean })}
                />
                <Label htmlFor="edit_has_vendor">Vendor</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit}>Update Workflow</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Workflow</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the workflow "{selectedWorkflow?.process_name}" for "{selectedWorkflow?.deliverable_name}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
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