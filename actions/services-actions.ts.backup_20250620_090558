"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Service, ServiceFormData, ServiceFilters } from "@/types/services"
import { getCurrentUser } from "@/lib/auth-utils"

export async function getServices(filters?: ServiceFilters): Promise<Service[]> {
  const supabase = createClient()

  try {
    let query = supabase
      .from("services")
      .select("*")
      .order("created_at", { ascending: false })

    // Apply filters
    if (filters?.status) {
      query = query.eq("status", filters.status)
    }

    if (filters?.category) {
      query = query.eq("category", filters.category)
    }

    if (filters?.search) {
      query = query.ilike("servicename", `%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching services:", error)
      throw new Error(`Failed to fetch services: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error("Error in getServices:", error)
    return []
  }
}

export async function getServiceById(id: number): Promise<Service | null> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching service:", error)
      return null
    }

    return data as Service
  } catch (error) {
    console.error("Error in getServiceById:", error)
    return null
  }
}

export async function createService(
  formData: ServiceFormData & {
    basic_price?: number
    premium_price?: number
    elite_price?: number
    package_included?: {
      basic: boolean
      premium: boolean
      elite: boolean
    }
  }
): Promise<{ success: boolean; message: string; id?: number }> {
  const supabase = createClient()

  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, message: "Authentication required" }
    }

    const serviceData = {
      servicename: formData.servicename.trim(),
      status: formData.status,
      description: formData.description?.trim() || null,
      category: formData.category || null,
      price: formData.price || null,
      unit: formData.unit?.trim() || null,
      basic_price: formData.basic_price || null,
      premium_price: formData.premium_price || null,
      elite_price: formData.elite_price || null,
      package_included: formData.package_included || null,
      created_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from("services")
      .insert(serviceData)
      .select()
      .single()

    if (error) {
      console.error("Error creating service:", error)
      return {
        success: false,
        message: `Failed to create service: ${error.message}`,
      }
    }

    revalidatePath("/events/services")
    return {
      success: true,
      message: "Service created successfully",
      id: data.id,
    }
  } catch (error) {
    console.error("Error creating service:", error)
    return {
      success: false,
      message: "An unexpected error occurred",
    }
  }
}

export async function updateService(
  id: number,
  formData: ServiceFormData & {
    basic_price?: number
    premium_price?: number
    elite_price?: number
    package_included?: {
      basic: boolean
      premium: boolean
      elite: boolean
    }
  }
): Promise<{ success: boolean; message: string }> {
  const supabase = createClient()

  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, message: "Authentication required" }
    }

    const updateData = {
      servicename: formData.servicename.trim(),
      status: formData.status,
      description: formData.description?.trim() || null,
      category: formData.category || null,
      price: formData.price || null,
      unit: formData.unit?.trim() || null,
      basic_price: formData.basic_price || null,
      premium_price: formData.premium_price || null,
      elite_price: formData.elite_price || null,
      package_included: formData.package_included || null,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from("services")
      .update(updateData)
      .eq("id", id)

    if (error) {
      console.error("Error updating service:", error)
      return {
        success: false,
        message: `Failed to update service: ${error.message}`,
      }
    }

    revalidatePath("/events/services")
    return {
      success: true,
      message: "Service updated successfully",
    }
  } catch (error) {
    console.error("Error updating service:", error)
    return {
      success: false,
      message: "An unexpected error occurred",
    }
  }
}

export async function deleteService(
  id: number
): Promise<{ success: boolean; message: string }> {
  const supabase = createClient()

  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, message: "Authentication required" }
    }

    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Error deleting service:", error)
      return {
        success: false,
        message: `Failed to delete service: ${error.message}`,
      }
    }

    revalidatePath("/events/services")
    return {
      success: true,
      message: "Service deleted successfully",
    }
  } catch (error) {
    console.error("Error deleting service:", error)
    return {
      success: false,
      message: "An unexpected error occurred",
    }
  }
}

export async function bulkImportServices(
  services: Omit<ServiceFormData, "status">[]
): Promise<{ success: boolean; message: string; imported: number }> {
  const supabase = createClient()

  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, message: "Authentication required", imported: 0 }
    }

    const servicesData = services.map(service => ({
      servicename: service.servicename.trim(),
      status: "Active" as const,
      description: service.description?.trim() || null,
      category: service.category || null,
      price: service.price || null,
      unit: service.unit?.trim() || null,
      created_at: new Date().toISOString(),
    }))

    const { data, error } = await supabase
      .from("services")
      .insert(servicesData)
      .select()

    if (error) {
      console.error("Error importing services:", error)
      return {
        success: false,
        message: `Failed to import services: ${error.message}`,
        imported: 0,
      }
    }

    revalidatePath("/events/services")
    return {
      success: true,
      message: `Successfully imported ${data.length} services`,
      imported: data.length,
    }
  } catch (error) {
    console.error("Error importing services:", error)
    return {
      success: false,
      message: "An unexpected error occurred during import",
      imported: 0,
    }
  }
}

// Enhanced Services with Package Pricing
export async function getServicesWithPackages(): Promise<Service[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("servicename", { ascending: true })

    if (error) {
      console.error("Error fetching services with packages:", error)
      throw new Error(`Failed to fetch services with packages: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error("Error in getServicesWithPackages:", error)
    return []
  }
} 