"use server"

import { query, transaction } from "@/lib/postgresql-client"

export interface Bug {
  id?: number
  title: string
  description: string
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  assignee_id?: number
  reporter_id: number
  tags?: string[]
  metadata?: any
  created_at?: string
  updated_at?: string
}

export interface BugComment {
  id?: number
  bug_id: number
  user_id: number
  content: string
  created_at?: string
}

export interface BugAttachment {
  id?: number
  bug_id: number
  filename: string
  file_path: string
  file_size: number
  mime_type: string
  uploaded_by: number
  created_at?: string
}

export async function createBug(bug: Omit<Bug, 'id' | 'created_at' | 'updated_at'>) {
  try {
    console.log('🐛 Creating bug via PostgreSQL:', bug.title)

    const result = await query(`
      INSERT INTO bugs (
        title, description, status, severity, 
        assignee_id, reporter_id, tags, metadata, 
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *
    `, [
      bug.title,
      bug.description,
      bug.status,
      bug.severity,
      bug.assignee_id || null,
      bug.reporter_id,
      JSON.stringify(bug.tags || []),
      JSON.stringify(bug.metadata || {})
    ])

    console.log('✅ Bug created successfully via PostgreSQL')
    
    return {
      success: true,
      data: result.rows[0]
    }
  } catch (error) {
    console.error("Error creating bug (PostgreSQL):", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function updateBug(id: number, updates: Partial<Bug>) {
  try {
    console.log('🐛 Updating bug via PostgreSQL:', id)

    const setClause = []
    const params = []
    let paramCount = 0

    if (updates.title) {
      paramCount++
      setClause.push(`title = $${paramCount}`)
      params.push(updates.title)
    }

    if (updates.description) {
      paramCount++
      setClause.push(`description = $${paramCount}`)
      params.push(updates.description)
    }

    if (updates.status) {
      paramCount++
      setClause.push(`status = $${paramCount}`)
      params.push(updates.status)
    }

    if (updates.severity) {
      paramCount++
      setClause.push(`severity = $${paramCount}`)
      params.push(updates.severity)
    }

    if (updates.assignee_id !== undefined) {
      paramCount++
      setClause.push(`assignee_id = $${paramCount}`)
      params.push(updates.assignee_id)
    }

    if (updates.tags) {
      paramCount++
      setClause.push(`tags = $${paramCount}`)
      params.push(JSON.stringify(updates.tags))
    }

    if (updates.metadata) {
      paramCount++
      setClause.push(`metadata = $${paramCount}`)
      params.push(JSON.stringify(updates.metadata))
    }

    paramCount++
    setClause.push(`updated_at = NOW()`)

    paramCount++
    params.push(id)

    const result = await query(`
      UPDATE bugs 
      SET ${setClause.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `, params)

    if (result.rows.length === 0) {
      return {
        success: false,
        error: "Bug not found"
      }
    }

    console.log('✅ Bug updated successfully via PostgreSQL')
    
    return {
      success: true,
      data: result.rows[0]
    }
  } catch (error) {
    console.error("Error updating bug (PostgreSQL):", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function getBugs(filters: {
  status?: string
  assignee?: number
  severity?: string
  limit?: number
  offset?: number
} = {}) {
  try {
    console.log('🐛 Fetching bugs via PostgreSQL...')

    let whereConditions = []
    let params = []
    let paramCount = 0

    if (filters.status) {
      paramCount++
      whereConditions.push(`b.status = $${paramCount}`)
      params.push(filters.status)
    }

    if (filters.assignee) {
      paramCount++
      whereConditions.push(`b.assignee_id = $${paramCount}`)
      params.push(filters.assignee)
    }

    if (filters.severity) {
      paramCount++
      whereConditions.push(`b.severity = $${paramCount}`)
      params.push(filters.severity)
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : ''

    const limit = filters.limit || 50
    const offset = filters.offset || 0

    const result = await query(`
      SELECT 
        b.*,
        assignee.name as assignee_name,
        reporter.name as reporter_name
      FROM bugs b
      LEFT JOIN employees assignee ON b.assignee_id = assignee.id
      LEFT JOIN employees reporter ON b.reporter_id = reporter.id
      ${whereClause}
      ORDER BY b.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `, [...params, limit, offset])

    // Process tags and metadata
    const bugs = result.rows.map(bug => ({
      ...bug,
      tags: typeof bug.tags === 'string' ? JSON.parse(bug.tags) : bug.tags,
      metadata: typeof bug.metadata === 'string' ? JSON.parse(bug.metadata) : bug.metadata
    }))

    console.log('✅ Bugs fetched successfully via PostgreSQL')
    
    return {
      success: true,
      data: bugs
    }
  } catch (error) {
    console.error("Error fetching bugs (PostgreSQL):", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: []
    }
  }
}

export async function addBugComment(comment: Omit<BugComment, 'id' | 'created_at'>) {
  try {
    console.log('🐛 Adding bug comment via PostgreSQL:', comment.bug_id)

    const result = await query(`
      INSERT INTO bug_comments (bug_id, user_id, content, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `, [comment.bug_id, comment.user_id, comment.content])

    console.log('✅ Bug comment added successfully via PostgreSQL')
    
    return {
      success: true,
      data: result.rows[0]
    }
  } catch (error) {
    console.error("Error adding bug comment (PostgreSQL):", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function addBugAttachment(attachment: Omit<BugAttachment, 'id' | 'created_at'>) {
  try {
    console.log('🐛 Adding bug attachment via PostgreSQL:', attachment.filename)

    const result = await query(`
      INSERT INTO bug_attachments (
        bug_id, filename, file_path, file_size, 
        mime_type, uploaded_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `, [
      attachment.bug_id,
      attachment.filename,
      attachment.file_path,
      attachment.file_size,
      attachment.mime_type,
      attachment.uploaded_by
    ])

    console.log('✅ Bug attachment added successfully via PostgreSQL')
    
    return {
      success: true,
      data: result.rows[0]
    }
  } catch (error) {
    console.error("Error adding bug attachment (PostgreSQL):", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function getBugStats() {
  try {
    console.log('🐛 Fetching bug stats via PostgreSQL...')

    const [totalResult, statusResult, severityResult] = await Promise.all([
      query('SELECT COUNT(*) as total FROM bugs'),
      query(`
        SELECT status, COUNT(*) as count 
        FROM bugs 
        GROUP BY status
        ORDER BY status
      `),
      query(`
        SELECT severity, COUNT(*) as count 
        FROM bugs 
        GROUP BY severity
        ORDER BY severity
      `)
    ])

    console.log('✅ Bug stats fetched successfully via PostgreSQL')
    
    return {
      success: true,
      stats: {
        total: parseInt(totalResult.rows[0].total),
        byStatus: statusResult.rows,
        bySeverity: severityResult.rows
      }
    }
  } catch (error) {
    console.error("Error fetching bug stats (PostgreSQL):", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stats: {
        total: 0,
        byStatus: [],
        bySeverity: []
      }
    }
  }
}

export async function getBugDetails(id: number) {
  try {
    console.log('🐛 Fetching bug details via PostgreSQL:', id)

    const [bugResult, commentsResult, attachmentsResult] = await Promise.all([
      query(`
        SELECT 
          b.*,
          assignee.name as assignee_name,
          reporter.name as reporter_name
        FROM bugs b
        LEFT JOIN employees assignee ON b.assignee_id = assignee.id
        LEFT JOIN employees reporter ON b.reporter_id = reporter.id
        WHERE b.id = $1
      `, [id]),
      query(`
        SELECT 
          c.*,
          e.name as user_name
        FROM bug_comments c
        LEFT JOIN employees e ON c.user_id = e.id
        WHERE c.bug_id = $1
        ORDER BY c.created_at ASC
      `, [id]),
      query(`
        SELECT 
          a.*,
          e.name as uploaded_by_name
        FROM bug_attachments a
        LEFT JOIN employees e ON a.uploaded_by = e.id
        WHERE a.bug_id = $1
        ORDER BY a.created_at ASC
      `, [id])
    ])

    if (bugResult.rows.length === 0) {
      return {
        success: false,
        error: "Bug not found"
      }
    }

    const bug = bugResult.rows[0]
    bug.tags = typeof bug.tags === 'string' ? JSON.parse(bug.tags) : bug.tags
    bug.metadata = typeof bug.metadata === 'string' ? JSON.parse(bug.metadata) : bug.metadata

    console.log('✅ Bug details fetched successfully via PostgreSQL')
    
    return {
      success: true,
      data: {
        ...bug,
        comments: commentsResult.rows,
        attachments: attachmentsResult.rows
      }
    }
  } catch (error) {
    console.error("Error fetching bug details (PostgreSQL):", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
export const bugService = {};
