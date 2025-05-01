"use client"

import { useState, useEffect } from "react"
import type { Role } from "@/types/role"
import { RoleList } from "@/components/role-list"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/components/ui/use-toast"

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoading(true)
        // Check if user_roles table exists and has data
        const { data, error } = await supabase.from("user_roles").select("*")

        if (error) {
          console.error("Error fetching roles:", error)
          throw error
        }

        if (data && data.length > 0) {
          // Parse permissions if they're stored as a string
          const parsedRoles = data.map((role: any) => ({
            ...role,
            permissions: typeof role.permissions === "string" ? JSON.parse(role.permissions) : role.permissions || {},
          }))
          setRoles(parsedRoles as Role[])
        } else {
          // If no roles exist, create default roles
          const defaultRoles = createDefaultRoles()
          for (const role of defaultRoles) {
            const { error: insertError } = await supabase.from("user_roles").insert(role)
            if (insertError) {
              console.error("Error inserting default role:", insertError)
            }
          }
          setRoles(defaultRoles)
        }
      } catch (error) {
        console.error("Error in roles setup:", error)
        toast({
          title: "Error",
          description: "Failed to load roles. Using default roles instead.",
          variant: "destructive",
        })
        // Fall back to sample data if database fetch fails
        setRoles(createDefaultRoles())
      } finally {
        setLoading(false)
      }
    }

    fetchRoles()
  }, [supabase, toast])

  const handleRolesChange = async (updatedRoles: Role[]) => {
    try {
      // Update local state immediately for responsive UI
      setRoles(updatedRoles)

      // Save changes to database
      for (const role of updatedRoles) {
        // Ensure permissions is properly formatted as JSONB
        const roleToSave = {
          ...role,
          permissions: typeof role.permissions === "string" ? role.permissions : JSON.stringify(role.permissions),
        }

        const { error } = await supabase.from("user_roles").upsert(roleToSave, { onConflict: "id" })

        if (error) {
          console.error("Error updating role:", error)
          throw error
        }
      }

      toast({
        title: "Success",
        description: "Roles updated successfully",
      })
    } catch (error) {
      console.error("Error updating roles:", error)
      toast({
        title: "Error",
        description: "Failed to update roles. Please try again.",
        variant: "destructive",
      })
    }
  }

  function createDefaultRoles(): Role[] {
    return [
      {
        id: 1,
        name: "Administrator",
        description: "Full access to all features",
        permissions: {
          dashboard: { view: true, read: true, write: true, delete: true },
          organization: { view: true, read: true, write: true, delete: true },
          "organization.companies": { view: true, read: true, write: true, delete: true },
          "organization.branches": { view: true, read: true, write: true, delete: true },
          "organization.vendors": { view: true, read: true, write: true, delete: true },
          "organization.suppliers": { view: true, read: true, write: true, delete: true },
          "organization.clients": { view: true, read: true, write: true, delete: true },
          "organization.roles": { view: true, read: true, write: true, delete: true },
          people: { view: true, read: true, write: true, delete: true },
          "people.employees": { view: true, read: true, write: true, delete: true },
          "people.departments": { view: true, read: true, write: true, delete: true },
          "people.designations": { view: true, read: true, write: true, delete: true },
          sales: { view: true, read: true, write: true, delete: true },
          "sales.create-lead": { view: true, read: true, write: true, delete: true },
          "sales.manage-lead": { view: true, read: true, write: true, delete: true },
          "sales.unassigned-lead": { view: true, read: true, write: true, delete: true },
          "sales.follow-up": { view: true, read: true, write: true, delete: true },
          "sales.quotation": { view: true, read: true, write: true, delete: true },
          "sales.order-confirmation": { view: true, read: true, write: true, delete: true },
          "sales.rejected-leads": { view: true, read: true, write: true, delete: true },
          "sales.lead-sources": { view: true, read: true, write: true, delete: true },
        },
      },
      {
        id: 2,
        name: "Manager",
        description: "Can manage most aspects but with limited deletion rights",
        permissions: {
          dashboard: { view: true, read: true, write: false, delete: false },
          organization: { view: true, read: true, write: true, delete: false },
          "organization.companies": { view: true, read: true, write: true, delete: false },
          "organization.branches": { view: true, read: true, write: true, delete: false },
          "organization.vendors": { view: true, read: true, write: true, delete: false },
          "organization.suppliers": { view: true, read: true, write: true, delete: false },
          "organization.clients": { view: true, read: true, write: true, delete: false },
          "organization.roles": { view: true, read: true, write: false, delete: false },
          people: { view: true, read: true, write: true, delete: false },
          "people.employees": { view: true, read: true, write: true, delete: false },
          "people.departments": { view: true, read: true, write: true, delete: false },
          "people.designations": { view: true, read: true, write: true, delete: false },
          sales: { view: true, read: true, write: true, delete: false },
          "sales.create-lead": { view: true, read: true, write: true, delete: false },
          "sales.manage-lead": { view: true, read: true, write: true, delete: false },
          "sales.unassigned-lead": { view: true, read: true, write: true, delete: false },
          "sales.follow-up": { view: true, read: true, write: true, delete: false },
          "sales.quotation": { view: true, read: true, write: true, delete: false },
          "sales.order-confirmation": { view: true, read: true, write: true, delete: false },
          "sales.rejected-leads": { view: true, read: true, write: true, delete: false },
          "sales.lead-sources": { view: true, read: true, write: true, delete: false },
        },
      },
      {
        id: 3,
        name: "Employee",
        description: "Basic view access with limited editing capabilities",
        permissions: {
          dashboard: { view: true, read: true, write: false, delete: false },
          organization: { view: true, read: true, write: false, delete: false },
          "organization.companies": { view: true, read: true, write: false, delete: false },
          "organization.branches": { view: true, read: true, write: false, delete: false },
          "organization.vendors": { view: true, read: true, write: false, delete: false },
          "organization.suppliers": { view: true, read: true, write: false, delete: false },
          "organization.clients": { view: true, read: true, write: false, delete: false },
          "organization.roles": { view: true, read: false, write: false, delete: false },
          people: { view: true, read: true, write: false, delete: false },
          "people.employees": { view: true, read: true, write: false, delete: false },
          "people.departments": { view: true, read: true, write: false, delete: false },
          "people.designations": { view: true, read: true, write: false, delete: false },
          sales: { view: true, read: true, write: false, delete: false },
          "sales.create-lead": { view: true, read: true, write: false, delete: false },
          "sales.manage-lead": { view: true, read: true, write: false, delete: false },
          "sales.unassigned-lead": { view: true, read: true, write: false, delete: false },
          "sales.follow-up": { view: true, read: true, write: false, delete: false },
          "sales.quotation": { view: true, read: true, write: false, delete: false },
          "sales.order-confirmation": { view: true, read: true, write: false, delete: false },
          "sales.rejected-leads": { view: true, read: true, write: false, delete: false },
          "sales.lead-sources": { view: true, read: true, write: false, delete: false },
        },
      },
    ]
  }

  return (
    <main className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-3xl font-bold mb-2">User Roles Management</h1>
        <p className="text-muted-foreground">
          Create and manage user roles with specific permissions for different parts of the application.
        </p>
      </div>

      <div className="max-w-6xl mx-auto">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p>Loading roles...</p>
          </div>
        ) : (
          <RoleList roles={roles} onRolesChange={handleRolesChange} />
        )}
      </div>
    </main>
  )
}
