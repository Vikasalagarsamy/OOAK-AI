"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { deleteEmployee, getEmployee, getEmployeeCompanies } from "@/actions/employee-actions"
import { DeleteEmployeeDialog } from "@/components/delete-employee-dialog"
import type { Employee, EmployeeCompany } from "@/types/employee"
import {
  Pencil,
  Trash2,
  Building2,
  Users,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  FileText,
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { format } from "date-fns"

interface EmployeeDetailViewProps {
  id: string | number
}

export function EmployeeDetailView({ id }: EmployeeDetailViewProps) {
  const router = useRouter()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [employeeCompanies, setEmployeeCompanies] = useState<EmployeeCompany[]>([])
  const [isLoadingEmployee, setIsLoadingEmployee] = useState(true)
  const [isLoadingAllocations, setIsLoadingAllocations] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingEmployee(true)
        // Convert id to number if it's a string and not "add"
        if (id && id !== "add") {
          const employeeData = await getEmployee(id)
          setEmployee(employeeData)

          setIsLoadingAllocations(true)
          if (employeeData) {
            const allocationsData = await getEmployeeCompanies(employeeData.id)
            setEmployeeCompanies(allocationsData)
          }
        }
      } catch (error) {
        console.error("Error fetching employee data:", error)
        toast({
          title: "Error",
          description: "Failed to load employee data",
          variant: "destructive",
        })
      } finally {
        setIsLoadingEmployee(false)
        setIsLoadingAllocations(false)
      }
    }

    if (id) {
      fetchData()
    }
  }, [id])

  const handleDelete = async () => {
    if (!employee) return

    setIsDeleting(true)
    try {
      await deleteEmployee(id)
      router.push("/people/employees")
    } catch (error) {
      console.error("Error deleting employee:", error)
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      toast({
        title: "Error",
        description: "Failed to delete employee",
        variant: "destructive",
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "inactive":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "on_leave":
        return <Clock className="h-4 w-4 text-amber-500" />
      case "terminated":
        return <AlertCircle className="h-4 w-4 text-gray-500" />
      default:
        return <User className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "Active"
      case "inactive":
        return "Inactive"
      case "on_leave":
        return "On Leave"
      case "terminated":
        return "Terminated"
      default:
        return "Unknown"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-red-100 text-red-800"
      case "on_leave":
        return "bg-amber-100 text-amber-800"
      case "terminated":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getAllocationStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case "pending":
        return <Badge className="bg-blue-100 text-blue-800">Pending</Badge>
      case "completed":
        return <Badge className="bg-gray-100 text-gray-800">Completed</Badge>
      case "expired":
        return <Badge className="bg-red-100 text-red-800">Expired</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

  if (isLoadingEmployee) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Loading employee data...</p>
        </div>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center h-48">
        <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
        <h3 className="text-lg font-medium">Employee not found</h3>
        <p className="text-muted-foreground">The employee you are looking for does not exist or has been deleted.</p>
        <Button className="mt-4" onClick={() => router.push("/people/employees")}>
          Back to Employees
        </Button>
      </div>
    )
  }

  // Group allocations by status
  const activeAllocations = employeeCompanies.filter((a) => a.status === "active")
  const pendingAllocations = employeeCompanies.filter((a) => a.status === "pending")
  const completedAllocations = employeeCompanies.filter((a) => a.status === "completed" || a.status === "expired")

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">
          {employee.first_name} {employee.last_name}
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/people/employees/${employee.id}/edit`}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Employee ID:</span>
              <span className="text-sm">{employee.employee_id || "N/A"}</span>
            </div>

            <div className="flex items-center gap-2">
              {getStatusIcon(employee.status || "")}
              <span className="text-sm font-medium">Status:</span>
              <Badge className={getStatusColor(employee.status || "")}>{getStatusText(employee.status || "")}</Badge>
            </div>

            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Email:</span>
              <span className="text-sm">{employee.email || "N/A"}</span>
            </div>

            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Phone:</span>
              <span className="text-sm">{employee.phone || "N/A"}</span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Hire Date:</span>
              <span className="text-sm">{formatDate(employee.hire_date)}</span>
            </div>

            {employee.termination_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Termination Date:</span>
                <span className="text-sm">{formatDate(employee.termination_date)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Organization Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Job Title:</span>
              <span className="text-sm">{employee.job_title || "N/A"}</span>
            </div>

            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Department:</span>
              <span className="text-sm">{employee.department_name || "N/A"}</span>
            </div>

            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Designation:</span>
              <span className="text-sm">{employee.designation_name || "N/A"}</span>
            </div>

            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Primary Company:</span>
              <span className="text-sm">{employee.primary_company_name || "N/A"}</span>
            </div>

            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Home Branch:</span>
              <span className="text-sm">{employee.home_branch_name || "N/A"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Address Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <span className="text-sm font-medium">Address:</span>
                <p className="text-sm whitespace-pre-line">{employee.address || "N/A"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium">City:</span>
                <p className="text-sm">{employee.city || "N/A"}</p>
              </div>
              <div>
                <span className="text-sm font-medium">State/Province:</span>
                <p className="text-sm">{employee.state || "N/A"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium">Zip/Postal Code:</span>
                <p className="text-sm">{employee.zip_code || "N/A"}</p>
              </div>
              <div>
                <span className="text-sm font-medium">Country:</span>
                <p className="text-sm">{employee.country || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active-allocations" className="w-full">
        <TabsList>
          <TabsTrigger value="active-allocations">Active Allocations</TabsTrigger>
          <TabsTrigger value="pending-allocations">Pending Allocations</TabsTrigger>
          <TabsTrigger value="completed-allocations">Completed Allocations</TabsTrigger>
          <TabsTrigger value="work-history">Work History</TabsTrigger>
        </TabsList>

        <TabsContent value="active-allocations" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Active Company & Project Allocations</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingAllocations ? (
                <div className="text-center py-4">Loading allocations...</div>
              ) : activeAllocations.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <p>No active allocations found</p>
                  <Button variant="outline" className="mt-2" asChild>
                    <Link href={`/people/employees/${employee.id}/edit`}>Add Allocation</Link>
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company / Branch</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Allocation %</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Primary</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeAllocations.map((allocation) => (
                      <TableRow key={allocation.id} className={allocation.is_primary ? "bg-muted/20" : ""}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{allocation.company_name}</p>
                            <p className="text-sm text-muted-foreground">{allocation.branch_name}</p>
                          </div>
                        </TableCell>
                        <TableCell>{allocation.project_name || "General"}</TableCell>
                        <TableCell>{allocation.allocation_percentage}%</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">
                              {allocation.start_date
                                ? format(new Date(allocation.start_date), "MMM d, yyyy")
                                : "No start"}
                            </span>
                            {allocation.end_date && (
                              <span className="text-sm text-muted-foreground">
                                to {format(new Date(allocation.end_date), "MMM d, yyyy")}
                              </span>
                            )}
                            {!allocation.end_date && <span className="text-sm text-muted-foreground">No end date</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          {allocation.is_primary ? (
                            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                              Primary
                            </Badge>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={2} className="text-right font-medium">
                        Total Active Allocation:
                      </TableCell>
                      <TableCell colSpan={3} className="font-medium">
                        {activeAllocations.reduce((sum, allocation) => sum + allocation.allocation_percentage, 0)}%
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
              <div className="mt-4 flex justify-end">
                <Button variant="outline" asChild>
                  <Link href={`/people/employees/${employee.id}/edit?tab=allocations`}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Manage Allocations
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending-allocations" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Pending Allocations</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingAllocations ? (
                <div className="text-center py-4">Loading allocations...</div>
              ) : pendingAllocations.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <p>No pending allocations found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company / Branch</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Allocation %</TableHead>
                      <TableHead>Start Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingAllocations.map((allocation) => (
                      <TableRow key={allocation.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{allocation.company_name}</p>
                            <p className="text-sm text-muted-foreground">{allocation.branch_name}</p>
                          </div>
                        </TableCell>
                        <TableCell>{allocation.project_name || "General"}</TableCell>
                        <TableCell>{allocation.allocation_percentage}%</TableCell>
                        <TableCell>
                          {allocation.start_date
                            ? format(new Date(allocation.start_date), "MMM d, yyyy")
                            : "No start date"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed-allocations" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Completed/Expired Allocations</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingAllocations ? (
                <div className="text-center py-4">Loading allocations...</div>
              ) : completedAllocations.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <p>No completed or expired allocations found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company / Branch</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Allocation %</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedAllocations.map((allocation) => (
                      <TableRow key={allocation.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{allocation.company_name}</p>
                            <p className="text-sm text-muted-foreground">{allocation.branch_name}</p>
                          </div>
                        </TableCell>
                        <TableCell>{allocation.project_name || "General"}</TableCell>
                        <TableCell>{allocation.allocation_percentage}%</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">
                              {allocation.start_date
                                ? format(new Date(allocation.start_date), "MMM d, yyyy")
                                : "No start"}
                            </span>
                            {allocation.end_date && (
                              <span className="text-sm text-muted-foreground">
                                to {format(new Date(allocation.end_date), "MMM d, yyyy")}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getAllocationStatusBadge(allocation.status || "")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="work-history" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Work History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                <p>Work history information not available</p>
                <p className="text-sm mt-1">This feature will be available in a future update.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <DeleteEmployeeDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} employee={employee} />
    </div>
  )
}
