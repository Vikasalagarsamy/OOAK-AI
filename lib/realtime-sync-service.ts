import { query } from '@/lib/postgresql-client'
import { getCurrentUser } from '@/actions/auth-actions'

// Real-Time Data Synchronization Service
export class RealtimeSyncService {
  
  // 🔄 Sync existing quotations to performance metrics
  static async syncQuotationData() {
    try {
      console.log('🔄 Starting real-time data sync...')

      // Get all quotations from the correct table
      const quotationsData = await query(`SELECT * FROM quotations ORDER BY created_at DESC`)
      const quotations = quotationsData.rows

      if (!quotations?.length) {
        console.log('⚠️ No quotations found to sync')
        return { success: false, message: 'No quotations found' }
      }

      console.log(`📊 Found ${quotations.length} quotations to process`)

      // Group quotations by created_by (sales rep) and month
      const performanceMap = new Map()

      for (const quotation of quotations) {
        const salesRep = quotation.created_by || 'Unknown'
        const month = new Date(quotation.created_at).toISOString().slice(0, 7) + '-01'
        const key = `${salesRep}-${month}`

        if (!performanceMap.has(key)) {
          performanceMap.set(key, {
            employee_id: salesRep,
            metric_period: month,
            quotations: [],
            quotations_created: 0,
            quotations_converted: 0,
            total_revenue_generated: 0,
            activity_logs: []
          })
        }

        const metrics = performanceMap.get(key)
        metrics.quotations.push(quotation)
        metrics.quotations_created++

        // Check if quotation is converted (approved)
        if (quotation.status === 'approved') {
          metrics.quotations_converted++
          metrics.total_revenue_generated += quotation.total_amount || 0
        }
      }

      // Process each sales rep's performance
      let syncedCount = 0
      for (const [key, metrics] of performanceMap) {
        const performanceData = await this.calculatePerformanceMetrics(metrics)
        
        // Upsert performance data
        try {
          await query(`
            INSERT INTO sales_performance_metrics 
            (employee_id, metric_period, quotations_created, quotations_converted, 
             total_revenue_generated, avg_deal_size, avg_conversion_time_days, 
             follow_ups_completed, client_meetings_held, calls_made, emails_sent, 
             conversion_rate, activity_score, performance_score, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            ON CONFLICT (employee_id, metric_period) 
            DO UPDATE SET 
              quotations_created = EXCLUDED.quotations_created,
              quotations_converted = EXCLUDED.quotations_converted,
              total_revenue_generated = EXCLUDED.total_revenue_generated,
              avg_deal_size = EXCLUDED.avg_deal_size,
              avg_conversion_time_days = EXCLUDED.avg_conversion_time_days,
              follow_ups_completed = EXCLUDED.follow_ups_completed,
              client_meetings_held = EXCLUDED.client_meetings_held,
              calls_made = EXCLUDED.calls_made,
              emails_sent = EXCLUDED.emails_sent,
              conversion_rate = EXCLUDED.conversion_rate,
              activity_score = EXCLUDED.activity_score,
              performance_score = EXCLUDED.performance_score,
              created_at = EXCLUDED.created_at
          `, [
            performanceData.employee_id,
            performanceData.metric_period,
            performanceData.quotations_created,
            performanceData.quotations_converted,
            performanceData.total_revenue_generated,
            performanceData.avg_deal_size,
            performanceData.avg_conversion_time_days,
            performanceData.follow_ups_completed,
            performanceData.client_meetings_held,
            performanceData.calls_made,
            performanceData.emails_sent,
            performanceData.conversion_rate,
            performanceData.activity_score,
            performanceData.performance_score,
            performanceData.created_at
          ])

          syncedCount++
          console.log(`✅ Synced performance for ${metrics.employee_id} - ${metrics.metric_period}`)
        } catch (error) {
          console.error(`❌ Error syncing ${key}:`, error)
        }
      }

      console.log(`🎯 Sync completed: ${syncedCount} performance records updated`)
      return { 
        success: true, 
        message: `Synced ${syncedCount} performance records`,
        processed: quotations.length,
        updated: syncedCount
      }

    } catch (error) {
      console.error('❌ Real-time sync failed:', error)
      return { success: false, error: error.message }
    }
  }

