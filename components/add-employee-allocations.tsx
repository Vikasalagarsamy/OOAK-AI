"use client"

import { useState, useEffect } from "react"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, X, Trash2 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Company, Branch } from "@/types/employee"
import { getBranchesByCompany } from "@/actions/employee-actions"
import { toast } from "@/components/ui/use-toast"

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
  const [branches, setBranches] = useState<Branch[]>(initialBranches)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("")
  const [selectedBranchId, setSelectedBranchId] = useState<string>("")
  const [allocationPercentage, setAllocationPercentage] = useState<number>(0)
  const [totalAllocation, setTotalAllocation] = useState(0)
  const [availableAllocation, setAvailableAllocation] = useState(100)

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
      if (percentage >= 1 && percentage <= availableAllocation) {
        setAllocationPercentage(percentage)
      } else if (percentage > availableAllocation) {
        // Cap at maximum available
        setAllocationPercentage(availableAllocation)
        toast({
          title: "Maximum allocation reached",
          description: `The maximum available allocation is ${availableAllocation}%.`,
          variant: "default",
        })
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

    const newAllocation: AllocationFormData = {
      company_id: Number.parseInt(selectedCompanyId),
      branch_id: Number.parseInt(selectedBranchId),
      allocation_percentage: allocationPercentage,
      is_primary: false,
      company_name: company?.name,
      branch_name: branch?.name,
    }

    setAllocations([...allocations, newAllocation])
    setIsAddDialogOpen(false)

    // Reset selection
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
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button type="button" disabled={availableAllocation <= 0} aria-label="Add company allocation">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Company
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Company Allocation</DialogTitle>
                    <DialogDescription>
                      Assign the employee to work at a company and branch with a specific allocation percentage.
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
                          {companies.map((company) => (
                            <SelectItem key={company.id} value={company.id.toString()}>
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                        max={availableAllocation}
                        value={allocationPercentage}
                        onChange={(e) => handleAllocationChange(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">Maximum available: {availableAllocation}%</p>
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
            </TooltipTrigger>
            <TooltipContent>
              <p>Add a new company allocation</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

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
                    <div className="flex items-center justify-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveAllocation(index)}
                              disabled={allocation.is_primary}
                              aria-label="Delete company allocation"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{allocation.is_primary ? "Cannot delete primary company" : "Delete allocation"}</p>
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
    </div>
  )
}
