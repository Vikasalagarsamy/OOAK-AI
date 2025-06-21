import { query, transaction } from '@/lib/postgresql-client'

/**
 * AI Configuration Service - NOW 100% POSTGRESQL
 * 
 * This service ensures AI behavior is persistent across restarts, deployments,
 * and environment changes. It stores all prompts and configurations in PostgreSQL
 * rather than hardcoding them in the application.
 * 
 * Key Features:
 * - PostgreSQL-stored prompts (survives restarts)
 * - Anti-hallucination configuration
 * - Template-based prompt generation
 * - Automatic validation and healing
 * - Version management for rollbacks
 * - Enhanced caching and performance
 * - Transaction safety for configuration updates
 */

export interface AIConfiguration {
  config_key: string
  config_type: string
  config_value: string
  version: number
  is_active: boolean
  description?: string
  created_at?: string
  updated_at?: string
}

export interface AIPromptTemplate {
  template_name: string
  template_content: string
  variables: Record<string, any>
  category: string
  is_default: boolean
  version: number
  is_active?: boolean
  created_at?: string
}

export interface AIBehaviorSettings {
  setting_key: string
  setting_value: Record<string, any>
  description?: string
  category: string
  is_active?: boolean
}

export interface SystemPromptData {
  hallucinationPreventionRules: string
  businessPersonality: string
  dataValidationRules: string
  totalRevenue: number
  totalQuotations: number
  conversionRate: number
  teamCount: number
  teamMembers: string
  activeClients: number
  activeQuotationsList: string
  clientInsights: string
  specificClientData?: string
  userMessage: string
}

export class AIConfigurationService {
  private configCache: Map<string, any> = new Map()
  private lastCacheUpdate: Date | null = null
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  /**
   * Get AI system configuration from PostgreSQL
   * This method ensures the AI always has the correct behavior settings
   */
  async getSystemConfiguration(): Promise<Record<string, string>> {
    try {
      console.log('🤖 Loading AI configuration from PostgreSQL...')
      
      // Check cache first
      if (this.isCacheValid('system_config')) {
        console.log('📋 Using cached AI configuration')
        return this.configCache.get('system_config')
      }

      const result = await query(`
        SELECT config_key, config_value, config_type, version, description
        FROM ai_configurations 
        WHERE is_active = true 
        ORDER BY version DESC, created_at DESC
      `)

      const configMap: Record<string, string> = {}
      result.rows.forEach((config: any) => {
        configMap[config.config_key] = config.config_value
      })

      // Cache the configuration
      this.configCache.set('system_config', configMap)
      this.lastCacheUpdate = new Date()

      console.log(`✅ AI Configuration loaded from PostgreSQL: ${result.rows.length} configs`)
      return configMap
    } catch (error: any) {
      console.error('❌ Error fetching AI configuration from PostgreSQL:', error)
      return this.getFallbackConfiguration()
    }
  }

  /**
   * Get AI behavior settings from PostgreSQL
   */
  async getBehaviorSettings(): Promise<Record<string, any>> {
    try {
      console.log('🎛️ Loading AI behavior settings from PostgreSQL...')
      
      const result = await query(`
        SELECT setting_key, setting_value, category, description
        FROM ai_behavior_settings 
        WHERE is_active = true 
        ORDER BY created_at DESC
      `)

      const settingsMap: Record<string, any> = {}
      result.rows.forEach((setting: any) => {
        try {
          // Parse JSON if it's a string
          const value = typeof setting.setting_value === 'string' 
            ? JSON.parse(setting.setting_value) 
            : setting.setting_value
          settingsMap[setting.setting_key] = value
        } catch (parseError) {
          console.warn(`⚠️ Failed to parse setting ${setting.setting_key}:`, parseError)
          settingsMap[setting.setting_key] = setting.setting_value
        }
      })

      console.log(`✅ AI Behavior settings loaded: ${result.rows.length} settings`)
      return settingsMap
    } catch (error: any) {
      console.error('❌ Error loading AI behavior settings from PostgreSQL:', error)
      return this.getDefaultBehaviorSettings()
    }
  }

