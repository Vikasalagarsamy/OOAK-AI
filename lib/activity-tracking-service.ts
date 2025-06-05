import { createClient } from '@/lib/supabase/server'

// Activity Tracking Service for Real-Time Performance Monitoring
export class ActivityTrackingService {

  // 📝 Log quotation creation activity
  static async logQuotationCreated(quotationData: any, userId: string) {
    try {
      const activity = {
        employee_id: userId,
        quotation_id: quotationData.id,
        activity_type: 'quotation_created',
        activity_description: `Created quotation for ${quotationData.client_name}`,
        activity_outcome: 'quotation_generated',
        time_spent_minutes: 45, // Estimated average time
        client_name: quotationData.client_name,
        deal_value: quotationData.total_amount,
        notes: `Package: ${quotationData.default_package}, Events: ${quotationData.events_count}`
      }

      await this.logActivity(activity)
      console.log(`📝 Logged quotation creation: ${quotationData.id}`)

    } catch (error) {
      console.error('❌ Error logging quotation creation:', error)
    }
  }

  // 📧 Log quotation sent activity
  static async logQuotationSent(quotationId: number, clientEmail: string, userId: string) {
    try {
      const activity = {
        employee_id: userId,
        quotation_id: quotationId,
        activity_type: 'quotation_sent',
        activity_description: `Sent quotation via email to ${clientEmail}`,
        activity_outcome: 'email_sent',
        time_spent_minutes: 10,
        notes: `Email delivery to ${clientEmail}`
      }

      await this.logActivity(activity)
      console.log(`📧 Logged quotation sent: ${quotationId}`)

    } catch (error) {
      console.error('❌ Error logging quotation sent:', error)
    }
  }

  // 📞 Log follow-up call activity
  static async logFollowUpCall(quotationId: number, outcome: string, notes: string, userId: string) {
    try {
      const activity = {
        employee_id: userId,
        quotation_id: quotationId,
        activity_type: 'follow_up_call',
        activity_description: `Follow-up call regarding quotation`,
        activity_outcome: outcome,
        time_spent_minutes: 15,
        notes: notes
      }

      await this.logActivity(activity)
      console.log(`📞 Logged follow-up call: ${quotationId}`)

    } catch (error) {
      console.error('❌ Error logging follow-up call:', error)
    }
  }

  // 💼 Log client meeting activity
  static async logClientMeeting(quotationId: number, meetingType: string, duration: number, outcome: string, userId: string) {
    try {
      const activity = {
        employee_id: userId,
        quotation_id: quotationId,
        activity_type: 'client_meeting',
        activity_description: `${meetingType} with client`,
        activity_outcome: outcome,
        time_spent_minutes: duration,
        notes: `Meeting type: ${meetingType}, Duration: ${duration} minutes`
      }

      await this.logActivity(activity)
      console.log(`💼 Logged client meeting: ${quotationId}`)

    } catch (error) {
      console.error('❌ Error logging client meeting:', error)
    }
  }

  // ✅ Log deal conversion (quotation approved)
  static async logDealWon(quotationId: number, dealValue: number, userId: string) {
    try {
      const activity = {
        employee_id: userId,
        quotation_id: quotationId,
        activity_type: 'contract_signed',
        activity_description: `Deal won - quotation approved`,
        activity_outcome: 'deal_closed_won',
        time_spent_minutes: 30,
        deal_value: dealValue,
        notes: `Successfully converted quotation to approved deal`
      }

      await this.logActivity(activity)
      console.log(`✅ Logged deal won: ${quotationId} - ₹${dealValue}`)

    } catch (error) {
      console.error('❌ Error logging deal won:', error)
    }
  }

  // ❌ Log deal lost
  static async logDealLost(quotationId: number, reason: string, userId: string) {
    try {
      const activity = {
        employee_id: userId,
        quotation_id: quotationId,
        activity_type: 'deal_lost',
        activity_description: `Deal lost - quotation rejected`,
        activity_outcome: 'deal_closed_lost',
        time_spent_minutes: 10,
        notes: `Reason: ${reason}`
      }

      await this.logActivity(activity)
      console.log(`❌ Logged deal lost: ${quotationId}`)

    } catch (error) {
      console.error('❌ Error logging deal lost:', error)
    }
  }

  // 📝 Log proposal revision activity
  static async logProposalRevision(quotationId: number, changes: string, userId: string) {
    try {
      const activity = {
        employee_id: userId,
        quotation_id: quotationId,
        activity_type: 'proposal_revision',
        activity_description: `Revised quotation based on client feedback`,
        activity_outcome: 'proposal_updated',
        time_spent_minutes: 60,
        notes: `Changes: ${changes}`
      }

      await this.logActivity(activity)
      console.log(`📝 Logged proposal revision: ${quotationId}`)

    } catch (error) {
      console.error('❌ Error logging proposal revision:', error)
    }
  }

  // 🏠 Log site visit activity
  static async logSiteVisit(quotationId: number, location: string, duration: number, findings: string, userId: string) {
    try {
      const activity = {
        employee_id: userId,
        quotation_id: quotationId,
        activity_type: 'site_visit',
        activity_description: `Site visit at ${location}`,
        activity_outcome: 'site_assessed',
        time_spent_minutes: duration,
        notes: `Location: ${location}, Findings: ${findings}`
      }

      await this.logActivity(activity)
      console.log(`🏠 Logged site visit: ${quotationId}`)

    } catch (error) {
      console.error('❌ Error logging site visit:', error)
    }
  }

