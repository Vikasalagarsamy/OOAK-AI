"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import CompanyList from "./company-list"
import AddCompanyForm from "./add-company-form"
import AddBranchForm from "./add-branch-form"
import EditCompanyModal from "./edit-company-modal"
import EditBranchModal from "./edit-branch-modal"
import type { Company, Branch } from "@/types/company"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function CompanyManager() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Edit modal states
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)

        // Fetch companies via API
        const companiesResponse = await fetch('/api/companies')
        const companiesData = await companiesResponse.json()
        
        // Fetch branches via API
        const branchesResponse = await fetch('/api/branches')
        const branchesData = await branchesResponse.json()

        setCompanies(companiesData.companies || [])
        setBranches(branchesData.branches || [])
        
        console.log(`✅ Loaded ${companiesData.companies?.length || 0} companies and ${branchesData.branches?.length || 0} branches`)
      } catch (error) {
        console.error("❌ Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load data. Please refresh the page.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [toast])

  const addCompany = async (company: Omit<Company, "id" | "created_at" | "updated_at">) => {
    try {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(company)
      })

      const result = await response.json()

      if (result.success && result.data && result.data.length > 0) {
        setCompanies([...companies, result.data[0]])
        console.log('✅ Company added successfully:', result.data[0].name)
      }

      return result
    } catch (error) {
      console.error("❌ Error adding company:", error)
      return { success: false, error }
    }
  }

  const updateCompany = async (id: number, updates: Partial<Company>) => {
    try {
      const response = await fetch('/api/companies/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, updates })
      })

      const result = await response.json()

      if (result.success && result.data && result.data.length > 0) {
        setCompanies(companies.map((company) => (company.id === id ? { ...company, ...result.data[0] } : company)))
        console.log('✅ Company updated successfully:', result.data[0].name)
      }

      return result
    } catch (error) {
      console.error("❌ Error updating company:", error)
      return { success: false, error }
    }
  }

  const addBranch = async (branch: Omit<Branch, "id" | "created_at" | "updated_at">) => {
    try {
      const response = await fetch('/api/branches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(branch)
      })

      const result = await response.json()

      if (result.success && result.data && result.data.length > 0) {
        setBranches([...branches, result.data[0]])
        console.log('✅ Branch added successfully:', result.data[0].name)
      }

      return result
    } catch (error) {
      console.error("❌ Error adding branch:", error)
      return { success: false, error }
    }
  }

  const updateBranch = async (id: number, updates: Partial<Branch>) => {
    try {
      const response = await fetch('/api/branches/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, updates })
      })

      const result = await response.json()

      if (result.success && result.data && result.data.length > 0) {
        setBranches(branches.map((branch) => (branch.id === id ? { ...branch, ...result.data[0] } : branch)))
        console.log('✅ Branch updated successfully:', result.data[0].name)
      }

      return result
    } catch (error) {
      console.error("❌ Error updating branch:", error)
      return { success: false, error }
    }
  }

  // Get branches for a specific company
  const getBranchesForCompany = (companyId: number) => {
    return branches.filter((branch) => branch.company_id === companyId)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading data...</span>
      </div>
    )
  }

  return (
    <>
      <Tabs defaultValue="companies" className="w-full max-w-4xl mx-auto">
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="companies">View Companies</TabsTrigger>
          <TabsTrigger value="add-company">Add Company</TabsTrigger>
          <TabsTrigger value="add-branch">Add Branch</TabsTrigger>
        </TabsList>

        <TabsContent value="companies">
          <CompanyList
            companies={companies}
            getBranchesForCompany={getBranchesForCompany}
            onEditCompany={setEditingCompany}
            onEditBranch={setEditingBranch}
          />
        </TabsContent>

        <TabsContent value="add-company">
          <AddCompanyForm onAddCompany={addCompany} />
        </TabsContent>

        <TabsContent value="add-branch">
          <AddBranchForm companies={companies} onAddBranch={addBranch} />
        </TabsContent>
      </Tabs>

      {/* Edit Company Modal */}
      {editingCompany && (
        <EditCompanyModal
          company={editingCompany}
          open={!!editingCompany}
          onOpenChange={(open) => !open && setEditingCompany(null)}
          onUpdateCompany={updateCompany}
        />
      )}

      {/* Edit Branch Modal */}
      {editingBranch && (
        <EditBranchModal
          branch={editingBranch}
          companies={companies}
          open={!!editingBranch}
          onOpenChange={(open) => !open && setEditingBranch(null)}
          onUpdateBranch={updateBranch}
        />
      )}
    </>
  )
}
