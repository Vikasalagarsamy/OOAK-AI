"use server"

import { bugService } from "@/services/bug-service"
import { getCurrentUser } from "@/actions/auth-actions"
import { supabase } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"
import type { Bug, BugStatus, BugFilterParams } from "@/types/bug"

// Get bugs with optional filtering
export async function getBugs(filters: BugFilterParams = {}) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: "Authentication required" }
    }

    const bugs = await bugService.getBugs(filters)
    return { success: true, data: bugs }
  } catch (error) {
    console.error("Error in getBugs:", error)
    return { success: false, error: "Failed to fetch bugs" }
  }
}

// Get a single bug by ID
export async function getBugById(id: number) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: "Authentication required" }
    }

    const bug = await bugService.getBugById(id)
    if (!bug) {
      return { success: false, error: "Bug not found" }
    }

    return { success: true, data: bug }
  } catch (error) {
    console.error("Error in getBugById:", error)
    return { success: false, error: "Failed to fetch bug" }
  }
}

// Create a new bug
export async function createBug(formData: FormData) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: "Authentication required" }
    }

    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const severity = formData.get("severity") as Bug["severity"]
    const assignee_id = (formData.get("assignee_id") as string) || null
    const due_date = (formData.get("due_date") as string) || null

    if (!title || !description || !severity) {
      return { success: false, error: "Missing required fields" }
    }

    const newBug = await bugService.createBug({
      title,
      description,
      severity,
      status: "open",
      assignee_id,
      reporter_id: user.id,
      due_date,
    })

    if (!newBug) {
      return { success: false, error: "Failed to create bug" }
    }

    revalidatePath("/admin/bugs")
    return { success: true, data: newBug }
  } catch (error) {
    console.error("Error in createBug:", error)
    return { success: false, error: "Failed to create bug" }
  }
}

// Update a bug
export async function updateBug(id: number, formData: FormData) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: "Authentication required" }
    }

    const updates: Partial<Bug> = {}

    const title = formData.get("title") as string
    if (title) updates.title = title

    const description = formData.get("description") as string
    if (description) updates.description = description

    const severity = formData.get("severity") as Bug["severity"]
    if (severity) updates.severity = severity

    const status = formData.get("status") as Bug["status"]
    if (status) updates.status = status

    const assignee_id = formData.get("assignee_id") as string
    updates.assignee_id = assignee_id || null

    const due_date = formData.get("due_date") as string
    updates.due_date = due_date || null

    if (Object.keys(updates).length === 0) {
      return { success: false, error: "No updates provided" }
    }

    const updatedBug = await bugService.updateBug(id, updates)
    if (!updatedBug) {
      return { success: false, error: "Failed to update bug" }
    }

    revalidatePath(`/admin/bugs/${id}`)
    revalidatePath("/admin/bugs")
    return { success: true, data: updatedBug }
  } catch (error) {
    console.error("Error in updateBug:", error)
    return { success: false, error: "Failed to update bug" }
  }
}

// Update bug status
export async function updateBugStatus(id: number, status: BugStatus) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: "Authentication required" }
    }

    const updatedBug = await bugService.updateBugStatus(id, status)
    if (!updatedBug) {
      return { success: false, error: "Failed to update bug status" }
    }

    revalidatePath(`/admin/bugs/${id}`)
    revalidatePath("/admin/bugs")
    return { success: true, data: updatedBug }
  } catch (error) {
    console.error("Error in updateBugStatus:", error)
    return { success: false, error: "Failed to update bug status" }
  }
}

// Assign bug to user
export async function assignBug(id: number, assignee_id: string | null) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: "Authentication required" }
    }

    const updatedBug = await bugService.assignBug(id, assignee_id)
    if (!updatedBug) {
      return { success: false, error: "Failed to assign bug" }
    }

    revalidatePath(`/admin/bugs/${id}`)
    revalidatePath("/admin/bugs")
    return { success: true, data: updatedBug }
  } catch (error) {
    console.error("Error in assignBug:", error)
    return { success: false, error: "Failed to assign bug" }
  }
}

// Add comment to bug
export async function addBugComment(formData: FormData) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: "Authentication required" }
    }

    const bug_id = Number.parseInt(formData.get("bug_id") as string)
    const content = formData.get("content") as string

    if (!bug_id || !content) {
      return { success: false, error: "Missing required fields" }
    }

    const comment = await bugService.addBugComment({
      bug_id,
      user_id: user.id,
      content,
    })

    if (!comment) {
      return { success: false, error: "Failed to add comment" }
    }

    revalidatePath(`/admin/bugs/${bug_id}`)
    return { success: true, data: comment }
  } catch (error) {
    console.error("Error in addBugComment:", error)
    return { success: false, error: "Failed to add comment" }
  }
}

// Get bug statistics
export async function getBugStats() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: "Authentication required" }
    }

    const stats = await bugService.getBugStats()
    return { success: true, data: stats }
  } catch (error) {
    console.error("Error in getBugStats:", error)
    return { success: false, error: "Failed to fetch bug statistics" }
  }
}

// Upload attachment (requires client-side handling for file uploads)
export async function handleAttachmentUpload(formData: FormData) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: "Authentication required" }
    }

    const bugId = Number.parseInt(formData.get("bug_id") as string)
    const file = formData.get("file") as File

    if (!bugId || !file) {
      return { success: false, error: "Missing required fields" }
    }

    // Generate a unique file path
    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`
    const filePath = `bug-attachments/${bugId}/${fileName}`

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage.from("bugs").upload(filePath, file)

    if (uploadError) {
      console.error("Error uploading file:", uploadError)
      return { success: false, error: "Failed to upload file" }
    }

    // Get public URL for the file
    const {
      data: { publicUrl },
    } = supabase.storage.from("bugs").getPublicUrl(filePath)

    // Save attachment record
    const attachment = await bugService.addBugAttachment({
      bug_id: bugId,
      file_name: file.name,
      file_path: publicUrl,
      file_type: file.type,
      file_size: file.size,
      uploaded_by: user.id,
    })

    if (!attachment) {
      return { success: false, error: "Failed to save attachment" }
    }

    revalidatePath(`/admin/bugs/${bugId}`)
    return { success: true, data: attachment }
  } catch (error) {
    console.error("Error in handleAttachmentUpload:", error)
    return { success: false, error: "Failed to process attachment" }
  }
}
