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

        // Fetch companies using PostgreSQL
        const companiesResult = await query("SELECT * FROM companies ORDER BY name", [])
        
        // Fetch branches using PostgreSQL
        const branchesResult = await query("SELECT * FROM branches ORDER BY name", [])

        setCompanies(companiesResult.rows || [])
        setBranches(branchesResult.rows || [])
        
        console.log(`✅ Loaded ${companiesResult.rows?.length || 0} companies and ${branchesResult.rows?.length || 0} branches`)
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
      const result = await query(
        `INSERT INTO companies (name, address, email, phone, website, tax_id, registration_number, founded_date, company_code) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
         RETURNING *`,
        [
          company.name,
          company.address,
          company.email || null,
          company.phone || null,
          company.website || null,
          company.tax_id || null,
          company.registration_number || null,
          company.founded_date || null,
          company.company_code
        ]
      )

      if (result.rows && result.rows.length > 0) {
        setCompanies([...companies, result.rows[0]])
        console.log('✅ Company added successfully:', result.rows[0].name)
      }

      return { success: true, data: result.rows }
    } catch (error) {
      console.error("❌ Error adding company:", error)
      return { success: false, error }
    }
  }

  const updateCompany = async (id: number, updates: Partial<Company>) => {
    try {
      // Build dynamic update query
      const updateFields = Object.keys(updates).filter(key => key !== 'id')
      const setClause = updateFields.map((field, index) => `${field} = $${index + 2}`).join(', ')
      const values = [id, ...updateFields.map(field => updates[field as keyof Company])]

      const result = await query(
        `UPDATE companies SET ${setClause} WHERE id = $1 RETURNING *`,
        values
      )

      if (result.rows && result.rows.length > 0) {
        setCompanies(companies.map((company) => (company.id === id ? { ...company, ...result.rows[0] } : company)))
        console.log('✅ Company updated successfully:', result.rows[0].name)
      }

      return { success: true, data: result.rows }
    } catch (error) {
      console.error("❌ Error updating company:", error)
      return { success: false, error }
    }
  }

  const addBranch = async (branch: Omit<Branch, "id" | "created_at" | "updated_at">) => {
    try {
      const result = await query(
        `INSERT INTO branches (name, company_id, location, address, phone, email, manager_name) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING *`,
        [
          branch.name,
          branch.company_id,
          branch.location || null,
          branch.address || null,
          branch.phone || null,
          branch.email || null,
          branch.manager_name || null
        ]
      )

      if (result.rows && result.rows.length > 0) {
        setBranches([...branches, result.rows[0]])
        console.log('✅ Branch added successfully:', result.rows[0].name)
      }

      return { success: true, data: result.rows }
    } catch (error) {
      console.error("❌ Error adding branch:", error)
      return { success: false, error }
    }
  }

  const updateBranch = async (id: number, updates: Partial<Branch>) => {
    try {
      // Build dynamic update query
      const updateFields = Object.keys(updates).filter(key => key !== 'id')
      const setClause = updateFields.map((field, index) => `${field} = $${index + 2}`).join(', ')
      const values = [id, ...updateFields.map(field => updates[field as keyof Branch])]

      const result = await query(
        `UPDATE branches SET ${setClause} WHERE id = $1 RETURNING *`,
        values
      )

      if (result.rows && result.rows.length > 0) {
        setBranches(branches.map((branch) => (branch.id === id ? { ...branch, ...result.rows[0] } : branch)))
        console.log('✅ Branch updated successfully:', result.rows[0].name)
      }

      return { success: true, data: result.rows }
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

      {/* Edit Modals */}
      {editingCompany && (
        <EditCompanyModal
          company={editingCompany}
          open={!!editingCompany}
          onOpenChange={(open) => !open && setEditingCompany(null)}
          onUpdateCompany={updateCompany}
        />
      )}

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
