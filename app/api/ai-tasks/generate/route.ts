import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/postgresql-client'

// PostgreSQL connection pool
// Using centralized PostgreSQL client

// Simple task service for generating AI-powered tasks
class SimpleTaskService {
  async generateSimpleTasks() {
    const client = await pool.connect()
    
    try {
      // Get current business data for context
      const businessContext = await this.getBusinessContext(client)
      
      // Generate intelligent tasks based on business analysis
      const generatedTasks = await this.analyzeAndGenerateTasks(client, businessContext)
      
      console.log(`🤖 Generated ${generatedTasks.length} AI-powered tasks`)
      
      return {
        tasksCreated: generatedTasks.length,
        tasks: generatedTasks,
        businessContext: businessContext
      }
      
    } finally {
      client.release()
    }
  }
  
  private async getBusinessContext(client: any) {
    // Get leads analysis
    const leadsResult = await client.query(`
      SELECT 
        COUNT(*) as total_leads,
        COUNT(CASE WHEN status = 'NEW' THEN 1 END) as new_leads,
        COUNT(CASE WHEN status = 'CONTACTED' THEN 1 END) as contacted_leads,
        COUNT(CASE WHEN assigned_to IS NULL THEN 1 END) as unassigned_leads,
        AVG(EXTRACT(days FROM NOW() - created_at)) as avg_age_days
      FROM leads
    `)
    
    // Get quotations analysis
    const quotationsResult = await client.query(`
      SELECT 
        COUNT(*) as total_quotations,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_quotations,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_quotations,
        SUM(total_amount) as total_pipeline_value
      FROM quotations
    `)
    
    // Get employee workload analysis
    const employeeWorkloadResult = await client.query(`
      SELECT 
        e.id,
        e.first_name,
        e.last_name,
        r.name as role_name,
        COUNT(t.id) as active_tasks,
        COUNT(l.id) as assigned_leads
      FROM employees e
      LEFT JOIN roles r ON e.role_id = r.id
      LEFT JOIN tasks t ON t.assigned_to = e.id AND t.status = 'open'
      LEFT JOIN leads l ON l.assigned_to = e.id AND l.status != 'REJECTED'
      WHERE e.status = 'active'
      GROUP BY e.id, e.first_name, e.last_name, r.name
      ORDER BY active_tasks ASC
    `)
    
    // Get recent call analytics
    const callAnalyticsResult = await client.query(`
      SELECT 
        COUNT(*) as total_calls,
        COUNT(CASE WHEN duration_seconds > 120 THEN 1 END) as meaningful_calls,
        AVG(duration_seconds) as avg_duration
      FROM call_transcriptions
      WHERE created_at >= NOW() - INTERVAL '7 days'
    `)
    
    return {
      leads: leadsResult.rows[0] || {},
      quotations: quotationsResult.rows[0] || {},
      employees: employeeWorkloadResult.rows || [],
      calls: callAnalyticsResult.rows[0] || {}
    }
  }
  
