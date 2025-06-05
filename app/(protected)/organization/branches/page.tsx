"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import BranchList from "@/components/branch-list"
import AddBranchForm from "@/components/add-branch-form"
import EditBranchModal from "@/components/edit-branch-modal"
import type { Company, Branch } from "@/types/company"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function BranchesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Edit modal states
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)

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

  const addBranch = async (branch: Omit<Branch, "id" | "created_at" | "updated_at">) => {
    try {
      const { data, error } = await supabase.from("branches").insert([branch]).select()

      if (error) throw error

      if (data && data.length > 0) {
        setBranches([...branches, data[0]])
      }

      return { success: true, data }
    } catch (error) {
      console.error("Error adding branch:", error)
      return { success: false, error }
    }
  }

  const updateBranch = async (id: number, updates: Partial<Branch>) => {
    try {
      const { data, error } = await supabase.from("branches").update(updates).eq("id", id).select()

      if (error) throw error

      if (data && data.length > 0) {
        setBranches(branches.map((branch) => (branch.id === id ? { ...branch, ...data[0] } : branch)))
      }

      return { success: true, data }
    } catch (error) {
      console.error("Error updating branch:", error)
      return { success: false, error }
    }
  }

  // Get company name by ID
  const getCompanyName = (companyId: number) => {
    const company = companies.find((c) => c.id === companyId)
    return company ? company.name : "Unknown Company"
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
        <h1 className="text-3xl font-bold mb-2">Branches</h1>
        <p className="text-muted-foreground">Manage branches across all companies.</p>
      </div>

      <Tabs defaultValue="view" className="w-full max-w-4xl mx-auto">
        <TabsList className="grid grid-cols-2 mb-8">
          <TabsTrigger value="view">View Branches</TabsTrigger>
          <TabsTrigger value="add">Add Branch</TabsTrigger>
        </TabsList>

        <TabsContent value="view">
          <BranchList branches={branches} getCompanyName={getCompanyName} onEditBranch={setEditingBranch} />
        </TabsContent>

        <TabsContent value="add">
          <AddBranchForm companies={companies} onAddBranch={addBranch} />
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      {editingBranch && (
        <EditBranchModal
          branch={editingBranch}
          companies={companies}
          open={!!editingBranch}
          onOpenChange={(open) => !open && setEditingBranch(null)}
          onUpdateBranch={updateBranch}
        />
      )}
    </div>
  )
}
