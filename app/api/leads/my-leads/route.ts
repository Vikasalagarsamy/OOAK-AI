import { NextResponse } from "next/server"
import { pool } from '@/lib/postgresql-client'

console.log('🐘 Using PostgreSQL client from lib for my-leads API')

// Get current employee ID (simplified for development)
async function getCurrentEmployeeId() {
  // For development, return employee ID 3 (Pooja Karthikeyan - Sales)
  return 3
}

export async function GET() {
  try {
    const employeeId = await getCurrentEmployeeId()

    if (!employeeId) {
      return NextResponse.json(
        {
          error: "Your account is not linked to an employee record. Please contact your administrator.",
        },
        { status: 403 },
      )
    }

    const client = await pool.connect()
    
    try {
      // Enhanced query with newly added columns
      const { rows } = await client.query(`
        SELECT 
          l.id,
          l.lead_number,
          l.client_name,
          l.email,
          l.phone,
          l.company_id,
          l.branch_id,
          l.status,
          l.created_at,
          l.updated_at,
          l.assigned_to,
          l.lead_source,
          l.location,
          l.notes,
          l.bride_name,
          l.groom_name,
          l.priority,
          l.expected_value,
          l.last_contact_date,
          l.next_follow_up_date,
          l.conversion_stage,
          l.lead_score,
          l.tags,
          l.budget_range,
          l.wedding_date,
          l.venue_preference,
          l.guest_count,
          l.description,
          c.name as company_name,
          b.name as branch_name,
          e.first_name as assigned_employee_name,
          e.last_name as assigned_employee_surname,
          r.name as assigned_employee_role,
          
          -- Lead activity metrics
          (
            SELECT COUNT(*) 
            FROM call_transcriptions ct 
            WHERE ct.client_name ILIKE '%' || l.client_name || '%'
          ) as call_count,
          
          (
            SELECT COUNT(*) 
            FROM quotations q 
            WHERE q.client_name ILIKE '%' || l.client_name || '%'
          ) as quotation_count,
          
          -- Lead age calculation
          EXTRACT(days FROM NOW() - l.created_at) as lead_age_days,
          
          -- Days since last contact
          CASE 
            WHEN l.last_contact_date IS NOT NULL 
            THEN EXTRACT(days FROM NOW() - l.last_contact_date)
            ELSE NULL
          END as days_since_last_contact,
          
          -- Follow-up urgency
          CASE 
            WHEN l.next_follow_up_date < NOW() THEN 'overdue'
            WHEN l.next_follow_up_date < NOW() + INTERVAL '1 day' THEN 'urgent'
            WHEN l.next_follow_up_date < NOW() + INTERVAL '3 days' THEN 'soon'
            ELSE 'scheduled'
          END as follow_up_urgency
          
        FROM leads l
        LEFT JOIN companies c ON l.company_id = c.id
        LEFT JOIN branches b ON l.branch_id = b.id
        LEFT JOIN employees e ON l.assigned_to = e.id
        LEFT JOIN roles r ON e.role_id = r.id
        WHERE l.assigned_to = $1
        AND l.status != 'REJECTED'
        ORDER BY 
          CASE 
            WHEN l.next_follow_up_date < NOW() THEN 1  -- Overdue first
            WHEN l.status = 'NEW' THEN 2               -- New leads second
            WHEN l.priority = 'urgent' THEN 3          -- Urgent priority third
            WHEN l.priority = 'high' THEN 4            -- High priority fourth
            ELSE 5                                     -- Everything else
          END,
          l.next_follow_up_date ASC NULLS LAST,
          l.created_at DESC
      `, [employeeId])

      // Enhanced lead processing with all available data
      const enrichedLeads = rows.map(lead => ({
        // Core lead information
        id: lead.id,
        lead_number: lead.lead_number,
        client_name: lead.client_name,
        email: lead.email,
        phone: lead.phone,
        status: lead.status,
        created_at: lead.created_at,
        updated_at: lead.updated_at,
        location: lead.location,
        notes: lead.notes,
        bride_name: lead.bride_name,
        groom_name: lead.groom_name,
        description: lead.description,
        
        // Priority and value information
        priority: lead.priority,
        expected_value: parseFloat(lead.expected_value) || 0,
        budget_range: lead.budget_range,
        
        // Contact and follow-up information
        last_contact_date: lead.last_contact_date,
        next_follow_up_date: lead.next_follow_up_date,
        days_since_last_contact: lead.days_since_last_contact ? Math.floor(parseFloat(lead.days_since_last_contact)) : null,
        follow_up_urgency: lead.follow_up_urgency,
        
        // Wedding-specific information
        wedding_date: lead.wedding_date,
        venue_preference: lead.venue_preference,
        guest_count: lead.guest_count ? parseInt(lead.guest_count) : null,
        
        // Lead scoring and categorization
        conversion_stage: lead.conversion_stage,
        lead_score: lead.lead_score ? parseInt(lead.lead_score) : 50,
        tags: lead.tags || [],
        
        // Company and branch information
        company_id: lead.company_id,
        company_name: lead.company_name || "Unknown Company",
        branch_id: lead.branch_id,
        branch_name: lead.branch_name,
        
        // Assignment information
        assigned_to: lead.assigned_to,
        assigned_employee_name: lead.assigned_employee_name,
        assigned_employee_surname: lead.assigned_employee_surname,
        assigned_employee_role: lead.assigned_employee_role,
        
        // Activity metrics
        call_count: parseInt(lead.call_count) || 0,
        quotation_count: parseInt(lead.quotation_count) || 0,
        
        // Timing information
        lead_age_days: Math.floor(parseFloat(lead.lead_age_days)) || 0,
        
        // Lead source analytics
        lead_source: lead.lead_source,
        
        // Computed insights
        engagement_level: (parseInt(lead.call_count) || 0) > 2 ? 'high' : 
                         (parseInt(lead.call_count) || 0) > 0 ? 'medium' : 'low',
        
        value_category: (parseFloat(lead.expected_value) || 0) > 100000 ? 'high' :
                       (parseFloat(lead.expected_value) || 0) > 50000 ? 'medium' : 'low',
        
        // AI-powered recommendations
        recommended_action: getRecommendedAction(lead),
        
        // Enhanced lead health score
        health_score: calculateLeadHealthScore(lead)
      }))

      // Get comprehensive lead summary statistics
      const summaryStats = await client.query(`
        SELECT 
          COUNT(*) as total_leads,
          COUNT(CASE WHEN status = 'NEW' THEN 1 END) as new_leads,
          COUNT(CASE WHEN status = 'CONTACTED' THEN 1 END) as contacted_leads,
          COUNT(CASE WHEN status = 'QUALIFIED' THEN 1 END) as qualified_leads,
          COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_leads,
          COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority_leads,
          COUNT(CASE WHEN next_follow_up_date < NOW() THEN 1 END) as overdue_leads,
          SUM(expected_value) as total_pipeline_value,
          AVG(expected_value) as avg_lead_value,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as new_this_week,
          COUNT(CASE WHEN last_contact_date >= NOW() - INTERVAL '7 days' THEN 1 END) as contacted_this_week,
          AVG(lead_score) as avg_lead_score
        FROM leads 
        WHERE assigned_to = $1 AND status != 'REJECTED'
      `, [employeeId])

      const stats = summaryStats.rows[0] || {}

      console.log(`✅ Fetched ${enrichedLeads.length} leads for employee ID: ${employeeId}`)

      return NextResponse.json({
        success: true,
        leads: enrichedLeads,
        summary: {
          total_leads: parseInt(stats.total_leads) || 0,
          new_leads: parseInt(stats.new_leads) || 0,
          contacted_leads: parseInt(stats.contacted_leads) || 0,
          qualified_leads: parseInt(stats.qualified_leads) || 0,
          urgent_leads: parseInt(stats.urgent_leads) || 0,
          high_priority_leads: parseInt(stats.high_priority_leads) || 0,
          overdue_leads: parseInt(stats.overdue_leads) || 0,
          total_pipeline_value: parseFloat(stats.total_pipeline_value) || 0,
          avg_lead_value: parseFloat(stats.avg_lead_value) || 0,
          new_this_week: parseInt(stats.new_this_week) || 0,
          contacted_this_week: parseInt(stats.contacted_this_week) || 0,
          avg_lead_score: parseFloat(stats.avg_lead_score) || 50,
          conversion_rate: stats.total_leads > 0 ? 
            ((parseInt(stats.qualified_leads) || 0) / parseInt(stats.total_leads) * 100).toFixed(1) + '%' : '0%'
        },
        insights: {
          priority_leads: enrichedLeads.filter(lead => 
            lead.follow_up_urgency === 'overdue' || 
            lead.follow_up_urgency === 'urgent' ||
            lead.priority === 'urgent'
          ),
          high_value_leads: enrichedLeads.filter(lead => lead.value_category === 'high'),
          stale_leads: enrichedLeads.filter(lead => 
            lead.lead_age_days > 14 && 
            (lead.days_since_last_contact === null || lead.days_since_last_contact > 7)
          ),
          wedding_leads: enrichedLeads.filter(lead => lead.wedding_date !== null),
          recent_activity: enrichedLeads.filter(lead => 
            lead.days_since_last_contact !== null && lead.days_since_last_contact <= 3
          ),
          requires_attention: enrichedLeads.filter(lead => 
            lead.follow_up_urgency === 'overdue' || 
            (lead.status === 'NEW' && lead.lead_age_days > 2) ||
            lead.health_score < 40 ||
            lead.priority === 'urgent'
          )
        },
        employee_info: {
          employee_id: employeeId,
          current_user: "Pooja Karthikeyan (Sales)"
        }
      })
      
    } finally {
      client.release()
    }

  } catch (error) {
    console.error("Error in my-leads API:", error)
    return NextResponse.json({ 
      success: false,
      error: "An unexpected error occurred while fetching leads" 
    }, { status: 500 })
  }
}

