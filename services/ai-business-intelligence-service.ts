import { createClient } from '@/lib/supabase'

export interface ComprehensiveBusinessData {
  // Core Business Data
  sales: {
    totalQuotations: number
    activeQuotations: number
    conversionRate: number
    totalRevenue: number
    monthlyRevenue: number
    averageQuotationValue: number
    topClients: Array<{ name: string; value: number }>
    salesTrends: Array<{ month: string; value: number }>
    quotationDetails: Array<{ id: string; client_name: string; total_amount: number; status: string; created_at: string }>
    workflowStatus: Array<{ status: string; count: number }>
    approvalsPending: number
  }
  employees: {
    totalEmployees: number
    departmentDistribution: Array<{ department: string; count: number }>
    recentHires: number
    employeeGrowthRate: number
    employeeDetails: Array<{ name: string; department: string; position: string; created_at: string }>
    totalDepartments?: number
    departmentList?: Array<{ id: number; name: string; description: string }>
    salesTeamPerformance?: Array<{ name: string; quotations: number; conversions: number; revenue: number }>
  }
  operations: {
    totalCompanies: number
    totalBranches: number
    totalClients: number
    totalDepartments?: number
    activeLeads: number
    leadConversionRate: number
    todaysLeads: number
    recentLeads: Array<{ name: string; status: string; created_at: string }>
    deliverables: Array<{ category: string; type: string; name: string }>
    suppliers?: Array<{ name: string; category: string; status: string }>
  }
  workflows: {
    quotationWorkflow: Array<{ stage: string; count: number; avgDays: number }>
    approvalQueue: Array<{ quotation: string; client: string; value: number; daysPending: number }>
    postSaleConfirmations: Array<{ quotation: string; status: string; daysSincePayment: number }>
    followupsDue: Array<{ lead: string; type: string; scheduled: string; overdue: boolean }>
  }
  ai_insights: {
    quotationPredictions: Array<{ quotation: string; successProbability: number; factors: string[] }>
    clientInsights: Array<{ client: string; sentiment: number; conversionProbability: number }>
    actionRecommendations: Array<{ type: string; priority: string; description: string; impact: string }>
    revenueForecast: { predicted: number; confidence: number; period: string }
  }
  notifications: {
    unreadCount: number
    urgentCount: number
    recentNotifications: Array<{ type: string; title: string; priority: string; created: string }>
  }
  performance: {
    quotationResponseTime: number
    clientSatisfactionScore: number
    teamProductivity: number
    systemHealth: { notifications: boolean; workflows: boolean; ai: boolean }
  }
  // NEW: AI Task Management Data
  taskManagement: {
    totalActiveTasks: number
    completedTasks: number
    overdueTasks: number
    taskCompletionRate: number
    averageTaskCompletion: number
    tasksByPriority: Record<string, number>
    tasksByType: Record<string, number>
    employeePerformance: Array<{
      employee_id: number
      employee_name: string
      total_tasks: number
      completed_tasks: number
      completion_rate: number
      overdue_tasks: number
      revenue_impact: number
    }>
    upcomingDeadlines: Array<{
      task_id: string
      title: string
      due_date: string
      priority: string
      assigned_to: string
      client_name?: string
    }>
    aiTaskInsights: {
      tasksGenerated: number
      automationSuccessRate: number
      revenueProtected: number
      timesSaved: number
    }
  }
}

export class AIBusinessIntelligenceService {
  private supabase = createClient()

  async getComprehensiveBusinessData(): Promise<ComprehensiveBusinessData> {
    try {
      console.log("🤖 AI: Fetching comprehensive business data...")

      // Fetch all business data in parallel
      const [
        quotationsData,
        employeesData,
        companiesData,
        branchesData,
        clientsData,
        leadsData,
        departmentsData,
        workflowData,
        aiInsightsData,
        notificationsData,
        deliverablesData,
        taskManagementData
      ] = await Promise.allSettled([
        this.getQuotationsAnalytics(),
        this.getEmployeeAnalytics(),
        this.getCompaniesCount(),
        this.getBranchesCount(),
        this.getClientsCount(),
        this.getLeadsAnalytics(),
        this.getDepartmentsAnalytics(),
        this.getWorkflowAnalytics(),
        this.getAIInsightsData(),
        this.getNotificationsData(),
        this.getDeliverablesData(),
        this.getTaskManagementData()
      ])

      // Process results with fallbacks
      const sales = quotationsData.status === 'fulfilled' ? quotationsData.value : this.getDefaultSalesData()
      const employees = employeesData.status === 'fulfilled' ? employeesData.value : this.getDefaultEmployeeData()
      const companies = companiesData.status === 'fulfilled' ? companiesData.value : 0
      const branches = branchesData.status === 'fulfilled' ? branchesData.value : 0
      const clients = clientsData.status === 'fulfilled' ? clientsData.value : 0
      const leads = leadsData.status === 'fulfilled' ? leadsData.value : this.getDefaultLeadsData()
      const departments = departmentsData.status === 'fulfilled' ? departmentsData.value : { totalDepartments: 0, departmentList: [] }
      const workflows = workflowData.status === 'fulfilled' ? workflowData.value : this.getDefaultWorkflowData()
      const aiInsights = aiInsightsData.status === 'fulfilled' ? aiInsightsData.value : this.getDefaultAIInsightsData()
      const notifications = notificationsData.status === 'fulfilled' ? notificationsData.value : this.getDefaultNotificationsData()
      const deliverables = deliverablesData.status === 'fulfilled' ? deliverablesData.value : []
      const taskManagement = taskManagementData.status === 'fulfilled' ? taskManagementData.value : this.getDefaultTaskManagementData()

      // Merge employee department assignments with actual departments
      const mergedEmployeeData = {
        ...employees,
        totalDepartments: departments.totalDepartments,
        departmentList: departments.departmentList
      }

      return {
        sales,
        employees: mergedEmployeeData,
        operations: {
          totalCompanies: companies,
          totalBranches: branches,
          totalClients: clients,
          totalDepartments: departments.totalDepartments,
          activeLeads: leads.activeLeads,
          leadConversionRate: leads.conversionRate,
          todaysLeads: leads.todaysLeads,
          recentLeads: leads.recentLeads,
          deliverables: deliverables
        },
        workflows,
        ai_insights: aiInsights,
        notifications,
        performance: {
          quotationResponseTime: 2.5, // Average days
          clientSatisfactionScore: 4.2,
          teamProductivity: 87,
          systemHealth: { notifications: true, workflows: true, ai: true }
        },
        taskManagement
      }
    } catch (error) {
      console.error("❌ Error fetching business intelligence data:", error)
      return this.getDefaultBusinessData()
    }
  }