  /**
   * Build system prompt using PostgreSQL template and real-time data
   */
  async buildSystemPrompt(promptData: SystemPromptData): Promise<string> {
    try {
      console.log('📝 Building system prompt from PostgreSQL template...')
      
      // Get the template from PostgreSQL
      const templateResult = await query(`
        SELECT template_content, variables, category, version
        FROM ai_prompt_templates 
        WHERE template_name = $1 
          AND is_default = true 
          AND is_active = true 
        ORDER BY version DESC 
        LIMIT 1
      `, ['business_advisor_system_prompt'])

      if (templateResult.rows.length === 0) {
        console.warn('⚠️ Template not found in PostgreSQL, using fallback')
        return this.buildFallbackPrompt(promptData)
      }

      const template = templateResult.rows[0]
      console.log(`✅ Template loaded: version ${template.version}`)

      // Get configuration values
      const configs = await this.getSystemConfiguration()

      // Replace template variables with actual data
      let prompt = template.template_content
      
      // Replace configuration placeholders
      prompt = prompt.replace('{{HALLUCINATION_PREVENTION_RULES}}', configs.hallucination_prevention || '')
      prompt = prompt.replace('{{BUSINESS_PERSONALITY}}', configs.business_personality || '')
      prompt = prompt.replace('{{DATA_VALIDATION_RULES}}', configs.data_validation_rules || '')
      
      // Replace business data placeholders
      prompt = prompt.replace('{{TOTAL_REVENUE}}', promptData.totalRevenue.toLocaleString())
      prompt = prompt.replace('{{TOTAL_QUOTATIONS}}', promptData.totalQuotations.toString())
      prompt = prompt.replace('{{CONVERSION_RATE}}', promptData.conversionRate.toFixed(1))
      prompt = prompt.replace('{{TEAM_COUNT}}', promptData.teamCount.toString())
      prompt = prompt.replace('{{TEAM_MEMBERS}}', promptData.teamMembers)
      prompt = prompt.replace('{{ACTIVE_CLIENTS}}', promptData.activeClients.toString())
      prompt = prompt.replace('{{ACTIVE_QUOTATIONS_LIST}}', promptData.activeQuotationsList)
      prompt = prompt.replace('{{CLIENT_INSIGHTS}}', promptData.clientInsights)
      prompt = prompt.replace('{{SPECIFIC_CLIENT_DATA}}', promptData.specificClientData || '')
      prompt = prompt.replace('{{USER_MESSAGE}}', promptData.userMessage)

      console.log('✅ System prompt built successfully')
      return prompt
    } catch (error: any) {
      console.error('❌ Error building system prompt from PostgreSQL:', error)
      return this.buildFallbackPrompt(promptData)
    }
  }

  /**
   * Validate AI response against hallucination rules (PostgreSQL function)
   */
  async validateResponse(responseText: string): Promise<{ isValid: boolean; warnings: string[] }> {
    try {
      console.log('🔍 Validating AI response via PostgreSQL function...')
      
      const result = await query(`
        SELECT validate_ai_response($1) as validation_result
      `, [responseText])

      if (result.rows.length > 0) {
        const validationResult = result.rows[0].validation_result
        return {
          isValid: validationResult.is_valid || false,
          warnings: validationResult.warnings || []
        }
      }

      // Fallback to basic validation
      return this.performBasicValidation(responseText)
    } catch (error: any) {
      console.error('❌ Error validating AI response via PostgreSQL:', error)
      // Perform basic validation as fallback
      return this.performBasicValidation(responseText)
    }
  }

