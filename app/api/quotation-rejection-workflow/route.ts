import { query, transaction } from '@/lib/postgresql-client'
import { NextRequest, NextResponse } from 'next/server'
import { taskAssignmentValidator } from '@/lib/task-assignment-validator'

// Handle rejection workflow notifications and revision requests
export async function POST(request: NextRequest) {
  try {
    console.log('📋 [QUOTATION WORKFLOW] Processing rejection workflow via PostgreSQL...')
    
    const { action, quotationNumber, rejectionDetails } = await request.json()

    console.log('📋 Processing rejection workflow:', { action, quotationNumber, rejectionDetails })

    if (action === 'notify_rejection') {
      // Get quotation details
      const quotationResult = await query(`
        SELECT 
          id,
          quotation_number,
          quotation_data,
          created_by,
          total_amount,
          lead_id
        FROM quotations
        WHERE quotation_number = $1
      `, [quotationNumber])

      if (quotationResult.rows.length === 0) {
        return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })
      }

      const quotationData = quotationResult.rows[0]
      const quotationInfo = typeof quotationData.quotation_data === 'string' 
        ? JSON.parse(quotationData.quotation_data) 
        : (quotationData.quotation_data || {})
      
      // NOTE: WhatsApp notification to clients disabled for rejections
      // Rejection is an internal process and clients should not be notified via WhatsApp
      console.log('📱 WhatsApp notification DISABLED for rejections (internal process only)')

      // 🎯 USE VALIDATED TASK ASSIGNMENT - No more random assignments!
      console.log('🎯 Using TaskAssignmentValidator for rejection workflow...')
      
      const assignmentResult = await taskAssignmentValidator.assignTask({
        taskType: 'quotation_revision',
        quotationId: quotationData.id,
        leadId: quotationData.lead_id,
        clientName: quotationInfo.client_name || 'Unknown Client'
      })
      
      console.log('✅ Validated assignment result:', assignmentResult)
      
      // Log any warnings
      if (assignmentResult.warnings) {
        console.warn('⚠️ Assignment warnings:', assignmentResult.warnings)
      }
      
      const salesPersonId = assignmentResult.employeeId
      const salesPersonName = assignmentResult.employeeName
      
      // Create rejection notification task for sales person
      await query(`
        INSERT INTO ai_tasks (
          task_title,
          task_description,
          task_type,
          priority,
          status,
          assigned_to_employee_id,
          assigned_to,
          quotation_id,
          client_name,
          due_date,
          business_impact,
          estimated_value,
          metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [
        `❌ Quotation Rejected - ${quotationInfo.client_name} (${quotationNumber})`,
        `Your quotation ${quotationNumber} for ${quotationInfo.client_name} has been rejected by the Sales Head.

**Rejection Details:**
- Quotation: ${quotationNumber}
- Client: ${quotationInfo.client_name}
- Amount: ₹${quotationData.total_amount?.toLocaleString()}
- Rejection Reason: ${rejectionDetails.reason}

**Your Action Required:**
1. Review the rejection feedback carefully
2. Revise the quotation based on the feedback
3. Update pricing, services, or terms as needed
4. Resubmit the revised quotation for approval

**Next Steps:**
- Edit the quotation with necessary changes
- Ensure all concerns mentioned in rejection are addressed
- Resubmit for Sales Head approval`,
        'quotation_revision',
        'high',
        'pending',
        salesPersonId,
        salesPersonName,
        quotationData.id,
        quotationInfo.client_name,
        new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 hours
        'high',
        quotationData.total_amount,
        JSON.stringify({
          quotation_number: quotationNumber,
          rejection_reason: rejectionDetails.reason,
          rejection_feedback: rejectionDetails.feedback,
          rejection_date: new Date().toISOString(),
          requires_revision: true,
          original_amount: quotationData.total_amount,
          workflow_type: 'rejection_notification'
        })
      ])
      
      console.log('✅ Created rejection notification task for:', salesPersonName)
      
      // Create internal notification for sales team
      await query(`
        INSERT INTO notifications (
          type,
          title,
          message,
          target_user,
          data,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        'quotation_rejected',
        `Quotation ${quotationNumber} Rejected`,
        `Quotation ${quotationNumber} for ${quotationInfo.client_name} has been rejected. Reason: ${rejectionDetails.reason}`,
        salesPersonId,
        JSON.stringify({
          quotation_number: quotationNumber,
          quotation_id: quotationData.id,
          rejection_reason: rejectionDetails.reason,
          rejection_feedback: rejectionDetails.feedback,
          requires_revision: true
        }),
        new Date().toISOString()
      ])

      return NextResponse.json({ 
        success: true, 
        message: 'Rejection notifications sent successfully' 
      })
    } 
    
    else if (action === 'prepare_revision') {
      // Prepare quotation for revision
      await query(`
        UPDATE quotations 
        SET 
          status = 'revision_required',
          updated_at = $1
        WHERE quotation_number = $2
      `, [new Date().toISOString(), quotationNumber])

      return NextResponse.json({ 
        success: true, 
        message: 'Quotation prepared for revision',
        revision_url: `/sales/quotations/edit/${quotationNumber}`
      })
    }

    else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Error in rejection workflow API (PostgreSQL):', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get rejected quotations for a user
export async function GET(request: NextRequest) {
  try {
    console.log('📋 [QUOTATION WORKFLOW] Getting rejected quotations via PostgreSQL...')
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    const result = await query(`
      SELECT 
        q.id,
        q.quotation_number,
        q.quotation_data,
        q.total_amount,
        q.status,
        q.created_at,
        qa.approval_status,
        qa.comments,
        qa.updated_at as approval_updated_at
      FROM quotations q
      JOIN quotation_approvals qa ON q.id = qa.quotation_id
      WHERE qa.approval_status = 'rejected'
      ${userId ? 'AND q.created_by = $1' : ''}
      ORDER BY qa.updated_at DESC
    `, userId ? [userId] : [])

    const rejectedQuotations = result.rows.map(row => ({
      ...row,
      quotation_data: typeof row.quotation_data === 'string' 
        ? JSON.parse(row.quotation_data) 
        : row.quotation_data
    }))

    return NextResponse.json({ 
      quotations: rejectedQuotations
    })

  } catch (error) {
    console.error('❌ Error fetching rejected quotations (PostgreSQL):', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 