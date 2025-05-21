import { supabase } from "@/lib/supabase-client"
import type { Bug, BugComment, BugAttachment, BugFilterParams, BugStatus, BugSeverity } from "@/types/bug"

export const bugService = {
  // Fetch bugs with optional filtering
  async getBugs(filters: BugFilterParams = {}): Promise<Bug[]> {
    let query = supabase
      .from("bugs")
      .select(`
      *,
      assignee:assignee_id(id, first_name, last_name, email),
      reporter:reporter_id(id, first_name, last_name, email)
    `)
      .order("created_at", { ascending: false })

    // Apply filters
    if (filters.status) {
      query = query.eq("status", filters.status)
    }

    if (filters.severity) {
      query = query.eq("severity", filters.severity)
    }

    if (filters.assignee_id) {
      query = query.eq("assignee_id", filters.assignee_id)
    }

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching bugs:", error)
      throw error
    }

    return data as Bug[]
  },

  // Get a single bug by ID
  async getBugById(id: number): Promise<Bug | null> {
    const { data, error } = await supabase
      .from("bugs")
      .select(`
        *,
        assignee:assignee_id(id, first_name, last_name, email),
        reporter:reporter_id(id, first_name, last_name, email)
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching bug:", error)
      return null
    }

    return data as Bug
  },

  // Create a new bug
  async createBug(bug: Omit<Bug, "id" | "created_at" | "updated_at">): Promise<Bug | null> {
    const { data, error } = await supabase.from("bugs").insert(bug).select().single()

    if (error) {
      console.error("Error creating bug:", error)
      throw error
    }

    return data as Bug
  },

  // Update a bug
  async updateBug(id: number, updates: Partial<Bug>): Promise<Bug | null> {
    const { data, error } = await supabase.from("bugs").update(updates).eq("id", id).select().single()

    if (error) {
      console.error("Error updating bug:", error)
      throw error
    }

    return data as Bug
  },

  // Update bug status
  async updateBugStatus(id: number, status: BugStatus): Promise<Bug | null> {
    return this.updateBug(id, { status })
  },

  // Assign bug to user
  async assignBug(id: number, assignee_id: string | null): Promise<Bug | null> {
    return this.updateBug(id, { assignee_id })
  },

  // Get comments for a bug
  async getBugComments(bugId: number): Promise<BugComment[]> {
    const { data, error } = await supabase
      .from("bug_comments")
      .select(`
        *,
        user:user_id(id, first_name, last_name, email)
      `)
      .eq("bug_id", bugId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching bug comments:", error)
      throw error
    }

    return data as BugComment[]
  },

  // Add a comment to a bug
  async addBugComment(comment: Omit<BugComment, "id" | "created_at" | "updated_at">): Promise<BugComment | null> {
    const { data, error } = await supabase.from("bug_comments").insert(comment).select().single()

    if (error) {
      console.error("Error adding bug comment:", error)
      throw error
    }

    return data as BugComment
  },

  // Get attachments for a bug
  async getBugAttachments(bugId: number): Promise<BugAttachment[]> {
    const { data, error } = await supabase
      .from("bug_attachments")
      .select(`
        *,
        uploader:uploaded_by(id, first_name, last_name, email)
      `)
      .eq("bug_id", bugId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching bug attachments:", error)
      throw error
    }

    return data as BugAttachment[]
  },

  // Add an attachment to a bug
  async addBugAttachment(attachment: Omit<BugAttachment, "id" | "created_at">): Promise<BugAttachment | null> {
    const { data, error } = await supabase.from("bug_attachments").insert(attachment).select().single()

    if (error) {
      console.error("Error adding bug attachment:", error)
      throw error
    }

    return data as BugAttachment
  },

  // Get bug statistics
  async getBugStats(): Promise<{
    total: number
    byStatus: Record<BugStatus, number>
    bySeverity: Record<BugSeverity, number>
  }> {
    const { count: total } = await supabase.from("bugs").select("*", { count: "exact", head: true })

    const { data: byStatusData } = await supabase.from("bugs").select("status, count").group("status")

    const { data: bySeverityData } = await supabase.from("bugs").select("severity, count").group("severity")

    const byStatus = {
      open: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0,
    }

    const bySeverity = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    }

    byStatusData?.forEach((item) => {
      byStatus[item.status as BugStatus] = Number.parseInt(item.count)
    })

    bySeverityData?.forEach((item) => {
      bySeverity[item.severity as BugSeverity] = Number.parseInt(item.count)
    })

    return {
      total: total || 0,
      byStatus,
      bySeverity,
    }
  },
}
