import type { User } from "@/types/user"

export type BugSeverity = "critical" | "high" | "medium" | "low"

export type BugStatus = "open" | "in_progress" | "resolved" | "closed"

export interface Bug {
  id: number
  title: string
  description: string
  severity: BugSeverity
  status: BugStatus
  assignee_id: string | null
  reporter_id: string
  due_date: string | null
  created_at: string
  updated_at: string
  assignee?: User
  reporter?: User
}

export interface BugComment {
  id: number
  bug_id: number
  user_id: string
  content: string
  created_at: string
  updated_at: string
  user?: User
}

export interface BugAttachment {
  id: number
  bug_id: number
  file_name: string
  file_path: string
  file_type: string
  file_size: number
  uploaded_by: string
  created_at: string
  uploader?: User
}

export interface BugFilterParams {
  status?: BugStatus
  severity?: BugSeverity
  assignee_id?: string
  search?: string
}
