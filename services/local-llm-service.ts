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
      console.log("🤖 Local LLM: Processing query:", userQuery)
      
      // 1. Fetch real business data from Supabase
      const businessData = await this.biService.getComprehensiveBusinessData()
      
      // 2. Create context-rich prompt for LLM
      const contextPrompt = this.buildBusinessContextPrompt(businessData, userQuery)
      
      // 3. Send to local LLM
      const llmResponse = await this.callLocalLLM(contextPrompt)
      
      console.log("🤖 Local LLM: Response generated successfully")
      return llmResponse
      
    } catch (error) {
      console.error("❌ Local LLM Error:", error)
      
      // Fallback to rule-based response if LLM fails
      const fallbackService = new (await import('./ai-business-intelligence-service')).AIResponseGenerator()
      return await fallbackService.generateResponse(userQuery)
    }
  }

  private buildBusinessContextPrompt(data: ComprehensiveBusinessData, userQuery: string): string {
    const context = `You are an expert business analyst and advisor with complete access to this organization's real-time operational data. You understand all workflows, processes, and can provide actionable business intelligence.

**CURRENT BUSINESS DATA:**

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

🤖 **AI Insights & Predictions:**
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

⚡ **SYSTEM HEALTH:**
- Notifications System: ${data.performance.systemHealth.notifications ? '✅ Active' : '❌ Issues'}
- Workflows: ${data.performance.systemHealth.workflows ? '✅ Running' : '❌ Issues'}
- AI Systems: ${data.performance.systemHealth.ai ? '✅ Operational' : '❌ Down'}

**BUSINESS INTELLIGENCE CAPABILITIES:**
You have access to:
1. Complete quotation lifecycle tracking (draft → sent → approved → payment → delivery)
2. Employee performance and department analytics
3. Lead management and conversion optimization
4. AI-powered predictions and recommendations
5. Workflow bottleneck identification
6. Revenue forecasting and trend analysis
7. Real-time notification and alert systems
8. Deliverable and service management

**INSTRUCTIONS:**
1. You understand the complete business workflow from lead generation to project delivery
2. Provide actionable insights based on workflow stages and bottlenecks
3. Reference specific quotations, employees, and processes by name
4. Suggest concrete next steps within the application's capabilities
5. Identify workflow inefficiencies and optimization opportunities
6. Use AI insights to provide predictive recommendations
7. Be conversational but data-driven and specific
8. When discussing processes, reference the actual workflow stages and statuses

**USER QUESTION:** ${userQuery}

**YOUR RESPONSE (as a business operations expert):**`

    return context
  }

  private async callLocalLLM(prompt: string): Promise<string> {
    const requestBody = this.buildRequestBody(prompt)
    
    const response = await fetch(this.config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status} - ${response.statusText}`)
    }

    const data = await response.json()
    return this.extractResponseText(data)
  }

  private buildRequestBody(prompt: string): any {
    switch (this.config.provider) {
      case 'ollama':
        return {
          model: this.config.model,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            max_tokens: 1000
          }
        }
      
      case 'lmstudio':
        return {
          model: this.config.model,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000,
          stream: false
        }
      
      case 'openai-compatible':
        return {
          model: this.config.model,
          messages: [
            {
              role: "user", 
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        }
      
      default:
        return {
          prompt: prompt,
          model: this.config.model,
          temperature: 0.7,
          max_tokens: 1000
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

  // Test connection to local LLM
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const testPrompt = "Respond with: 'Connection successful'"
      const response = await this.callLocalLLM(testPrompt)
      
      return {
        success: true,
        message: `✅ Local LLM connected successfully. Response: ${response.substring(0, 100)}...`
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to connect to local LLM: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
}

// Configuration helper for common LLM setups
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

// Environment-based configuration
export function getLLMConfigFromEnv(): LocalLLMConfig | null {
  const provider = process.env.LOCAL_LLM_PROVIDER as LocalLLMConfig['provider']
  const apiUrl = process.env.LOCAL_LLM_API_URL
  const model = process.env.LOCAL_LLM_MODEL
  const apiKey = process.env.LOCAL_LLM_API_KEY

  if (!provider || !apiUrl || !model) {
    return null
  }

  return {
    provider,
    apiUrl,
    model,
    apiKey
  }
} 