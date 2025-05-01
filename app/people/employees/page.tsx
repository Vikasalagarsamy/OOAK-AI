"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus, FileDown, FileUp, Trash2, RefreshCw } from "lucide-react"
import EmployeeList from "@/components/employee-list"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { BatchDeleteEmployeesDialog } from "@/components/batch-delete-employees-dialog"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showBatchDelete, setShowBatchDelete] = useState(false)
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([])
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      setError(null)

      // Try a direct query first - this avoids any issues with stored procedures
      // Remove the location column from the query
      const { data: directData, error: directError } = await supabase
        .from("employees")
        .select(`
          id,
          employee_id,
          first_name,
          last_name,
          email,
          phone,
          job_title,
          status,
          department_id,
          departments(name),
          designation_id,
          designations(name),
          primary_company_id,
          companies:primary_company_id(name),
          home_branch_id,
          branches:home_branch_id(name),
          created_at,
          updated_at
        `)
        .order("created_at", { ascending: false })

      if (directError) {
        console.error("Error with direct query:", directError)

        // Try an even simpler query without any joins
        const { data: simpleData, error: simpleError } = await supabase
          .from("employees")
          .select(`
            id,
            employee_id,
            first_name,
            last_name,
            email,
            phone,
            job_title,
            status,
            department_id,
            designation_id,
            primary_company_id,
            home_branch_id,
            created_at,
            updated_at
          `)
          .order("created_at", { ascending: false })

        if (simpleError) {
          // If even that fails, try the absolute minimum
          const { data: minimalData, error: minimalError } = await supabase
            .from("employees")
            .select()
            .order("created_at", { ascending: false })

          if (minimalError) {
            throw minimalError
          }

          setEmployees(minimalData || [])
        } else {
          setEmployees(simpleData || [])
        }
      } else {
        // Transform the direct query data
        const transformedData =
          directData?.map((employee) => ({
            ...employee,
            department: employee.departments?.name || null,
            designation: employee.designations?.name || null,
            primary_company: employee.companies?.name || null,
            home_branch: employee.branches?.name || null,
          })) || []

        setEmployees(transformedData)
      }
    } catch (error) {
      console.error("Error fetching employees:", error)
      setError("Failed to load employees. Please try again.")
      toast({
        title: "Error",
        description: "Failed to load employees. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEmployee = async (id: number) => {
    try {
      // Try direct delete first
      const { error } = await supabase.from("employees").delete().eq("id", id)

      if (error) {
        console.error("Error deleting employee:", error)
        throw error
      }

      toast({
        title: "Success",
        description: "Employee deleted successfully",
      })

      fetchEmployees()
    } catch (error) {
      console.error("Error deleting employee:", error)
      toast({
        title: "Error",
        description: "Failed to delete employee. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleBatchDelete = async (ids: number[]) => {
    try {
      let successCount = 0
      let errorCount = 0

      // Delete employees one by one
      for (const id of ids) {
        const { error } = await supabase.from("employees").delete().eq("id", id)

        if (error) {
          console.error(`Error deleting employee ${id}:`, error)
          errorCount++
        } else {
          successCount++
        }
      }

      if (successCount > 0) {
        toast({
          title: "Success",
          description: `${successCount} employees deleted successfully${errorCount > 0 ? ` (${errorCount} failed)` : ""}`,
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to delete employees. Please try again.",
          variant: "destructive",
        })
      }

      setSelectedEmployees([])
      fetchEmployees()
    } catch (error) {
      console.error("Error batch deleting employees:", error)
      toast({
        title: "Error",
        description: "Failed to delete employees. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-3xl font-bold mb-2">Employees</h1>
        <p className="text-muted-foreground">Manage your organization's employees.</p>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            <Link href="/people/employees/add">
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Employee
              </Button>
            </Link>
            <Button variant="outline" disabled>
              <FileUp className="mr-2 h-4 w-4" /> Import
            </Button>
            <Button variant="outline" disabled>
              <FileDown className="mr-2 h-4 w-4" /> Export
            </Button>
          </div>
          <div className="flex gap-2">
            {error && (
              <Button variant="outline" onClick={fetchEmployees}>
                <RefreshCw className="mr-2 h-4 w-4" /> Retry
              </Button>
            )}
            <Button
              variant="destructive"
              onClick={() => setShowBatchDelete(true)}
              disabled={selectedEmployees.length === 0}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete Selected ({selectedEmployees.length})
            </Button>
          </div>
        </div>

        {error ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={fetchEmployees}>
                <RefreshCw className="mr-2 h-4 w-4" /> Retry
              </Button>
            </CardContent>
          </Card>
        ) : (
          <EmployeeList
            employees={employees}
            loading={loading}
            onDeleteEmployee={handleDeleteEmployee}
            onEditEmployee={(id) => router.push(`/people/employees/${id}/edit`)}
            onViewEmployee={(id) => router.push(`/people/employees/${id}`)}
            selectedEmployees={selectedEmployees}
            setSelectedEmployees={setSelectedEmployees}
          />
        )}
      </div>

      <BatchDeleteEmployeesDialog
        open={showBatchDelete}
        onOpenChange={setShowBatchDelete}
        selectedCount={selectedEmployees.length}
        onConfirm={() => {
          handleBatchDelete(selectedEmployees)
          setShowBatchDelete(false)
        }}
      />
    </div>
  )
}
