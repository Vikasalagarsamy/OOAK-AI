"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { 
  Deliverable, 
  DeliverableFormData, 
  DeliverableFilters,
  ServicePackage,
  PackageServiceView,
  PackageDeliverableView,
  ServiceWithPackages
} from "@/types/deliverables"
import { getCurrentUser } from "@/lib/auth-utils"
import {
  getDeliverableMasterByCategoryAndType,
  getDeliverableMasterCategories,
  getDeliverableMasterTypes,
} from "@/actions/deliverable-master-actions"

// Deliverables CRUD Operations
export async function getDeliverables(filters?: DeliverableFilters): Promise<Deliverable[]> {
  const supabase = createClient()

  try {
    let query = supabase
      .from("deliverables")
      .select("*")
      .order("deliverable_type", { ascending: true })
      .order("sort_order", { ascending: true })

    // Apply filters
    if (filters?.category) {
      query = query.eq("deliverable_cat", filters.category)
    }

    if (filters?.type) {
      query = query.eq("deliverable_type", filters.type)
    }

    if (filters?.status !== undefined) {
      query = query.eq("status", filters.status)
    }

    if (filters?.has_customer !== undefined) {
      query = query.eq("has_customer", filters.has_customer)
    }

    if (filters?.has_employee !== undefined) {
      query = query.eq("has_employee", filters.has_employee)
    }

    if (filters?.search) {
      query = query.or(`deliverable_name.ilike.%${filters.search}%,process_name.ilike.%${filters.search}%`)
    }

    if (filters?.package) {
      query = query.eq(`package_included->${filters.package}`, true)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching deliverables:", error)
      throw new Error(`Failed to fetch deliverables: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error("Error in getDeliverables:", error)
    return []
  }
}

export async function getDeliverableById(id: number): Promise<Deliverable | null> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("deliverables")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching deliverable:", error)
      return null
    }

    return data as Deliverable
  } catch (error) {
    console.error("Error in getDeliverableById:", error)
    return null
  }
}

export async function createDeliverable(
  formData: DeliverableFormData
): Promise<{ success: boolean; message: string; id?: number }> {
  const supabase = createClient()

  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, message: "Authentication required" }
    }

    const deliverableData = {
      deliverable_cat: formData.deliverable_cat,
      deliverable_type: formData.deliverable_type,
      deliverable_id: formData.deliverable_id,
      deliverable_name: formData.deliverable_name.trim(),
      process_name: formData.process_name.trim(),
      has_customer: formData.has_customer,
      has_employee: formData.has_employee,
      has_qc: formData.has_qc,
      has_vendor: formData.has_vendor,
      link: formData.link?.trim() || null,
      sort_order: formData.sort_order,
      timing_type: formData.timing_type,
      tat: formData.tat,
      tat_value: formData.tat_value,
      buffer: formData.buffer,
      skippable: formData.skippable,
      employee: formData.employee || null,
      has_download_option: formData.has_download_option,
      has_task_process: formData.has_task_process,
      has_upload_folder_path: formData.has_upload_folder_path,
      process_starts_from: formData.process_starts_from,
      status: formData.status,
      
      // Package pricing
      basic_price: formData.basic_price || 0.00,
      premium_price: formData.premium_price || 0.00,
      elite_price: formData.elite_price || 0.00,
      
      on_start_template: formData.on_start_template?.trim() || null,
      on_complete_template: formData.on_complete_template?.trim() || null,
      on_correction_template: formData.on_correction_template?.trim() || null,
      input_names: formData.input_names || null,
      stream: formData.stream || null,
      stage: formData.stage?.trim() || null,
      package_included: formData.package_included,
      created_date: new Date().toISOString(),
      created_by: parseInt(currentUser.id),
    }

    const { data, error } = await supabase
      .from("deliverables")
      .insert(deliverableData)
      .select()
      .single()

    if (error) {
      console.error("Error creating deliverable:", error)
      return {
        success: false,
        message: `Failed to create deliverable: ${error.message}`,
      }
    }

    revalidatePath("/post-production/deliverables")
    return {
      success: true,
      message: "Deliverable created successfully",
      id: data.id,
    }
  } catch (error) {
    console.error("Error creating deliverable:", error)
    return {
      success: false,
      message: "An unexpected error occurred",
    }
  }
}

export async function updateDeliverable(
  id: number,
  formData: DeliverableFormData
): Promise<{ success: boolean; message: string }> {
  const supabase = createClient()

  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, message: "Authentication required" }
    }

    const updateData = {
      deliverable_cat: formData.deliverable_cat,
      deliverable_type: formData.deliverable_type,
      deliverable_id: formData.deliverable_id,
      deliverable_name: formData.deliverable_name.trim(),
      process_name: formData.process_name.trim(),
      has_customer: formData.has_customer,
      has_employee: formData.has_employee,
      has_qc: formData.has_qc,
      has_vendor: formData.has_vendor,
      link: formData.link?.trim() || null,
      sort_order: formData.sort_order,
      timing_type: formData.timing_type,
      tat: formData.tat,
      tat_value: formData.tat_value,
      buffer: formData.buffer,
      skippable: formData.skippable,
      employee: formData.employee || null,
      has_download_option: formData.has_download_option,
      has_task_process: formData.has_task_process,
      has_upload_folder_path: formData.has_upload_folder_path,
      process_starts_from: formData.process_starts_from,
      status: formData.status,
      
      // Package pricing
      basic_price: formData.basic_price || 0.00,
      premium_price: formData.premium_price || 0.00,
      elite_price: formData.elite_price || 0.00,
      
      on_start_template: formData.on_start_template?.trim() || null,
      on_complete_template: formData.on_complete_template?.trim() || null,
      on_correction_template: formData.on_correction_template?.trim() || null,
      input_names: formData.input_names || null,
      stream: formData.stream || null,
      stage: formData.stage?.trim() || null,
      package_included: formData.package_included,
    }

    const { error } = await supabase
      .from("deliverables")
      .update(updateData)
      .eq("id", id)

    if (error) {
      console.error("Error updating deliverable:", error)
      return {
        success: false,
        message: `Failed to update deliverable: ${error.message}`,
      }
    }

    revalidatePath("/post-production/deliverables")
    return {
      success: true,
      message: "Deliverable updated successfully",
    }
  } catch (error) {
    console.error("Error updating deliverable:", error)
    return {
      success: false,
      message: "An unexpected error occurred",
    }
  }
}

export async function deleteDeliverable(
  id: number
): Promise<{ success: boolean; message: string }> {
  const supabase = createClient()

  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, message: "Authentication required" }
    }

    const { error } = await supabase
      .from("deliverables")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Error deleting deliverable:", error)
      return {
        success: false,
        message: `Failed to delete deliverable: ${error.message}`,
      }
    }

    revalidatePath("/post-production/deliverables")
    return {
      success: true,
      message: "Deliverable deleted successfully",
    }
  } catch (error) {
    console.error("Error deleting deliverable:", error)
    return {
      success: false,
      message: "An unexpected error occurred",
    }
  }
}

// Package Management
export async function getServicePackages(): Promise<ServicePackage[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("service_packages")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })

    if (error) {
      console.error("Error fetching service packages:", error)
      throw new Error(`Failed to fetch service packages: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error("Error in getServicePackages:", error)
    return []
  }
}

export async function getPackageServices(packageName: string): Promise<PackageServiceView[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("v_package_services")
      .select("*")
      .eq("package_name", packageName)
      .eq("is_included", true)

    if (error) {
      console.error("Error fetching package services:", error)
      throw new Error(`Failed to fetch package services: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error("Error in getPackageServices:", error)
    return []
  }
}

export async function getPackageDeliverables(packageName: string): Promise<PackageDeliverableView[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("v_package_deliverables")
      .select("*")
      .eq("package_name", packageName)
      .eq("is_included", true)

    if (error) {
      console.error("Error fetching package deliverables:", error)
      throw new Error(`Failed to fetch package deliverables: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error("Error in getPackageDeliverables:", error)
    return []
  }
}

// Enhanced Services with Package Pricing
export async function getServicesWithPackages(): Promise<ServiceWithPackages[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("status", "Active")
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

export async function updateServicePackagePrice(
  serviceId: number,
  packageType: 'basic' | 'premium' | 'elite',
  price: number
): Promise<{ success: boolean; message: string }> {
  const supabase = createClient()

  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, message: "Authentication required" }
    }

    const updateData = {
      [`${packageType}_price`]: price,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from("services")
      .update(updateData)
      .eq("id", serviceId)

    if (error) {
      console.error("Error updating service package price:", error)
      return {
        success: false,
        message: `Failed to update service package price: ${error.message}`,
      }
    }

    revalidatePath("/events/services")
    return {
      success: true,
      message: "Service package price updated successfully",
    }
  } catch (error) {
    console.error("Error updating service package price:", error)
    return {
      success: false,
      message: "An unexpected error occurred",
    }
  }
}

// Bulk Operations
export async function bulkImportDeliverables(
  deliverables: Omit<DeliverableFormData, "created_date" | "created_by">[]
): Promise<{ success: boolean; message: string; imported: number }> {
  const supabase = createClient()

  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, message: "Authentication required", imported: 0 }
    }

    const deliverablesData = deliverables.map(deliverable => ({
      ...deliverable,
      deliverable_name: deliverable.deliverable_name.trim(),
      process_name: deliverable.process_name.trim(),
      link: deliverable.link?.trim() || null,
      on_start_template: deliverable.on_start_template?.trim() || null,
      on_complete_template: deliverable.on_complete_template?.trim() || null,
      on_correction_template: deliverable.on_correction_template?.trim() || null,
      stage: deliverable.stage?.trim() || null,
      created_date: new Date().toISOString(),
      created_by: parseInt(currentUser.id),
    }))

    const { data, error } = await supabase
      .from("deliverables")
      .insert(deliverablesData)
      .select()

    if (error) {
      console.error("Error importing deliverables:", error)
      return {
        success: false,
        message: `Failed to import deliverables: ${error.message}`,
        imported: 0,
      }
    }

    revalidatePath("/post-production/deliverables")
    return {
      success: true,
      message: `Successfully imported ${data.length} deliverables`,
      imported: data.length,
    }
  } catch (error) {
    console.error("Error importing deliverables:", error)
    return {
      success: false,
      message: "An unexpected error occurred during import",
      imported: 0,
    }
  }
}

