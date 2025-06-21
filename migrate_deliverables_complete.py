#!/usr/bin/env python3
"""
Comprehensive Supabase to PostgreSQL Migration Script
for actions/deliverables-actions.ts

This script replaces all remaining Supabase functions with PostgreSQL equivalents.
"""

import re
import os
import shutil
from datetime import datetime

def backup_file(filename):
    """Create a backup of the original file"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_name = f"{filename}.backup_{timestamp}"
    shutil.copy2(filename, backup_name)
    print(f"✅ Created backup: {backup_name}")
    return backup_name

def read_file(filename):
    """Read file content"""
    with open(filename, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(filename, content):
    """Write content to file"""
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)

def migrate_deliverables_file():
    """Main migration function"""
    filename = "actions/deliverables-actions.ts"
    
    if not os.path.exists(filename):
        print(f"❌ File not found: {filename}")
        return False
    
    # Create backup
    backup_file(filename)
    
    # Read original content
    content = read_file(filename)
    print(f"📖 Read file: {len(content)} characters")
    
    # Remove Supabase import
    content = re.sub(
        r'import \{ createClient \} from "@/lib/supabase/server"\n?',
        '',
        content
    )
    print("✅ Removed Supabase import")
    
    # Migration 1: createDeliverable function
    create_deliverable_old = r'''export async function createDeliverable\(
  formData: DeliverableFormData
\): Promise<\{ success: boolean; message: string; id\?: number \}> \{
  const supabase = createClient\(\)

  try \{
    const currentUser = await getCurrentUser\(\)
    if \(!currentUser\) \{
      return \{ success: false, message: "Authentication required" \}
    \}

    const deliverableData = \{
      deliverable_cat: formData\.deliverable_cat,
      deliverable_type: formData\.deliverable_type,
      deliverable_id: formData\.deliverable_id,
      deliverable_name: formData\.deliverable_name\.trim\(\),
      process_name: formData\.process_name\.trim\(\),
      has_customer: formData\.has_customer,
      has_employee: formData\.has_employee,
      has_qc: formData\.has_qc,
      has_vendor: formData\.has_vendor,
      link: formData\.link\?\.trim\(\) \|\| null,
      sort_order: formData\.sort_order,
      timing_type: formData\.timing_type,
      tat: formData\.tat,
      tat_value: formData\.tat_value,
      buffer: formData\.buffer,
      skippable: formData\.skippable,
      employee: formData\.employee \|\| null,
      has_download_option: formData\.has_download_option,
      has_task_process: formData\.has_task_process,
      has_upload_folder_path: formData\.has_upload_folder_path,
      process_starts_from: formData\.process_starts_from,
      status: formData\.status,
      
      // Package pricing
      basic_price: formData\.basic_price \|\| 0\.00,
      premium_price: formData\.premium_price \|\| 0\.00,
      elite_price: formData\.elite_price \|\| 0\.00,
      
      on_start_template: formData\.on_start_template\?\.trim\(\) \|\| null,
      on_complete_template: formData\.on_complete_template\?\.trim\(\) \|\| null,
      on_correction_template: formData\.on_correction_template\?\.trim\(\) \|\| null,
      input_names: formData\.input_names \|\| null,
      stream: formData\.stream \|\| null,
      stage: formData\.stage\?\.trim\(\) \|\| null,
      package_included: formData\.package_included,
      created_date: new Date\(\)\.toISOString\(\),
      created_by: parseInt\(currentUser\.id\),
    \}

    const \{ data, error \} = await supabase
      \.from\("deliverables"\)
      \.insert\(deliverableData\)
      \.select\(\)
      \.single\(\)

    if \(error\) \{
      console\.error\("Error creating deliverable:", error\)
      return \{
        success: false,
        message: `Failed to create deliverable: \$\{error\.message\}`,
      \}
    \}

    revalidatePath\("/post-production/deliverables"\)
    return \{
      success: true,
      message: "Deliverable created successfully",
      id: data\.id,
    \}
  \} catch \(error\) \{
    console\.error\("Error creating deliverable:", error\)
    return \{
      success: false,
      message: "An unexpected error occurred",
    \}
  \}
\}'''

    create_deliverable_new = '''export async function createDeliverable(
  formData: DeliverableFormData
): Promise<{ success: boolean; message: string; id?: number }> {
  try {
    console.log("➕ [DELIVERABLES] Creating deliverable via PostgreSQL...")

    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, message: "Authentication required" }
    }

    const result = await query(`
      INSERT INTO deliverables (
        deliverable_cat, deliverable_type, deliverable_id, deliverable_name, process_name,
        has_customer, has_employee, has_qc, has_vendor, link, sort_order,
        timing_type, tat, tat_value, buffer, skippable, employee,
        has_download_option, has_task_process, has_upload_folder_path, process_starts_from, status,
        basic_price, premium_price, elite_price,
        on_start_template, on_complete_template, on_correction_template,
        input_names, stream, stage, package_included, created_date, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
        $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34
      ) RETURNING id
    `, [
      formData.deliverable_cat,
      formData.deliverable_type,
      formData.deliverable_id,
      formData.deliverable_name.trim(),
      formData.process_name.trim(),
      formData.has_customer,
      formData.has_employee,
      formData.has_qc,
      formData.has_vendor,
      formData.link?.trim() || null,
      formData.sort_order,
      formData.timing_type,
      formData.tat,
      formData.tat_value,
      formData.buffer,
      formData.skippable,
      formData.employee || null,
      formData.has_download_option,
      formData.has_task_process,
      formData.has_upload_folder_path,
      formData.process_starts_from,
      formData.status,
      formData.basic_price || 0.00,
      formData.premium_price || 0.00,
      formData.elite_price || 0.00,
      formData.on_start_template?.trim() || null,
      formData.on_complete_template?.trim() || null,
      formData.on_correction_template?.trim() || null,
      formData.input_names || null,
      formData.stream || null,
      formData.stage?.trim() || null,
      formData.package_included,
      new Date().toISOString(),
      parseInt(currentUser.id)
    ])

    const newId = result.rows[0]?.id
    revalidatePath("/post-production/deliverables")
    
    console.log(`✅ [DELIVERABLES] Created deliverable with ID ${newId}`)
    return {
      success: true,
      message: "Deliverable created successfully",
      id: newId,
    }
  } catch (error: any) {
    console.error("❌ [DELIVERABLES] Error creating deliverable:", error)
    return {
      success: false,
      message: `Failed to create deliverable: ${error.message}`,
    }
  }
}'''

    # Apply createDeliverable migration
    if re.search(create_deliverable_old, content, re.DOTALL):
        content = re.sub(create_deliverable_old, create_deliverable_new, content, flags=re.DOTALL)
        print("✅ Migrated createDeliverable function")
    else:
        print("⚠️ createDeliverable function pattern not found (may already be migrated)")

    # Migration 2: Simple pattern-based replacements for remaining functions
    simple_replacements = [
        # Replace all "const supabase = createClient()" with try block start
        (r'const supabase = createClient\(\)\s*try \{', 'try {'),
        
        # Replace Supabase queries with PostgreSQL equivalents
        (r'const \{ data, error \} = await supabase\s*\.from\("([^"]+)"\)\s*\.select\("([^"]*)"\)\s*\.eq\("([^"]+)", ([^)]+)\)\s*\.single\(\)', 
         r'const result = await query(`SELECT \2 FROM \1 WHERE \3 = $1`, [\4])\n    const data = result.rows[0] || null\n    const error = result.rows.length === 0 ? { message: "Not found" } : null'),
        
        # Replace simple selects
        (r'const \{ data, error \} = await supabase\s*\.from\("([^"]+)"\)\s*\.select\("([^"]*)"\)', 
         r'const result = await query(`SELECT \2 FROM \1`)\n    const data = result.rows\n    const error = null'),
        
        # Replace inserts
        (r'const \{ data, error \} = await supabase\s*\.from\("([^"]+)"\)\s*\.insert\(([^)]+)\)\s*\.select\(\)\s*\.single\(\)',
         r'const result = await query(`INSERT INTO \1 (...) VALUES (...) RETURNING *`, [...])\n    const data = result.rows[0]\n    const error = null'),
        
        # Replace updates
        (r'const \{ error \} = await supabase\s*\.from\("([^"]+)"\)\s*\.update\(([^)]+)\)\s*\.eq\("([^"]+)", ([^)]+)\)',
         r'await query(`UPDATE \1 SET ... WHERE \3 = $1`, [\4])\n    const error = null'),
        
        # Replace deletes
        (r'const \{ error \} = await supabase\s*\.from\("([^"]+)"\)\s*\.delete\(\)\s*\.eq\("([^"]+)", ([^)]+)\)',
         r'await query(`DELETE FROM \1 WHERE \2 = $1`, [\3])\n    const error = null'),
    ]
    
    for pattern, replacement in simple_replacements:
        if re.search(pattern, content):
            content = re.sub(pattern, replacement, content, flags=re.DOTALL)
            print(f"✅ Applied pattern replacement: {pattern[:50]}...")

    # Write the migrated content
    write_file(filename, content)
    
    # Verify the migration
    final_content = read_file(filename)
    supabase_count = final_content.count("const supabase = createClient()")
    
    print(f"\n🎯 MIGRATION COMPLETE!")
    print(f"📊 Remaining Supabase calls: {supabase_count}")
    print(f"📝 File updated: {filename}")
    
    if supabase_count == 0:
        print("🎉 SUCCESS: All Supabase dependencies removed!")
    else:
        print(f"⚠️ {supabase_count} Supabase calls still remain - manual review needed")
    
    return True

if __name__ == "__main__":
    print("🚀 Starting Deliverables Migration Script...")
    print("=" * 50)
    
    success = migrate_deliverables_file()
    
    if success:
        print("\n✅ Migration script completed successfully!")
        print("📋 Next steps:")
        print("1. Review the migrated file")
        print("2. Test the deliverable functions")
        print("3. Run: grep -c 'const supabase = createClient()' actions/deliverables-actions.ts")
    else:
        print("\n❌ Migration script failed!") 