  // 📈 Calculate comprehensive performance metrics
  static async calculatePerformanceMetrics(rawMetrics: any) {
    const {
      employee_id,
      metric_period,
      quotations_created,
      quotations_converted,
      total_revenue_generated,
      quotations
    } = rawMetrics

    // Calculate conversion rate
    const conversion_rate = quotations_created > 0 ? quotations_converted / quotations_created : 0

    // Calculate average deal size
    const avg_deal_size = quotations_converted > 0 ? total_revenue_generated / quotations_converted : 0

    // Calculate average conversion time
    const convertedQuotations = quotations.filter(q => q.status === 'approved')
    let avg_conversion_time_days = 0
    if (convertedQuotations.length > 0) {
      const totalDays = convertedQuotations.reduce((sum, q) => {
        const created = new Date(q.created_at)
        const updated = new Date(q.updated_at)
        return sum + Math.floor((updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
      }, 0)
      avg_conversion_time_days = Math.round(totalDays / convertedQuotations.length)
    }

    // Calculate activity score (based on quotation frequency and follow-ups)
    const activity_score = this.calculateActivityScore({
      quotations_created,
      quotations_converted,
      conversion_rate,
      avg_conversion_time_days
    })

    // Calculate overall performance score
    const performance_score = this.calculatePerformanceScore({
      conversion_rate,
      activity_score,
      total_revenue_generated,
      quotations_created
    })

    return {
      employee_id,
      metric_period,
      quotations_created,
      quotations_converted,
      total_revenue_generated,
      avg_deal_size: Math.round(avg_deal_size),
      avg_conversion_time_days,
      follow_ups_completed: Math.floor(quotations_created * 1.5), // Estimated
      client_meetings_held: Math.floor(quotations_created * 0.8), // Estimated
      calls_made: Math.floor(quotations_created * 2.5), // Estimated
      emails_sent: Math.floor(quotations_created * 3), // Estimated
      conversion_rate: Number(conversion_rate.toFixed(4)),
      activity_score: Number(activity_score.toFixed(2)),
      performance_score: Number(performance_score.toFixed(2)),
      created_at: new Date().toISOString(),
    }
  }

  // 🎯 Calculate activity score (0-10 scale)
  static calculateActivityScore(metrics: any): number {
    const { quotations_created, conversion_rate, avg_conversion_time_days } = metrics
    
    let score = 5.0 // Base score

    // Quotation volume factor (0-3 points)
    if (quotations_created >= 20) score += 3
    else if (quotations_created >= 15) score += 2
    else if (quotations_created >= 10) score += 1
    else if (quotations_created < 5) score -= 1

    // Conversion efficiency factor (0-2 points)
    if (conversion_rate >= 0.7) score += 2
    else if (conversion_rate >= 0.5) score += 1
    else if (conversion_rate < 0.3) score -= 1

    // Speed factor (0-1 points)
    if (avg_conversion_time_days <= 7) score += 1
    else if (avg_conversion_time_days > 21) score -= 0.5

    return Math.max(0, Math.min(10, score))
  }

  // 🏆 Calculate performance score (0-10 scale)
  static calculatePerformanceScore(metrics: any): number {
    const { conversion_rate, activity_score, total_revenue_generated, quotations_created } = metrics
    
    let score = 0

    // Conversion rate weight: 40%
    score += (conversion_rate * 10) * 0.4

    // Activity score weight: 30%
    score += activity_score * 0.3

    // Revenue impact weight: 20%
    const revenueScore = Math.min(10, (total_revenue_generated / 500000) * 10)
    score += revenueScore * 0.2

    // Productivity weight: 10%
    const productivityScore = Math.min(10, (quotations_created / 15) * 10)
    score += productivityScore * 0.1

    return Math.max(0, Math.min(10, score))
  }

  // 👥 Sync team members from existing users
  static async syncTeamMembers() {
    try {
      console.log('👥 Syncing team members...')

      // Get current user info for proper display
      const currentUser = await getCurrentUser()
      console.log('🔍 Current user for sync:', currentUser?.username)

      // Get unique sales reps from quotations
      const quotationsData = await query(`SELECT DISTINCT created_by FROM quotations WHERE created_by IS NOT NULL`)

      if (!quotationsData.rows?.length) return { success: false, message: 'No quotations found' }

      const uniqueReps = quotationsData.rows.map(q => q.created_by).filter(Boolean)
      console.log(`👥 Found ${uniqueReps.length} unique sales reps`)

      let syncedCount = 0
      for (const repId of uniqueReps) {
        // Check if team member already exists
        const existingData = await query(`SELECT employee_id FROM sales_team_members WHERE employee_id = $1`, [repId])

        if (!existingData.rows || existingData.rows.length === 0) {
          // Create new team member record with real user data
          const displayName = repId === currentUser?.id ? 
            currentUser.username || `User ${currentUser?.id}` : 
            `Sales Rep ${repId.slice(-8)}`
          
          const email = repId === currentUser?.id ? 
            `${currentUser.username}@company.com` : 
            `sales.rep.${repId.slice(-4)}@company.com`

          try {
            await query(`
              INSERT INTO sales_team_members 
              (employee_id, full_name, email, role, hire_date, territory, target_monthly, is_active)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [
              repId,
              displayName,
              email,
              'sales_rep',
              '2023-01-01', // Default date
              'General',
              500000,
              true
            ])

            syncedCount++
            console.log(`✅ Created team member: ${displayName} (${repId})`)
          } catch (error) {
            console.error(`❌ Error creating team member ${repId}:`, error)
          }
        }
      }

      console.log(`👥 Team sync completed: ${syncedCount} members added`)
      return { success: true, synced: syncedCount }

    } catch (error) {
      console.error('❌ Team sync failed:', error)
      return { success: false, error: error.message }
    }
  }

  // 🔄 Full sync process
  static async performFullSync() {
    console.log('🚀 Starting full real-time sync process...')
    
    const teamSync = await this.syncTeamMembers()
    const dataSync = await this.syncQuotationData()
    
    return {
      success: teamSync.success && dataSync.success,
      teamSync,
      dataSync,
      timestamp: new Date().toISOString()
    }
  }

  // 📊 Get real-time performance summary
  static async getRealtimePerformanceSummary() {
    try {
      const metricsData = await query(`SELECT * FROM sales_performance_metrics ORDER BY metric_period DESC`)
      const quotationsData = await query(`SELECT status, total_amount, created_at FROM quotations`)

      const metrics = metricsData.rows
      const quotations = quotationsData.rows

      const summary = {
        total_quotations: quotations?.length || 0,
        approved_quotations: quotations?.filter(q => q.status === 'approved').length || 0,
        total_revenue: quotations?.filter(q => q.status === 'approved')
          .reduce((sum, q) => sum + (q.total_amount || 0), 0) || 0,
        team_conversion_rate: 0,
        active_reps: metrics?.length || 0,
        last_sync: new Date().toISOString()
      }

      if (summary.total_quotations > 0) {
        summary.team_conversion_rate = summary.approved_quotations / summary.total_quotations
      }

      return summary
    } catch (error) {
      console.error('❌ Error getting performance summary:', error)
      return null
    }
  }
} 