  private async getQuotationsAnalytics() {
    const { data: quotations, error } = await this.supabase
      .from('quotations')
      .select('*')

    if (error) throw error

    // Get workflow statuses
    const workflowStatusCounts = new Map()
    quotations?.forEach(q => {
      const status = q.workflow_status || q.status || 'draft'
      workflowStatusCounts.set(status, (workflowStatusCounts.get(status) || 0) + 1)
    })

    const workflowStatus = Array.from(workflowStatusCounts.entries())
      .map(([status, count]) => ({ status, count }))

    // Count pending approvals
    const approvalsPending = quotations?.filter(q => 
      q.status === 'pending_approval' || q.workflow_status === 'pending_approval'
    ).length || 0

    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const totalQuotations = quotations?.length || 0
    const activeQuotations = quotations?.filter(q => 
      ['draft', 'sent', 'approved'].includes(q.status)
    ).length || 0

    const approvedQuotations = quotations?.filter(q => q.status === 'approved').length || 0
    const conversionRate = totalQuotations > 0 ? (approvedQuotations / totalQuotations) * 100 : 0

    const totalRevenue = quotations?.reduce((sum, q) => sum + (q.total_amount || 0), 0) || 0
    
    const monthlyQuotations = quotations?.filter(q => {
      const qDate = new Date(q.created_at)
      return qDate.getMonth() === currentMonth && qDate.getFullYear() === currentYear
    }) || []
    
    const monthlyRevenue = monthlyQuotations.reduce((sum, q) => sum + (q.total_amount || 0), 0)
    const averageQuotationValue = totalQuotations > 0 ? totalRevenue / totalQuotations : 0

    // Top clients by quotation value
    const clientTotals = new Map()
    quotations?.forEach(q => {
      const existing = clientTotals.get(q.client_name) || 0
      clientTotals.set(q.client_name, existing + (q.total_amount || 0))
    })
    
    const topClients = Array.from(clientTotals.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)

    // Get quotation details for specific queries
    const quotationDetails = quotations?.map(q => ({
      id: q.id,
      client_name: q.client_name,
      total_amount: q.total_amount || 0,
      status: q.status,
      created_at: q.created_at
    })) || []

    return {
      totalQuotations,
      activeQuotations,
      conversionRate,
      totalRevenue,
      monthlyRevenue,
      averageQuotationValue,
      topClients,
      salesTrends: this.generateSalesTrends(quotations || []),
      quotationDetails,
      workflowStatus,
      approvalsPending
    }
  }

  private async getEmployeeAnalytics() {
    const { data: employees, error } = await this.supabase
      .from('employees')
      .select(`
        *,
        departments:department_id (name),
        designations:designation_id (name)
      `)

    if (error) {
      console.error('❌ Employee query error:', error)
      throw error
    }

    const totalEmployees = employees?.length || 0
    
    // Department distribution
    const departmentCounts = new Map()
    employees?.forEach(emp => {
      const dept = emp.departments?.name || 'Unassigned'
      departmentCounts.set(dept, (departmentCounts.get(dept) || 0) + 1)
    })

    const departmentDistribution = Array.from(departmentCounts.entries())
      .map(([department, count]) => ({ department, count }))

    // Recent hires (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentHires = employees?.filter(emp => 
      new Date(emp.created_at) > thirtyDaysAgo
    ).length || 0

    const employeeGrowthRate = totalEmployees > 0 ? (recentHires / totalEmployees) * 100 : 0

    // Employee details for specific queries
    const employeeDetails = employees?.map(emp => ({
      name: emp.first_name && emp.last_name ? `${emp.first_name} ${emp.last_name}` : 'Unknown',
      department: emp.departments?.name || 'Unassigned',
      position: emp.job_title || emp.designations?.name || 'Not specified',
      created_at: emp.created_at
    })) || []

