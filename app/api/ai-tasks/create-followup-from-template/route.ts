import { createClient } from '@/lib/postgresql-client'
import { NextRequest, NextResponse } from 'next/server'

/**
 * 🎯 AI TASK CREATION FROM ADMIN TEMPLATES
 * =========================================
 * 
 * Uses admin-defined task sequence templates to create intelligent follow-up tasks.
 * This bridges the gap between admin configuration and AI automation.
 */

export async function POST(request: NextRequest) {
  try {
    const { 
      quotationId, 
      quotationNumber, 
      clientName, 
      totalAmount, 
      templateId,
      sequenceCategory = 'sales_followup' 
    } = await request.json()

    console.log('🎯 AI Template-Based Task Generator:', quotationNumber, 'Template:', templateId)

    const { query, transaction } = createClient()

    // 1. Get the sequence template
    let template
    if (templateId) {
      // Use specific template
      const { data: templateData, error: templateError } = await supabase
        .from('task_sequence_templates')
        .select(`
          *,
          steps:sequence_steps (*),
          rules:sequence_rules (*)
        `)
        .eq('id', templateId)
        .eq('is_active', true)
        .single()

      if (templateError || !templateData) {
        throw new Error(`Template not found: ${templateId}`)
      }
      template = templateData
    } else {
      // Auto-select best template based on quotation value and category
      template = await selectBestTemplate(supabase, totalAmount, sequenceCategory)
    }

    if (!template || !template.steps || template.steps.length === 0) {
      throw new Error('No suitable template found or template has no steps')
    }

    console.log('✅ Using template:', template.name, 'with', template.steps.length, 'steps')

    // 2. Create the first task (sequential approach)
    const firstStep = template.steps.sort((a: any, b: any) => a.step_number - b.step_number)[0]
    const now = new Date()

    const { data: newTask, error } = await supabase
      .from('ai_tasks')
      .insert({
        task_title: `${firstStep.title} - ${quotationNumber}`,
        task_description: `${firstStep.description} Client: ${clientName}. Quote: ${quotationNumber} (₹${totalAmount.toLocaleString()})`,
        priority: firstStep.priority,
        status: 'pending',
        due_date: new Date(now.getTime() + firstStep.due_after_hours * 60 * 60 * 1000).toISOString(),
        category: template.category,
        assigned_to: 'Sales Team',
        assigned_by: 'AI System (Template)',
        client_name: clientName,
        business_impact: `Template: ${template.name} • Step ${firstStep.step_number}/${template.steps.length} • Value: ₹${totalAmount.toLocaleString()}`,
        ai_reasoning: `Using admin template "${template.name}". ${firstStep.description} This is step ${firstStep.step_number} of ${template.steps.length} in the sequence.`,
        estimated_value: totalAmount,
        quotation_id: quotationId,
        metadata: {
          quotation_number: quotationNumber,
          template_id: template.id,
          template_name: template.name,
          sequence_step: firstStep.step_number,
          sequence_total_steps: template.steps.length,
          is_sequential: true,
          is_template_based: true,
          ai_generated: true,
          original_step_id: firstStep.id
        },
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create task: ${error.message}`)
    }

    console.log('✅ Created template-based task:', newTask.task_title)

    return NextResponse.json({
      success: true,
      task: newTask,
      template: {
        id: template.id,
        name: template.name,
        category: template.category
      },
      sequence: {
        currentStep: firstStep.step_number,
        totalSteps: template.steps.length,
        isSequential: true
      },
      message: `Created task from template "${template.name}": Step ${firstStep.step_number} of ${template.steps.length}`
    })

  } catch (error) {
    console.error('❌ Template-based Task Creation Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create task from template',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

/**
 * 🎯 AUTO-SELECT BEST TEMPLATE
 * ============================
 * Selects the most appropriate template based on business rules
 */
async function selectBestTemplate(supabase: any, totalAmount: number, category: string) {
  // Get ALL active templates, not just one category
  const { data: allTemplates, error } = await supabase
    .from('task_sequence_templates')
    .select(`
      *,
      steps:sequence_steps (*),
      rules:sequence_rules (*)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error || !allTemplates || allTemplates.length === 0) {
    console.warn('⚠️ No templates found')
    return null
  }

  console.log('🎯 Available templates:', allTemplates.map(t => `${t.name} (${t.category})`))

  // Business logic for template selection
  if (totalAmount > 200000) {
    // Corporate-level quotations
    const corporateTemplate = allTemplates.find((t: any) => 
      t.name.toLowerCase().includes('corporate') ||
      t.category === 'corporate'
    )
    if (corporateTemplate) {
      console.log('✅ Selected corporate template:', corporateTemplate.name)
      return corporateTemplate
    }
  }

  if (totalAmount > 100000) {
    // High-value quotations get premium template
    const premiumTemplate = allTemplates.find((t: any) => 
      t.name.toLowerCase().includes('high-value') || 
      t.name.toLowerCase().includes('premium') ||
      t.category === 'premium_followup'
    )
    if (premiumTemplate) {
      console.log('✅ Selected premium template:', premiumTemplate.name)
      return premiumTemplate
    }
  }

  // Default to sales followup template
  const standardTemplate = allTemplates.find((t: any) => 
    t.category === 'sales_followup' ||
    t.name.toLowerCase().includes('standard')
  )
  
  if (standardTemplate) {
    console.log('✅ Selected standard template:', standardTemplate.name)
    return standardTemplate
  }

  // Fallback to first template
  console.log('✅ Using fallback template:', allTemplates[0].name)
  return allTemplates[0]
} 