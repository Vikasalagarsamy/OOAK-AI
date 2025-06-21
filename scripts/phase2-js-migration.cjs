#!/usr/bin/env node

/**
 * 🎯 PHASE 2: ESSENTIAL SCRIPTS MIGRATION
 * Batch migration tool for converting JavaScript files from Supabase to PostgreSQL
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Phase 2: Essential Scripts Migration - JavaScript Files');
console.log('📝 Converting Supabase dependencies to PostgreSQL\n');

// Priority groups for migration
const MIGRATION_GROUPS = {
  'Critical Infrastructure': [
    'scripts/run-migration.cjs',
    'scripts/run-migration-direct.cjs', 
    'scripts/add-sample-deliverables.js',
    'scripts/add-sample-employees.js',
    'scripts/complete-supabase-to-postgres-migration.js',
    'scripts/populate-sample-business-data.mjs'
  ],
  'Table & Schema Management': [
    'copy-all-schemas.cjs',
    'create-tables-and-migrate.cjs',
    'get-all-remote-tables.cjs',
    'pull-schema.cjs',
    'complete-schema-extractor.cjs',
    'check-table-structure.js'
  ],
  'Data Sync & Migration': [
    'sync-remote-to-local.cjs',
    'sync-schema-then-data.cjs',
    'complete-sync-remote-to-local.cjs',
    'complete-remote-dump.cjs'
  ],
  'Testing & Verification': [
    'test-connection.cjs',
    'test-local-connection.cjs',
    'test-complete-uuid-audit.cjs',
    'test-quotation-fix.cjs',
    'verify-fixes.cjs'
  ]
};

// PostgreSQL migration template
const PG_TEMPLATE = {
  imports: `const { Pool } = require('pg');`,
  
  poolConfig: `
// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DATABASE || 'ooak_future',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'password',
  ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});`,

  queryHelper: `
// Query helper function
async function query(text, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return { data: result.rows, error: null };
  } catch (error) {
    console.error('❌ PostgreSQL Query Error:', error.message);
    return { data: null, error: error.message };
  } finally {
    client.release();
  }
}

// Transaction helper function  
async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return { data: result, error: null };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ PostgreSQL Transaction Error:', error.message);
    return { data: null, error: error.message };
  } finally {
    client.release();
  }
}`,

  cleanup: `
// Cleanup function
async function cleanup() {
  try {
    await pool.end();
    console.log('✅ PostgreSQL pool closed');
  } catch (error) {
    console.error('❌ Error closing pool:', error.message);
  }
}`
};

// Migration patterns for common Supabase operations
const MIGRATION_PATTERNS = [
  {
    pattern: /const\s*\{\s*createClient\s*\}\s*=\s*require\(['"][^'"]*supabase[^'"]*['"];?/g,
    replacement: PG_TEMPLATE.imports
  },
  {
    pattern: /import\s*\{\s*createClient\s*\}\s*from\s*['"][^'"]*supabase[^'"]*['"];?/g,
    replacement: PG_TEMPLATE.imports
  },
  {
    pattern: /const\s+\w+\s*=\s*createClient\([^)]*\);?/g,
    replacement: '// PostgreSQL connection - see pool configuration below'
  },
  {
    pattern: /\.from\(['"](\w+)['"]\)\.select\(['"]([^'"]*)['"]\)/g,
    replacement: "query('SELECT $2 FROM $1')"
  },
  {
    pattern: /\.from\(['"](\w+)['"]\)\.insert\(([^)]*)\)/g,
    replacement: "query('INSERT INTO $1 (...) VALUES (...)', [/* $2 */])"
  },
  {
    pattern: /\.from\(['"](\w+)['"]\)\.update\(([^)]*)\)\.eq\(['"](\w+)['"]\s*,\s*([^)]*)\)/g,
    replacement: "query('UPDATE $1 SET ... WHERE $3 = $4', [/* $2 */])"
  },
  {
    pattern: /\.from\(['"](\w+)['"]\)\.delete\(\)\.eq\(['"](\w+)['"]\s*,\s*([^)]*)\)/g,
    replacement: "query('DELETE FROM $1 WHERE $2 = $3')"
  },
  {
    pattern: /\.rpc\(['"](\w+)['"]\s*,\s*\{([^}]*)\}\)/g,
    replacement: "query('SELECT $1($2)')" // RPC calls need manual conversion
  }
];

function migrateFileContent(content, filename) {
  console.log(`🔄 Processing: ${filename}`);
  
  let migratedContent = content;
  let hasChanges = false;

  // Apply migration patterns
  MIGRATION_PATTERNS.forEach((pattern, index) => {
    const oldContent = migratedContent;
    migratedContent = migratedContent.replace(pattern.pattern, pattern.replacement);
    
    if (oldContent !== migratedContent) {
      hasChanges = true;
      console.log(`   ✅ Applied pattern ${index + 1}`);
    }
  });

  if (hasChanges) {
    // Add PostgreSQL configuration at the top
    const migrationHeader = `// 🚨 MIGRATED FROM SUPABASE TO POSTGRESQL
// Migration Date: ${new Date().toISOString()}
// Original file backed up as: ${filename}.backup

${PG_TEMPLATE.poolConfig}

${PG_TEMPLATE.queryHelper}

// Original content starts here:
`;

    // Add cleanup at the end if it's a main execution file
    if (migratedContent.includes('require.main === module') || 
        migratedContent.includes('if (require.main === module)')) {
      migratedContent += `\n\n${PG_TEMPLATE.cleanup}`;
    }

    migratedContent = migrationHeader + migratedContent;
  }

  return { content: migratedContent, hasChanges };
}

async function migrateFile(filePath) {
  try {
    const fullPath = path.resolve(filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return { success: false, reason: 'File not found' };
    }

    const originalContent = fs.readFileSync(fullPath, 'utf8');
    
    // Skip if already migrated
    if (originalContent.includes('MIGRATED FROM SUPABASE TO POSTGRESQL')) {
      console.log(`ℹ️  Already migrated: ${filePath}`);
      return { success: true, reason: 'Already migrated' };
    }

    // Skip if no Supabase dependencies
    if (!originalContent.includes('supabase') && !originalContent.includes('createClient')) {
      console.log(`ℹ️  No Supabase dependencies: ${filePath}`);
      return { success: true, reason: 'No Supabase dependencies' };
    }

    const { content, hasChanges } = migrateFileContent(originalContent, filePath);

    if (hasChanges) {
      // Create backup
      fs.writeFileSync(fullPath + '.backup', originalContent);
      
      // Write migrated content
      fs.writeFileSync(fullPath, content);
      
      console.log(`✅ Migrated: ${filePath} (backup created)`);
      return { success: true, reason: 'Migrated successfully' };
    } else {
      console.log(`ℹ️  No changes needed: ${filePath}`);
      return { success: true, reason: 'No changes needed' };
    }

  } catch (error) {
    console.error(`❌ Error migrating ${filePath}:`, error.message);
    return { success: false, reason: error.message };
  }
}

async function migrateGroup(groupName, filePaths) {
  console.log(`\n📂 MIGRATING GROUP: ${groupName}`);
  console.log('='.repeat(60));

  const results = {
    successful: [],
    failed: [],
    skipped: []
  };

  for (const filePath of filePaths) {
    const result = await migrateFile(filePath);
    
    if (result.success) {
      if (result.reason.includes('migrated') || result.reason.includes('Migrated')) {
        results.successful.push({ file: filePath, reason: result.reason });
      } else {
        results.skipped.push({ file: filePath, reason: result.reason });
      }
    } else {
      results.failed.push({ file: filePath, reason: result.reason });
    }
  }

  // Summary for this group
  console.log(`\n📊 Group "${groupName}" Summary:`);
  console.log(`   ✅ Successful: ${results.successful.length}`);
  console.log(`   ⚠️  Skipped: ${results.skipped.length}`);
  console.log(`   ❌ Failed: ${results.failed.length}`);

  return results;
}

async function main() {
  console.log('🎯 Starting Phase 2 JavaScript Migration...\n');

  const overallResults = {
    successful: [],
    failed: [],
    skipped: []
  };

  // Process each group
  for (const [groupName, filePaths] of Object.entries(MIGRATION_GROUPS)) {
    const groupResults = await migrateGroup(groupName, filePaths);
    
    overallResults.successful.push(...groupResults.successful);
    overallResults.failed.push(...groupResults.failed);
    overallResults.skipped.push(...groupResults.skipped);
  }

  // Final summary
  console.log('\n' + '='.repeat(80));
  console.log('🎉 PHASE 2 MIGRATION COMPLETE!');
  console.log('='.repeat(80));
  console.log(`✅ Successfully migrated: ${overallResults.successful.length} files`);
  console.log(`⚠️  Skipped: ${overallResults.skipped.length} files`);
  console.log(`❌ Failed: ${overallResults.failed.length} files`);

  if (overallResults.successful.length > 0) {
    console.log('\n✅ Successfully migrated files:');
    overallResults.successful.forEach(({ file, reason }) => {
      console.log(`   - ${file} (${reason})`);
    });
  }

  if (overallResults.failed.length > 0) {
    console.log('\n❌ Failed files:');
    overallResults.failed.forEach(({ file, reason }) => {
      console.log(`   - ${file}: ${reason}`);
    });
  }

  console.log('\n🚀 Next Steps:');
  console.log('   1. Test migrated scripts with PostgreSQL');
  console.log('   2. Update environment variables for PostgreSQL');
  console.log('   3. Review and refine SQL queries in migrated files');
  console.log('   4. Run Phase 3 for remaining JavaScript files');

  // Create environment template
  const envTemplate = `
# PostgreSQL Configuration for Migrated Scripts
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=ooak_future
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_SSL=false

# Remote PostgreSQL (if applicable)
POSTGRES_REMOTE_HOST=remote-host
POSTGRES_REMOTE_PORT=5432
POSTGRES_REMOTE_DATABASE=ooak_future
POSTGRES_REMOTE_USER=postgres
POSTGRES_REMOTE_PASSWORD=password
POSTGRES_REMOTE_SSL=true
`;

  fs.writeFileSync('.env.postgresql', envTemplate);
  console.log('   5. Environment template created: .env.postgresql');

  process.exit(0);
}

// Execute if run directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { migrateFileContent, migrateFile, MIGRATION_PATTERNS }; 