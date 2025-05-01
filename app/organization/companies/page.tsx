"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import CompanyList from "@/components/company-list"
import AddCompanyForm from "@/components/add-company-form"
import EditCompanyModal from "@/components/edit-company-modal"
import type { Company, Branch } from "@/types/company"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Edit modal states
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)

        // Fetch companies
        const { data: companiesData, error: companiesError } = await supabase.from("companies").select("*")

        if (companiesError) throw companiesError

        // Fetch branches
        const { data: branchesData, error: branchesError } = await supabase.from("branches").select("*")

        if (branchesError) throw branchesError

        setCompanies(companiesData || [])
        setBranches(branchesData || [])
      } catch (error) {
        console.error("Error fetching data:", error)
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
      const { data, error } = await supabase.from("companies").insert([company]).select()

      if (error) throw error

      if (data && data.length > 0) {
        setCompanies([...companies, data[0]])
      }

      return { success: true, data }
    } catch (error) {
      console.error("Error adding company:", error)
      return { success: false, error }
    }
  }

  const updateCompany = async (id: number, updates: Partial<Company>) => {
    try {
      const { data, error } = await supabase.from("companies").update(updates).eq("id", id).select()

      if (error) throw error

      if (data && data.length > 0) {
        setCompanies(companies.map((company) => (company.id === id ? { ...company, ...data[0] } : company)))
      }

      return { success: true, data }
    } catch (error) {
      console.error("Error updating company:", error)
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
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-3xl font-bold mb-2">Companies</h1>
        <p className="text-muted-foreground">Manage your companies and their details.</p>
      </div>

      <Tabs defaultValue="view" className="w-full max-w-4xl mx-auto">
        <TabsList className="grid grid-cols-2 mb-8">
          <TabsTrigger value="view">View Companies</TabsTrigger>
          <TabsTrigger value="add">Add Company</TabsTrigger>
        </TabsList>

        <TabsContent value="view">
          <CompanyList
            companies={companies}
            getBranchesForCompany={getBranchesForCompany}
            onEditCompany={setEditingCompany}
            onEditBranch={() => {}} // We'll handle branch editing in the branches page
          />
        </TabsContent>

        <TabsContent value="add">
          <AddCompanyForm onAddCompany={addCompany} />
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      {editingCompany && (
        <EditCompanyModal
          company={editingCompany}
          open={!!editingCompany}
          onOpenChange={(open) => !open && setEditingCompany(null)}
          onUpdateCompany={updateCompany}
        />
      )}
    </div>
  )
}
