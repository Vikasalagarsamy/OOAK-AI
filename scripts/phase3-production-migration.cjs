#!/usr/bin/env node

/**
 * 🎯 PHASE 3: PRODUCTION SCRIPTS MIGRATION
 * Final batch migration for remaining 52 JavaScript files from Supabase to PostgreSQL
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Phase 3: Production Scripts Migration');
console.log('📝 Final 52 JavaScript files conversion\n');

// Import migration functions from Phase 2
const { migrateFileContent, MIGRATION_PATTERNS } = require('./phase2-js-migration.cjs');

// Prioritized groups for Phase 3 migration
const PHASE3_GROUPS = {
  'Critical Production Scripts': [
    'scripts/run-sql.js',
    'scripts/check-database-schema.js', 
    'scripts/verify-correct-db.mjs',
    'scripts/verify-real-time-connections.js',
    'scripts/get-auth-token.js',
    'services/unified-ai-service.js'
  ],
  
  'Database Management': [
    'check-actual-columns.js',
    'check-quotations-schema.cjs',
    'check-employees.js',
    'diagnose-database-issues.cjs',
    'inspect-local-database.cjs',
    'local-tables-check.cjs',
    'simple-db-inspector.cjs'
  ],
  
  'Data Population & Migration': [
    'scripts/create-organization-data.js',
    'scripts/remove-all-mock-data.js',
    'scripts/add-package-pricing-to-services.js',
    'populate-services-deliverables.js',
    'populate-correct-data.js',
    'populate-test-data.cjs',
    'sync-data.js'
  ],
  
  'Testing & Verification': [
    'test-all-fixes.cjs',
    'test-dashboard-queries.cjs',
    'test-lead-reassignment-fix.cjs',
    'test-local-supabase-frontend.cjs',
    'test-local-supabase-frontend.js',
    'scripts/verify-team-performance.js',
    'scripts/verify-team-performance.mjs'
  ]
};

async function migratePhase3Group(groupName, filePaths) {
  console.log(`\n📂 MIGRATING GROUP: ${groupName}`);
  console.log('='.repeat(70));

  const results = {
    successful: [],
    failed: [],
    skipped: []
  };

  for (const filePath of filePaths) {
    try {
      const fullPath = path.resolve(filePath);
      
      if (!fs.existsSync(fullPath)) {
        console.log(`⚠️  File not found: ${filePath}`);
        results.skipped.push({ file: filePath, reason: 'File not found' });
        continue;
      }

      const originalContent = fs.readFileSync(fullPath, 'utf8');
      
      // Skip if already migrated
      if (originalContent.includes('MIGRATED FROM SUPABASE TO POSTGRESQL')) {
        console.log(`ℹ️  Already migrated: ${filePath}`);
        results.skipped.push({ file: filePath, reason: 'Already migrated' });
        continue;
      }

      // Skip if no Supabase dependencies
      if (!originalContent.includes('supabase') && !originalContent.includes('createClient')) {
        console.log(`ℹ️  No Supabase dependencies: ${filePath}`);
        results.skipped.push({ file: filePath, reason: 'No Supabase dependencies' });
        continue;
      }

      console.log(`🔄 Processing: ${filePath}`);
      
      const { content, hasChanges } = migrateFileContent(originalContent, filePath);

      if (hasChanges) {
        // Create backup
        fs.writeFileSync(fullPath + '.backup', originalContent);
        
        // Write migrated content
        fs.writeFileSync(fullPath, content);
        
        console.log(`✅ Migrated: ${filePath} (backup created)`);
        results.successful.push({ file: filePath, reason: 'Migrated successfully' });
      } else {
        console.log(`ℹ️  No changes needed: ${filePath}`);
        results.skipped.push({ file: filePath, reason: 'No changes needed' });
      }

    } catch (error) {
      console.error(`❌ Error migrating ${filePath}:`, error.message);
      results.failed.push({ file: filePath, reason: error.message });
    }
  }

  // Group summary
  console.log(`\n📊 Group "${groupName}" Summary:`);
  console.log(`   ✅ Successful: ${results.successful.length}`);
  console.log(`   ⚠️  Skipped: ${results.skipped.length}`);
  console.log(`   ❌ Failed: ${results.failed.length}`);

  return results;
}

async function runPhase3Migration() {
  console.log('🎯 Starting Phase 3 Production Migration...\n');

  const overallResults = {
    successful: [],
    failed: [],
    skipped: []
  };

  // Process each group in priority order
  for (const [groupName, filePaths] of Object.entries(PHASE3_GROUPS)) {
    const groupResults = await migratePhase3Group(groupName, filePaths);
    
    overallResults.successful.push(...groupResults.successful);
    overallResults.failed.push(...groupResults.failed);
    overallResults.skipped.push(...groupResults.skipped);
  }

  // Final summary
  console.log('\n' + '='.repeat(80));
  console.log('🎉 PHASE 3 PRODUCTION MIGRATION COMPLETE!');
  console.log('='.repeat(80));
  console.log(`✅ Successfully migrated: ${overallResults.successful.length} files`);
  console.log(`⚠️  Skipped: ${overallResults.skipped.length} files`);
  console.log(`❌ Failed: ${overallResults.failed.length} files`);

  console.log('\n🎯 COMPLETE MIGRATION SUMMARY:');
  console.log(`   📊 Phase 1: 12 files migrated`);
  console.log(`   📊 Phase 2: 31 files migrated`);
  console.log(`   📊 Phase 3: ${overallResults.successful.length} files migrated`);
  console.log(`   🏆 TOTAL: ${12 + 31 + overallResults.successful.length} files`);

  return overallResults;
}

// Execute if run directly
if (require.main === module) {
  runPhase3Migration().catch(console.error);
}

module.exports = { runPhase3Migration, PHASE3_GROUPS }; 