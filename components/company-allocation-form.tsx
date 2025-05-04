"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getCompanies, getBranchesByCompany } from "@/actions/employee-actions"
import { Plus, Trash2, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import type { Company, Branch } from "@/types/employee"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface CompanyAllocation {
  id: string
  company_id: number
  company_name: string
  branch_id: number
  branch_name: string
  allocation_percentage: number
  is_primary: boolean
}

interface CompanyAllocationFormProps {
  allocations: CompanyAllocation[]
  onChange: (allocations: CompanyAllocation[]) => void
  onPrimaryChange?: (companyId: number, branchId: number) => void
}

export function CompanyAllocationForm({ allocations, onChange, onPrimaryChange }: CompanyAllocationFormProps) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [branchesMap, setBranchesMap] = useState<Record<number, Branch[]>>({})
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("")
  const [selectedBranchId, setSelectedBranchId] = useState<string>("")
  const [allocationPercentage, setAllocationPercentage] = useState<string>("100")
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingAllocation, setIsAddingAllocation] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculate total allocation
  const totalAllocation = allocations.reduce((sum, allocation) => sum + allocation.allocation_percentage, 0)
  const availableAllocation = 100 - totalAllocation

  // Load companies on component mount
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setIsLoading(true)
        const data = await getCompanies()
        setCompanies(data)
      } catch (error) {
        console.error("Error fetching companies:", error)
        toast({
          title: "Error fetching companies",
          description: "Could not load company data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchCompanies()
  }, [])

  // Load branches when a company is selected
  useEffect(() => {
    const fetchBranches = async () => {
      if (!selectedCompanyId) return

      const companyId = Number.parseInt(selectedCompanyId)

      // Check if we already have branches for this company
      if (branchesMap[companyId]) {
        return
      }

      try {
        setIsAddingAllocation(true)
        const data = await getBranchesByCompany(companyId)

        // Update branches map
        setBranchesMap((prev) => ({
          ...prev,
          [companyId]: data,
        }))

        if (data.length === 0) {
          toast({
            title: "No branches found",
            description: "This company has no branches. Please add a branch first.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error fetching branches:", error)
        toast({
          title: "Error fetching branches",
          description: "Failed to load branches for this company.",
          variant: "destructive",
        })
      } finally {
        setIsAddingAllocation(false)
      }
    }

    fetchBranches()
  }, [selectedCompanyId, branchesMap])

  // Get available companies (all companies, as we now allow the same company with different branches)
  const availableCompanies = companies

  const handleAddAllocation = () => {
    setError(null)

    if (!selectedCompanyId || !selectedBranchId) {
      setError("Please select both company and branch")
      return
    }

    const percentage = Number.parseInt(allocationPercentage)
    if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
      setError("Allocation percentage must be between 1 and 100")
      return
    }

    if (percentage > availableAllocation && totalAllocation > 0) {
      setError(`Allocation exceeds available percentage. Maximum available: ${availableAllocation}%`)
      return
    }

    const companyId = Number.parseInt(selectedCompanyId)
    const branchId = Number.parseInt(selectedBranchId)

    // Find company and branch names
    const company = companies.find((c) => c.id === companyId)
    const branch = branchesMap[companyId]?.find((b) => b.id === branchId)

    if (!company || !branch) {
      setError("Invalid company or branch selection")
      return
    }

    // Check if this company-branch combination already exists
    const existingAllocation = allocations.find((a) => a.company_id === companyId && a.branch_id === branchId)

    if (existingAllocation) {
      setError("This company and branch combination already has an allocation")
      return
    }

    // Create new allocation
    const newAllocation: CompanyAllocation = {
      id: `temp-${Date.now()}`,
      company_id: companyId,
      company_name: company.name,
      branch_id: branchId,
      branch_name: branch.name,
      allocation_percentage: percentage,
      is_primary: allocations.length === 0, // First allocation is primary by default
    }

    // Update allocations
    const newAllocations = [...allocations, newAllocation]
    onChange(newAllocations)

    // If this is the first allocation (primary), notify parent
    if (newAllocation.is_primary && onPrimaryChange) {
      onPrimaryChange(companyId, branchId)
    }

    // Reset form
    setSelectedCompanyId("")
    setSelectedBranchId("")
    setAllocationPercentage(availableAllocation > 0 ? availableAllocation.toString() : "100")

    toast({
      title: "Allocation added",
      description: `Added ${percentage}% allocation to ${company.name} (${branch.name})`,
    })
  }

  const handleRemoveAllocation = (index: number) => {
    const allocationToRemove = allocations[index]
    const wasPrimary = allocationToRemove.is_primary

    // Create new allocations array without the removed allocation
    const newAllocations = allocations.filter((_, i) => i !== index)

    // If the removed allocation was primary and there are other allocations,
    // set the first one as primary
    if (wasPrimary && newAllocations.length > 0) {
      newAllocations[0].is_primary = true

      // Notify parent of primary change
      if (onPrimaryChange) {
        onPrimaryChange(newAllocations[0].company_id, newAllocations[0].branch_id)
      }
    }

    onChange(newAllocations)

    toast({
      title: "Allocation removed",
      description: `Removed allocation from ${allocationToRemove.company_name}`,
    })
  }

  const handleSetPrimary = (index: number) => {
    // Create new allocations array with updated primary status
    const newAllocations = allocations.map((allocation, i) => ({
      ...allocation,
      is_primary: i === index,
    }))

    onChange(newAllocations)

    // Notify parent of primary change
    if (onPrimaryChange) {
      const primaryAllocation = newAllocations[index]
      onPrimaryChange(primaryAllocation.company_id, primaryAllocation.branch_id)
    }

    toast({
      title: "Primary company updated",
      description: `Set ${allocations[index].company_name} as primary company`,
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Company Allocations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Assign the employee to work at one or more companies with specific allocation percentages. The total
          allocation must equal 100%.
        </p>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Total Allocation: {totalAllocation}%</p>
            <p className="text-xs text-muted-foreground">Available: {availableAllocation}%</p>
          </div>
        </div>

        {/* Allocation Table */}
        {allocations.length > 0 && (
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
              {allocations.map((allocation, index) => (
                <TableRow key={allocation.id} className={allocation.is_primary ? "bg-muted/20" : ""}>
                  <TableCell className="font-medium">{allocation.company_name}</TableCell>
                  <TableCell>{allocation.branch_name}</TableCell>
                  <TableCell>{allocation.allocation_percentage}%</TableCell>
                  <TableCell>
                    {allocation.is_primary ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        Primary
                      </span>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => handleSetPrimary(index)} className="h-7 text-xs">
                        Set Primary
                      </Button>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveAllocation(index)}
                      disabled={isAddingAllocation}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Add Allocation Form */}
        <div className="space-y-4 border rounded-md p-4 mt-4">
          <h3 className="text-sm font-medium">Add Company Allocation</h3>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_id">Company</Label>
              <Select
                value={selectedCompanyId}
                onValueChange={setSelectedCompanyId}
                disabled={isLoading || isAddingAllocation}
              >
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch_id">Branch</Label>
              <Select
                value={selectedBranchId}
                onValueChange={setSelectedBranchId}
                disabled={!selectedCompanyId || isAddingAllocation}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedCompanyId ? "Select branch" : "Select company first"} />
                </SelectTrigger>
                <SelectContent>
                  {selectedCompanyId &&
                    branchesMap[Number.parseInt(selectedCompanyId)]?.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id.toString()}>
                        {branch.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="allocation_percentage">Allocation %</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="allocation_percentage"
                  type="number"
                  min="1"
                  max="100"
                  value={allocationPercentage}
                  onChange={(e) => setAllocationPercentage(e.target.value)}
                  disabled={isAddingAllocation}
                />
                <Button
                  onClick={handleAddAllocation}
                  disabled={!selectedCompanyId || !selectedBranchId || isAddingAllocation}
                  className="flex-shrink-0"
                >
                  {isAddingAllocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden field to store allocations as JSON for form submission */}
        <input type="hidden" name="allocations_json" value={JSON.stringify(allocations)} />
      </CardContent>
    </Card>
  )
}