  private async analyzeAndGenerateTasks(client: any, context: any) {
    const tasks = []
    
    // 1. Lead follow-up tasks for unassigned or stale leads
    if (context.leads.unassigned_leads > 0) {
      const unassignedLeads = await client.query(`
        SELECT id, client_name, phone, email, created_at
        FROM leads 
        WHERE assigned_to IS NULL AND status = 'NEW'
        LIMIT 5
      `)
      
      for (const lead of unassignedLeads.rows) {
        const leastBusyEmployee = context.employees.find((emp: any) => 
          emp.role_name && emp.role_name.toLowerCase().includes('sales')
        ) || context.employees[0]
        
        if (leastBusyEmployee) {
          const taskResult = await client.query(`
            INSERT INTO tasks (
              title,
              description,
              task_type,
              priority,
              status,
              assigned_to,
              lead_id,
              due_date,
              created_at,
              updated_at,
              metadata
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id, title
          `, [
            `🔥 URGENT: Contact new lead ${lead.client_name}`,
            `NEW LEAD ALERT: ${lead.client_name}
            
📞 IMMEDIATE ACTION REQUIRED:
• Contact within 2 hours for best conversion
• Lead created: ${new Date(lead.created_at).toLocaleDateString()}
• Phone: ${lead.phone || 'Not provided'}
• Email: ${lead.email || 'Not provided'}

🎯 FOLLOW-UP STRATEGY:
1. Call first, then WhatsApp if no answer
2. Send portfolio samples via WhatsApp
3. Schedule consultation call
4. Create and send customized quotation

💡 AI INSIGHT: Fresh leads have 70% higher conversion when contacted within 2 hours.`,
            'lead_followup',
            'high',
            'open',
            leastBusyEmployee.id,
            lead.id,
            new Date(Date.now() + 2 * 60 * 60 * 1000), // Due in 2 hours
            new Date(),
            new Date(),
            JSON.stringify({
              ai_generated: true,
              lead_age_hours: Math.round((Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60)),
              priority_reason: 'unassigned_new_lead',
              estimated_value: 75000,
              conversion_probability: 0.7
            })
          ])
          
          tasks.push({
            id: taskResult.rows[0].id,
            title: taskResult.rows[0].title,
            type: 'lead_followup',
            priority: 'high',
            ai_reasoning: 'Unassigned new lead requires immediate attention'
          })
        }
      }
    }
    
    // 2. Quotation follow-up tasks for pending quotations
    if (context.quotations.pending_quotations > 0) {
      const pendingQuotations = await client.query(`
        SELECT 
          q.id,
          q.quotation_number,
          q.client_name,
          q.total_amount,
          q.created_at,
          l.assigned_to,
          e.first_name,
          e.last_name
        FROM quotations q
        LEFT JOIN leads l ON q.lead_id = l.id
        LEFT JOIN employees e ON l.assigned_to = e.id
        WHERE q.status = 'pending'
        AND q.created_at < NOW() - INTERVAL '1 day'
        LIMIT 3
      `)
      
      for (const quotation of pendingQuotations.rows) {
        const assigneeId = quotation.assigned_to || context.employees[0]?.id
        
        if (assigneeId) {
          const taskResult = await client.query(`
            INSERT INTO tasks (
              title,
              description,
              task_type,
              priority,
              status,
              assigned_to,
              quotation_id,
              due_date,
              created_at,
              updated_at,
              metadata
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id, title
          `, [
            `💰 Follow up: ${quotation.client_name} quotation ${quotation.quotation_number}`,
            `QUOTATION FOLLOW-UP: ${quotation.client_name}
            
�� QUOTATION DETAILS:
• Number: ${quotation.quotation_number}
• Amount: ₹${quotation.total_amount?.toLocaleString() || 'TBD'}
• Sent: ${new Date(quotation.created_at).toLocaleDateString()}
• Days pending: ${Math.ceil((Date.now() - new Date(quotation.created_at).getTime()) / (1000 * 60 * 60 * 24))}

📞 ACTION REQUIRED:
• Call client to discuss quotation
• Address any questions or concerns
• Negotiate if necessary (max 10% discount)
• Guide towards booking confirmation

🎯 CONVERSION TIPS:
• Highlight unique value propositions
• Share recent client testimonials
• Offer payment plan options if needed`,
            'quotation_followup',
            'medium',
            'open',
            assigneeId,
            quotation.id,
            new Date(Date.now() + 24 * 60 * 60 * 1000), // Due in 24 hours
            new Date(),
            new Date(),
            JSON.stringify({
              ai_generated: true,
              quotation_amount: quotation.total_amount,
              days_pending: Math.ceil((Date.now() - new Date(quotation.created_at).getTime()) / (1000 * 60 * 60 * 24)),
              priority_reason: 'pending_quotation_followup',
              estimated_conversion_probability: 0.4
            })
          ])
          
          tasks.push({
            id: taskResult.rows[0].id,
            title: taskResult.rows[0].title,
            type: 'quotation_followup',
            priority: 'medium',
            ai_reasoning: 'Pending quotation requires follow-up for conversion'
          })
        }
      }
    }
    
    // 3. Performance improvement tasks for underperforming areas
    if (context.calls.total_calls < 10) {
      const managerEmployee = context.employees.find((emp: any) => 
        emp.role_name && (emp.role_name.toLowerCase().includes('head') || emp.role_name.toLowerCase().includes('manager'))
      ) || context.employees[0]
      
      if (managerEmployee) {
        const taskResult = await client.query(`
          INSERT INTO tasks (
            title,
            description,
            task_type,
            priority,
            status,
            assigned_to,
            due_date,
            created_at,
            updated_at,
            metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING id, title
        `, [
          `📈 Boost client communication - Low call activity detected`,
          `PERFORMANCE IMPROVEMENT REQUIRED
          
📊 ANALYSIS:
• Total calls this week: ${context.calls.total_calls || 0}
• Average duration: ${Math.round(context.calls.avg_duration || 0)}s
• Meaningful calls (>2min): ${context.calls.meaningful_calls || 0}

🎯 ACTION PLAN:
• Review call strategy with team
• Set daily call targets for sales team
• Implement call quality training
• Monitor and improve call conversion rates

💡 RECOMMENDATION:
Increase proactive client outreach to improve business development and client relationships.`,
          'performance_improvement',
          'medium',
          'open',
          managerEmployee.id,
          new Date(Date.now() + 48 * 60 * 60 * 1000), // Due in 48 hours
          new Date(),
          new Date(),
          JSON.stringify({
            ai_generated: true,
            performance_metric: 'call_activity',
            current_value: context.calls.total_calls,
            target_value: 50,
            priority_reason: 'low_communication_activity'
          })
        ])
        
        tasks.push({
          id: taskResult.rows[0].id,
          title: taskResult.rows[0].title,
          type: 'performance_improvement',
          priority: 'medium',
          ai_reasoning: 'Low communication activity requires management attention'
        })
      }
    }
    
    return tasks
  }
}