// Fetch employees for stakeholder assignment
export async function getEmployees(): Promise<{ id: number; name: string; department?: string }[]> {
  const supabase = createClient()

  try {
    // Try different approaches based on common employee table schemas
    
    // Approach 1: Try with first_name, last_name fields
    let { data, error } = await supabase
      .from("employees")
      .select("id, first_name, last_name, department, job_title, status")
      .in("status", ["active", "Active", "ACTIVE"])
      .order("first_name", { ascending: true })

    if (!error && data) {
      return data.map(emp => ({
        id: emp.id,
        name: emp.last_name ? `${emp.first_name} ${emp.last_name}` : emp.first_name,
        department: emp.department || emp.job_title || undefined
      }))
    }

    // Approach 2: Try with name field
    const { data: data2, error: error2 } = await supabase
      .from("employees")
      .select("id, name, department")
      .eq("is_active", true)
      .order("name", { ascending: true })

    if (!error2 && data2) {
      return data2
    }

    // Approach 3: Try basic fields only
    const { data: data3, error: error3 } = await supabase
      .from("employees")
      .select("id, first_name, last_name")
      .order("first_name", { ascending: true })

    if (!error3 && data3) {
      return data3.map(emp => ({
        id: emp.id,
        name: emp.last_name ? `${emp.first_name} ${emp.last_name}` : emp.first_name,
        department: undefined
      }))
    }

    console.error("All employee fetch attempts failed:", { error, error2, error3 })
    return []
  } catch (error) {
    console.error("Error in getEmployees:", error)
    return []
  }
}

