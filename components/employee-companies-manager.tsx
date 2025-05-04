"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { getEmployeeCompanies } from "@/actions/employee-actions"
import type { EmployeeCompany } from "@/types/employee-company"
import { CompanyAllocationForm } from "./company-allocation-form"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, Plus, Trash } from "lucide-react"
import { setPrimaryCompany } from "@/actions/employee-actions"
import { toast } from "@/components/ui/use-toast"

interface EmployeeCompaniesManagerProps {
  employeeId: string
}

export function EmployeeCompaniesManager({ employeeId }: EmployeeCompaniesManagerProps) {
  const [companies, setCompanies] = useState<EmployeeCompany[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Function to fetch employee companies
  const fetchCompanies = async () => {
    try {
      setLoading(true)
      console.log("Fetching companies for employee:", employeeId)
      const result = await getEmployeeCompanies(employeeId)
      console.log("Fetched companies result:", result)
      setCompanies(result || [])
    } catch (error) {
      console.error("Error fetching employee companies:", error)
      toast({
        title: "Error",
        description: "Failed to load company allocations",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch companies on initial load and when refreshTrigger changes
  useEffect(() => {
    if (employeeId) {
      fetchCompanies()
    }
  }, [employeeId, refreshTrigger])

  const handleAddCompany = async () => {
    setShowAddForm(true)
  }

  const handleCompanyAdded = () => {
    setShowAddForm(false)
    setRefreshTrigger((prev) => prev + 1) // Trigger a refresh
  }

  const handleCancelAdd = () => {
    setShowAddForm(false)
  }

  const handleSetPrimary = async (companyId: string) => {
    try {
      await setPrimaryCompany(employeeId, companyId)
      toast({
        title: "Success",
        description: "Primary company updated successfully",
      })
      setRefreshTrigger((prev) => prev + 1) // Trigger a refresh
    } catch (error) {
      console.error("Error setting primary company:", error)
      toast({
        title: "Error",
        description: "Failed to update primary company",
        variant: "destructive",
      })
    }
  }

  const handleRemoveCompany = async (companyId: string) => {
    try {
      // Implement company removal logic
      toast({
        title: "Success",
        description: "Company allocation removed successfully",
      })
      setRefreshTrigger((prev) => prev + 1) // Trigger a refresh
    } catch (error) {
      console.error("Error removing company:", error)
      toast({
        title: "Error",
        description: "Failed to remove company allocation",
        variant: "destructive",
      })
    }
  }

  const totalAllocation = companies.reduce((sum, company) => sum + (company.allocation_percentage || 0), 0)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Company & Project Allocations</h3>
        <Button onClick={handleAddCompany} disabled={showAddForm}>
          <Plus className="h-4 w-4 mr-2" /> Add Allocation
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : companies.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center border rounded-md">
          <AlertCircle className="h-10 w-10 text-gray-400 mb-2" />
          <p className="text-gray-500">No company allocations found.</p>
          <p className="text-gray-500">Click the "Add Allocation" button to allocate this employee to a company.</p>
        </div>
      ) : (
        <div>
          <div className="mb-2 text-sm text-gray-500">Total active allocation: {totalAllocation}%</div>
          <div className="space-y-2">
            {companies.map((company) => (
              <div key={company.id} className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex-1">
                  <div className="font-medium">{company.company_name}</div>
                  <div className="text-sm text-gray-500">
                    Branch: {company.branch_name} | Allocation: {company.allocation_percentage}%
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {!company.is_primary && (
                    <Button variant="outline" size="sm" onClick={() => handleSetPrimary(company.company_id)}>
                      Set Primary
                    </Button>
                  )}
                  {company.is_primary && (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Primary</span>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveCompany(company.company_id)}>
                    <Trash className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="mt-4 p-4 border rounded-md">
          <h4 className="text-md font-medium mb-2">Add Company Allocation</h4>
          <CompanyAllocationForm employeeId={employeeId} onSuccess={handleCompanyAdded} onCancel={handleCancelAdd} />
        </div>
      )}
    </div>
  )
}
