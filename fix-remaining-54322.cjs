const fs = require('fs');

// Remaining files to fix
const remainingFiles = [
  'scripts/complete-supabase-to-postgres-migration.js'
];

// Function to fix port 54322 in file
function fixFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Replace port 54322 with 5432
    const oldContent = content;
    content = content.replace(/port: 54322,/g, 'port: 5432,');
    content = content.replace(/POSTGRES_PORT: 54322,/g, 'POSTGRES_PORT: 5432,');
    content = content.replace(/localhost:54322/g, 'localhost:5432');
    
    if (content !== oldContent) {
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    } else {
      console.log(`➖ No changes needed: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

console.log('🔧 Fixing remaining port 54322 references...\n');

remainingFiles.forEach(file => {
  fixFile(file);
});

console.log('\n✅ Remaining port fixes completed!'); 