// Fetch deliverable categories (distinct values)
export async function getDeliverableCategories(): Promise<string[]> {
  // Use the new deliverable_master table
  return await getDeliverableMasterCategories()
}

// Fetch deliverable types (distinct values)
export async function getDeliverableTypes(): Promise<string[]> {
  // Use the new deliverable_master table
  return await getDeliverableMasterTypes()
}

// Fetch existing deliverable names for reference
export async function getDeliverableNames(): Promise<{ id: number; name: string; category: string; type: string }[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("deliverable_master")
      .select("id, deliverable_name, category, type")
      .order("deliverable_name", { ascending: true })

    if (error) {
      console.error("Error fetching deliverable names:", error)
      return []
    }

    return data?.map(d => ({
      id: d.id,
      name: d.deliverable_name,
      category: d.category,
      type: d.type
    })) || []
  } catch (error) {
    console.error("Error in getDeliverableNames:", error)
    return []
  }
}

// Fetch process names filtered by deliverable name
export async function getProcessNamesByDeliverable(
  deliverableName: string
): Promise<string[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("deliverables")
      .select("process_name")
      .eq("deliverable_name", deliverableName)
      .eq("status", 1)
      .not("process_name", "is", null)

    if (error) {
      console.error("Error fetching process names:", error)
      return []
    }

    // Get unique process names
    const uniqueProcessNames = data ? [...new Set(data.map(d => d.process_name).filter(name => name))] : []
    return uniqueProcessNames.sort()
  } catch (error) {
    console.error("Error in getProcessNamesByDeliverable:", error)
    return []
  }
}

