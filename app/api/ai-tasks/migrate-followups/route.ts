import { NextRequest, NextResponse } from 'next/server'
import { FollowupToTaskMigrationService } from '@/services/followup-to-task-migration-service'
import { EnhancedAITaskService } from '@/services/enhanced-ai-task-service'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting Followup to Task Migration API...')
    
    const migrationService = new FollowupToTaskMigrationService()
    const enhancedTaskService = new EnhancedAITaskService()
    
    // Get migration type from request
    const body = await request.json().catch(() => ({}))
    const migrationType = body.type || 'full_migration'
    
    let result
    let tasksCount = 0
    
    switch (migrationType) {
      case 'full_migration':
        // Complete migration of all followups to tasks
        result = await migrationService.migrateAllFollowupsToTasks()
        tasksCount = result.tasksCreated
        break
        
      case 'enhanced_tasks':
        // Generate enhanced tasks with AI business rules
        result = await enhancedTaskService.generateEnhancedTasks()
        tasksCount = result.tasksGenerated
        break
        
      case 'migration_report':
        // Generate comprehensive migration report
        const report = await migrationService.generateMigrationReport()
        return NextResponse.json({
          success: true,
          type: 'migration_report',
          report,
          timestamp: new Date().toISOString()
        })
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid migration type. Use: full_migration, enhanced_tasks, or migration_report'
        }, { status: 400 })
    }
    
    console.log('✅ Migration completed successfully')
    
    return NextResponse.json({
      success: true,
      type: migrationType,
      result,
      timestamp: new Date().toISOString(),
      message: `Migration completed: ${tasksCount} tasks created`
    })
    
  } catch (error) {
    console.error('❌ Migration API failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Migration failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const enhancedTaskService = new EnhancedAITaskService()
    
    // Get migration status and summary
    const summary = await enhancedTaskService.getTaskGenerationSummary()
    const businessRules = enhancedTaskService.getBusinessRules()
    
    return NextResponse.json({
      success: true,
      migration_status: 'ready',
      summary,
      available_business_rules: businessRules,
      migration_options: {
        full_migration: 'Convert all existing followups to intelligent tasks',
        enhanced_tasks: 'Generate AI-powered tasks based on current business data',
        migration_report: 'Get comprehensive migration analysis report'
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Migration status API failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get migration status'
    }, { status: 500 })
  }
} 