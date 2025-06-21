import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/postgresql-client'

/**
 * 🎛️ ADMIN TASK SEQUENCE MANAGEMENT API
 * ===================================
 * 
 * Manages task sequence templates, rules, and configurations
 * This is the master control for all automated task sequences
 */

// GET /api/admin/task-sequences - Get all sequence templates
export async function GET() {
  try {
    const { query, transaction } = createClient()

    // Get all sequence templates with their steps and rules
    const { data: sequences, error } = await supabase
      .from('task_sequence_templates')
      .select(`
        *,
        steps:sequence_steps (*),
        rules:sequence_rules (*)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch sequences: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      sequences: sequences || [],
      count: sequences?.length || 0
    })

  } catch (error) {
    console.error('❌ Error fetching task sequences:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch task sequences',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

// POST /api/admin/task-sequences - Create new sequence template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      name, 
      description, 
      category, 
      is_active = true,
      steps = [],
      rules = [],
      created_by = 'Admin'
    } = body

    console.log('🎯 Creating new task sequence template:', name)

    const { query, transaction } = createClient()

    // Validate required fields
    if (!name || !steps.length) {
      return NextResponse.json({
        success: false,
        error: 'Sequence name and steps are required'
      }, { status: 400 })
    }

    // Create the main sequence template
    const { data: sequence, error: sequenceError } = await supabase
      .from('task_sequence_templates')
      .insert({
        name,
        description,
        category,
        is_active,
        created_by,
        metadata: {
          total_steps: steps.length,
          estimated_duration_days: Math.max(...steps.map((s: any) => s.due_after_hours / 24)),
          created_at: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (sequenceError) {
      throw new Error(`Failed to create sequence: ${sequenceError.message}`)
    }

    // Create sequence steps
    const stepsWithSequenceId = steps.map((step: any, index: number) => ({
      sequence_template_id: sequence.id,
      step_number: index + 1,
      title: step.title,
      description: step.description,
      icon: step.icon || 'target',
      due_after_hours: step.due_after_hours || 24,
      priority: step.priority || 'medium',
      is_conditional: step.is_conditional || false,
      condition_type: step.condition_type || null,
      condition_value: step.condition_value || null,
      metadata: {
        estimated_duration: step.estimated_duration || '30 minutes',
        required_tools: step.required_tools || [],
        success_criteria: step.success_criteria || []
      }
    }))

    const { error: stepsError } = await supabase
      .from('sequence_steps')
      .insert(stepsWithSequenceId)

    if (stepsError) {
      throw new Error(`Failed to create steps: ${stepsError.message}`)
    }

    // Create sequence rules if provided
    if (rules.length > 0) {
      const rulesWithSequenceId = rules.map((rule: any) => ({
        sequence_template_id: sequence.id,
        rule_type: rule.rule_type, // 'conditional_step', 'timing_adjustment', 'priority_boost'
        condition_field: rule.condition_field, // 'quotation_value', 'client_type', 'response_time'
        condition_operator: rule.condition_operator, // '>', '<', '=', 'contains'
        condition_value: rule.condition_value,
        action_type: rule.action_type, // 'add_step', 'modify_timing', 'change_priority'
        action_data: rule.action_data,
        is_active: rule.is_active !== false
      }))

      const { error: rulesError } = await supabase
        .from('sequence_rules')
        .insert(rulesWithSequenceId)

      if (rulesError) {
        console.warn('⚠️ Failed to create some rules:', rulesError.message)
      }
    }

    console.log('✅ Task sequence template created successfully:', sequence.id)

    return NextResponse.json({
      success: true,
      sequence: sequence,
      message: `Task sequence "${name}" created successfully with ${steps.length} steps`
    })

  } catch (error) {
    console.error('❌ Error creating task sequence:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create task sequence',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

// PUT /api/admin/task-sequences - Update sequence template
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Sequence ID is required'
      }, { status: 400 })
    }

    const { query, transaction } = createClient()

    const { data: sequence, error } = await supabase
      .from('task_sequence_templates')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update sequence: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      sequence: sequence,
      message: 'Task sequence updated successfully'
    })

  } catch (error) {
    console.error('❌ Error updating task sequence:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update task sequence',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

// DELETE /api/admin/task-sequences - Delete sequence template
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Sequence ID is required'
      }, { status: 400 })
    }

    const { query, transaction } = createClient()

    // Delete the sequence (steps and rules will be cascaded)
    const { error } = await supabase
      .from('task_sequence_templates')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete sequence: ${error.message}`)
    }

    console.log('✅ Task sequence deleted successfully:', id)

    return NextResponse.json({
      success: true,
      message: 'Task sequence deleted successfully'
    })

  } catch (error) {
    console.error('❌ Error deleting task sequence:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete task sequence',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
} 