  /**
   * Initialize AI system with PostgreSQL configuration
   * This runs on app startup to ensure AI is properly configured
   */
  async initializeAISystem(): Promise<boolean> {
    try {
      console.log('🤖 Initializing AI Configuration System with PostgreSQL...')

      // Check if essential tables exist
      const tablesResult = await query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name IN ('ai_configurations', 'ai_prompt_templates', 'ai_behavior_settings')
      `)

      const existingTables = tablesResult.rows.map(row => row.table_name)
      console.log('📋 Found AI tables:', existingTables)

      // Create tables if they don't exist
      if (!existingTables.includes('ai_configurations')) {
        await this.createAIConfigurationsTable()
      }
      if (!existingTables.includes('ai_prompt_templates')) {
        await this.createAIPromptTemplatesTable()
      }
      if (!existingTables.includes('ai_behavior_settings')) {
        await this.createAIBehaviorSettingsTable()
      }

      // Load and validate configuration
      const configs = await this.getSystemConfiguration()
      const requiredConfigs = [
        'hallucination_prevention',
        'business_personality',
        'data_validation_rules'
      ]

      const missingConfigs = requiredConfigs.filter(key => !configs[key])
      if (missingConfigs.length > 0) {
        console.warn('⚠️ Missing AI configurations:', missingConfigs)
        await this.healMissingConfigurations(missingConfigs)
      }

      // Load behavior settings
      const settings = await this.getBehaviorSettings()
      console.log('⚙️ AI Behavior settings loaded:', Object.keys(settings).length)

      // Test template loading
      const testPromptData: SystemPromptData = {
        hallucinationPreventionRules: 'test',
        businessPersonality: 'test',
        dataValidationRules: 'test',
        totalRevenue: 0,
        totalQuotations: 0,
        conversionRate: 0,
        teamCount: 0,
        teamMembers: 'test',
        activeClients: 0,
        activeQuotationsList: 'test',
        clientInsights: 'test',
        userMessage: 'test'
      }

      const prompt = await this.buildSystemPrompt(testPromptData)
      if (prompt.length < 100) {
        console.warn('⚠️ Generated prompt seems too short, may indicate configuration issues')
      }

      console.log('✅ AI Configuration System initialized successfully')
      return true

    } catch (error: any) {
      console.error('❌ Error initializing AI configuration system:', error)
      return false
    }
  }

  /**
   * Update AI configuration in PostgreSQL with transaction safety
   */
  async updateConfiguration(configKey: string, configValue: string, description?: string): Promise<boolean> {
    try {
      console.log(`🔧 Updating AI configuration: ${configKey}`)
      
      return await transaction(async (client) => {
        // Get current version
        const versionResult = await client.query(`
          SELECT COALESCE(MAX(version), 0) + 1 as next_version
          FROM ai_configurations 
          WHERE config_key = $1
        `, [configKey])
        
        const nextVersion = versionResult.rows[0].next_version

        // Deactivate old versions
        await client.query(`
          UPDATE ai_configurations 
          SET is_active = false 
          WHERE config_key = $1
        `, [configKey])

        // Insert new version
        await client.query(`
          INSERT INTO ai_configurations (
            config_key, 
            config_value, 
            config_type, 
            version, 
            is_active, 
            description,
            created_at,
            updated_at
          ) VALUES ($1, $2, 'system', $3, true, $4, NOW(), NOW())
        `, [configKey, configValue, nextVersion, description])

        // Clear cache
        this.configCache.delete('system_config')
        
        console.log(`✅ AI configuration updated: ${configKey} (v${nextVersion})`)
        return true
      })

    } catch (error: any) {
      console.error(`❌ Error updating AI configuration ${configKey}:`, error)
      return false
    }
  }

  /**
   * Create AI configurations table if it doesn't exist
   */
  private async createAIConfigurationsTable(): Promise<void> {
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS ai_configurations (
          id SERIAL PRIMARY KEY,
          config_key VARCHAR(255) NOT NULL,
          config_type VARCHAR(100) NOT NULL DEFAULT 'system',
          config_value TEXT NOT NULL,
          version INTEGER NOT NULL DEFAULT 1,
          is_active BOOLEAN NOT NULL DEFAULT true,
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_ai_configurations_key_active 
        ON ai_configurations(config_key, is_active);
        
        CREATE INDEX IF NOT EXISTS idx_ai_configurations_type 
        ON ai_configurations(config_type);
      `)
      console.log('✅ AI configurations table created')
    } catch (error) {
      console.error('❌ Error creating AI configurations table:', error)
    }
  }

  /**
   * Create AI prompt templates table if it doesn't exist
   */
  private async createAIPromptTemplatesTable(): Promise<void> {
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS ai_prompt_templates (
          id SERIAL PRIMARY KEY,
          template_name VARCHAR(255) NOT NULL,
          template_content TEXT NOT NULL,
          variables JSONB DEFAULT '{}',
          category VARCHAR(100) NOT NULL,
          is_default BOOLEAN NOT NULL DEFAULT false,
          is_active BOOLEAN NOT NULL DEFAULT true,
          version INTEGER NOT NULL DEFAULT 1,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_ai_prompt_templates_name 
        ON ai_prompt_templates(template_name, is_active);
        
        CREATE INDEX IF NOT EXISTS idx_ai_prompt_templates_category 
        ON ai_prompt_templates(category);
      `)
      console.log('✅ AI prompt templates table created')
    } catch (error) {
      console.error('❌ Error creating AI prompt templates table:', error)
    }
  }

  /**
   * Create AI behavior settings table if it doesn't exist
   */
  private async createAIBehaviorSettingsTable(): Promise<void> {
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS ai_behavior_settings (
          id SERIAL PRIMARY KEY,
          setting_key VARCHAR(255) NOT NULL UNIQUE,
          setting_value JSONB NOT NULL,
          description TEXT,
          category VARCHAR(100) NOT NULL DEFAULT 'general',
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_ai_behavior_settings_key 
        ON ai_behavior_settings(setting_key, is_active);
        
        CREATE INDEX IF NOT EXISTS idx_ai_behavior_settings_category 
        ON ai_behavior_settings(category);
      `)
      console.log('✅ AI behavior settings table created')
    } catch (error) {
      console.error('❌ Error creating AI behavior settings table:', error)
    }
  }

  /**
   * Setup default configuration in PostgreSQL
   */
  private async setupDefaultConfiguration(): Promise<void> {
    try {
      console.log('🔧 Setting up default AI configuration in PostgreSQL...')
      
      const defaultConfigs = [
        {
          key: 'hallucination_prevention',
          value: `CRITICAL: You must only use factual data from the business database. Never make up numbers, client names, or project details. If you don't have specific information, clearly state that you need to check the records.`,
          description: 'Rules to prevent AI hallucination and ensure factual responses'
        },
        {
          key: 'business_personality',
          value: `You are a professional, knowledgeable assistant for a photography and videography business. You are helpful, accurate, and always focus on providing value to clients and the business team.`,
          description: 'Core personality and tone for AI interactions'
        },
        {
          key: 'data_validation_rules',
          value: `Always cross-reference data with multiple sources when possible. Flag any inconsistencies. Prioritize recent data over older data when there are conflicts.`,
          description: 'Rules for validating and prioritizing data sources'
        }
      ]

      for (const config of defaultConfigs) {
        await this.updateConfiguration(config.key, config.value, config.description)
      }

      console.log('✅ Default AI configuration setup complete')
    } catch (error) {
      console.error('❌ Error setting up default configuration:', error)
    }
  }

  /**
   * Heal missing configurations by creating them
   */
  private async healMissingConfigurations(missingConfigs: string[]): Promise<void> {
    console.log('🔧 Healing missing AI configurations:', missingConfigs)
    await this.setupDefaultConfiguration()
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(key: string): boolean {
    if (!this.lastCacheUpdate || !this.configCache.has(key)) {
      return false
    }
    
    const cacheAge = Date.now() - this.lastCacheUpdate.getTime()
    return cacheAge < this.CACHE_DURATION
  }

  /**
   * Get fallback configuration if PostgreSQL is unavailable
   */
  private getFallbackConfiguration(): Record<string, string> {
    console.log('⚠️ Using fallback AI configuration')
    return {
      hallucination_prevention: 'CRITICAL: Only use factual data from the business database. Never make up information.',
      business_personality: 'Professional photography and videography business assistant.',
      data_validation_rules: 'Always cross-reference data and flag inconsistencies.'
    }
  }

  /**
   * Get default behavior settings if PostgreSQL is unavailable
   */
  private getDefaultBehaviorSettings(): Record<string, any> {
    console.log('⚠️ Using default AI behavior settings')
    return {
      response_style: 'professional',
      max_response_length: 2000,
      confidence_threshold: 0.7,
      enable_proactive_suggestions: true,
      enable_context_awareness: true
    }
  }

  /**
   * Build fallback prompt if template system fails
   */
  private buildFallbackPrompt(data: SystemPromptData): string {
    console.log('⚠️ Using fallback prompt template')
    return `You are a professional AI assistant for a photography and videography business.

BUSINESS DATA:
- Total Revenue: ${data.totalRevenue.toLocaleString()}
- Total Quotations: ${data.totalQuotations}
- Conversion Rate: ${data.conversionRate.toFixed(1)}%
- Team Size: ${data.teamCount}
- Active Clients: ${data.activeClients}

IMPORTANT: Only use factual data. Never make up information.

User Query: ${data.userMessage}

Please provide a helpful, accurate response based on the available business data.`
  }

  /**
   * Perform basic validation as fallback
   */
  private performBasicValidation(responseText: string): { isValid: boolean; warnings: string[] } {
    const warnings: string[] = []
    let isValid = true

    // Check for suspicious patterns that might indicate hallucination
    const suspiciousPatterns = [
      /I estimate|I assume|I believe|I think|probably|likely|approximately/gi,
      /fictional|hypothetical|example|sample/gi
    ]

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(responseText)) {
        warnings.push('Response contains uncertain language')
        isValid = false
      }
    }

    // Check response length
    if (responseText.length < 10) {
      warnings.push('Response is too short')
      isValid = false
    }

    if (responseText.length > 5000) {
      warnings.push('Response is very long')
    }

    return { isValid, warnings }
  }
} 