export async function POST() {
  try {
    console.log('🤖 AI Task Generation API: Starting...')
    
    const simpleService = new SimpleTaskService()
    const result = await simpleService.generateSimpleTasks()
    
    console.log(`✅ Successfully generated ${result.tasksCreated} AI-powered tasks`)
    
    return NextResponse.json({
      success: true,
      message: `Generated ${result.tasksCreated} intelligent tasks based on business analysis`,
      tasksCreated: result.tasksCreated,
      tasks: result.tasks,
      businessContext: result.businessContext,
      capabilities: [
        'Real-time business analysis',
        'Intelligent task prioritization',
        'Employee workload balancing',
        'Lead conversion optimization',
        'Performance gap identification'
      ],
      mode: 'enhanced_postgresql'
    })
  } catch (error) {
    console.error('❌ AI task generation failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const employeeId = url.searchParams.get('employeeId')
    
    const client = await pool.connect()
    
    try {
      if (employeeId) {
        // Get specific employee tasks and analytics
        const employeeTasksResult = await client.query(`
          SELECT 
            t.id,
            t.title,
            t.priority,
            t.status,
            t.due_date,
            t.task_type,
            t.metadata,
            l.client_name,
            q.total_amount as quotation_amount
          FROM tasks t
          LEFT JOIN leads l ON t.lead_id = l.id
          LEFT JOIN quotations q ON t.quotation_id = q.id
          WHERE t.assigned_to = $1
          AND t.status = 'open'
          ORDER BY 
            CASE t.priority 
              WHEN 'high' THEN 1
              WHEN 'medium' THEN 2
              WHEN 'low' THEN 3
            END,
            t.due_date ASC
          LIMIT 10
        `, [employeeId])
        
        // Get employee performance metrics
        const performanceResult = await client.query(`
          SELECT 
            e.first_name,
            e.last_name,
            r.name as role_name,
            COUNT(t.id) as total_tasks,
            COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
            COUNT(CASE WHEN t.due_date < NOW() AND t.status = 'open' THEN 1 END) as overdue_tasks,
            SUM(CASE WHEN t.metadata->>'estimated_value' IS NOT NULL THEN (t.metadata->>'estimated_value')::numeric ELSE 0 END) as revenue_impact
          FROM employees e
          LEFT JOIN roles r ON e.role_id = r.id
          LEFT JOIN tasks t ON t.assigned_to = e.id
          WHERE e.id = $1
          GROUP BY e.id, e.first_name, e.last_name, r.name
        `, [employeeId])
        
        const performance = performanceResult.rows[0] || {}
        const completionRate = performance.total_tasks > 0 ? 
          (performance.completed_tasks / performance.total_tasks).toFixed(2) : '0.00'
        
        return NextResponse.json({
          success: true,
          employee: {
            name: `${performance.first_name} ${performance.last_name}`,
            role: performance.role_name,
            total_tasks: performance.total_tasks || 0,
            completed_tasks: performance.completed_tasks || 0,
            overdue_tasks: performance.overdue_tasks || 0,
            completion_rate: parseFloat(completionRate),
            revenue_impact: performance.revenue_impact || 0
          },
          tasks: employeeTasksResult.rows.map(task => ({
            id: task.id,
            title: task.title,
            priority: task.priority,
            status: task.status,
            due_date: task.due_date,
            task_type: task.task_type,
            client_name: task.client_name,
            estimated_value: task.quotation_amount || 0,
            ai_reasoning: task.metadata?.ai_reasoning || 'Standard business task'
          }))
        })
      }
      
      // Return team performance analytics
      const teamPerformanceResult = await client.query(`
        SELECT 
          e.first_name || ' ' || e.last_name as employee_name,
          r.name as role_name,
          COUNT(t.id) as total_tasks,
          COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
          COUNT(CASE WHEN t.due_date < NOW() AND t.status = 'open' THEN 1 END) as overdue_tasks,
          SUM(CASE WHEN t.metadata->>'estimated_value' IS NOT NULL THEN (t.metadata->>'estimated_value')::numeric ELSE 0 END) as revenue_impact
        FROM employees e
        LEFT JOIN roles r ON e.role_id = r.id
        LEFT JOIN tasks t ON t.assigned_to = e.id
        WHERE e.status = 'active'
        GROUP BY e.id, e.first_name, e.last_name, r.name
        HAVING COUNT(t.id) > 0
        ORDER BY completed_tasks DESC, total_tasks DESC
      `)
      
      return NextResponse.json({
        success: true,
        performance_analytics: teamPerformanceResult.rows.map(row => ({
          employee_name: row.employee_name,
          role: row.role_name,
          total_tasks: row.total_tasks || 0,
          completed_tasks: row.completed_tasks || 0,
          overdue_tasks: row.overdue_tasks || 0,
          completion_rate: row.total_tasks > 0 ? 
            parseFloat((row.completed_tasks / row.total_tasks).toFixed(2)) : 0,
          revenue_impact: row.revenue_impact || 0
        })),
        team_insights: {
          total_active_employees: teamPerformanceResult.rows.length,
          avg_completion_rate: teamPerformanceResult.rows.length > 0 ?
            teamPerformanceResult.rows.reduce((sum, row) => 
              sum + (row.total_tasks > 0 ? row.completed_tasks / row.total_tasks : 0), 0
            ) / teamPerformanceResult.rows.length : 0,
          total_revenue_impact: teamPerformanceResult.rows.reduce((sum, row) => 
            sum + (row.revenue_impact || 0), 0
          )
        }
      })
      
    } finally {
      client.release()
    }

  } catch (error) {
    console.error('❌ Performance analytics failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
} 