// Enhanced helper function for AI-powered recommended actions
function getRecommendedAction(lead: any): string {
  const callCount = parseInt(lead.call_count) || 0
  const quotationCount = parseInt(lead.quotation_count) || 0
  const leadAge = Math.floor(parseFloat(lead.lead_age_days)) || 0
  const daysSinceContact = lead.days_since_last_contact ? Math.floor(parseFloat(lead.days_since_last_contact)) : null
  
  // Overdue follow-ups take highest priority
  if (lead.follow_up_urgency === 'overdue') {
    return 'URGENT: Follow-up overdue - Contact immediately'
  }
  
  if (lead.follow_up_urgency === 'urgent') {
    return 'High Priority: Contact within next 2 hours'
  }
  
  // New lead priorities
  if (lead.status === 'NEW' && leadAge === 0) {
    return 'New lead: Make first contact within 2 hours'
  }
  
  if (lead.status === 'NEW' && leadAge > 1) {
    return 'Priority: Contact new lead - response time critical'
  }
  
  // Priority-based actions
  if (lead.priority === 'urgent' && (daysSinceContact === null || daysSinceContact > 1)) {
    return 'Urgent lead: Immediate attention required'
  }
  
  // Contact history based actions
  if (callCount === 0 && leadAge > 0) {
    return 'First contact: Call and introduce services'
  }
  
  if (callCount > 0 && quotationCount === 0 && lead.conversion_stage !== 'quotation_sent') {
    return 'Send quotation: Lead is engaged and ready for pricing'
  }
  
  if (quotationCount > 0 || lead.conversion_stage === 'quotation_sent') {
    return 'Follow up on quotation: Check client feedback and close deal'
  }
  
  // Wedding-specific recommendations
  if (lead.wedding_date) {
    const weddingDate = new Date(lead.wedding_date)
    const today = new Date()
    const daysToWedding = Math.ceil((weddingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysToWedding <= 30) {
      return 'Wedding approaching: Finalize details and confirm bookings'
    } else if (daysToWedding <= 90) {
      return 'Wedding planning: Discuss detailed requirements and timeline'
    }
  }
  
  // Stale lead handling
  if (daysSinceContact !== null && daysSinceContact > 14) {
    return 'Re-engage: Lead has been inactive - send follow-up message'
  }
  
  if (lead.status === 'CONTACTED') {
    return 'Continue nurturing: Build relationship and identify specific needs'
  }
  
  return 'Regular follow-up: Maintain client relationship and explore opportunities'
}

// Enhanced lead health score calculation
function calculateLeadHealthScore(lead: any): number {
  let score = 50 // Base score
  
  const callCount = parseInt(lead.call_count) || 0
  const quotationCount = parseInt(lead.quotation_count) || 0
  const leadAge = Math.floor(parseFloat(lead.lead_age_days)) || 0
  const expectedValue = parseFloat(lead.expected_value) || 0
  const daysSinceContact = lead.days_since_last_contact ? Math.floor(parseFloat(lead.days_since_last_contact)) : null
  
  // Positive factors
  if (callCount > 0) score += 15
  if (callCount > 2) score += 10
  if (quotationCount > 0) score += 20
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
  if (lead.follow_up_urgency === 'overdue') score -= 25
  if (lead.status === 'NEW' && leadAge > 2) score -= 15
  if (callCount === 0 && leadAge > 1) score -= 10
  if (daysSinceContact !== null && daysSinceContact > 14) score -= 15
  if (daysSinceContact !== null && daysSinceContact > 30) score -= 20
  
  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, score))
}
