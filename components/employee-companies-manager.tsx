"use client"

import type React from "react"

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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, Pencil, Trash2, X, Save, Loader2, AlertCircle } from "lucide-react"
import type { EmployeeCompany, Company, Branch } from "@/types/employee"
import {
  getCompanies,
  getBranchesByCompany,
  addEmployeeCompany,
  updateEmployeeCompany,
  deleteEmployeeCompany,
  getEmployeeCompanies,
  setPrimaryCompany,
} from "@/actions/employee-actions"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"

interface EmployeeCompaniesManagerProps {
  employeeId: string
  employeeCompanies: EmployeeCompany[]
  setEmployeeCompanies: (companies: EmployeeCompany[]) => void
  onPrimaryCompanyChange?: (companyId: number, branchId: number) => void
}

export function EmployeeCompaniesManager({
  employeeId,
  employeeCompanies,
  setEmployeeCompanies,
  onPrimaryCompanyChange,
}: EmployeeCompaniesManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isPrimaryConfirmDialogOpen, setIsPrimaryConfirmDialogOpen] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("")
  const [selectedCompany, setSelectedCompany] = useState<EmployeeCompany | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [totalAllocation, setTotalAllocation] = useState(0)
  const [availableAllocation, setAvailableAllocation] = useState(100)
  const [loadingMessage, setLoadingMessage] = useState("")

  // Load companies on component mount
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const data = await getCompanies()
        setCompanies(data)
      } catch (error) {
        console.error("Error fetching companies:", error)
        toast({
          title: "Error fetching companies",
          description: "Could not load company data. Please try again.",
          variant: "destructive",
        })
      }
    }

    fetchCompanies()
  }, [])

  // Calculate total allocation and available allocation whenever employee companies change
  useEffect(() => {
    // Calculate total allocation
    const total = employeeCompanies.reduce((sum, ec) => sum + ec.allocation_percentage, 0)
    setTotalAllocation(total)
    setAvailableAllocation(100 - total)
  }, [employeeCompanies])

  // Fetch branches whenever selected company changes
  useEffect(() => {
    const fetchBranches = async () => {
      if (!selectedCompanyId) {
        setBranches([])
        return
      }

      try {
        setLoadingMessage("Loading branches...")
        const data = await getBranchesByCompany(Number.parseInt(selectedCompanyId))
        setBranches(data)
        setLoadingMessage("")

        if (data.length === 0) {
          toast({
            title: "No branches found",
            description: "This company has no branches. Please add a branch first.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error fetching branches:", error)
        setBranches([])
        setLoadingMessage("")
        toast({
          title: "Error fetching branches",
          description: "Failed to load branches for this company.",
          variant: "destructive",
        })
      }
    }

    fetchBranches()
  }, [selectedCompanyId])

  const handleCompanyChange = (value: string) => {
    setSelectedCompanyId(value)
  }

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setLoadingMessage("Adding company allocation...")

    try {
      const formData = new FormData(e.currentTarget)
      await addEmployeeCompany(employeeId, formData)

      // Refresh employee companies
      const updatedCompanies = await getEmployeeCompanies(employeeId)
      setEmployeeCompanies(updatedCompanies)

      // Close dialog and reset form
      setIsAddDialogOpen(false)
      setSelectedCompanyId("")

      toast({
        title: "Company allocation added",
        description: "The company allocation has been successfully added.",
      })
    } catch (error) {
      console.error("Error adding employee company:", error)
      toast({
        title: "Error adding company allocation",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setLoadingMessage("")
    }
  }

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedCompany) return

    setIsSubmitting(true)
    setLoadingMessage("Updating company allocation...")

    try {
      const formData = new FormData(e.currentTarget)
      await updateEmployeeCompany(selectedCompany.id.toString(), formData)

      // Refresh employee companies
      const updatedCompanies = await getEmployeeCompanies(employeeId)
      setEmployeeCompanies(updatedCompanies)

      // Close dialog
      setIsEditDialogOpen(false)

      toast({
        title: "Company allocation updated",
        description: "The company allocation has been successfully updated.",
      })
    } catch (error) {
      console.error("Error updating employee company:", error)
      toast({
        title: "Error updating company allocation",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setLoadingMessage("")
    }
  }

  const handleDelete = async () => {
    if (!selectedCompany) return

    setIsSubmitting(true)
    setLoadingMessage("Deleting company allocation...")

    try {
      await deleteEmployeeCompany(selectedCompany.id.toString(), employeeId)

      // Refresh employee companies
      const updatedCompanies = await getEmployeeCompanies(employeeId)
      setEmployeeCompanies(updatedCompanies)

      // Close dialog
      setIsDeleteDialogOpen(false)

      toast({
        title: "Company allocation deleted",
        description: "The company allocation has been successfully deleted.",
      })
    } catch (error) {
      console.error("Error deleting employee company:", error)
      toast({
        title: "Error deleting company allocation",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setLoadingMessage("")
    }
  }

  const handleSetPrimary = async (allocation: EmployeeCompany) => {
    if (allocation.is_primary) return

    setSelectedCompany(allocation)
    setIsPrimaryConfirmDialogOpen(true)
  }

  const confirmSetPrimary = async () => {
    if (!selectedCompany) return

    setIsSubmitting(true)
    setLoadingMessage("Setting primary company...")

    try {
      await setPrimaryCompany(employeeId, selectedCompany.id.toString())

      // Refresh employee companies
      const updatedCompanies = await getEmployeeCompanies(employeeId)
      setEmployeeCompanies(updatedCompanies)

      // Close dialog
      setIsPrimaryConfirmDialogOpen(false)

      // Notify parent component if callback is provided
      if (onPrimaryCompanyChange) {
        onPrimaryCompanyChange(selectedCompany.company_id, selectedCompany.branch_id)
      }

      toast({
        title: "Primary company updated",
        description: "The primary company has been successfully updated.",
      })
    } catch (error) {
      console.error("Error setting primary company:", error)
      toast({
        title: "Error setting primary company",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setLoadingMessage("")
      setSelectedCompany(null)
    }
  }

  const openEditDialog = (company: EmployeeCompany) => {
    setSelectedCompany(company)
    setSelectedCompanyId(company.company_id.toString())
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (company: EmployeeCompany) => {
    setSelectedCompany(company)
    setIsDeleteDialogOpen(true)
  }

  // Get available companies (those not already allocated)
  const availableCompanies = companies.filter(
    (company) => !employeeCompanies.some((allocation) => allocation.company_id === company.id),
  )

  const renderLoadingOverlay = () => {
    if (!loadingMessage) return null

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <p>{loadingMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 relative">
      {renderLoadingOverlay()}

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
                  <Button
                    disabled={availableCompanies.length === 0}
                    aria-label="Add company allocation"
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Company
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleAddSubmit}>
                    <DialogHeader>
                      <DialogTitle>Add Company Allocation</DialogTitle>
                      <DialogDescription>
                        Assign the employee to work at a company and branch with a specific allocation percentage.
                      </DialogDescription>
                    </DialogHeader>

                    {availableCompanies.length === 0 ? (
                      <Alert variant="destructive" className="my-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          No more companies available to allocate. The employee is already allocated to all available
                          companies.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="grid gap-4 py-4">
                        <input type="hidden" name="employee_id" value={employeeId} />

                        <div className="grid gap-2">
                          <Label htmlFor="company_id">Company</Label>
                          <Select name="company_id" onValueChange={handleCompanyChange} required>
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

                        <div className="grid gap-2">
                          <Label htmlFor="branch_id">Branch</Label>
                          <Select name="branch_id" disabled={!selectedCompanyId || branches.length === 0} required>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  !selectedCompanyId
                                    ? "Select company first"
                                    : branches.length === 0
                                      ? "No branches available"
                                      : "Select branch"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {branches.map((branch) => (
                                <SelectItem key={branch.id} value={branch.id.toString()}>
                                  {branch.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {selectedCompanyId && branches.length === 0 && (
                            <p className="text-xs text-destructive">
                              This company has no branches. Please add a branch first.
                            </p>
                          )}
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="allocation_percentage">Allocation Percentage</Label>
                          <Input
                            id="allocation_percentage"
                            name="allocation_percentage"
                            type="number"
                            min="1"
                            max={availableAllocation > 0 ? availableAllocation : 100}
                            defaultValue={availableAllocation > 0 ? availableAllocation : 100}
                            required
                          />
                          {availableAllocation <= 0 ? (
                            <p className="text-xs text-amber-500">
                              Total allocation will exceed 100%. You may need to adjust other allocations after adding
                              this one.
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">Maximum available: {availableAllocation}%</p>
                          )}
                        </div>
                      </div>
                    )}

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddDialogOpen(false)}
                        disabled={isSubmitting}
                        className="flex items-center gap-2"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={
                          isSubmitting || availableCompanies.length === 0 || !selectedCompanyId || branches.length === 0
                        }
                        className="flex items-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4" />
                            Add
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
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

      {availableCompanies.length === 0 && employeeCompanies.length > 0 && (
        <Alert variant="info" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            All available companies have been allocated. Due to database constraints, an employee can only be allocated
            to a company once.
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Allocation %</TableHead>
              <TableHead>Primary</TableHead>
              <TableHead className="w-[140px] text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employeeCompanies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No company allocations found
                </TableCell>
              </TableRow>
            ) : (
              employeeCompanies.map((company) => (
                <TableRow key={company.id} className={company.is_primary ? "bg-muted/20" : ""}>
                  <TableCell className="font-medium">{company.company_name}</TableCell>
                  <TableCell>{company.branch_name}</TableCell>
                  <TableCell>{company.allocation_percentage}%</TableCell>
                  <TableCell>
                    {company.is_primary ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        Primary
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      {!company.is_primary && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSetPrimary(company)}
                                className="h-8 px-2 text-xs"
                              >
                                Set Primary
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Make this the primary company</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(company)}
                              aria-label="Edit company allocation"
                            >
                              <Pencil className="h-4 w-4" />
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
                              onClick={() => openDeleteDialog(company)}
                              disabled={company.is_primary && employeeCompanies.length > 1}
                              aria-label="Delete company allocation"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {company.is_primary && employeeCompanies.length > 1
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          {selectedCompany && (
            <form onSubmit={handleEditSubmit}>
              <DialogHeader>
                <DialogTitle>Edit Company Allocation</DialogTitle>
                <DialogDescription>
                  Update the employee's work allocation for this company and branch.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <input type="hidden" name="employee_id" value={employeeId} />

                <div className="grid gap-2">
                  <Label htmlFor="company_id">Company</Label>
                  <Input id="company_id" name="company_id" type="hidden" value={selectedCompany.company_id} />
                  <div className="p-2 border rounded-md bg-muted/20">{selectedCompany.company_name}</div>
                  <p className="text-xs text-muted-foreground">Company cannot be changed due to database constraints</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="branch_id">Branch</Label>
                  <Select name="branch_id" defaultValue={selectedCompany.branch_id.toString()} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
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
                    name="allocation_percentage"
                    type="number"
                    min="1"
                    max={availableAllocation + selectedCompany.allocation_percentage}
                    defaultValue={selectedCompany.allocation_percentage}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum available: {availableAllocation + selectedCompany.allocation_percentage}%
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={isSubmitting}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Update
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this allocation?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove the employee's allocation to
              {selectedCompany && (
                <span className="font-medium">
                  {" "}
                  {selectedCompany.company_name} ({selectedCompany.branch_name})
                </span>
              )}
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting} className="flex items-center gap-2">
              <X className="h-4 w-4" />
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Set Primary Confirmation Dialog */}
      <AlertDialog open={isPrimaryConfirmDialogOpen} onOpenChange={setIsPrimaryConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Set as primary company?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to set
              {selectedCompany && (
                <span className="font-medium">
                  {" "}
                  {selectedCompany.company_name} ({selectedCompany.branch_name})
                </span>
              )}{" "}
              as the primary company for this employee? This will update the employee's primary company and home branch.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting} className="flex items-center gap-2">
              <X className="h-4 w-4" />
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmSetPrimary} disabled={isSubmitting} className="flex items-center gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Setting Primary...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Set as Primary
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
