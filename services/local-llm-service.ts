import { AIBusinessIntelligenceService, ComprehensiveBusinessData } from './ai-business-intelligence-service'

export interface LocalLLMConfig {
  apiUrl: string
  model: string
  apiKey?: string
  provider: 'ollama' | 'lmstudio' | 'openai-compatible' | 'custom'
}

export class LocalLLMService {
  private biService = new AIBusinessIntelligenceService()
  private config: LocalLLMConfig

  constructor(config: LocalLLMConfig) {
    this.config = config
  }

  async generateIntelligentResponse(userQuery: string): Promise<string> {
    try {
      console.log("🤖 Local LLM: Processing query with PostgreSQL backend:", userQuery)
      
      // 1. Fetch real business data from PostgreSQL via enhanced business intelligence service
      const businessData = await this.biService.getComprehensiveBusinessData()
      
      // 2. Create context-rich prompt for LLM with PostgreSQL-powered insights
      const contextPrompt = this.buildBusinessContextPrompt(businessData, userQuery)
      
      // 3. Send to local LLM with enhanced business context
      const llmResponse = await this.callLocalLLM(contextPrompt)
      
      console.log("🤖 Local LLM: Response generated successfully with PostgreSQL data")
      return llmResponse
      
    } catch (error) {
      console.error("❌ Local LLM Error:", error)
      
      // Fallback to rule-based response if LLM fails
      const fallbackService = new (await import('./ai-business-intelligence-service')).AIResponseGenerator()
      return await fallbackService.generateResponse(userQuery)
    }
  }

