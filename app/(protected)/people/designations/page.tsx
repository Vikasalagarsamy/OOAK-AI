"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import DesignationList from "@/components/designation-list"
import DesignationForm from "@/components/designation-form"
import type { Designation } from "@/types/designation"
import type { Department } from "@/types/department"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function DesignationsPage() {
  const [designations, setDesignations] = useState<Designation[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("view")
  const [editingDesignation, setEditingDesignation] = useState<Designation | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)

        // Fetch departments
        const { data: departmentsData, error: departmentsError } = await supabase
          .from("departments")
          .select("*")
          .order("name")

        if (departmentsError) throw departmentsError

        // Fetch designations
        const { data: designationsData, error: designationsError } = await supabase
          .from("designations")
          .select("*")
          .order("name")

        if (designationsError) throw designationsError

        setDepartments(departmentsData || [])
        setDesignations(designationsData || [])
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

  const handleAddDesignation = async (designation: Omit<Designation, "id" | "created_at" | "updated_at">) => {
    try {
      const { data, error } = await supabase.from("designations").insert([designation]).select()

      if (error) throw error

      if (data && data.length > 0) {
        setDesignations([...designations, data[0]])
      }

      return { success: true, data }
    } catch (error: any) {
      console.error("Error adding designation:", error)
      return {
        success: false,
        error: {
          message:
            error.code === "23505" ? "A designation with this name already exists in this department." : error.message,
        },
      }
    }
  }

  const handleUpdateDesignation = async (designation: Omit<Designation, "id" | "created_at" | "updated_at">) => {
    if (!editingDesignation) return { success: false }

    try {
      const { data, error } = await supabase
        .from("designations")
        .update(designation)
        .eq("id", editingDesignation.id)
        .select()

      if (error) throw error

      if (data && data.length > 0) {
        setDesignations(
          designations.map((desig) => (desig.id === editingDesignation.id ? { ...desig, ...data[0] } : desig)),
        )
      }

      return { success: true, data }
    } catch (error: any) {
      console.error("Error updating designation:", error)
      return {
        success: false,
        error: {
          message:
            error.code === "23505" ? "A designation with this name already exists in this department." : error.message,
        },
      }
    }
  }

  const handleDeleteDesignation = async (id: number) => {
    try {
      const { error } = await supabase.from("designations").delete().eq("id", id)

      if (error) throw error

      setDesignations(designations.filter((desig) => desig.id !== id))
      return { success: true }
    } catch (error) {
      console.error("Error deleting designation:", error)
      return { success: false }
    }
  }

  const handleEditDesignation = (designation: Designation) => {
    setEditingDesignation(designation)
    setActiveTab("edit")
  }

  const handleCancelEdit = () => {
    setEditingDesignation(null)
    setActiveTab("view")
  }

  const handleAddNew = () => {
    setEditingDesignation(null)
    setActiveTab("add")
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading designations...</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-3xl font-bold mb-2">Designations</h1>
        <p className="text-muted-foreground">Manage job designations within your organization.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-4xl mx-auto">
        <TabsList className="grid grid-cols-2 mb-8">
          <TabsTrigger value="view">View Designations</TabsTrigger>
          <TabsTrigger value="add">Add Designation</TabsTrigger>
        </TabsList>

        <TabsContent value="view">
          <DesignationList
            designations={designations}
            departments={departments}
            onEditDesignation={handleEditDesignation}
            onAddDesignation={handleAddNew}
            onDeleteDesignation={handleDeleteDesignation}
          />
        </TabsContent>

        <TabsContent value="add">
          <DesignationForm
            departments={departments}
            onSubmit={handleAddDesignation}
            onCancel={() => setActiveTab("view")}
          />
        </TabsContent>

        <TabsContent value="edit">
          {editingDesignation && (
            <DesignationForm
              designation={editingDesignation}
              departments={departments}
              onSubmit={handleUpdateDesignation}
              onCancel={handleCancelEdit}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
