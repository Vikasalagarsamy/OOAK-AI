"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type DeliverableMaster = {
  id: number
  category: "Main" | "Optional"
  type: "Photo" | "Video"
  deliverable_name: string
  created_at: string
  updated_at: string
}

export type DeliverableMasterFormData = {
  category: "Main" | "Optional"
  type: "Photo" | "Video"
  deliverable_name: string
}

/**
 * Get all deliverable master records
 */
export async function getDeliverableMaster(): Promise<DeliverableMaster[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from("deliverable_master")
    .select("*")
    .order("category", { ascending: true })
    .order("type", { ascending: true })
    .order("deliverable_name", { ascending: true })

  if (error) {
    console.error("Error fetching deliverable master:", error)
    throw new Error("Failed to fetch deliverable master data")
  }

  return data || []
}

/**
 * Get deliverable master records by category
 */
export async function getDeliverableMasterByCategory(category: "Main" | "Optional"): Promise<DeliverableMaster[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from("deliverable_master")
    .select("*")
    .eq("category", category)
    .order("type", { ascending: true })
    .order("deliverable_name", { ascending: true })

  if (error) {
    console.error("Error fetching deliverable master by category:", error)
    throw new Error("Failed to fetch deliverable master data")
  }

  return data || []
}

/**
 * Get deliverable master records by type
 */
export async function getDeliverableMasterByType(type: "Photo" | "Video"): Promise<DeliverableMaster[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from("deliverable_master")
    .select("*")
    .eq("type", type)
    .order("category", { ascending: true })
    .order("deliverable_name", { ascending: true })

  if (error) {
    console.error("Error fetching deliverable master by type:", error)
    throw new Error("Failed to fetch deliverable master data")
  }

  return data || []
}

/**
 * Get deliverable master records by category and type
 */
export async function getDeliverableMasterByCategoryAndType(
  category: "Main" | "Optional",
  type: "Photo" | "Video"
): Promise<DeliverableMaster[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from("deliverable_master")
    .select("*")
    .eq("category", category)
    .eq("type", type)
    .order("deliverable_name", { ascending: true })

  if (error) {
    console.error("Error fetching deliverable master by category and type:", error)
    throw new Error("Failed to fetch deliverable master data")
  }

  return data || []
}

/**
 * Create a new deliverable master record
 */
export async function createDeliverableMaster(formData: DeliverableMasterFormData): Promise<{
  success: boolean
  message: string
  data?: DeliverableMaster
}> {
  try {
    const supabase = createClient()

    // Check if the deliverable name already exists for this category and type
    const { data: existing } = await supabase
      .from("deliverable_master")
      .select("id")
      .eq("category", formData.category)
      .eq("type", formData.type)
      .eq("deliverable_name", formData.deliverable_name)
      .single()

    if (existing) {
      return {
        success: false,
        message: "A deliverable with this name already exists for the selected category and type",
      }
    }

    const { data, error } = await supabase
      .from("deliverable_master")
      .insert([
        {
          category: formData.category,
          type: formData.type,
          deliverable_name: formData.deliverable_name,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating deliverable master:", error)
      return {
        success: false,
        message: "Failed to create deliverable master record",
      }
    }

    revalidatePath("/")
    
    return {
      success: true,
      message: "Deliverable master record created successfully",
      data,
    }
  } catch (error) {
    console.error("Error in createDeliverableMaster:", error)
    return {
      success: false,
      message: "An unexpected error occurred",
    }
  }
}

/**
 * Update a deliverable master record
 */
export async function updateDeliverableMaster(
  id: number,
  formData: DeliverableMasterFormData
): Promise<{
  success: boolean
  message: string
  data?: DeliverableMaster
}> {
  try {
    const supabase = createClient()

    // Check if another record with the same name exists (excluding current record)
    const { data: existing } = await supabase
      .from("deliverable_master")
      .select("id")
      .eq("category", formData.category)
      .eq("type", formData.type)
      .eq("deliverable_name", formData.deliverable_name)
      .neq("id", id)
      .single()

    if (existing) {
      return {
        success: false,
        message: "A deliverable with this name already exists for the selected category and type",
      }
    }

    const { data, error } = await supabase
      .from("deliverable_master")
      .update({
        category: formData.category,
        type: formData.type,
        deliverable_name: formData.deliverable_name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating deliverable master:", error)
      return {
        success: false,
        message: "Failed to update deliverable master record",
      }
    }

    revalidatePath("/")
    
    return {
      success: true,
      message: "Deliverable master record updated successfully",
      data,
    }
  } catch (error) {
    console.error("Error in updateDeliverableMaster:", error)
    return {
      success: false,
      message: "An unexpected error occurred",
    }
  }
}

/**
 * Delete a deliverable master record
 */
export async function deleteDeliverableMaster(id: number): Promise<{
  success: boolean
  message: string
}> {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from("deliverable_master")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Error deleting deliverable master:", error)
      return {
        success: false,
        message: "Failed to delete deliverable master record",
      }
    }

    revalidatePath("/")
    
    return {
      success: true,
      message: "Deliverable master record deleted successfully",
    }
  } catch (error) {
    console.error("Error in deleteDeliverableMaster:", error)
    return {
      success: false,
      message: "An unexpected error occurred",
    }
  }
}

/**
 * Get unique categories from deliverable master
 */
export async function getDeliverableMasterCategories(): Promise<string[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from("deliverable_master")
    .select("category")
    .order("category", { ascending: true })

  if (error) {
    console.error("Error fetching deliverable master categories:", error)
    return ["Main", "Optional"] // Return defaults if error
  }

  // Extract unique categories
  const categories = [...new Set(data?.map(item => item.category) || [])]
  return categories.length > 0 ? categories : ["Main", "Optional"]
}

/**
 * Get unique types from deliverable master
 */
export async function getDeliverableMasterTypes(): Promise<string[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from("deliverable_master")
    .select("type")
    .order("type", { ascending: true })

  if (error) {
    console.error("Error fetching deliverable master types:", error)
    return ["Photo", "Video"] // Return defaults if error
  }

  // Extract unique types
  const types = [...new Set(data?.map(item => item.type) || [])]
  return types.length > 0 ? types : ["Photo", "Video"]
} 