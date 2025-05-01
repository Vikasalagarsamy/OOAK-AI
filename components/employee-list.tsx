"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Eye, Pencil, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DeleteEmployeeDialog } from "@/components/delete-employee-dialog"
import { BatchDeleteEmployeesDialog } from "@/components/batch-delete-employees-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Employee } from "@/types/employee"

export function EmployeeList() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null)
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([])
  const [batchDeleteDialogOpen, setBatchDeleteDialogOpen] = useState(false)
  const [selectAll, setSelectAll] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchEmployees()
  }, [])

  useEffect(() => {
    // Update selectAll state based on whether all employees are selected
    if (employees.length > 0 && selectedEmployees.length === employees.length) {
      setSelectAll(true)
    } else {
      setSelectAll(false)
    }
  }, [selectedEmployees, employees])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("employees")
        .select(`
          *,
          departments(name),
          companies:primary_company_id(name)
        `)
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      // Transform the data to include department and company names
      const transformedData =
        data?.map((employee) => ({
          ...employee,
          department: employee.departments?.name || "Not Assigned",
          primary_company: employee.companies?.name || "Not Assigned",
        })) || []

      setEmployees(transformedData)
    } catch (error) {
      console.error("Error fetching employees:", error)
      toast({
        title: "Error",
        description: "Failed to fetch employees. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEmployee = (employee: Employee) => {
    setEmployeeToDelete(employee)
    setDeleteDialogOpen(true)
  }

  const handleEmployeeDeleted = (employeeId: string) => {
    setEmployees((prevEmployees) => prevEmployees.filter((emp) => emp.id.toString() !== employeeId))
    setSelectedEmployees((prevSelected) => prevSelected.filter((emp) => emp.id.toString() !== employeeId))
  }

  const handleBatchEmployeesDeleted = (deletedIds: string[]) => {
    setEmployees((prevEmployees) => prevEmployees.filter((emp) => !deletedIds.includes(emp.id.toString())))
    setSelectedEmployees([])
  }

  const toggleEmployeeSelection = (employee: Employee) => {
    setSelectedEmployees((prevSelected) => {
      const isSelected = prevSelected.some((emp) => emp.id === employee.id)
      if (isSelected) {
        return prevSelected.filter((emp) => emp.id !== employee.id)
      } else {
        return [...prevSelected, employee]
      }
    })
  }

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedEmployees([])
    } else {
      setSelectedEmployees([...employees])
    }
    setSelectAll(!selectAll)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Employees</h2>
        <div className="flex gap-2">
          {selectedEmployees.length > 0 && (
            <Button variant="destructive" size="sm" onClick={() => setBatchDeleteDialogOpen(true)}>
              Delete Selected ({selectedEmployees.length})
            </Button>
          )}
          <Link href="/people/employees/add">
            <Button>Add Employee</Button>
          </Link>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox checked={selectAll} onCheckedChange={toggleSelectAll} aria-label="Select all employees" />
              </TableHead>
              <TableHead>Employee ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Job Title</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Primary Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4">
                  Loading employees...
                </TableCell>
              </TableRow>
            ) : employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4">
                  No employees found. Add your first employee to get started.
                </TableCell>
              </TableRow>
            ) : (
              employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedEmployees.some((emp) => emp.id === employee.id)}
                      onCheckedChange={() => toggleEmployeeSelection(employee)}
                      aria-label={`Select ${employee.first_name} ${employee.last_name}`}
                    />
                  </TableCell>
                  <TableCell>{employee.employee_id}</TableCell>
                  <TableCell>
                    {employee.first_name} {employee.last_name}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={employee.email || ""}>
                    {employee.email}
                  </TableCell>
                  <TableCell>{employee.job_title}</TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell>{employee.primary_company}</TableCell>
                  <TableCell>
                    <Badge variant={employee.status === "Active" ? "default" : "secondary"}>{employee.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center space-x-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link href={`/people/employees/${employee.id}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Eye className="h-4 w-4 text-blue-600" />
                                <span className="sr-only">View employee</span>
                              </Button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View employee details</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link href={`/people/employees/${employee.id}/edit`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Pencil className="h-4 w-4 text-green-600" />
                                <span className="sr-only">Edit employee</span>
                              </Button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit employee information</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDeleteEmployee(employee)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                              <span className="sr-only">Delete employee</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Delete employee</p>
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

      {employeeToDelete && (
        <DeleteEmployeeDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          employee={employeeToDelete}
          onEmployeeDeleted={handleEmployeeDeleted}
        />
      )}

      <BatchDeleteEmployeesDialog
        open={batchDeleteDialogOpen}
        onOpenChange={setBatchDeleteDialogOpen}
        selectedEmployees={selectedEmployees}
        onEmployeesDeleted={handleBatchEmployeesDeleted}
      />
    </div>
  )
}