  // 💰 Log negotiation activity
  static async logNegotiation(quotationId: number, originalAmount: number, negotiatedAmount: number, userId: string) {
    try {
      const activity = {
        employee_id: userId,
        quotation_id: quotationId,
        activity_type: 'negotiation',
        activity_description: `Price negotiation session`,
        activity_outcome: 'price_negotiated',
        time_spent_minutes: 45,
        deal_value: negotiatedAmount,
        notes: `Original: ₹${originalAmount}, Negotiated: ₹${negotiatedAmount}`
      }

      await this.logActivity(activity)
      console.log(`💰 Logged negotiation: ${quotationId}`)

    } catch (error) {
      console.error('❌ Error logging negotiation:', error)
    }
  }

  // 🔄 Core activity logging function
  private static async logActivity(activityData: any) {
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('sales_activities')
        .insert({
          ...activityData,
          activity_date: new Date().toISOString(),
          created_at: new Date().toISOString()
        })

      if (error) {
        console.error('❌ Database error logging activity:', error)
      }

    } catch (error) {
      console.error('❌ Error in core activity logging:', error)
    }
  }

  // 📊 Get activity summary for a sales rep
  static async getActivitySummary(userId: string, period: string = 'current_month') {
    try {
      const supabase = createClient()
      
      // Calculate date range
      const now = new Date()
      let startDate: Date
      
      switch (period) {
        case 'current_week':
          startDate = new Date(now.setDate(now.getDate() - 7))
          break
        case 'current_month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case 'last_30_days':
          startDate = new Date(now.setDate(now.getDate() - 30))
          break
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      }

      const { data: activities } = await supabase
        .from('sales_activities')
        .select('*')
        .eq('employee_id', userId)
        .gte('activity_date', startDate.toISOString())
        .order('activity_date', { ascending: false })

      if (!activities) return null

      // Calculate activity metrics
      const summary = {
        total_activities: activities.length,
        quotations_created: activities.filter(a => a.activity_type === 'quotation_created').length,
        follow_up_calls: activities.filter(a => a.activity_type === 'follow_up_call').length,
        client_meetings: activities.filter(a => a.activity_type === 'client_meeting').length,
        site_visits: activities.filter(a => a.activity_type === 'site_visit').length,
        deals_won: activities.filter(a => a.activity_type === 'contract_signed').length,
        deals_lost: activities.filter(a => a.activity_type === 'deal_lost').length,
        total_time_spent: activities.reduce((sum, a) => sum + (a.time_spent_minutes || 0), 0),
        total_deal_value: activities
          .filter(a => a.deal_value)
          .reduce((sum, a) => sum + (a.deal_value || 0), 0),
        recent_activities: activities.slice(0, 10),
        period
      }

      return summary

    } catch (error) {
      console.error('❌ Error getting activity summary:', error)
      return null
    }
  }

  // 📈 Get team-wide activity metrics
  static async getTeamActivityMetrics(period: string = 'current_month') {
    try {
      const supabase = createClient()
      
      const now = new Date()
      let startDate: Date
      
      switch (period) {
        case 'current_week':
          startDate = new Date(now.setDate(now.getDate() - 7))
          break
        case 'current_month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case 'last_30_days':
          startDate = new Date(now.setDate(now.getDate() - 30))
          break
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      }

      const { data: activities } = await supabase
        .from('sales_activities')
        .select('*')
        .gte('activity_date', startDate.toISOString())

      if (!activities) return null

      // Group by employee
      const teamMetrics = new Map()

      for (const activity of activities) {
        const empId = activity.employee_id
        if (!teamMetrics.has(empId)) {
          teamMetrics.set(empId, {
            employee_id: empId,
            total_activities: 0,
            quotations_created: 0,
            follow_up_calls: 0,
            client_meetings: 0,
            deals_won: 0,
            total_time_spent: 0,
            total_deal_value: 0
          })
        }

        const metrics = teamMetrics.get(empId)
        metrics.total_activities++
        metrics.total_time_spent += activity.time_spent_minutes || 0
        metrics.total_deal_value += activity.deal_value || 0

        switch (activity.activity_type) {
          case 'quotation_created':
            metrics.quotations_created++
            break
          case 'follow_up_call':
            metrics.follow_up_calls++
            break
          case 'client_meeting':
            metrics.client_meetings++
            break
          case 'contract_signed':
            metrics.deals_won++
            break
        }
      }

      return {
        period,
        team_metrics: Array.from(teamMetrics.values()),
        total_activities: activities.length,
        total_team_time: activities.reduce((sum, a) => sum + (a.time_spent_minutes || 0), 0),
        total_team_revenue: activities
          .filter(a => a.deal_value)
          .reduce((sum, a) => sum + (a.deal_value || 0), 0)
      }

    } catch (error) {
      console.error('❌ Error getting team activity metrics:', error)
      return null
    }
  }

  // 🔔 Auto-trigger activity updates when quotation status changes
  static async handleQuotationStatusChange(quotationId: number, oldStatus: string, newStatus: string, userId: string) {
    try {
      if (newStatus === 'approved' && oldStatus !== 'approved') {
        // Get quotation details
        const supabase = createClient()
        const { data: quotation } = await supabase
          .from('quotations')
          .select('total_amount, client_name')
          .eq('id', quotationId)
          .single()

        if (quotation) {
          await this.logDealWon(quotationId, quotation.total_amount, userId)
        }
      } else if (newStatus === 'rejected' && oldStatus !== 'rejected') {
        await this.logDealLost(quotationId, 'Client rejected proposal', userId)
      }

    } catch (error) {
      console.error('❌ Error handling quotation status change:', error)
    }
  }
} 