// Fetch all unique process names for general use
export async function getAllProcessNames(): Promise<string[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("deliverables")
      .select("process_name")
      .eq("status", 1)
      .not("process_name", "is", null)

    if (error) {
      console.error("Error fetching all process names:", error)
      return []
    }

    // Get unique process names
    const uniqueProcessNames = data ? [...new Set(data.map(d => d.process_name).filter(name => name))] : []
    return uniqueProcessNames.sort()
  } catch (error) {
    console.error("Error in getAllProcessNames:", error)
    return []
  }
}

// Fetch deliverable names filtered by category and type from deliverable_master table
export async function getFilteredDeliverableNames(
  category?: string, 
  type?: string
): Promise<{ id: number; name: string; category: string; type: string }[]> {
  try {
    if (!category || !type) {
      return []
    }

    // Use the new deliverable_master table
    const data = await getDeliverableMasterByCategoryAndType(
      category as "Main" | "Optional",
      type as "Photo" | "Video"
    )

    return data.map(d => ({
      id: d.id,
      name: d.deliverable_name,
      category: d.category,
      type: d.type
    }))
  } catch (error) {
    console.error("Error in getFilteredDeliverableNames:", error)
    return []
  }
}

/**
 * Calculate total deliverable pricing by summing all process prices
 */
export async function calculateDeliverableTotalPricing(deliverableName: string): Promise<{
  basic_total: number
  premium_total: number
  elite_total: number
  process_count: number
}> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("deliverables")
      .select("basic_price, premium_price, elite_price")
      .eq("deliverable_name", deliverableName)
      .eq("status", 1)

    if (error) {
      console.error("Error calculating deliverable total pricing:", error)
      return { basic_total: 0, premium_total: 0, elite_total: 0, process_count: 0 }
    }

    const totals = data?.reduce(
      (acc, process) => ({
        basic_total: acc.basic_total + (process.basic_price || 0),
        premium_total: acc.premium_total + (process.premium_price || 0),
        elite_total: acc.elite_total + (process.elite_price || 0),
        process_count: acc.process_count + 1
      }),
      { basic_total: 0, premium_total: 0, elite_total: 0, process_count: 0 }
    ) || { basic_total: 0, premium_total: 0, elite_total: 0, process_count: 0 }

    return totals
  } catch (error) {
    console.error("Error in calculateDeliverableTotalPricing:", error)
    return { basic_total: 0, premium_total: 0, elite_total: 0, process_count: 0 }
  }
}

/**
 * Get all process pricing breakdown for a deliverable
 */
export async function getDeliverableProcessPricing(deliverableName: string): Promise<{
  processes: Array<{
    id: number
    process_name: string
    basic_price: number
    premium_price: number
    elite_price: number
  }>
  totals: {
    basic_total: number
    premium_total: number
    elite_total: number
    process_count: number
  }
}> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("deliverables")
      .select("id, process_name, basic_price, premium_price, elite_price")
      .eq("deliverable_name", deliverableName)
      .eq("status", 1)
      .order("sort_order", { ascending: true })

    if (error) {
      console.error("Error fetching deliverable process pricing:", error)
      return { processes: [], totals: { basic_total: 0, premium_total: 0, elite_total: 0, process_count: 0 } }
    }

    const processes = data?.map(process => ({
      id: process.id,
      process_name: process.process_name,
      basic_price: process.basic_price || 0,
      premium_price: process.premium_price || 0,
      elite_price: process.elite_price || 0
    })) || []

    const totals = processes.reduce(
      (acc, process) => ({
        basic_total: acc.basic_total + process.basic_price,
        premium_total: acc.premium_total + process.premium_price,
        elite_total: acc.elite_total + process.elite_price,
        process_count: acc.process_count + 1
      }),
      { basic_total: 0, premium_total: 0, elite_total: 0, process_count: 0 }
    )

    return { processes, totals }
  } catch (error) {
    console.error("Error in getDeliverableProcessPricing:", error)
    return { processes: [], totals: { basic_total: 0, premium_total: 0, elite_total: 0, process_count: 0 } }
  }
} 