  private buildBusinessContextPrompt(data: ComprehensiveBusinessData, userQuery: string): string {
    const context = `You are an expert business analyst and advisor with complete access to this organization's real-time operational data from our PostgreSQL-powered business intelligence system. You understand all workflows, processes, and can provide actionable business intelligence.

**CURRENT BUSINESS DATA (PostgreSQL-Powered):**

📊 **Sales & Revenue Performance:**
- Total Quotations: ${data.sales.totalQuotations} (${data.sales.activeQuotations} active)
- Conversion Rate: ${data.sales.conversionRate.toFixed(1)}%
- Total Revenue: ₹${data.sales.totalRevenue.toLocaleString()}
- Monthly Revenue: ₹${data.sales.monthlyRevenue.toLocaleString()}
- Average Deal Size: ₹${data.sales.averageQuotationValue.toLocaleString()}
- Pending Approvals: ${data.sales.approvalsPending}
- Top Clients: ${data.sales.topClients.slice(0, 3).map(c => `${c.name} (₹${c.value.toLocaleString()})`).join(', ')}

**WORKFLOW STATUS BREAKDOWN:**
${data.sales.workflowStatus.map(ws => `- ${ws.status}: ${ws.count} quotations`).join('\n')}

👥 **Team & Organization:**
- Total Employees: ${data.employees.totalEmployees}
- Departments: ${data.employees.departmentDistribution.map(d => `${d.department}: ${d.count}`).join(', ')}
- Total Departments Available: ${data.employees.totalDepartments || 'Unknown'}
- Recent Hires: ${data.employees.recentHires} (${data.employees.employeeGrowthRate.toFixed(1)}% growth)
- Companies: ${data.operations.totalCompanies} | Branches: ${data.operations.totalBranches}

**AVAILABLE DEPARTMENTS:**
${data.employees.departmentList && data.employees.departmentList.length > 0 ? 
  data.employees.departmentList.map(dept => 
    `- ${dept.name}: ${dept.description}`
  ).join('\n') 
  : '- No department information available'}

**TEAM MEMBERS:**
${data.employees.employeeDetails.length > 0 ? 
  data.employees.employeeDetails.map(emp => 
    `- ${emp.name}: ${emp.position} in ${emp.department} department`
  ).join('\n') 
  : '- No employee details available'}

🎯 **Leads & Client Pipeline:**
- Total Clients: ${data.operations.totalClients}
- Active Leads: ${data.operations.activeLeads}
- Lead Conversion Rate: ${data.operations.leadConversionRate.toFixed(1)}%
- Today's New Leads: ${data.operations.todaysLeads}

**RECENT LEAD ACTIVITY:**
${data.operations.recentLeads.map(lead => 
  `- ${lead.name}: ${lead.status}`
).join('\n')}

🔄 **Workflow Analytics:**
**Quotation Pipeline Stages:**
${data.workflows.quotationWorkflow.map(stage => 
  `- ${stage.stage}: ${stage.count} quotations (avg: ${stage.avgDays} days)`
).join('\n')}

**APPROVAL QUEUE (${data.workflows.approvalQueue.length} pending):**
${data.workflows.approvalQueue.slice(0, 3).map(approval => 
  `- ${approval.client}: ₹${approval.value.toLocaleString()} (${approval.daysPending} days pending)`
).join('\n')}

**POST-SALE STATUS:**
${data.workflows.postSaleConfirmations.slice(0, 3).map(confirm => 
  `- ${confirm.quotation}: ${confirm.status} (${confirm.daysSincePayment} days since payment)`
).join('\n')}

🤖 **AI Insights & Predictions (PostgreSQL-Enhanced):**
**QUOTATION SUCCESS PREDICTIONS:**
${data.ai_insights.quotationPredictions.map(pred => 
  `- ${pred.quotation}: ${(pred.successProbability * 100).toFixed(0)}% success probability`
).join('\n')}

**CLIENT INSIGHTS:**
${data.ai_insights.clientInsights.map(insight => 
  `- ${insight.client}: ${(insight.sentiment * 100).toFixed(0)}% sentiment, ${(insight.conversionProbability * 100).toFixed(0)}% conversion probability`
).join('\n')}

**AI RECOMMENDATIONS:**
${data.ai_insights.actionRecommendations.map(rec => 
  `- [${rec.priority.toUpperCase()}] ${rec.description}`
).join('\n')}

**REVENUE FORECAST:**
- Next ${data.ai_insights.revenueForecast.period}: ₹${data.ai_insights.revenueForecast.predicted.toLocaleString()} (${(data.ai_insights.revenueForecast.confidence * 100).toFixed(0)}% confidence)

🔔 **Notifications & Alerts:**
- Unread Notifications: ${data.notifications.unreadCount}
- Urgent Alerts: ${data.notifications.urgentCount}

**RECENT NOTIFICATIONS:**
${data.notifications.recentNotifications.slice(0, 3).map(notif => 
  `- [${notif.priority.toUpperCase()}] ${notif.title}`
).join('\n')}

📦 **Deliverables & Services:**
**AVAILABLE DELIVERABLES:**
${data.operations.deliverables.slice(0, 5).map(deliv => 
  `- ${deliv.category} ${deliv.type}: ${deliv.name}`
).join('\n')}

**SPECIFIC QUOTATION DETAILS:**
${data.sales.quotationDetails.slice(0, 5).map(q => 
  `- ${q.client_name}: ₹${q.total_amount.toLocaleString()} (Status: ${q.status})`
).join('\n')}

⚡ **SYSTEM HEALTH (PostgreSQL-Powered):**
- Database Performance: ${data.performance.systemHealth.database ? '✅ Optimal' : '❌ Issues'}
- Notifications System: ${data.performance.systemHealth.notifications ? '✅ Active' : '❌ Issues'}
- Workflows: ${data.performance.systemHealth.workflows ? '✅ Running' : '❌ Issues'}
- AI Systems: ${data.performance.systemHealth.ai ? '✅ Operational' : '❌ Down'}

**ENHANCED BUSINESS INTELLIGENCE CAPABILITIES:**
You have access to:
1. Real-time PostgreSQL database insights with optimized performance
2. Complete quotation lifecycle tracking (draft → sent → approved → payment → delivery)
3. Employee performance and department analytics with detailed metrics
4. Lead management and conversion optimization with AI predictions
5. AI-powered predictions and recommendations based on historical data
6. Workflow bottleneck identification with performance analytics
7. Revenue forecasting and trend analysis with confidence scoring
8. Real-time notification and alert systems with priority management
9. Deliverable and service management with pricing intelligence
10. Advanced business intelligence with predictive analytics

**INSTRUCTIONS:**
1. You understand the complete business workflow from lead generation to project delivery
2. Provide actionable insights based on PostgreSQL-powered analytics and workflow stages
3. Reference specific quotations, employees, and processes by name with data-driven context
4. Suggest concrete next steps within the application's capabilities
5. Identify workflow inefficiencies and optimization opportunities using real data
6. Use AI insights to provide predictive recommendations with confidence scores
7. Be conversational but data-driven and specific with PostgreSQL-backed insights
8. When discussing processes, reference the actual workflow stages and statuses
9. Leverage the enhanced business intelligence for strategic recommendations
10. Provide performance-optimized suggestions based on real-time data analysis

**USER QUESTION:** ${userQuery}

**YOUR RESPONSE (as a PostgreSQL-powered business operations expert):**`

    return context
  }

  private async callLocalLLM(prompt: string): Promise<string> {
    const requestBody = this.buildRequestBody(prompt)
    
    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 90000) // Extended to 90 seconds for complex analysis
    
