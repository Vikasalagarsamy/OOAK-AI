"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import DepartmentList from "@/components/department-list"
import DepartmentForm from "@/components/department-form"
import type { Department } from "@/types/department"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("view")
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const { data, error } = await supabase.from("departments").select("*").order("name")

        if (error) throw error

        setDepartments(data || [])
      } catch (error) {
        console.error("Error fetching departments:", error)
        toast({
          title: "Error",
          description: "Failed to load departments. Please refresh the page.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [toast])

  const handleAddDepartment = async (department: Omit<Department, "id" | "created_at" | "updated_at">) => {
    try {
      const { data, error } = await supabase.from("departments").insert([department]).select()

      if (error) throw error

      if (data && data.length > 0) {
        setDepartments([...departments, data[0]])
      }

      return { success: true, data }
    } catch (error: any) {
      console.error("Error adding department:", error)
      return {
        success: false,
        error: {
          message: error.code === "23505" ? "A department with this name already exists." : error.message,
        },
      }
    }
  }

  const handleUpdateDepartment = async (department: Omit<Department, "id" | "created_at" | "updated_at">) => {
    if (!editingDepartment) return { success: false }

    try {
      const { data, error } = await supabase
        .from("departments")
        .update(department)
        .eq("id", editingDepartment.id)
        .select()

      if (error) throw error

      if (data && data.length > 0) {
        setDepartments(departments.map((dept) => (dept.id === editingDepartment.id ? { ...dept, ...data[0] } : dept)))
      }

      return { success: true, data }
    } catch (error: any) {
      console.error("Error updating department:", error)
      return {
        success: false,
        error: {
          message: error.code === "23505" ? "A department with this name already exists." : error.message,
        },
      }
    }
  }

  const handleDeleteDepartment = async (id: number) => {
    try {
      const { error } = await supabase.from("departments").delete().eq("id", id)

      if (error) throw error

      setDepartments(departments.filter((dept) => dept.id !== id))
      return { success: true }
    } catch (error) {
      console.error("Error deleting department:", error)
      return { success: false }
    }
  }

  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department)
    setActiveTab("edit")
  }

  const handleCancelEdit = () => {
    setEditingDepartment(null)
    setActiveTab("view")
  }

  const handleAddNew = () => {
    setEditingDepartment(null)
    setActiveTab("add")
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading departments...</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-3xl font-bold mb-2">Departments</h1>
        <p className="text-muted-foreground">Manage departments within your organization.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-4xl mx-auto">
        <TabsList className="grid grid-cols-2 mb-8">
          <TabsTrigger value="view">View Departments</TabsTrigger>
          <TabsTrigger value="add">Add Department</TabsTrigger>
        </TabsList>

        <TabsContent value="view">
          <DepartmentList
            departments={departments}
            onEditDepartment={handleEditDepartment}
            onAddDepartment={handleAddNew}
            onDeleteDepartment={handleDeleteDepartment}
          />
        </TabsContent>

        <TabsContent value="add">
          <DepartmentForm onSubmit={handleAddDepartment} onCancel={() => setActiveTab("view")} />
        </TabsContent>

        <TabsContent value="edit">
          {editingDepartment && (
            <DepartmentForm
              department={editingDepartment}
              onSubmit={handleUpdateDepartment}
              onCancel={handleCancelEdit}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
