"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { deleteEmployee, getEmployeeCompanies } from "@/actions/employee-actions"
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
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { useEffect } from "react"

interface EmployeeDetailViewProps {
  employee: Employee
}

export function EmployeeDetailView({ employee }: EmployeeDetailViewProps) {
  const router = useRouter()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [employeeCompanies, setEmployeeCompanies] = useState<EmployeeCompany[]>([])
  const [isLoadingAllocations, setIsLoadingAllocations] = useState(true)

  useEffect(() => {
    const fetchEmployeeCompanies = async () => {
      try {
        setIsLoadingAllocations(true)
        const data = await getEmployeeCompanies(employee.id.toString())
        setEmployeeCompanies(data)
      } catch (error) {
        console.error("Error fetching employee companies:", error)
        toast({
          title: "Error",
          description: "Failed to load company allocations",
          variant: "destructive",
        })
      } finally {
        setIsLoadingAllocations(false)
      }
    }

    fetchEmployeeCompanies()
  }, [employee.id])

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      await deleteEmployee(employee.id.toString())
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

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

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
              <span className="text-sm">{employee.departments?.name || "N/A"}</span>
            </div>

            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Designation:</span>
              <span className="text-sm">{employee.designations?.name || "N/A"}</span>
            </div>

            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Primary Company:</span>
              <span className="text-sm">{employee.companies?.name || "N/A"}</span>
            </div>

            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Home Branch:</span>
              <span className="text-sm">{employee.branches?.name || "N/A"}</span>
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

      <Tabs defaultValue="company-allocations" className="w-full">
        <TabsList>
          <TabsTrigger value="company-allocations">Company Allocations</TabsTrigger>
          <TabsTrigger value="work-history">Work History</TabsTrigger>
        </TabsList>
        <TabsContent value="company-allocations" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Company Allocations</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingAllocations ? (
                <div className="text-center py-4">Loading allocations...</div>
              ) : employeeCompanies.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <p>No company allocations found</p>
                  <Button variant="outline" className="mt-2" asChild>
                    <Link href={`/people/employees/${employee.id}/edit`}>Add Company Allocation</Link>
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Allocation %</TableHead>
                      <TableHead>Primary</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeeCompanies.map((company) => (
                      <TableRow key={company.id} className={company.is_primary ? "bg-muted/20" : ""}>
                        <TableCell className="font-medium">{company.company_name}</TableCell>
                        <TableCell>{company.branch_name}</TableCell>
                        <TableCell>{company.allocation_percentage}%</TableCell>
                        <TableCell>
                          {company.is_primary ? (
                            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                              Primary
                            </Badge>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={2} className="text-right font-medium">
                        Total Allocation:
                      </TableCell>
                      <TableCell colSpan={2} className="font-medium">
                        {employeeCompanies.reduce((sum, company) => sum + company.allocation_percentage, 0)}%
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
              <div className="mt-4 flex justify-end">
                <Button variant="outline" asChild>
                  <Link href={`/people/employees/${employee.id}/edit`}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Manage Allocations
                  </Link>
                </Button>
              </div>
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
                <p>Work history information not available</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <DeleteEmployeeDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onDelete={handleDelete}
        isDeleting={isDeleting}
        employeeName={`${employee.first_name} ${employee.last_name}`}
      />
    </div>
  )
}
