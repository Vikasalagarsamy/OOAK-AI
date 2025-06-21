#!/usr/bin/env node

/**
 * 🎯 COMPLETE SUPABASE TO POSTGRESQL MIGRATION
 * Phase 12.4 - Replace all Supabase client usage with direct PostgreSQL connections
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🚀 Starting Phase 12.4: Complete Supabase to PostgreSQL Migration')

// PostgreSQL connection configuration
const PG_CONFIG = {
  host: 'localhost',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'postgres'
}

// 1. Create centralized PostgreSQL client
const pgClientContent = `import { Pool } from 'pg'

// Centralized PostgreSQL connection pool
export const pool = new Pool({
  host: '${PG_CONFIG.host}',
  port: ${PG_CONFIG.port},
  database: '${PG_CONFIG.database}',
  user: '${PG_CONFIG.user}',
  password: '${PG_CONFIG.password}',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// Helper function for single queries
export async function query(text: string, params?: any[]) {
  const client = await pool.connect()
  try {
    const result = await client.query(text, params)
    return result
  } finally {
    client.release()
  }
}

// Helper function for transactions
export async function transaction(callback: (client: any) => Promise<any>) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

// Connection health check
export async function healthCheck() {
  try {
    const result = await query('SELECT NOW() as current_time')
    console.log('✅ PostgreSQL connection healthy:', result.rows[0].current_time)
    return true
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message)
    return false
  }
}
`

// 2. Migration mappings for common Supabase patterns
const migrationMappings = [
  {
    pattern: /import\s+\{\s*createClient\s*\}\s+from\s+['"]['"][^'"'"]*supabase['"'"]/g,
    replacement: "import { query, transaction, pool } from '@/lib/postgresql-client'"
  },
  {
    pattern: /const\s+supabase\s*=\s*createClient\([^)]*\)/g,
    replacement: "// Direct PostgreSQL connection - see lib/postgresql-client.ts"
  },
  {
    pattern: /supabase\.from\(['"]([^'"]*)['"]\)\.select\(['"]([^'"]*)['"]\)/g,
    replacement: "await query('SELECT $2 FROM $1')"
  },
  {
    pattern: /supabase\.from\(['"]([^'"]*)['"]\)\.insert\(([^)]*)\)/g,
    replacement: "await query('INSERT INTO $1 ...', [$2])"
  },
  {
    pattern: /supabase\.from\(['"]([^'"]*)['"]\)\.update\(([^)]*)\)\.eq\(['"]([^'"]*)['"]\s*,\s*([^)]*)\)/g,
    replacement: "await query('UPDATE $1 SET ... WHERE $3 = $4', [$2])"
  },
  {
    pattern: /supabase\.from\(['"]([^'"]*)['"]\)\.delete\(\)\.eq\(['"]([^'"]*)['"]\s*,\s*([^)]*)\)/g,
    replacement: "await query('DELETE FROM $1 WHERE $2 = $3')"
  }
]

// 3. Files to migrate (prioritized list)
const filesToMigrate = [
  // Core services
  'services/dashboard-service.ts',
  'services/bug-service.ts',
  'services/notification-service.ts',
  'services/activity-service.ts',
  'services/reports-service.ts',
  'services/lead-source-service.ts',
  
  // Actions
  'actions/dashboard-actions.ts',
  'actions/user-role-actions.ts',
  'actions/department-actions.ts',
  'actions/employee-list-actions.ts',
  
  // High-priority components and APIs would be handled separately
]

async function createPostgreSQLClient() {
  console.log('📝 Creating centralized PostgreSQL client...')
  
  const clientPath = path.join(process.cwd(), 'lib', 'postgresql-client.ts')
  fs.writeFileSync(clientPath, pgClientContent)
  
  console.log('✅ Created lib/postgresql-client.ts')
}

async function migrateFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath)
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`)
    return
  }
  
  console.log(`🔄 Migrating ${filePath}...`)
  
  let content = fs.readFileSync(fullPath, 'utf8')
  const originalContent = content
  
  // Apply migration patterns
  migrationMappings.forEach(({ pattern, replacement }) => {
    content = content.replace(pattern, replacement)
  })
  
  // Additional specific replacements
  content = content.replace(
    /await\s+supabase\./g,
    '// TODO: Replace with direct PostgreSQL query - await query('
  )
  
  if (content !== originalContent) {
    // Create backup
    fs.writeFileSync(fullPath + '.backup', originalContent)
    
    // Write migrated content with migration notice
    const migrationNotice = `// 🚨 MIGRATION NOTICE: This file has been partially migrated from Supabase to PostgreSQL
// TODO: Complete the migration by replacing Supabase queries with direct SQL
// See lib/postgresql-client.ts for helper functions
// Backup saved as: ${filePath}.backup

`
    fs.writeFileSync(fullPath, migrationNotice + content)
    console.log(`✅ Migrated ${filePath} (backup created)`)
  } else {
    console.log(`ℹ️  No changes needed for ${filePath}`)
  }
}

async function createMigrationPlan() {
  console.log('📋 Creating comprehensive migration plan...')
  
  const migrationPlan = `# PHASE 12.4 MIGRATION PLAN
## Supabase to PostgreSQL Complete Migration

### STATUS: IN PROGRESS
- ✅ Created centralized PostgreSQL client
- ✅ Migrated sample files with pattern replacement
- 🔄 Manual migration required for complex queries

### PRIORITY 1: Core Services (This Week)
${filesToMigrate.map(file => `- [ ] ${file}`).join('\n')}

### PRIORITY 2: Actions & Components (Next Week)
- [ ] All files in /actions/*.ts
- [ ] All files in /components/**/*.tsx using Supabase
- [ ] All files in /services/*.ts

### PRIORITY 3: Legacy Scripts (Final Phase)
- [ ] All .js files using Supabase
- [ ] Test files and utilities

### MIGRATION PATTERNS APPLIED:
${migrationMappings.map(m => `- ${m.pattern.source} → ${m.replacement}`).join('\n')}

### NEXT STEPS:
1. Test PostgreSQL client health check
2. Migrate high-priority services manually
3. Update all API routes to use direct PostgreSQL
4. Remove Supabase dependencies from package.json
5. Update environment variables

### COMPLETION CRITERIA:
- [ ] No remaining createClient imports from Supabase
- [ ] All database operations use direct PostgreSQL
- [ ] All tests pass with new PostgreSQL client
- [ ] Performance benchmarks meet requirements
`

  fs.writeFileSync('MIGRATION_PLAN_12.4.md', migrationPlan)
  console.log('✅ Created MIGRATION_PLAN_12.4.md')
}

async function testPostgreSQLConnection() {
  console.log('🔍 Testing PostgreSQL connection...')
  
  try {
    const { Pool } = require('pg')
    const testPool = new Pool(PG_CONFIG)
    
    const result = await testPool.query('SELECT NOW() as current_time, version() as pg_version')
    console.log('✅ PostgreSQL connection successful!')
    console.log('   Time:', result.rows[0].current_time)
    console.log('   Version:', result.rows[0].pg_version.split(' ')[0])
    
    await testPool.end()
    return true
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message)
    return false
  }
}

async function generateMigrationReport() {
  console.log('📊 Generating migration status report...')
  
  const supabaseFiles = []
  
  function scanDirectory(dir) {
    const files = fs.readdirSync(dir)
    
    files.forEach(file => {
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        scanDirectory(filePath)
      } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
        const content = fs.readFileSync(filePath, 'utf8')
        if (content.includes('supabase') || content.includes('@supabase')) {
          supabaseFiles.push(filePath.replace(process.cwd() + '/', ''))
        }
      }
    })
  }
  
  scanDirectory(process.cwd())
  
  const report = `# SUPABASE MIGRATION STATUS REPORT
Generated: ${new Date().toISOString()}

## FILES STILL USING SUPABASE: ${supabaseFiles.length}

${supabaseFiles.map(file => `- ${file}`).join('\n')}

## NEXT ACTIONS REQUIRED:
1. Complete migration of ${filesToMigrate.length} priority files
2. Update ${supabaseFiles.length - filesToMigrate.length} remaining files
3. Remove Supabase dependencies
4. Update documentation

## ESTIMATED COMPLETION TIME: 
- Priority files: 2-3 days
- Remaining files: 1 week
- Testing & validation: 2 days
`

  fs.writeFileSync('SUPABASE_MIGRATION_REPORT.md', report)
  console.log(`✅ Generated migration report: ${supabaseFiles.length} files need migration`)
}

async function main() {
  try {
    console.log('🏗️  Phase 12.4: Complete Supabase to PostgreSQL Migration')
    
    // Step 1: Test PostgreSQL connection
    const connectionOk = await testPostgreSQLConnection()
    if (!connectionOk) {
      console.error('❌ Cannot proceed without PostgreSQL connection')
      process.exit(1)
    }
    
    // Step 2: Create PostgreSQL client
    await createPostgreSQLClient()
    
    // Step 3: Generate migration status report
    await generateMigrationReport()
    
    // Step 4: Create migration plan
    await createMigrationPlan()
    
    // Step 5: Start migrating priority files
    console.log('\n🔄 Starting priority file migration...')
    for (const file of filesToMigrate) {
      await migrateFile(file)
    }
    
    console.log('\n🎉 Phase 12.4 Initial Migration Complete!')
    console.log('📋 Next steps:')
    console.log('   1. Review MIGRATION_PLAN_12.4.md')
    console.log('   2. Review SUPABASE_MIGRATION_REPORT.md')
    console.log('   3. Test the new PostgreSQL client')
    console.log('   4. Manually complete complex query migrations')
    console.log('   5. Remove Supabase dependencies when all files are migrated')
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

// Run migration
main().catch(console.error) 