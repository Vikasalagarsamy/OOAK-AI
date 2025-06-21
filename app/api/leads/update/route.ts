import { NextResponse } from "next/server"
import { pool } from '@/lib/postgresql-client'

// PostgreSQL connection pool
// Using centralized PostgreSQL client

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const {
      id,
      priority,
      expected_value,
      next_follow_up_date,
      status,
      conversion_stage,
      notes,
      tags,
      budget_range,
      wedding_date,
      venue_preference,
      guest_count,
      description
    } = body

    if (!id) {
      return NextResponse.json(
        { error: "Lead ID is required" },
        { status: 400 }
      )
    }

    const client = await pool.connect()
    
    try {
      // Build dynamic update query
      const updateFields = []
      const values = []
      let paramCounter = 1

      if (priority !== undefined) {
        updateFields.push(`priority = $${paramCounter}`)
        values.push(priority)
        paramCounter++
      }

      if (expected_value !== undefined) {
        updateFields.push(`expected_value = $${paramCounter}`)
        values.push(expected_value)
        paramCounter++
      }

      if (next_follow_up_date !== undefined) {
        updateFields.push(`next_follow_up_date = $${paramCounter}`)
        values.push(next_follow_up_date)
        paramCounter++
      }

      if (status !== undefined) {
        updateFields.push(`status = $${paramCounter}`)
        values.push(status)
        paramCounter++
      }

      if (conversion_stage !== undefined) {
        updateFields.push(`conversion_stage = $${paramCounter}`)
        values.push(conversion_stage)
        paramCounter++
      }

      if (notes !== undefined) {
        updateFields.push(`notes = $${paramCounter}`)
        values.push(notes)
        paramCounter++
      }

      if (tags !== undefined) {
        updateFields.push(`tags = $${paramCounter}`)
        values.push(tags)
        paramCounter++
      }

      if (budget_range !== undefined) {
        updateFields.push(`budget_range = $${paramCounter}`)
        values.push(budget_range)
        paramCounter++
      }

      if (wedding_date !== undefined) {
        updateFields.push(`wedding_date = $${paramCounter}`)
        values.push(wedding_date)
        paramCounter++
      }

      if (venue_preference !== undefined) {
        updateFields.push(`venue_preference = $${paramCounter}`)
        values.push(venue_preference)
        paramCounter++
      }

      if (guest_count !== undefined) {
        updateFields.push(`guest_count = $${paramCounter}`)
        values.push(guest_count)
        paramCounter++
      }

      if (description !== undefined) {
        updateFields.push(`description = $${paramCounter}`)
        values.push(description)
        paramCounter++
      }

      // Always update the updated_at timestamp
      updateFields.push(`updated_at = NOW()`)

      if (updateFields.length === 1) { // Only updated_at
        return NextResponse.json(
          { error: "No fields to update" },
          { status: 400 }
        )
      }

      // Add the ID for the WHERE clause
      values.push(id)
      const idParam = `$${paramCounter}`

      const updateQuery = `
        UPDATE leads 
        SET ${updateFields.join(', ')}
        WHERE id = ${idParam}
        RETURNING *
      `

      const { rows } = await client.query(updateQuery, values)

      if (rows.length === 0) {
        return NextResponse.json(
          { error: "Lead not found" },
          { status: 404 }
        )
      }

      // Update last_contact_date if status changed to CONTACTED
      if (status === 'CONTACTED') {
        await client.query(
          'UPDATE leads SET last_contact_date = NOW() WHERE id = $1',
          [id]
        )
      }

      // Recalculate lead score based on updated information
      const leadScore = calculateLeadScore(rows[0])
      await client.query(
        'UPDATE leads SET lead_score = $1 WHERE id = $2',
        [leadScore, id]
      )

      console.log(`✅ Updated lead ID: ${id}`)

      return NextResponse.json({
        success: true,
        message: "Lead updated successfully",
        lead: rows[0]
      })
      
    } finally {
      client.release()
    }

  } catch (error) {
    console.error("Error updating lead:", error)
    return NextResponse.json({ 
      success: false,
      error: "An unexpected error occurred while updating the lead" 
    }, { status: 500 })
  }
}

// Helper function to calculate lead score
function calculateLeadScore(lead: any): number {
  let score = 50 // Base score
  
  const expectedValue = parseFloat(lead.expected_value) || 0
  const leadAge = lead.created_at ? Math.floor((Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0
  
  // Positive factors
  if (expectedValue > 50000) score += 15
  if (expectedValue > 100000) score += 10
  if (lead.status === 'QUALIFIED') score += 20
  if (lead.status === 'CONTACTED') score += 10
  if (lead.priority === 'high' || lead.priority === 'urgent') score += 10
  if (lead.conversion_stage === 'interested' || lead.conversion_stage === 'quotation_sent') score += 15
  if (lead.wedding_date) score += 5 // Wedding leads are often higher value
  
  // Negative factors
  if (leadAge > 7) score -= 10
  if (leadAge > 14) score -= 15
  if (leadAge > 30) score -= 20
  if (lead.status === 'NEW' && leadAge > 2) score -= 15
  
  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, score))
} 