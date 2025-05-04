"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, X, Trash2, Edit2, AlertCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Company, Branch } from "@/types/employee"
import { getBranchesByCompany } from "@/actions/employee-actions"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

export interface AllocationFormData {
  company_id: number
  branch_id: number
  allocation_percentage: number
  is_primary: boolean
  company_name?: string
  branch_name?: string
}

interface AddEmployeeAllocationsProps {
  companies: Company[]
  initialBranches: Branch[]
  allocations: AllocationFormData[]
  setAllocations: (allocations: AllocationFormData[]) => void
  primaryCompanyId?: string
  primaryBranchId?: string
}

export function AddEmployeeAllocations({
  companies,
  initialBranches,
  allocations,
  setAllocations,
  primaryCompanyId,
  primaryBranchId,
}: AddEmployeeAllocationsProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number>(-1)
  const [branches, setBranches] = useState<Branch[]>(initialBranches)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("")
  const [selectedBranchId, setSelectedBranchId] = useState<string>("")
  const [allocationPercentage, setAllocationPercentage] = useState<number>(0)
  const [totalAllocation, setTotalAllocation] = useState(0)
  const [availableAllocation, setAvailableAllocation] = useState(100)
  const dialogButtonRef = useRef<HTMLButtonElement>(null)

  // Calculate total allocation whenever allocations change
  useEffect(() => {
    const total = allocations.reduce((sum, allocation) => sum + allocation.allocation_percentage, 0)
    setTotalAllocation(total)
    setAvailableAllocation(100 - total)
  }, [allocations])

  // Update branches when a company is selected
  useEffect(() => {
    const fetchBranches = async () => {
      if (!selectedCompanyId) {
        setBranches(initialBranches)
        return
      }

      try {
        const data = await getBranchesByCompany(Number.parseInt(selectedCompanyId))
        if (data && data.length > 0) {
          setBranches(data)
          // Auto-select the first branch if none is selected
          if (!selectedBranchId) {
            setSelectedBranchId(data[0].id.toString())
          }
        } else {
          setBranches([])
          // Show toast notification if no branches found
          toast({
            title: "No branches found",
            description: "This company has no branches. Please add a branch first.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error fetching branches:", error)
        setBranches([])
        toast({
          title: "Error fetching branches",
          description: "Failed to load branches for this company.",
          variant: "destructive",
        })
      }
    }

    fetchBranches()
  }, [selectedCompanyId, initialBranches, selectedBranchId])

  // Handle company change in the add dialog
  const handleCompanyChange = (value: string) => {
    setSelectedCompanyId(value)
    setSelectedBranchId("")
  }

  // Handle branch change in the add dialog
  const handleBranchChange = (value: string) => {
    setSelectedBranchId(value)
  }

  // Handle allocation percentage change in the add dialog
  const handleAllocationChange = (value: string) => {
    const percentage = Number.parseInt(value)
    if (!isNaN(percentage)) {
      if (percentage >= 1 && percentage <= 100) {
        setAllocationPercentage(percentage)
      } else if (percentage > 100) {
        // Cap at maximum 100%
        setAllocationPercentage(100)
      } else if (percentage < 1) {
        // Minimum allocation is 1%
        setAllocationPercentage(1)
      }
    }
  }

  // Handle adding a new allocation
  const handleAddAllocation = () => {
    if (!selectedCompanyId || !selectedBranchId || allocationPercentage <= 0) {
      return
    }

    // Find company and branch names for display
    const company = companies.find((c) => c.id.toString() === selectedCompanyId)
    const branch = branches.find((b) => b.id.toString() === selectedBranchId)

    // Check if this exact company-branch combination already has an allocation
    const existingAllocationIndex = allocations.findIndex(
      (a) => a.company_id.toString() === selectedCompanyId && a.branch_id.toString() === selectedBranchId,
    )

    if (existingAllocationIndex >= 0) {
      toast({
        title: "Allocation already exists",
        description:
          "This company and branch combination already has an allocation. Please edit the existing allocation instead.",
        variant: "destructive",
      })
      return
    }

    // Check if adding this allocation would exceed 100%
    const newTotal = totalAllocation + allocationPercentage
    if (newTotal > 100) {
      // Ask user if they want to adjust allocations
      if (confirm(`Adding this allocation will exceed 100% (${newTotal}%). Would you like to adjust it to fit?`)) {
        // Adjust the new allocation to fit within 100%
        const adjustedPercentage = 100 - totalAllocation

        if (adjustedPercentage <= 0) {
          toast({
            title: "Cannot add allocation",
            description: "Total allocation is already at 100%. Please reduce other allocations first.",
            variant: "destructive",
          })
          return
        }

        const newAllocation: AllocationFormData = {
          company_id: Number.parseInt(selectedCompanyId),
          branch_id: Number.parseInt(selectedBranchId),
          allocation_percentage: adjustedPercentage,
          is_primary: false,
          company_name: company?.name,
          branch_name: branch?.name,
        }

        setAllocations([...allocations, newAllocation])
      } else {
        // User chose not to adjust
        return
      }
    } else {
      // Add the allocation as is
      const newAllocation: AllocationFormData = {
        company_id: Number.parseInt(selectedCompanyId),
        branch_id: Number.parseInt(selectedBranchId),
        allocation_percentage: allocationPercentage,
        is_primary: false,
        company_name: company?.name,
        branch_name: branch?.name,
      }

      setAllocations([...allocations, newAllocation])
    }

    setIsAddDialogOpen(false)

    // Reset selection
    setSelectedCompanyId("")
    setSelectedBranchId("")
    setAllocationPercentage(0)
  }

  // Handle editing an allocation
  const handleEditAllocation = (index: number) => {
    const allocation = allocations[index]
    setEditingIndex(index)
    setSelectedCompanyId(allocation.company_id.toString())
    setSelectedBranchId(allocation.branch_id.toString())
    setAllocationPercentage(allocation.allocation_percentage)
    setIsEditDialogOpen(true)
  }

  // Handle saving edited allocation
  const handleSaveEdit = () => {
    if (editingIndex < 0 || !selectedCompanyId || !selectedBranchId || allocationPercentage <= 0) {
      return
    }

    // Find company and branch names for display
    const company = companies.find((c) => c.id.toString() === selectedCompanyId)
    const branch = branches.find((b) => b.id.toString() === selectedBranchId)

    // Check if changing to a company-branch combination that already exists
    if (
      allocations[editingIndex].company_id.toString() !== selectedCompanyId ||
      allocations[editingIndex].branch_id.toString() !== selectedBranchId
    ) {
      const existingCombinationIndex = allocations.findIndex(
        (a, i) =>
          i !== editingIndex &&
          a.company_id.toString() === selectedCompanyId &&
          a.branch_id.toString() === selectedBranchId,
      )

      if (existingCombinationIndex >= 0) {
        toast({
          title: "Allocation already exists",
          description:
            "This company and branch combination already has an allocation. Please edit the existing allocation instead.",
          variant: "destructive",
        })
        return
      }
    }

    // Calculate what the new total would be
    const oldPercentage = allocations[editingIndex].allocation_percentage
    const newTotal = totalAllocation - oldPercentage + allocationPercentage

    if (newTotal > 100) {
      // Ask user if they want to adjust
      if (confirm(`This change will exceed 100% (${newTotal}%). Would you like to adjust it to fit?`)) {
        // Adjust to fit
        const adjustedPercentage = oldPercentage + (100 - totalAllocation)

        const updatedAllocation: AllocationFormData = {
          ...allocations[editingIndex],
          company_id: Number.parseInt(selectedCompanyId),
          branch_id: Number.parseInt(selectedBranchId),
          allocation_percentage: adjustedPercentage,
          company_name: company?.name,
          branch_name: branch?.name,
        }

        const newAllocations = [...allocations]
        newAllocations[editingIndex] = updatedAllocation
        setAllocations(newAllocations)
      } else {
        // User chose not to adjust
        return
      }
    } else {
      // Update the allocation
      const updatedAllocation: AllocationFormData = {
        ...allocations[editingIndex],
        company_id: Number.parseInt(selectedCompanyId),
        branch_id: Number.parseInt(selectedBranchId),
        allocation_percentage: allocationPercentage,
        company_name: company?.name,
        branch_name: branch?.name,
      }

      const newAllocations = [...allocations]
      newAllocations[editingIndex] = updatedAllocation
      setAllocations(newAllocations)
    }

    setIsEditDialogOpen(false)
    setEditingIndex(-1)
    setSelectedCompanyId("")
    setSelectedBranchId("")
    setAllocationPercentage(0)
  }

  // Handle removing an allocation
  const handleRemoveAllocation = (index: number) => {
    const newAllocations = [...allocations]
    newAllocations.splice(index, 1)
    setAllocations(newAllocations)
  }

  // Check if a primary company allocation was added based on form selection
  useEffect(() => {
    if (primaryCompanyId && primaryBranchId && primaryCompanyId !== "none" && primaryBranchId !== "none") {
      // Check if we already have this primary allocation
      const hasPrimaryAllocation = allocations.some(
        (a) =>
          a.company_id.toString() === primaryCompanyId && a.branch_id.toString() === primaryBranchId && a.is_primary,
      )

      // Check if we have any primary allocation
      const hasAnyPrimaryAllocation = allocations.some((a) => a.is_primary)

      if (!hasPrimaryAllocation && !hasAnyPrimaryAllocation) {
        // Find company and branch names for display
        const company = companies.find((c) => c.id.toString() === primaryCompanyId)
        const branch = initialBranches.find((b) => b.id.toString() === primaryBranchId)

        // Create a primary allocation
        const primaryAllocation: AllocationFormData = {
          company_id: Number.parseInt(primaryCompanyId),
          branch_id: Number.parseInt(primaryBranchId),
          allocation_percentage: 100,
          is_primary: true,
          company_name: company?.name,
          branch_name: branch?.name,
        }

        // Add it to allocations
        setAllocations([primaryAllocation])
      }
    }
  }, [primaryCompanyId, primaryBranchId, companies, initialBranches, allocations, setAllocations])

  // Function to redistribute allocations to make room for a new one
  const redistributeAllocations = (targetPercentage: number) => {
    if (allocations.length === 0 || targetPercentage >= 100) return false

    // Calculate how much we need to reduce
    const reductionNeeded = targetPercentage

    // Create a copy of allocations that we can modify
    const newAllocations = [...allocations]

    // Sort by allocation percentage (descending) and non-primary first
    newAllocations.sort((a, b) => {
      // Primary allocations last
      if (a.is_primary && !b.is_primary) return 1
      if (!a.is_primary && b.is_primary) return -1
      // Then by percentage (descending)
      return b.allocation_percentage - a.allocation_percentage
    })

    let totalReduced = 0

    // Reduce each allocation proportionally
    for (let i = 0; i < newAllocations.length; i++) {
      if (totalReduced >= reductionNeeded) break

      const allocation = newAllocations[i]
      // Skip primary allocations initially if possible
      if (allocation.is_primary && i < newAllocations.length - 1) continue

      // Calculate reduction for this allocation (proportional to its size)
      const reductionForThis = Math.min(
        allocation.allocation_percentage - 1, // Don't go below 1%
        reductionNeeded - totalReduced, // Don't reduce more than needed
      )

      if (reductionForThis <= 0) continue

      // Apply reduction
      allocation.allocation_percentage -= reductionForThis
      totalReduced += reductionForThis
    }

    // If we couldn't reduce enough, try again including primary allocations
    if (totalReduced < reductionNeeded) {
      for (let i = 0; i < newAllocations.length; i++) {
        if (totalReduced >= reductionNeeded) break

        const allocation = newAllocations[i]
        if (!allocation.is_primary) continue // Already processed non-primary

        const reductionForThis = Math.min(allocation.allocation_percentage - 1, reductionNeeded - totalReduced)

        if (reductionForThis <= 0) continue

        allocation.allocation_percentage -= reductionForThis
        totalReduced += reductionForThis
      }
    }

    // If we managed to reduce enough, apply the changes
    if (totalReduced >= reductionNeeded) {
      setAllocations(newAllocations)
      return true
    }

    return false
  }

  // Validate total allocation
  const validateTotalAllocation = () => {
    const total = allocations.reduce((sum, allocation) => sum + allocation.allocation_percentage, 0)
    if (total !== 100) {
      toast({
        title: "Invalid allocation",
        description: `Total allocation must be exactly 100%. Current total: ${total}%`,
        variant: "destructive",
      })
      return false
    }
    return true
  }

  // Export the validation function for use in the parent component
  useEffect(() => {
    if (typeof window !== "undefined") {
      // @ts-ignore - Add validation function to window for parent component access
      window.validateEmployeeAllocations = validateTotalAllocation
    }
    return () => {
      if (typeof window !== "undefined") {
        // @ts-ignore - Clean up
        delete window.validateEmployeeAllocations
      }
    }
  }, [allocations])

  // Get available companies (those not already allocated)
  const availableCompanies = companies

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm font-medium">Total Allocation: {totalAllocation}%</p>
          <p className="text-xs text-muted-foreground">Available: {availableAllocation}%</p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                onClick={() => setIsAddDialogOpen(true)}
                aria-label="Add company allocation"
                ref={dialogButtonRef}
                disabled={availableCompanies.length === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Company
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {availableCompanies.length === 0
                  ? "No more companies available to allocate"
                  : "Add a new company allocation"}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {availableCompanies.length === 0 && allocations.length > 0 && (
        <Alert variant="info" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            All available companies have been allocated. Due to database constraints, an employee can only be allocated
            to a company once.
          </AlertDescription>
        </Alert>
      )}

      {/* Add Company Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Company Allocation</DialogTitle>
            <DialogDescription>
              Assign the employee to work at a company and branch with a specific allocation percentage.
              {availableAllocation <= 0 && (
                <p className="text-amber-500 mt-2">
                  Note: Adding this allocation will require adjusting existing allocations.
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="company_id">Company</Label>
              <Select value={selectedCompanyId} onValueChange={handleCompanyChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {availableCompanies.map((company) => (
                    <SelectItem key={company.id} value={company.id.toString()}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableCompanies.length === 0 && (
                <p className="text-xs text-destructive">No more companies available to allocate.</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="branch_id">Branch</Label>
              <Select value={selectedBranchId} onValueChange={handleBranchChange} disabled={!selectedCompanyId}>
                <SelectTrigger>
                  <SelectValue placeholder={selectedCompanyId ? "Select branch" : "Select company first"} />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id.toString()}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="allocation_percentage">Allocation Percentage</Label>
              <Input
                id="allocation_percentage"
                type="number"
                min="1"
                max="100"
                value={allocationPercentage}
                onChange={(e) => handleAllocationChange(e.target.value)}
              />
              {availableAllocation <= 0 ? (
                <p className="text-xs text-amber-500">Adding this allocation will redistribute existing allocations.</p>
              ) : (
                <p className="text-xs text-muted-foreground">Recommended maximum: {availableAllocation}%</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddAllocation}
              disabled={!selectedCompanyId || !selectedBranchId || allocationPercentage <= 0}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Allocation %</TableHead>
              <TableHead>Primary</TableHead>
              <TableHead className="w-[100px] text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allocations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No company allocations added
                </TableCell>
              </TableRow>
            ) : (
              allocations.map((allocation, index) => (
                <TableRow key={index}>
                  <TableCell>{allocation.company_name}</TableCell>
                  <TableCell>{allocation.branch_name}</TableCell>
                  <TableCell>{allocation.allocation_percentage}%</TableCell>
                  <TableCell>
                    {allocation.is_primary ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        Primary
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditAllocation(index)}
                              aria-label="Edit company allocation"
                            >
                              <Edit2 className="h-4 w-4 text-blue-500" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit allocation</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveAllocation(index)}
                              disabled={allocation.is_primary && allocations.length > 1}
                              aria-label="Delete company allocation"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {allocation.is_primary && allocations.length > 1
                                ? "Cannot delete primary company when other allocations exist"
                                : "Delete allocation"}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Allocation Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Company Allocation</DialogTitle>
            <DialogDescription>Update the allocation percentage for this company and branch.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit_company_id">Company</Label>
              <Select
                value={selectedCompanyId}
                onValueChange={handleCompanyChange}
                disabled={editingIndex >= 0 && allocations[editingIndex]?.is_primary}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id.toString()}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit_branch_id">Branch</Label>
              <Select
                value={selectedBranchId}
                onValueChange={handleBranchChange}
                disabled={!selectedCompanyId || (editingIndex >= 0 && allocations[editingIndex]?.is_primary)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedCompanyId ? "Select branch" : "Select company first"} />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id.toString()}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit_allocation_percentage">Allocation Percentage</Label>
              <Input
                id="edit_allocation_percentage"
                type="number"
                min="1"
                max="100"
                value={allocationPercentage}
                onChange={(e) => handleAllocationChange(e.target.value)}
              />
              {editingIndex >= 0 && (
                <p className="text-xs text-muted-foreground">
                  Current: {allocations[editingIndex]?.allocation_percentage}%
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false)
                setEditingIndex(-1)
              }}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveEdit}
              disabled={!selectedCompanyId || !selectedBranchId || allocationPercentage <= 0}
              className="flex items-center gap-2"
            >
              <Edit2 className="h-4 w-4" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
