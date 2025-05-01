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
import { Plus, Pencil, Trash2, X, Save, Loader2 } from "lucide-react"
import type { EmployeeCompany, Company, Branch } from "@/types/employee"
import {
  getCompanies,
  getBranchesByCompany,
  addEmployeeCompany,
  updateEmployeeCompany,
  deleteEmployeeCompany,
  getEmployeeCompanies,
} from "@/actions/employee-actions"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface EmployeeCompaniesManagerProps {
  employeeId: string
  employeeCompanies: EmployeeCompany[]
  setEmployeeCompanies: (companies: EmployeeCompany[]) => void
}

export function EmployeeCompaniesManager({
  employeeId,
  employeeCompanies,
  setEmployeeCompanies,
}: EmployeeCompaniesManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("")
  const [selectedCompany, setSelectedCompany] = useState<EmployeeCompany | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [totalAllocation, setTotalAllocation] = useState(0)
  const [availableAllocation, setAvailableAllocation] = useState(100)

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const data = await getCompanies()
        setCompanies(data)
      } catch (error) {
        console.error("Error fetching companies:", error)
      }
    }

    fetchCompanies()
  }, [])

  useEffect(() => {
    // Calculate total allocation
    const total = employeeCompanies.reduce((sum, ec) => sum + ec.allocation_percentage, 0)
    setTotalAllocation(total)
    setAvailableAllocation(100 - total)
  }, [employeeCompanies])

  useEffect(() => {
    const fetchBranches = async () => {
      if (!selectedCompanyId) {
        setBranches([])
        return
      }

      try {
        const data = await getBranchesByCompany(Number.parseInt(selectedCompanyId))
        setBranches(data)
      } catch (error) {
        console.error("Error fetching branches:", error)
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

    try {
      await addEmployeeCompany(employeeId, new FormData(e.currentTarget))
      const updatedCompanies = await getEmployeeCompanies(employeeId)
      setEmployeeCompanies(updatedCompanies)
      setIsAddDialogOpen(false)
      setSelectedCompanyId("")
    } catch (error) {
      console.error("Error adding employee company:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedCompany) return

    setIsSubmitting(true)

    try {
      await updateEmployeeCompany(selectedCompany.id.toString(), new FormData(e.currentTarget))
      const updatedCompanies = await getEmployeeCompanies(employeeId)
      setEmployeeCompanies(updatedCompanies)
      setIsEditDialogOpen(false)
    } catch (error) {
      console.error("Error updating employee company:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedCompany) return

    setIsSubmitting(true)

    try {
      await deleteEmployeeCompany(selectedCompany.id.toString(), employeeId)
      const updatedCompanies = await getEmployeeCompanies(employeeId)
      setEmployeeCompanies(updatedCompanies)
      setIsDeleteDialogOpen(false)
    } catch (error) {
      console.error("Error deleting employee company:", error)
    } finally {
      setIsSubmitting(false)
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
                  <Button disabled={availableAllocation <= 0} aria-label="Add company allocation">
                    <Plus className="h-4 w-4 mr-2" />
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
                    <div className="grid gap-4 py-4">
                      <input type="hidden" name="employee_id" value={employeeId} />

                      <div className="grid gap-2">
                        <Label htmlFor="company_id">Company</Label>
                        <Select name="company_id" onValueChange={handleCompanyChange} required>
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
                        <Select name="branch_id" disabled={!selectedCompanyId} required>
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
                          name="allocation_percentage"
                          type="number"
                          min="1"
                          max={availableAllocation}
                          defaultValue={availableAllocation > 0 ? availableAllocation : 0}
                          required
                        />
                        <p className="text-xs text-muted-foreground">Maximum available: {availableAllocation}%</p>
                      </div>
                    </div>
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
                      <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
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
            {employeeCompanies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No company allocations found
                </TableCell>
              </TableRow>
            ) : (
              employeeCompanies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell>{company.company_name}</TableCell>
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
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(company)}
                              disabled={company.is_primary}
                              aria-label="Edit company allocation"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{company.is_primary ? "Cannot edit primary company" : "Edit allocation"}</p>
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
                              disabled={company.is_primary}
                              aria-label="Delete company allocation"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{company.is_primary ? "Cannot delete primary company" : "Delete allocation"}</p>
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
                  <Select
                    name="company_id"
                    onValueChange={handleCompanyChange}
                    defaultValue={selectedCompany.company_id.toString()}
                    required
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
    </div>
  )
}
