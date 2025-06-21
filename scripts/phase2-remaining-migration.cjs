#!/usr/bin/env node

/**
 * 🎯 PHASE 2.5: REMAINING CRITICAL FILES MIGRATION
 * Migrating remaining root-level JavaScript files from Supabase to PostgreSQL
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Phase 2.5: Remaining Critical Files Migration');
console.log('📝 Root-level JavaScript files conversion\n');

// Remaining critical files
const REMAINING_FILES = [
  'test-quotation-slug.js',
  'test-quotation-data.js', 
  'fix-processing-records.js',
  'sync-roles.cjs',
  'test-database-connection.js',
  'test-local-supabase-frontend.js',
  'test-ai-task-uuid-fixes.cjs',
  'fix-sequential-task-logic.js',
  'fix-task-lead-links.js',
  'check-registration.cjs',
  'create-admin-user.cjs',
  'compare-local-instances.cjs',
  'test-complete-uuid-audit.cjs',
  'fix-all-database-issues.cjs',
  'check-employees.cjs'
];

// Import the migration functions from Phase 2
const { migrateFileContent, MIGRATION_PATTERNS } = require('./phase2-js-migration.cjs');

async function migrateRemainingFiles() {
  console.log('🎯 Starting Phase 2.5 Migration...\n');

  const results = {
    successful: [],
    failed: [],
    skipped: []
  };

  for (const fileName of REMAINING_FILES) {
    try {
      const filePath = path.resolve(fileName);
      
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${fileName}`);
        results.skipped.push({ file: fileName, reason: 'File not found' });
        continue;
      }

      const originalContent = fs.readFileSync(filePath, 'utf8');
      
      // Skip if already migrated
      if (originalContent.includes('MIGRATED FROM SUPABASE TO POSTGRESQL')) {
        console.log(`ℹ️  Already migrated: ${fileName}`);
        results.skipped.push({ file: fileName, reason: 'Already migrated' });
        continue;
      }

      // Skip if no Supabase dependencies
      if (!originalContent.includes('supabase') && !originalContent.includes('createClient')) {
        console.log(`ℹ️  No Supabase dependencies: ${fileName}`);
        results.skipped.push({ file: fileName, reason: 'No Supabase dependencies' });
        continue;
      }

      console.log(`🔄 Processing: ${fileName}`);
      
      const { content, hasChanges } = migrateFileContent(originalContent, fileName);

      if (hasChanges) {
        // Create backup
        fs.writeFileSync(filePath + '.backup', originalContent);
        
        // Write migrated content
        fs.writeFileSync(filePath, content);
        
        console.log(`✅ Migrated: ${fileName} (backup created)`);
        results.successful.push({ file: fileName, reason: 'Migrated successfully' });
      } else {
        console.log(`ℹ️  No changes needed: ${fileName}`);
        results.skipped.push({ file: fileName, reason: 'No changes needed' });
      }

    } catch (error) {
      console.error(`❌ Error migrating ${fileName}:`, error.message);
      results.failed.push({ file: fileName, reason: error.message });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('🎉 PHASE 2.5 MIGRATION COMPLETE!');
  console.log('='.repeat(80));
  console.log(`✅ Successfully migrated: ${results.successful.length} files`);
  console.log(`⚠️  Skipped: ${results.skipped.length} files`);
  console.log(`❌ Failed: ${results.failed.length} files`);

  if (results.successful.length > 0) {
    console.log('\n✅ Successfully migrated files:');
    results.successful.forEach(({ file, reason }) => {
      console.log(`   - ${file} (${reason})`);
    });
  }

  if (results.failed.length > 0) {
    console.log('\n❌ Failed files:');
    results.failed.forEach(({ file, reason }) => {
      console.log(`   - ${file}: ${reason}`);
    });
  }

  console.log('\n🚀 Combined Phase 2 + 2.5 Total Results:');
  console.log(`   📊 Phase 2: 17 files migrated`);
  console.log(`   📊 Phase 2.5: ${results.successful.length} files migrated`);
  console.log(`   🎯 Total migrated: ${17 + results.successful.length} files`);

  console.log('\n🚀 Next Steps:');
  console.log('   1. Test critical migrated scripts');
  console.log('   2. Set up PostgreSQL environment variables'); 
  console.log('   3. Run Phase 3 for production scripts');
  console.log('   4. Validate data migration workflows');

  return results;
}

// Execute if run directly
if (require.main === module) {
  migrateRemainingFiles().catch(console.error);
}

module.exports = { migrateRemainingFiles }; 