    try {
      console.log(`🚀 Sending enhanced business context to ${this.config.provider} LLM...`)
      
      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`LLM API error: ${response.status} - ${response.statusText}`)
      }

      const data = await response.json()
      const result = this.extractResponseText(data)
      
      console.log(`✅ Local LLM response generated (${result.length} characters)`)
      return result
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('LLM request timed out after 90 seconds')
      }
      throw error
    }
  }

  private buildRequestBody(prompt: string): any {
    const baseConfig = {
      temperature: 0.7,
      top_p: 0.9,
      max_tokens: 1500, // Increased for detailed business analysis
    }

    switch (this.config.provider) {
      case 'ollama':
        return {
          model: this.config.model,
          prompt: prompt,
          stream: false,
          options: {
            ...baseConfig,
            num_ctx: 8192, // Larger context for business data
            repeat_penalty: 1.1
          }
        }
      
      case 'lmstudio':
        return {
          model: this.config.model,
          messages: [
            {
              role: "system",
              content: "You are an expert business analyst with access to comprehensive PostgreSQL-powered business intelligence data."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          ...baseConfig,
          stream: false
        }
      
      case 'openai-compatible':
        return {
          model: this.config.model,
          messages: [
            {
              role: "system",
              content: "You are a PostgreSQL-powered business intelligence expert providing data-driven insights."
            },
            {
              role: "user", 
              content: prompt
            }
          ],
          ...baseConfig
        }
      
      default:
        return {
          prompt: prompt,
          model: this.config.model,
          ...baseConfig
        }
    }
  }

  private extractResponseText(data: any): string {
    // Handle different response formats from different LLM providers
    if (data.response) {
      return data.response // Ollama format
    }
    
    if (data.choices?.[0]?.message?.content) {
      return data.choices[0].message.content // OpenAI/LM Studio format
    }
    
    if (data.choices?.[0]?.text) {
      return data.choices[0].text // Some other formats
    }
    
    if (data.content) {
      return data.content // Direct content
    }
    
    if (typeof data === 'string') {
      return data // Direct string response
    }
    
    throw new Error('Unable to extract response text from LLM response')
  }

  // Test connection to local LLM with PostgreSQL integration
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const testPrompt = "Respond with: 'PostgreSQL-powered business intelligence connection successful'"
      const response = await this.callLocalLLM(testPrompt)
      
      return {
        success: true,
        message: `✅ Local LLM with PostgreSQL backend connected successfully. Response: ${response.substring(0, 100)}...`
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to connect to local LLM: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // Enhanced business analytics query capability
  async queryBusinessIntelligence(businessQuery: string): Promise<string> {
    try {
      console.log("📊 Processing business intelligence query:", businessQuery)
      
      // Get comprehensive business data
      const businessData = await this.biService.getComprehensiveBusinessData()
      
      // Create specialized BI prompt
      const biPrompt = `
You are a business intelligence expert with access to real-time PostgreSQL data.

BUSINESS QUERY: ${businessQuery}

CURRENT DATA SNAPSHOT:
- Total Revenue: ₹${businessData.sales.totalRevenue.toLocaleString()}
- Active Quotations: ${businessData.sales.activeQuotations}
- Conversion Rate: ${businessData.sales.conversionRate.toFixed(1)}%
- Active Leads: ${businessData.operations.activeLeads}
- Total Employees: ${businessData.employees.totalEmployees}

Provide a data-driven, actionable response to the business query.
`
      
      return await this.callLocalLLM(biPrompt)
    } catch (error) {
      console.error("❌ Business intelligence query failed:", error)
      return "I apologize, but I'm unable to process your business intelligence query at the moment. Please try again or contact system support."
    }
  }
}

// Configuration helper for common LLM setups with enhanced PostgreSQL integration
export class LLMConfigBuilder {
  static ollama(model: string = 'llama3.2', port: number = 11434): LocalLLMConfig {
    return {
      apiUrl: `http://localhost:${port}/api/generate`,
      model: model,
      provider: 'ollama'
    }
  }

  static lmStudio(model: string = 'local-model', port: number = 1234): LocalLLMConfig {
    return {
      apiUrl: `http://localhost:${port}/v1/chat/completions`,
      model: model,
      provider: 'lmstudio'
    }
  }

  static openAICompatible(apiUrl: string, model: string, apiKey?: string): LocalLLMConfig {
    return {
      apiUrl: apiUrl,
      model: model,
      apiKey: apiKey,
      provider: 'openai-compatible'
    }
  }

  static custom(apiUrl: string, model: string, apiKey?: string): LocalLLMConfig {
    return {
      apiUrl: apiUrl,
      model: model,
      apiKey: apiKey,
      provider: 'custom'
    }
  }
}

// Environment-based configuration with PostgreSQL optimization
export function getLLMConfigFromEnv(): LocalLLMConfig | null {
  const provider = process.env.LOCAL_LLM_PROVIDER as LocalLLMConfig['provider']
  const apiUrl = process.env.LOCAL_LLM_API_URL
  const model = process.env.LOCAL_LLM_MODEL
  const apiKey = process.env.LOCAL_LLM_API_KEY

  if (!provider || !apiUrl || !model) {
    console.warn('⚠️ Local LLM configuration incomplete, using defaults')
    return null
  }

  console.log(`🤖 Local LLM configured: ${provider} with PostgreSQL backend`)
  return {
    provider,
    apiUrl,
    model,
    apiKey
  }
} 