    return {
      totalEmployees,
      departmentDistribution,
      recentHires,
      employeeGrowthRate,
      employeeDetails
    }
  }

  private async getCompaniesCount(): Promise<number> {
    const { count, error } = await this.supabase
      .from('companies')
      .select('*', { count: 'exact', head: true })
    
    if (error) throw error
    return count || 0
  }

  private async getBranchesCount(): Promise<number> {
    const { count, error } = await this.supabase
      .from('branches')
      .select('*', { count: 'exact', head: true })
    
    if (error) throw error
    return count || 0
  }

  private async getClientsCount(): Promise<number> {
    const { data: quotations, error } = await this.supabase
      .from('quotations')
      .select('client_name')
    
    if (error) throw error
    const uniqueClients = new Set(quotations?.map(q => q.client_name) || [])
    return uniqueClients.size
  }

  private async getLeadsAnalytics() {
    const { data: leads, error } = await this.supabase
      .from('leads')
      .select('*')

    if (error) throw error

    const totalLeads = leads?.length || 0
    const activeLeads = leads?.filter(lead => 
      ['new', 'contacted', 'qualified'].includes(lead.status)
    ).length || 0
    
    const convertedLeads = leads?.filter(lead => lead.status === 'converted').length || 0
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0

    // Today's leads
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todaysLeads = leads?.filter(lead => {
      const leadDate = new Date(lead.created_at)
      leadDate.setHours(0, 0, 0, 0)
      return leadDate.getTime() === today.getTime()
    }).length || 0

    // Recent leads for context
    const recentLeads = leads?.slice(0, 5).map(lead => ({
      name: lead.name || lead.company_name || 'Unknown',
      status: lead.status,
      created_at: lead.created_at
    })) || []

    return {
      activeLeads,
      conversionRate,
      todaysLeads,
      recentLeads
    }
  }

  private async getDepartmentsAnalytics() {
    const { data: departments, error } = await this.supabase
      .from('departments')
      .select('*')

    if (error) throw error

    const totalDepartments = departments?.length || 0
    const departmentList = departments?.map(dept => ({
      id: dept.id,
      name: dept.name,
      description: dept.description || ''
    })) || []

    return {
      totalDepartments,
      departmentList
    }
  }

  private generateSalesTrends(quotations: any[]): Array<{ month: string; value: number }> {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const currentYear = new Date().getFullYear()
    
    const trends = months.map(month => ({ month, value: 0 }))
    
    quotations.forEach(q => {
      const date = new Date(q.created_at)
      if (date.getFullYear() === currentYear) {
        const monthIndex = date.getMonth()
        trends[monthIndex].value += q.total_amount || 0
      }
    })
    
    return trends
  }

  // Generate AI insights based on real data
  async generateAIInsights(data: ComprehensiveBusinessData): Promise<string[]> {
    const insights: string[] = []

    // Sales insights
    if (data.sales.conversionRate < 20) {
      insights.push(`🚨 Sales conversion rate is ${data.sales.conversionRate.toFixed(1)}% - consider sales training or pricing review`)
    }
    if (data.sales.conversionRate > 80) {
      insights.push(`🎯 Excellent conversion rate of ${data.sales.conversionRate.toFixed(1)}% - your sales process is highly effective`)
    }

    // Revenue insights
    if (data.sales.monthlyRevenue > data.sales.totalRevenue * 0.3) {
      insights.push(`📈 Strong monthly performance - this month represents ${((data.sales.monthlyRevenue / data.sales.totalRevenue) * 100).toFixed(1)}% of total revenue`)
    }

    // Employee insights
    if (data.employees.employeeGrowthRate > 10) {
      insights.push(`👥 Rapid team growth of ${data.employees.employeeGrowthRate.toFixed(1)}% - ensure proper onboarding processes`)
    }

    // Client insights
    if (data.sales.topClients.length > 0) {
      const topClient = data.sales.topClients[0]
      insights.push(`🏆 Top client: ${topClient.name} with ₹${topClient.value.toLocaleString()} in business`)
    }

    // Lead insights
    if (data.operations.leadConversionRate < 15) {
      insights.push(`🎣 Lead conversion at ${data.operations.leadConversionRate.toFixed(1)}% - focus on lead qualification`)
    }

    return insights
  }

  // Default fallback data
  private getDefaultSalesData() {
    return {
      totalQuotations: 0,
      activeQuotations: 0,
      conversionRate: 0,
      totalRevenue: 0,
      monthlyRevenue: 0,
      averageQuotationValue: 0,
      topClients: [],
      salesTrends: [],
      quotationDetails: [],
      workflowStatus: [],
      approvalsPending: 0
    }
  }

  private getDefaultEmployeeData() {
    return {
      totalEmployees: 0,
      departmentDistribution: [],
      recentHires: 0,
      employeeGrowthRate: 0,
      employeeDetails: []
    }
  }

  private getDefaultLeadsData() {
    return {
      activeLeads: 0,
      conversionRate: 0,
      todaysLeads: 0,
      recentLeads: []
    }
  }

  private getDefaultWorkflowData() {
    return {
      quotationWorkflow: [],
      approvalQueue: [],
      postSaleConfirmations: [],
      followupsDue: []
    }
  }

  private getDefaultAIInsightsData() {
    return {
      quotationPredictions: [],
      clientInsights: [],
      actionRecommendations: [],
      revenueForecast: { predicted: 0, confidence: 0, period: 'unknown' }
    }
  }

  private getDefaultNotificationsData() {
    return {
      unreadCount: 0,
      urgentCount: 0,
      recentNotifications: []
    }
  }

  private getDefaultTaskManagementData() {
    return {
      totalActiveTasks: 0,
      completedTasks: 0,
      overdueTasks: 0,
      taskCompletionRate: 0,
      averageTaskCompletion: 0,
      tasksByPriority: { urgent: 0, high: 0, medium: 0, low: 0 },
      tasksByType: {},
      employeePerformance: [],
      upcomingDeadlines: [],
      aiTaskInsights: {
        tasksGenerated: 0,
        automationSuccessRate: 0,
        revenueProtected: 0,
        timesSaved: 0
      }
    }
  }

  private getDefaultBusinessData(): ComprehensiveBusinessData {
    return {
      sales: this.getDefaultSalesData(),
      employees: this.getDefaultEmployeeData(),
      operations: {
        totalCompanies: 0,
        totalBranches: 0,
        totalClients: 0,
        activeLeads: 0,
        leadConversionRate: 0,
        todaysLeads: 0,
        recentLeads: [],
        deliverables: []
      },
      workflows: this.getDefaultWorkflowData(),
      ai_insights: this.getDefaultAIInsightsData(),
      notifications: this.getDefaultNotificationsData(),
      performance: {
        quotationResponseTime: 0,
        clientSatisfactionScore: 0,
        teamProductivity: 0,
        systemHealth: { notifications: false, workflows: false, ai: false }
      },
      taskManagement: this.getDefaultTaskManagementData()
    }
  }

  private async getWorkflowAnalytics() {
    try {
      // Get quotation workflow data
      const { data: quotations, error: quotationError } = await this.supabase
        .from('quotations')
        .select('*')

      if (quotationError) throw quotationError

      // Analyze quotation workflow stages
      const workflowStages = ['draft', 'sent', 'pending_approval', 'approved', 'in_progress', 'completed']
      const quotationWorkflow = workflowStages.map(stage => {
        const stageQuotations = quotations?.filter(q => 
          q.status === stage || q.workflow_status === stage
        ) || []
        
        const avgDays = stageQuotations.length > 0 
          ? stageQuotations.reduce((sum, q) => {
              const days = Math.floor((new Date().getTime() - new Date(q.created_at).getTime()) / (1000 * 60 * 60 * 24))
              return sum + days
            }, 0) / stageQuotations.length
          : 0

        return {
          stage,
          count: stageQuotations.length,
          avgDays: Math.round(avgDays)
        }
      })

      // Get approval queue
      const approvalQueue = quotations?.filter(q => 
        q.status === 'pending_approval' || q.workflow_status === 'pending_approval'
      ).map(q => ({
        quotation: q.client_name || 'Unknown',
        client: q.client_name || 'Unknown',
        value: q.total_amount || 0,
        daysPending: Math.floor((new Date().getTime() - new Date(q.created_at).getTime()) / (1000 * 60 * 60 * 24))
      })) || []

      // Get post-sale confirmations (mock data structure)
      const postSaleConfirmations = quotations?.filter(q => 
        q.status === 'approved' && q.payment_received_date
      ).map(q => ({
        quotation: q.client_name || 'Unknown',
        status: 'confirmed',
        daysSincePayment: q.payment_received_date 
          ? Math.floor((new Date().getTime() - new Date(q.payment_received_date).getTime()) / (1000 * 60 * 60 * 24))
          : 0
      })) || []

      // 🔄 ENHANCED: Replace followups with task-based insights
      const followupsDue = await this.getTaskBasedFollowups(quotations || [])

      return {
        quotationWorkflow,
        approvalQueue,
        postSaleConfirmations,
        followupsDue
      }
    } catch (error) {
      console.error('Error fetching workflow analytics:', error)
      return this.getDefaultWorkflowData()
    }
  }

  // 🔄 NEW: Task-based followup insights replacing legacy followup system
  private async getTaskBasedFollowups(quotations: any[]): Promise<Array<{ lead: string; type: string; scheduled: string; overdue: boolean }>> {
    const taskInsights = []

    for (const quotation of quotations) {
      const daysSince = Math.floor((new Date().getTime() - new Date(quotation.updated_at || quotation.created_at).getTime()) / (1000 * 60 * 60 * 24))

      // Smart task generation logic - mimics the enhanced AI task service
      if (quotation.status === 'sent' && daysSince >= 1) {
        taskInsights.push({
          lead: quotation.client_name || 'Unknown Client',
          type: daysSince >= 5 ? 'urgent_followup' : 'standard_followup',
          scheduled: new Date(Date.now() + (daysSince >= 5 ? 0 : 24 * 60 * 60 * 1000)).toISOString(),
          overdue: daysSince >= 5
        })
      }

      if (quotation.status === 'approved' && daysSince >= 3) {
        taskInsights.push({
          lead: quotation.client_name || 'Unknown Client',
          type: 'payment_followup',
          scheduled: new Date(Date.now() + (daysSince >= 7 ? 0 : 24 * 60 * 60 * 1000)).toISOString(),
          overdue: daysSince >= 7
        })
      }

      if (quotation.status === 'draft' && daysSince >= 0) {
        taskInsights.push({
          lead: quotation.client_name || 'Unknown Client',
          type: 'approval_required',
          scheduled: new Date().toISOString(),
          overdue: daysSince >= 2
        })
      }
    }

    return taskInsights.slice(0, 10) // Limit to top 10 most urgent
  }

  private async getAIInsightsData() {
    try {
      // Mock AI insights data (you can replace with actual AI predictions when available)
      const quotationPredictions = [
        { quotation: 'Ramya', successProbability: 0.75, factors: ['High engagement', 'Budget match', 'Quick response'] }
      ]

      const clientInsights = [
        { client: 'Ramya', sentiment: 0.8, conversionProbability: 0.75 }
      ]

      const actionRecommendations = [
        { 
          type: 'follow_up', 
          priority: 'high', 
          description: 'Follow up with Ramya about ₹54,000 quotation', 
          impact: 'High conversion probability' 
        }
      ]

      const revenueForecast = {
        predicted: 180000,
        confidence: 0.82,
        period: 'next_month'
      }

      return {
        quotationPredictions,
        clientInsights,
        actionRecommendations,
        revenueForecast
      }
    } catch (error) {
      console.error('Error fetching AI insights:', error)
      return this.getDefaultAIInsightsData()
    }
  }

  private async getNotificationsData() {
    try {
      const { data: notifications, error } = await this.supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const unreadCount = notifications?.filter(n => !n.is_read).length || 0
      const urgentCount = notifications?.filter(n => 
        n.priority === 'urgent' && !n.is_read
      ).length || 0

      const recentNotifications = notifications?.slice(0, 5).map(n => ({
        type: n.type,
        title: n.title,
        priority: n.priority,
        created: n.created_at
      })) || []

      return {
        unreadCount,
        urgentCount,
        recentNotifications
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      return this.getDefaultNotificationsData()
    }
  }

  private async getDeliverablesData() {
    try {
      const { data: deliverables, error } = await this.supabase
        .from('deliverable_master')
        .select('*')

      if (error) throw error

      return deliverables?.map(d => ({
        category: d.category,
        type: d.type,
        name: d.deliverable_name
      })) || []
    } catch (error) {
      console.error('Error fetching deliverables:', error)
      return []
    }
  }

  /**
   * NEW: Get AI Task Management Data
   */
  private async getTaskManagementData() {
    try {
      // Get all AI tasks
      const { data: allTasks, error: tasksError } = await this.supabase
        .from('ai_tasks')
        .select(`
          id,
          title,
          priority,
          status,
          due_date,
          estimated_value,
          assigned_to_employee_id,
          client_name,
          task_type,
          created_at,
          completed_at,
          employees:assigned_to_employee_id (first_name, last_name)
        `)

      if (tasksError) throw tasksError

      // Calculate task metrics
      const totalActiveTasks = allTasks?.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length || 0
      const completedTasks = allTasks?.filter(t => t.status === 'completed').length || 0
      const overdueTasks = allTasks?.filter(t => 
        t.status !== 'completed' && new Date(t.due_date) < new Date()
      ).length || 0

      const taskCompletionRate = totalActiveTasks + completedTasks > 0 
        ? completedTasks / (totalActiveTasks + completedTasks) 
        : 0

      // Task breakdown by priority
      const tasksByPriority = {
        urgent: allTasks?.filter(t => t.priority === 'urgent').length || 0,
        high: allTasks?.filter(t => t.priority === 'high').length || 0,
        medium: allTasks?.filter(t => t.priority === 'medium').length || 0,
        low: allTasks?.filter(t => t.priority === 'low').length || 0
      }

      // Task breakdown by type
      const tasksByType = allTasks?.reduce((acc, task) => {
        acc[task.task_type] = (acc[task.task_type] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      // Employee performance
      const employeePerformanceMap = new Map<number, any>()

      allTasks?.forEach(task => {
        const empId = task.assigned_to_employee_id
        if (!empId) return

        if (!employeePerformanceMap.has(empId)) {
          const employeeData = task.employees as any
          employeePerformanceMap.set(empId, {
            employee_id: empId,
            employee_name: employeeData ? `${employeeData.first_name} ${employeeData.last_name}` : 'Unknown',
            total_tasks: 0,
            completed_tasks: 0,
            completion_rate: 0,
            overdue_tasks: 0,
            revenue_impact: 0
          })
        }

        const perf = employeePerformanceMap.get(empId)
        perf.total_tasks++
        
        if (task.status === 'completed') {
          perf.completed_tasks++
          perf.revenue_impact += task.estimated_value || 0
        } else if (task.status === 'overdue' || (task.status !== 'completed' && new Date(task.due_date) < new Date())) {
          perf.overdue_tasks++
        }
      })

      const employeePerformance = Array.from(employeePerformanceMap.values()).map(perf => ({
        ...perf,
        completion_rate: perf.total_tasks > 0 ? perf.completed_tasks / perf.total_tasks : 0
      }))

      // Upcoming deadlines (next 7 days)
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)
      
      const upcomingDeadlines = allTasks
        ?.filter(task => 
          task.status !== 'completed' && 
          new Date(task.due_date) <= nextWeek &&
          new Date(task.due_date) >= new Date()
        )
        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
        .map(task => {
          const employeeData = task.employees as any
          return {
            task_id: task.id,
            title: task.title,
            due_date: task.due_date,
            priority: task.priority,
            assigned_to: employeeData ? `${employeeData.first_name} ${employeeData.last_name}` : 'Unassigned',
            client_name: task.client_name
          }
        }) || []

      // Calculate AI insights
      const totalRevenueProtected = allTasks?.reduce((sum, task) => 
        task.status === 'completed' ? sum + (task.estimated_value || 0) : sum, 0
      ) || 0

      const tasksGenerated = allTasks?.filter(t => t.created_at >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length || 0
      
      const averageTaskCompletion = completedTasks > 0 
        ? allTasks
            ?.filter(t => t.status === 'completed' && t.completed_at && t.created_at)
            .reduce((sum, task) => {
              const completionTime = new Date(task.completed_at!).getTime() - new Date(task.created_at).getTime()
              return sum + (completionTime / (1000 * 60 * 60 * 24)) // days
            }, 0) / completedTasks
        : 0

      return {
        totalActiveTasks,
        completedTasks,
        overdueTasks,
        taskCompletionRate,
        averageTaskCompletion: averageTaskCompletion || 0,
        tasksByPriority,
        tasksByType,
        employeePerformance,
        upcomingDeadlines: upcomingDeadlines.slice(0, 10), // Top 10 upcoming
        aiTaskInsights: {
          tasksGenerated,
          automationSuccessRate: taskCompletionRate,
          revenueProtected: totalRevenueProtected,
          timesSaved: tasksGenerated * 15 // Estimated 15 minutes saved per task
        }
      }
    } catch (error) {
      console.error('Error fetching task management data:', error)
      return this.getDefaultTaskManagementData()
    }
  }
}

// AI Response Generator that uses real data and responds like a human business analyst
export class AIResponseGenerator {
  private biService = new AIBusinessIntelligenceService()

  async generateResponse(userInput: string): Promise<string> {
    const input = userInput.toLowerCase()
    const data = await this.biService.getComprehensiveBusinessData()
    
    // Specific value/highest questions
    if (input.includes('highest') && (input.includes('value') || input.includes('quote') || input.includes('quotation'))) {
      return this.generateHighestQuoteResponse(data)
    }
    
    // Today's/recent activity questions
    if (input.includes('today') || input.includes('created today')) {
      return this.generateTodayActivityResponse(data, input)
    }
    
    // Employee count questions
    if ((input.includes('how many') || input.includes('total')) && input.includes('employee')) {
      return this.generateEmployeeCountResponse(data)
    }
    
    // Sales and Revenue queries
    if (input.includes('sales') || input.includes('revenue') || input.includes('quotation')) {
      return this.generateSalesResponse(data, input)
    }
    
    // Employee and Team queries
    if (input.includes('employee') || input.includes('team') || input.includes('staff') || input.includes('department')) {
      return this.generateEmployeeResponse(data, input)
    }
    
    // Growth and Performance queries
    if (input.includes('growth') || input.includes('performance') || input.includes('productivity')) {
      return this.generateGrowthResponse(data, input)
    }
    
    // Client and Lead queries
    if (input.includes('client') || input.includes('lead') || input.includes('customer')) {
      return this.generateClientResponse(data, input)
    }
    
    // Cost and Budget queries
    if (input.includes('cost') || input.includes('budget') || input.includes('expense') || input.includes('profit')) {
      return this.generateFinancialResponse(data, input)
    }
    
    // General overview
    if (input.includes('overview') || input.includes('summary') || input.includes('status')) {
      return this.generateOverviewResponse(data)
    }
    
    // Default response with current data
    return this.generateContextualResponse(data, input)
  }

  private generateHighestQuoteResponse(data: ComprehensiveBusinessData): string {
    if (data.sales.quotationDetails.length === 0) {
      return "I don't see any quotations in your system yet. Once you create some quotations, I'll be able to tell you which one has the highest value and provide insights on your sales performance."
    }

    const highest = data.sales.quotationDetails.reduce((max, quote) => 
      quote.total_amount > max.total_amount ? quote : max
    )

    const createdDate = new Date(highest.created_at).toLocaleDateString()
    
    return `Your highest value quotation is **₹${highest.total_amount.toLocaleString()}** for ${highest.client_name}, created on ${createdDate}. Currently it's in "${highest.status}" status.

📊 For context: This represents ${((highest.total_amount / data.sales.totalRevenue) * 100).toFixed(1)}% of your total quotation value. Your average quotation value is ₹${data.sales.averageQuotationValue.toLocaleString()}, so this one is ${((highest.total_amount / data.sales.averageQuotationValue) * 100).toFixed(0)}% above average.

${highest.status === 'draft' ? '💡 **Tip:** This quotation is still in draft. Consider finalizing and sending it to the client.' : highest.status === 'sent' ? '⏳ **Status:** Waiting for client response. You might want to follow up.' : '✅ **Great!** This quotation has been approved.'}`
  }

  private generateTodayActivityResponse(data: ComprehensiveBusinessData, input: string): string {
    if (input.includes('lead')) {
      if (data.operations.todaysLeads === 0) {
        return `No new leads were created today. 

📈 **Action items:**
• Consider running some marketing campaigns to generate leads
• Check if your lead capture forms are working properly
• Review your recent lead sources to see what's been most effective

Your current pipeline has ${data.operations.activeLeads} active leads that you can focus on converting.`
      } else {
        return `Great news! **${data.operations.todaysLeads} new lead${data.operations.todaysLeads > 1 ? 's were' : ' was'} created today**. 

This brings your total active leads to ${data.operations.activeLeads}. With your current conversion rate of ${data.operations.leadConversionRate.toFixed(1)}%, these could potentially generate significant business.

🎯 **Next steps:** Make sure to follow up with today's leads while they're still hot!`
      }
    }

    // Default today activity
    return `Here's what happened today:
• **Leads:** ${data.operations.todaysLeads} new leads created
• **Active pipeline:** ${data.operations.activeLeads} leads in progress
• **Team activity:** All ${data.employees.totalEmployees} team members working on current projects

${data.operations.todaysLeads > 0 ? '🔥 Great job on the new leads!' : '💡 Consider some lead generation activities to keep the pipeline flowing.'}`
  }

  private generateEmployeeCountResponse(data: ComprehensiveBusinessData): string {
    if (data.employees.totalEmployees === 0) {
      return "I don't see any employees in your system yet. You might want to add your team members to get better insights and analytics."
    }

    const deptBreakdown = data.employees.departmentDistribution
      .map(d => `${d.department}: ${d.count}`)
      .join(', ')

    let response = `You currently have **${data.employees.totalEmployees} team member${data.employees.totalEmployees > 1 ? 's' : ''}** in your organization.`

    if (data.employees.departmentDistribution.length > 1) {
      response += ` They're distributed across ${data.employees.departmentDistribution.length} departments: ${deptBreakdown}.`
    } else if (data.employees.departmentDistribution.length === 1) {
      response += ` All are in the ${data.employees.departmentDistribution[0].department} department.`
    }

    if (data.employees.recentHires > 0) {
      response += `\n\n📈 You've grown by ${data.employees.recentHires} new hire${data.employees.recentHires > 1 ? 's' : ''} in the past 30 days (${data.employees.employeeGrowthRate.toFixed(1)}% growth rate). That's solid growth!`
    } else {
      response += `\n\n💼 No new hires in the past 30 days. Depending on your workload and business growth, you might want to consider if additional team members would help scale your operations.`
    }

    return response
  }

  private generateSalesResponse(data: ComprehensiveBusinessData, input: string): string {
    const { sales } = data
    
    if (input.includes('conversion')) {
      const advice = sales.conversionRate < 20 ? 
        "This is below industry standards. I'd recommend reviewing your sales process, pricing strategy, and maybe providing additional sales training." :
        sales.conversionRate > 50 ? 
        "That's excellent! Your sales team is performing really well. Keep doing whatever you're doing." :
        "That's decent, but there's room for improvement. Consider better lead qualification and follow-up processes."

      return `Your quotation conversion rate is **${sales.conversionRate.toFixed(1)}%** with ${sales.totalQuotations} total quotations and ${sales.activeQuotations} currently active.

${advice}

🎯 **Current pipeline:** ${sales.activeQuotations} quotations worth approximately ₹${(sales.activeQuotations * sales.averageQuotationValue).toLocaleString()} if they all convert.`
    }
    
    if (input.includes('revenue') || input.includes('money')) {
      const monthlyPercent = sales.totalRevenue > 0 ? (sales.monthlyRevenue / sales.totalRevenue) * 100 : 0
      
      let response = `Your total quotation revenue is **₹${sales.totalRevenue.toLocaleString()}**. This month you've generated ₹${sales.monthlyRevenue.toLocaleString()} (${monthlyPercent.toFixed(1)}% of total).

💰 **Key metrics:**
• Average deal size: ₹${sales.averageQuotationValue.toLocaleString()}
• Active pipeline value: ₹${(sales.activeQuotations * sales.averageQuotationValue).toLocaleString()}`

      if (sales.topClients.length > 0) {
        response += `\n• Top client: ${sales.topClients[0].name} (₹${sales.topClients[0].value.toLocaleString()})`
      }

      if (monthlyPercent > 30) {
        response += "\n\n🚀 **Great monthly performance!** You're on track for a strong month."
      } else if (monthlyPercent < 10) {
        response += "\n\n📈 **Focus needed:** This month's revenue is lower than usual. Consider accelerating your sales activities."
      }

      return response
    }
    
    return `**Sales Overview:**
• ${sales.totalQuotations} quotations totaling ₹${sales.totalRevenue.toLocaleString()}
• ${sales.activeQuotations} active quotes (${sales.conversionRate.toFixed(1)}% conversion rate)
• Average deal size: ₹${sales.averageQuotationValue.toLocaleString()}

${sales.conversionRate > 40 ? '🎯 Strong conversion rate!' : '📈 Opportunity to improve conversion rates through better sales processes.'}`
  }

  private generateEmployeeResponse(data: ComprehensiveBusinessData, input: string): string {
    const { employees } = data
    
    if (input.includes('department')) {
      if (employees.departmentDistribution.length === 0) {
        return "I don't see any department information for your employees yet. Consider organizing your team into departments for better analytics and management."
      }

      const deptInfo = employees.departmentDistribution
        .map(d => `**${d.department}:** ${d.count} ${d.count === 1 ? 'person' : 'people'}`)
        .join('\n• ')
      
      return `Your ${employees.totalEmployees} team members are organized as follows:

• ${deptInfo}

${employees.recentHires > 0 ? `\n🆕 Recent activity: ${employees.recentHires} new hire${employees.recentHires > 1 ? 's' : ''} in the last 30 days (${employees.employeeGrowthRate.toFixed(1)}% growth).` : '\n📊 No recent hires in the past 30 days.'}`
    }
    
    if (input.includes('hire') || input.includes('recruit') || input.includes('growth')) {
      const advice = employees.employeeGrowthRate > 10 ? 
        "That's rapid growth! Make sure you have proper onboarding processes and training programs in place." :
        employees.employeeGrowthRate > 5 ? 
        "Healthy growth rate for a stable organization." :
        "Stable team size. Consider if you need additional talent for upcoming projects or increased workload."

      return `**Team Growth Analysis:**

Your team has grown by **${employees.employeeGrowthRate.toFixed(1)}%** with ${employees.recentHires} new hire${employees.recentHires !== 1 ? 's' : ''} in the last 30 days.

Current team size: **${employees.totalEmployees} ${employees.totalEmployees === 1 ? 'employee' : 'employees'}**

💡 **Insight:** ${advice}`
    }
    
    return `**Team Overview:**
• Total employees: ${employees.totalEmployees}
• Recent hires: ${employees.recentHires} in the last 30 days
• Growth rate: ${employees.employeeGrowthRate.toFixed(1)}%
• Departments: ${employees.departmentDistribution.length}

${employees.totalEmployees < 5 ? '🚀 You have a lean team! Consider if scaling up could help handle more business.' : '👥 Good team size for your current operations.'}`
  }

  private generateGrowthResponse(data: ComprehensiveBusinessData, input: string): string {
    const insights = [
      `**📊 Current Performance Analysis:**`,
      `• Revenue: ₹${data.sales.totalRevenue.toLocaleString()} from ${data.sales.totalQuotations} quotations`,
      `• Team: ${data.employees.totalEmployees} employees across ${data.employees.departmentDistribution.length} departments`,
      `• Market reach: ${data.operations.totalClients} clients with ${data.operations.activeLeads} leads in pipeline`,
      ``,
      `**📈 Growth Opportunities I've Identified:**`,
    ]

    if (data.sales.conversionRate < 30) {
      insights.push(`• **Sales Process:** Your ${data.sales.conversionRate.toFixed(1)}% conversion rate has room for improvement - this could be your biggest growth lever`)
    } else {
      insights.push(`• **Sales Excellence:** Your ${data.sales.conversionRate.toFixed(1)}% conversion rate is strong - focus on increasing lead volume`)
    }

    if (data.operations.leadConversionRate < 20) {
      insights.push(`• **Lead Pipeline:** Only ${data.operations.leadConversionRate.toFixed(1)}% lead conversion - better qualification could unlock significant growth`)
    } else {
      insights.push(`• **Lead Management:** Strong ${data.operations.leadConversionRate.toFixed(1)}% lead conversion - scale your lead generation efforts`)
    }

    if (data.employees.employeeGrowthRate > 0) {
      insights.push(`• **Team Scaling:** ${data.employees.employeeGrowthRate.toFixed(1)}% team growth indicates expansion - ensure systems can scale`)
    } else {
      insights.push(`• **Capacity Planning:** Consider strategic hiring to handle increased business volume`)
    }

    insights.push(``, `**🎯 My Recommendation:** ${this.getGrowthRecommendation(data)}`)
    
    return insights.join('\n')
  }

  private getGrowthRecommendation(data: ComprehensiveBusinessData): string {
    if (data.sales.conversionRate < 20) {
      return "Focus on sales training and process improvement first - this will give you the highest ROI on growth efforts."
    } else if (data.operations.activeLeads < 10) {
      return "Invest in lead generation - you have good conversion rates but need more pipeline volume."
    } else if (data.employees.totalEmployees < 5) {
      return "Consider strategic hiring to handle increased business capacity as you scale."
    } else {
      return "You have solid fundamentals - focus on expanding to new markets or service offerings."
    }
  }

  private generateClientResponse(data: ComprehensiveBusinessData, input: string): string {
    const { operations, sales } = data
    
    let response = `You're currently serving **${operations.totalClients} unique client${operations.totalClients !== 1 ? 's' : ''}** with ${operations.activeLeads} leads in your pipeline.

**Lead Performance:**
• Conversion rate: ${operations.leadConversionRate.toFixed(1)}%
• Today's new leads: ${operations.todaysLeads}`

    if (sales.topClients.length > 0) {
      const topClientsList = sales.topClients.slice(0, 3)
        .map(c => `${c.name} (₹${c.value.toLocaleString()})`)
        .join(', ')
      response += `\n\n**🏆 Top clients by value:** ${topClientsList}`
    }

    const advice = operations.leadConversionRate < 15 ? 
      "\n\n💡 **Action needed:** Your lead conversion rate is quite low. I'd recommend reviewing your lead qualification process and follow-up procedures." :
      operations.leadConversionRate > 30 ? 
      "\n\n🎯 **Excellent work!** Your lead conversion is strong. Focus on generating more qualified leads to scale up." :
      "\n\n📈 **Good foundation:** Decent conversion rate with room for improvement through better lead nurturing."

    return response + advice
  }

  private generateFinancialResponse(data: ComprehensiveBusinessData, input: string): string {
    const { sales } = data
    const monthlyShare = sales.totalRevenue > 0 ? (sales.monthlyRevenue / sales.totalRevenue) * 100 : 0
    
    return `**💰 Financial Performance Analysis:**

**Revenue Metrics:**
• Total Revenue: ₹${sales.totalRevenue.toLocaleString()}
• This Month: ₹${sales.monthlyRevenue.toLocaleString()} (${monthlyShare.toFixed(1)}% of total)
• Average Deal Size: ₹${sales.averageQuotationValue.toLocaleString()}
• Active Pipeline Value: ₹${(sales.activeQuotations * sales.averageQuotationValue).toLocaleString()}

**💡 Strategic Recommendations:**
${monthlyShare > 30 ? '• Excellent monthly performance - you\'re on track for strong growth' : '• Focus on accelerating sales activities this month'}
${sales.averageQuotationValue < 50000 ? '• Consider value-based pricing or service bundling to increase deal sizes' : '• Your deal sizes are healthy - maintain current pricing strategy'}
${sales.activeQuotations < 10 ? '• Build a stronger sales pipeline with more active quotations' : '• Good pipeline health with multiple active opportunities'}

**🎯 Bottom line:** ${this.getFinancialBottomLine(data)}`
  }

  private getFinancialBottomLine(data: ComprehensiveBusinessData): string {
    const { sales } = data
    if (sales.totalRevenue < 100000) {
      return "Focus on scaling your sales activities and increasing deal volume."
    } else if (sales.conversionRate < 30) {
      return "You have good revenue but improving conversion rates could significantly boost profitability."
    } else {
      return "Strong financial foundation - ready for strategic growth investments."
    }
  }

  private generateOverviewResponse(data: ComprehensiveBusinessData): string {
    const insights = [
      `**🏢 Business Overview Dashboard:**`,
      ``,
      `**Organization Structure:**`,
      `• ${data.operations.totalCompanies} companies, ${data.operations.totalBranches} branches`,
      `• ${data.employees.totalEmployees} team members, ${data.operations.totalClients} active clients`,
      ``,
      `**💰 Financial Performance:**`,
      `• ₹${data.sales.totalRevenue.toLocaleString()} total revenue from ${data.sales.totalQuotations} quotations`,
      `• ${data.sales.conversionRate.toFixed(1)}% conversion rate, ₹${data.sales.averageQuotationValue.toLocaleString()} average deal`,
      `• ${data.sales.activeQuotations} active quotes in pipeline`,
      ``,
      `**📊 Key Performance Indicators:**`,
      `• Lead pipeline: ${data.operations.activeLeads} active leads (${data.operations.leadConversionRate.toFixed(1)}% conversion)`,
      `• Team growth: ${data.employees.recentHires} new hires (${data.employees.employeeGrowthRate.toFixed(1)}% growth rate)`,
      `• Productivity: ${data.performance.teamProductivity}% team efficiency`,
      ``,
      `**🎯 Current Status:** ${this.getOverallStatus(data)}`
    ]
    
    return insights.join('\n')
  }

  private getOverallStatus(data: ComprehensiveBusinessData): string {
    if (data.sales.conversionRate > 40 && data.operations.leadConversionRate > 25) {
      return "Strong performance across all metrics - excellent foundation for scaling."
    } else if (data.sales.totalRevenue > 100000) {
      return "Good revenue base with opportunities to optimize conversion rates."
    } else {
      return "Growing business with solid fundamentals - focus on sales acceleration."
    }
  }

  private generateContextualResponse(data: ComprehensiveBusinessData, input: string): string {
    // Try to understand what the user is asking for
    if (input.includes('help') || input.includes('what can you')) {
      return `I'm your AI business analyst with access to all your live data. I can help you with:

**📊 Sales & Revenue Analysis**
• "What's my highest value quote?"
• "How's my conversion rate?"
• "Show me this month's revenue"

**👥 Team & Operations**
• "How many employees do I have?"
• "What's my team growth rate?"
• "Show me department breakdown"

**🎯 Leads & Clients**
• "How many leads were created today?"
• "What's my lead conversion rate?"
• "Who are my top clients?"

**📈 Business Intelligence**
• "Give me a business overview"
• "What are my growth opportunities?"
• "Show me financial performance"

Just ask me anything about your business - I have real-time access to your data!`
    }

    return `I have real-time access to your business data: **${data.sales.totalQuotations} quotations** (₹${data.sales.totalRevenue.toLocaleString()} revenue), **${data.employees.totalEmployees} team members**, **${data.operations.totalClients} clients**, and **${data.operations.activeLeads} active leads**.

What specific insights would you like me to analyze for you? I can dive deep into sales performance, team metrics, growth opportunities, financial analysis, or any other business aspect you're curious about! 🚀`
  }
} 