"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getEmployee, getEmployeeCompanies } from "@/actions/employee-actions"
import type { Employee, EmployeeCompany } from "@/types/employee"
import { EmployeeCompaniesManager } from "./employee-companies-manager"
import { Pencil, Trash2, Building, Users, Briefcase, Mail, Phone, MapPin, Calendar } from "lucide-react"
import Link from "next/link"
import { DeleteEmployeeDialog } from "./delete-employee-dialog"

interface EmployeeDetailViewProps {
  id: string
}

export function EmployeeDetailView({ id }: EmployeeDetailViewProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [employeeCompanies, setEmployeeCompanies] = useState<EmployeeCompany[]>([])
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if we're on the add page
        if (pathname === "/people/employees/add") {
          setIsLoading(false)
          return
        }

        const [empData, empCompanies] = await Promise.all([getEmployee(id), getEmployeeCompanies(id)])

        setEmployee(empData)
        setEmployeeCompanies(empCompanies)
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching employee data:", error)
        setIsLoading(false)
      }
    }

    fetchData()
  }, [id, pathname])

  // If we're on the add page, don't render the detail view
  if (pathname === "/people/employees/add") {
    return null
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading employee data...</div>
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h3 className="text-lg font-medium">Employee not found</h3>
        <p className="text-muted-foreground">The employee you are looking for does not exist or has been deleted.</p>
        <Button className="mt-4" onClick={() => router.push("/people/employees")}>
          Back to Employees
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">
            {employee.first_name} {employee.last_name}
          </h2>
          <p className="text-muted-foreground">{employee.employee_id}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/people/employees/${id}/edit`}>
            <Button variant="outline">
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="companies">Company Allocations</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {employee.email && (
                  <div className="flex items-start gap-2">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-muted-foreground">{employee.email}</p>
                    </div>
                  </div>
                )}

                {employee.phone && (
                  <div className="flex items-start gap-2">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Phone</p>
                      <p className="text-muted-foreground">{employee.phone}</p>
                    </div>
                  </div>
                )}

                {employee.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Address</p>
                      <p className="text-muted-foreground">
                        {employee.address}
                        {employee.city && `, ${employee.city}`}
                        {employee.state && `, ${employee.state}`}
                        {employee.zip_code && ` ${employee.zip_code}`}
                        {employee.country && `, ${employee.country}`}
                      </p>
                    </div>
                  </div>
                )}

                {employee.hire_date && (
                  <div className="flex items-start gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Hire Date</p>
                      <p className="text-muted-foreground">{new Date(employee.hire_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}

                {employee.termination_date && (
                  <div className="flex items-start gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Termination Date</p>
                      <p className="text-muted-foreground">
                        {new Date(employee.termination_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2">
                  <div>
                    <p className="font-medium">Status</p>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        employee.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {employee.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Organization Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {employee.job_title && (
                  <div className="flex items-start gap-2">
                    <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Job Title</p>
                      <p className="text-muted-foreground">{employee.job_title}</p>
                    </div>
                  </div>
                )}

                {employee.department_name && (
                  <div className="flex items-start gap-2">
                    <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Department</p>
                      <p className="text-muted-foreground">{employee.department_name}</p>
                    </div>
                  </div>
                )}

                {employee.designation_name && (
                  <div className="flex items-start gap-2">
                    <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Designation</p>
                      <p className="text-muted-foreground">{employee.designation_name}</p>
                    </div>
                  </div>
                )}

                {employee.primary_company_name && (
                  <div className="flex items-start gap-2">
                    <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Primary Company</p>
                      <p className="text-muted-foreground">{employee.primary_company_name}</p>
                    </div>
                  </div>
                )}

                {employee.home_branch_name && (
                  <div className="flex items-start gap-2">
                    <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Home Branch</p>
                      <p className="text-muted-foreground">{employee.home_branch_name}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="companies">
          <Card>
            <CardHeader>
              <CardTitle>Company Allocations</CardTitle>
              <CardDescription>
                Manage employee work allocations across different companies and branches. Total allocation percentage
                cannot exceed 100%.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmployeeCompaniesManager
                employeeId={id}
                employeeCompanies={employeeCompanies}
                setEmployeeCompanies={setEmployeeCompanies}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <DeleteEmployeeDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} employee={employee} />
    </div>
  )
}
