import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/postgresql-client'

export async function PUT(request: NextRequest) {
  try {
    const { id, updates } = await request.json()
    
    if (!id || !updates) {
      return NextResponse.json(
        { success: false, error: 'Company ID and updates are required' },
        { status: 400 }
      )
    }

    console.log(`🏢 API: Updating company ${id}`)
    
    // Build dynamic update query
    const updateFields = Object.keys(updates).filter(key => key !== 'id')
    const setClause = updateFields.map((field, index) => `${field} = $${index + 2}`).join(', ')
    const values = [id, ...updateFields.map(field => updates[field])]

    const result = await query(
      `UPDATE companies SET ${setClause} WHERE id = $1 RETURNING *`,
      values
    )

    if (result.rows && result.rows.length > 0) {
      console.log(`✅ API: Company updated successfully: ${result.rows[0].name}`)
      return NextResponse.json({
        success: true,
        data: result.rows
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      )
    }
    
  } catch (error) {
    console.error('❌ API: Error updating company:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update company' },
      { status: 500 }
    )
  }
}
