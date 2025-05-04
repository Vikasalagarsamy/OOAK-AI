"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { AlertCircle, Calendar, Check, Clock, Loader2, Plus, Star, StarOff, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  addEmployeeCompany,
  updateEmployeeCompany,
  deleteEmployeeCompany,
  setPrimaryCompany,
  getCompanies,
  getBranchesByCompany,
  getProjectsByCompany,
} from "@/actions/employee-actions"
import type { Company, Branch, Project } from "@/types/employee"

// Define the allocation type
interface Allocation {
  id: string
  company_id: number
  company_name: string
  branch_id: number
  branch_name: string
  project_id: number | null
  project_name: string | null
  allocation_percentage: number
  is_primary: boolean
  start_date: Date
  end_date: Date | null
  status: "active" | "pending" | "completed" | "expired"
}

interface EnhancedCompanyAllocationFormProps {
  employeeId: string
  allocations: Allocation[]
  onChange: (allocations: Allocation[]) => void
  onPrimaryChange?: (companyId: number, branchId: number) => void
}

export function EnhancedCompanyAllocationForm({
  employeeId,
  allocations = [], // Provide default empty array
  onChange,
  onPrimaryChange,
}: EnhancedCompanyAllocationFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("")
  const [selectedBranchId, setSelectedBranchId] = useState<string>("")
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [allocationPercentage, setAllocationPercentage] = useState<string>("100")
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [endDate, setEndDate] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("active")
  const [editingAllocation, setEditingAllocation] = useState<Allocation | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editBranches, setEditBranches] = useState<Branch[]>([])

  // Filter allocations by status
  const activeAllocations = allocations.filter((a) => a.status === "active")
  const pendingAllocations = allocations.filter((a) => a.status === "pending")
  const completedAllocations = allocations.filter((a) => a.status === "completed" || a.status === "expired")

  // Calculate total allocation percentage for active allocations
  const totalAllocationPercentage = activeAllocations.reduce((sum, a) => sum + a.allocation_percentage, 0)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const companiesData = await getCompanies()
        setCompanies(companiesData)
      } catch (error) {
        console.error("Error fetching companies:", error)
        toast({
          title: "Error",
          description: "Failed to load companies. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    const fetchBranches = async () => {
      if (!selectedCompanyId || selectedCompanyId === "none") {
        setBranches([])
        return
      }

      try {
        const branchesData = await getBranchesByCompany(Number.parseInt(selectedCompanyId))
        setBranches(branchesData)
      } catch (error) {
        console.error("Error fetching branches:", error)
        toast({
          title: "Error",
          description: "Failed to load branches. Please try again.",
          variant: "destructive",
        })
      }
    }

    fetchBranches()
  }, [selectedCompanyId])

  useEffect(() => {
    const fetchProjects = async () => {
      if (!selectedCompanyId || selectedCompanyId === "none") {
        setProjects([])
        return
      }

      try {
        // Set loading state for projects
        setIsLoading(true)
        const projectsData = await getProjectsByCompany(Number.parseInt(selectedCompanyId))
        setProjects(projectsData || []) // Ensure we always have an array
      } catch (error) {
        console.error("Error fetching projects:", error)
        // Don't show an error toast, just set empty projects
        setProjects([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchProjects()
  }, [selectedCompanyId])

  // Effect to fetch branches for editing
  useEffect(() => {
    const fetchEditBranches = async () => {
      if (editingAllocation && editingAllocation.company_id) {
        try {
          setIsLoading(true)
          const branchesData = await getBranchesByCompany(editingAllocation.company_id)
          setEditBranches(branchesData)
        } catch (error) {
          console.error("Error fetching branches for edit:", error)
          toast({
            title: "Error",
            description: "Failed to load branches for editing. Please try again.",
            variant: "destructive",
          })
        } finally {
          setIsLoading(false)
        }
      }
    }

    fetchEditBranches()
  }, [editingAllocation])

  const handleCompanyChange = (value: string) => {
    setSelectedCompanyId(value)
    setSelectedBranchId("")
    setSelectedProjectId("")
  }

  const handleBranchChange = (value: string) => {
    setSelectedBranchId(value)
  }

  const handleProjectChange = (value: string) => {
    setSelectedProjectId(value === "none" ? "" : value)
  }

  const handleOpenAddDialog = () => {
    // Calculate available allocation percentage
    const availablePercentage = 100 - totalAllocationPercentage

    // Reset form fields
    setSelectedCompanyId("")
    setSelectedBranchId("")
    setSelectedProjectId("")
    // Set the allocation percentage to the available percentage (or 100 if nothing is allocated yet)
    setAllocationPercentage(availablePercentage > 0 ? String(availablePercentage) : "100")
    setStartDate(new Date().toISOString().split("T")[0])
    setEndDate("")

    // Open dialog
    setIsDialogOpen(true)
  }

  const handleAddAllocation = async () => {
    setIsSubmitting(true)

    try {
      // Validate inputs
      if (!selectedCompanyId || !selectedBranchId || !allocationPercentage || !startDate) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // Validate allocation percentage
      const percentage = Number.parseInt(allocationPercentage)
      if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
        toast({
          title: "Validation Error",
          description: "Allocation percentage must be between 1 and 100.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // Check if the new allocation would exceed 100%
      if (totalAllocationPercentage + percentage > 100) {
        toast({
          title: "Allocation Error",
          description: `Total allocation would exceed 100%. Current total: ${totalAllocationPercentage}%, Available: ${100 - totalAllocationPercentage}%`,
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // Check if this specific company-branch combination already has an allocation
      const existingAllocation = allocations.find(
        (a) => a.company_id === Number.parseInt(selectedCompanyId) && a.branch_id === Number.parseInt(selectedBranchId),
      )

      if (existingAllocation) {
        toast({
          title: "Validation Error",
          description:
            "This company and branch combination already has an allocation. Please edit the existing allocation instead.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // Create form data
      const formData = new FormData()
      formData.append("company_id", selectedCompanyId)
      formData.append("branch_id", selectedBranchId)
      if (selectedProjectId) {
        formData.append("project_id", selectedProjectId)
      }
      formData.append("allocation_percentage", allocationPercentage)
      formData.append("start_date", startDate)
      if (endDate) {
        formData.append("end_date", endDate)
      }

      // Submit the form
      await addEmployeeCompany(employeeId, formData)

      // Refresh the allocations
      const company = companies.find((c) => c.id === Number.parseInt(selectedCompanyId))
      const branch = branches.find((b) => b.id === Number.parseInt(selectedBranchId))
      const project = selectedProjectId ? projects.find((p) => p.id === Number.parseInt(selectedProjectId)) : null

      // Determine status based on dates
      const today = new Date()
      const start = new Date(startDate)
      const end = endDate ? new Date(endDate) : null
      let status: "active" | "pending" | "completed" | "expired" = "active"

      if (start > today) {
        status = "pending"
      } else if (end && end < today) {
        status = "expired"
      }

      // Create a new allocation object
      const newAllocation: Allocation = {
        id: Date.now().toString(), // Temporary ID until we refresh
        company_id: Number.parseInt(selectedCompanyId),
        company_name: company?.name || "",
        branch_id: Number.parseInt(selectedBranchId),
        branch_name: branch?.name || "",
        project_id: selectedProjectId ? Number.parseInt(selectedProjectId) : null,
        project_name: project?.name || null,
        allocation_percentage: Number.parseInt(allocationPercentage),
        is_primary: false,
        start_date: new Date(startDate),
        end_date: endDate ? new Date(endDate) : null,
        status,
      }

      // Update the allocations
      const updatedAllocations = [...allocations, newAllocation]
      onChange(updatedAllocations)

      // Reset form
      setSelectedCompanyId("")
      setSelectedBranchId("")
      setSelectedProjectId("")
      setAllocationPercentage("100")
      setStartDate(new Date().toISOString().split("T")[0])
      setEndDate("")

      // Close dialog
      setIsDialogOpen(false)

      toast({
        title: "Success",
        description: "Allocation added successfully.",
        variant: "default",
      })
    } catch (error) {
      console.error("Error adding allocation:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add allocation. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditAllocation = async () => {
    if (!editingAllocation) return

    setIsSubmitting(true)

    try {
      // Validate inputs
      if (!editingAllocation.branch_id || !editingAllocation.allocation_percentage || !editingAllocation.start_date) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // Validate allocation percentage
      if (editingAllocation.allocation_percentage <= 0 || editingAllocation.allocation_percentage > 100) {
        toast({
          title: "Validation Error",
          description: "Allocation percentage must be between 1 and 100.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // Validate dates
      if (
        editingAllocation.end_date &&
        new Date(editingAllocation.end_date) <= new Date(editingAllocation.start_date)
      ) {
        toast({
          title: "Validation Error",
          description: "End date must be after start date.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // Create form data
      const formData = new FormData()
      formData.append("employee_id", employeeId)
      formData.append("branch_id", String(editingAllocation.branch_id))
      if (editingAllocation.project_id) {
        formData.append("project_id", String(editingAllocation.project_id))
      }
      formData.append("allocation_percentage", String(editingAllocation.allocation_percentage))
      formData.append(
        "start_date",
        editingAllocation.start_date instanceof Date
          ? editingAllocation.start_date.toISOString().split("T")[0]
          : new Date(editingAllocation.start_date).toISOString().split("T")[0],
      )
      if (editingAllocation.end_date) {
        formData.append(
          "end_date",
          editingAllocation.end_date instanceof Date
            ? editingAllocation.end_date.toISOString().split("T")[0]
            : new Date(editingAllocation.end_date).toISOString().split("T")[0],
        )
      }

      // Submit the form
      await updateEmployeeCompany(editingAllocation.id, formData)

      // Get updated branch name if it changed
      const updatedBranchName =
        editBranches.find((b) => b.id === editingAllocation.branch_id)?.name || editingAllocation.branch_name

      // Update the allocations with the new branch name
      const updatedAllocations = allocations.map((a) =>
        a.id === editingAllocation.id
          ? {
              ...editingAllocation,
              branch_name: updatedBranchName,
            }
          : a,
      )

      onChange(updatedAllocations)

      // Close dialog
      setIsEditDialogOpen(false)
      setEditingAllocation(null)

      toast({
        title: "Success",
        description: "Allocation updated successfully.",
        variant: "default",
      })
    } catch (error) {
      console.error("Error updating allocation:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update allocation. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteAllocation = async (id: string) => {
    if (!confirm("Are you sure you want to delete this allocation?")) {
      return
    }

    try {
      await deleteEmployeeCompany(id, employeeId)

      // Update the allocations
      const updatedAllocations = allocations.filter((a) => a.id !== id)
      onChange(updatedAllocations)

      toast({
        title: "Success",
        description: "Allocation deleted successfully.",
        variant: "default",
      })
    } catch (error) {
      console.error("Error deleting allocation:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete allocation. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSetPrimary = async (id: string) => {
    try {
      await setPrimaryCompany(employeeId, id)

      // Update the allocations
      const updatedAllocations = allocations.map((a) => ({
        ...a,
        is_primary: a.id === id,
      }))
      onChange(updatedAllocations)

      // Call the onPrimaryChange callback if provided
      const allocation = allocations.find((a) => a.id === id)
      if (allocation && onPrimaryChange) {
        onPrimaryChange(allocation.company_id, allocation.branch_id)
      }

      toast({
        title: "Success",
        description: "Primary company updated successfully.",
        variant: "default",
      })
    } catch (error) {
      console.error("Error setting primary company:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to set primary company. Please try again.",
        variant: "destructive",
      })
    }
  }

  const formatDate = (date: Date | null | string) => {
    if (!date) return "N/A"
    const d = date instanceof Date ? date : new Date(date)
    return d.toLocaleDateString()
  }

  const renderAllocationCard = (allocation: Allocation) => {
    return (
      <Card key={allocation.id} className="mb-4">
        <CardContent className="pt-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{allocation.company_name}</h3>
                {allocation.is_primary && (
                  <Badge variant="outline" className="bg-primary/10 text-primary">
                    Primary
                  </Badge>
                )}
                <Badge
                  variant={
                    allocation.status === "active"
                      ? "default"
                      : allocation.status === "pending"
                        ? "outline"
                        : "secondary"
                  }
                  className={
                    allocation.status === "active"
                      ? "bg-green-500"
                      : allocation.status === "pending"
                        ? "border-amber-500 text-amber-500"
                        : "bg-gray-200 text-gray-700"
                  }
                >
                  {allocation.status.charAt(0).toUpperCase() + allocation.status.slice(1)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">Branch: {allocation.branch_name}</p>
              {allocation.project_name && (
                <p className="text-sm text-muted-foreground">Project: {allocation.project_name}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setEditingAllocation(allocation)
                  setIsEditDialogOpen(true)
                }}
                title="Edit allocation"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  <path d="m15 5 4 4" />
                </svg>
              </Button>
              {!allocation.is_primary && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleSetPrimary(allocation.id)}
                  title="Set as primary"
                >
                  <StarOff className="h-5 w-5" />
                </Button>
              )}
              {allocation.is_primary && <Star className="h-5 w-5 text-amber-500" />}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteAllocation(allocation.id)}
                title="Delete allocation"
                disabled={allocation.is_primary && allocations.length > 1}
              >
                <Trash2 className="h-5 w-5 text-destructive" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-sm font-medium">Allocation</p>
              <p className="text-lg">{allocation.allocation_percentage}%</p>
            </div>
            <div>
              <p className="text-sm font-medium">Period</p>
              <div className="flex items-center gap-1 text-sm">
                <Calendar className="h-3 w-3" />
                <span>
                  {formatDate(allocation.start_date)} -{" "}
                  {allocation.end_date ? formatDate(allocation.end_date) : "Ongoing"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Company & Project Allocations</CardTitle>
        <Button size="sm" className="h-8" onClick={handleOpenAddDialog}>
          <Plus className="h-4 w-4 mr-1" /> Add Allocation
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading allocations...</span>
          </div>
        ) : allocations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No company allocations found.</p>
            <p className="text-sm text-muted-foreground">
              Click the "Add Allocation" button to allocate this employee to a company.
            </p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active" className="relative">
                Active
                {activeAllocations.length > 0 && (
                  <Badge className="ml-1 bg-primary text-primary-foreground">{activeAllocations.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="pending" className="relative">
                Pending
                {pendingAllocations.length > 0 && (
                  <Badge className="ml-1 bg-amber-500 text-white">{pendingAllocations.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="completed" className="relative">
                Completed
                {completedAllocations.length > 0 && (
                  <Badge className="ml-1 bg-gray-500 text-white">{completedAllocations.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="active" className="mt-4">
              {activeAllocations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <Clock className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No active allocations found.</p>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Total active allocation: {totalAllocationPercentage}%</span>
                    </div>
                  </div>
                  {activeAllocations.map(renderAllocationCard)}
                </>
              )}
            </TabsContent>
            <TabsContent value="pending" className="mt-4">
              {pendingAllocations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <Clock className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No pending allocations found.</p>
                </div>
              ) : (
                pendingAllocations.map(renderAllocationCard)
              )}
            </TabsContent>
            <TabsContent value="completed" className="mt-4">
              {completedAllocations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <Check className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No completed allocations found.</p>
                </div>
              ) : (
                completedAllocations.map(renderAllocationCard)
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Add Allocation Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Company Allocation</DialogTitle>
              <DialogDescription>
                Allocate this employee to a company, branch, and optionally a project.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="company">Company</Label>
                <Select value={selectedCompanyId} onValueChange={handleCompanyChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={String(company.id)}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="branch">Branch</Label>
                <Select value={selectedBranchId} onValueChange={handleBranchChange} disabled={!selectedCompanyId}>
                  <SelectTrigger>
                    <SelectValue placeholder={selectedCompanyId ? "Select branch" : "Select company first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.length > 0 ? (
                      branches.map((branch) => (
                        <SelectItem key={branch.id} value={String(branch.id)}>
                          {branch.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none">No branches available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="project">Project (Optional)</Label>
                <Select value={selectedProjectId} onValueChange={handleProjectChange} disabled={!selectedCompanyId}>
                  <SelectTrigger>
                    <SelectValue placeholder={selectedCompanyId ? "Select project" : "Select company first"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={String(project.id)}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="allocation">Allocation Percentage</Label>
                <Input
                  id="allocation"
                  type="number"
                  min="1"
                  max={100 - totalAllocationPercentage}
                  value={allocationPercentage}
                  onChange={(e) => setAllocationPercentage(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Current total active allocation: {totalAllocationPercentage}%, Available:{" "}
                  {100 - totalAllocationPercentage}%
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="end-date">End Date (Optional)</Label>
                  <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddAllocation} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...
                  </>
                ) : (
                  "Add Allocation"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Allocation Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Company Allocation</DialogTitle>
              <DialogDescription>Update this employee's allocation details.</DialogDescription>
            </DialogHeader>
            {editingAllocation && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Company</Label>
                  <div className="p-2 border rounded-md bg-muted/50">{editingAllocation.company_name}</div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-branch">Branch</Label>
                  <Select
                    value={String(editingAllocation.branch_id)}
                    onValueChange={(value) =>
                      setEditingAllocation({ ...editingAllocation, branch_id: Number.parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {editBranches.length > 0 ? (
                        editBranches.map((branch) => (
                          <SelectItem key={branch.id} value={String(branch.id)}>
                            {branch.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value={String(editingAllocation.branch_id)}>
                          {editingAllocation.branch_name}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-project">Project (Optional)</Label>
                  <Select
                    value={editingAllocation.project_id?.toString() || "none"}
                    onValueChange={(value) =>
                      setEditingAllocation({
                        ...editingAllocation,
                        project_id: value !== "none" ? Number.parseInt(value) : null,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={String(project.id)}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-allocation">Allocation Percentage</Label>
                  <Input
                    id="edit-allocation"
                    type="number"
                    min="1"
                    max="100"
                    value={String(editingAllocation.allocation_percentage)}
                    onChange={(e) =>
                      setEditingAllocation({
                        ...editingAllocation,
                        allocation_percentage: Number.parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-start-date">Start Date</Label>
                    <Input
                      id="edit-start-date"
                      type="date"
                      value={
                        editingAllocation.start_date instanceof Date
                          ? editingAllocation.start_date.toISOString().split("T")[0]
                          : new Date(editingAllocation.start_date).toISOString().split("T")[0]
                      }
                      onChange={(e) =>
                        setEditingAllocation({ ...editingAllocation, start_date: new Date(e.target.value) })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-end-date">End Date (Optional)</Label>
                    <Input
                      id="edit-end-date"
                      type="date"
                      value={
                        editingAllocation.end_date instanceof Date
                          ? editingAllocation.end_date.toISOString().split("T")[0]
                          : editingAllocation.end_date
                            ? new Date(editingAllocation.end_date).toISOString().split("T")[0]
                            : ""
                      }
                      onChange={(e) =>
                        setEditingAllocation({
                          ...editingAllocation,
                          end_date: e.target.value ? new Date(e.target.value) : null,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditAllocation} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
                  </>
                ) : (
                  "Update Allocation"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
