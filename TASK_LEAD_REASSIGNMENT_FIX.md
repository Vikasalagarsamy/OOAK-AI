# Task & Lead Reassignment Bug Fix

## 🚨 **Critical Issue Identified**

### **Problem Statement**
When quotation rejection tasks were reassigned from one employee to another, the **task was successfully reassigned but the associated lead remained with the original owner**. This broke the workflow completely as the new assignee could see the task but not access the lead details.

### **Business Impact**
- ❌ **Broken Workflow**: New assignee sees task but cannot access lead
- ❌ **Customer Service Failure**: Unable to follow up with clients  
- ❌ **Revenue Loss**: Quotation revisions delayed/missed
- ❌ **Employee Confusion**: Tasks without accessible leads

## 🔍 **Root Cause Analysis**

### **Primary Issue: Missing Lead ID in Tasks**
The task reassignment logic in `app/api/tasks/reassign/route.ts` was designed correctly:

```typescript
// If the task has an associated lead, reassign the lead too
if (task.lead_id) {
  // Reassign lead to new employee
  await supabase.from('leads').update({
    assigned_to: newEmployeeId,
    // ... other fields
  }).eq('id', task.lead_id)
}
```

**BUT**: Quotation rejection tasks were being created **WITHOUT** the `lead_id` field!

### **Secondary Issue: Task Creation Logic**
In `app/api/quotation-approval/route.ts`, rejection tasks were created like this:

```typescript
// ❌ BROKEN - Missing lead_id
await supabase.from('ai_tasks').insert({
  task_title: followUpTaskTitle,
  task_description: enhancedDescription,
  assigned_to_employee_id: assigneeEmployee.id,
  quotation_id: quotationId,
  // ❌ MISSING: lead_id: quotation.lead_id
})
```

## 📊 **Investigation Results**

### **Debug Findings**
From our debug script (`debug-lead-reassignment.cjs`):

```bash
Found 26 Ramya-related tasks:
  - Task ID: 27 (assigned to Sridhar K) - Lead ID: null ❌
  - Task ID: 25 (assigned to Sridhar K) - Lead ID: null ❌  
  - Task ID: 23 (assigned to Deepika)   - Lead ID: null ❌
  - Task ID: 1  (initial contact)       - Lead ID: 2   ✅
```

**Critical Discovery**: ALL quotation rejection tasks had `lead_id: null`!

### **Quotation Analysis**
```bash
Found 1 Ramya-related quotations:
  - Quotation ID: 1
  - Number: QT-2025-0001
  - Lead ID: 2 ✅ (quotation correctly linked to lead)
```

The quotation was correctly linked to the lead, but the rejection tasks were not.

## 🔧 **The Complete Fix**

### **1. Fixed Task Creation Logic**
Updated `app/api/quotation-approval/route.ts` line ~520:

```typescript
// ✅ FIXED - Now includes lead_id
const { error: followUpTaskError } = await supabase
  .from('ai_tasks')
  .insert({
    task_title: followUpTaskTitle,
    task_description: enhancedDescription,
    assigned_to_employee_id: assigneeEmployee.id,
    quotation_id: quotationId,
    lead_id: quotation.lead_id, // 🔧 FIX: Add lead_id to enable proper task reassignment!
    client_name: quotation.client_name,
    // ... rest of fields
  })
```

### **2. Backfill Script for Existing Data**
Created `fix-orphaned-quotation-tasks.sql` to fix existing orphaned tasks:

```sql
-- Update all orphaned quotation tasks with correct lead_id
UPDATE ai_tasks 
SET lead_id = quotations.lead_id, updated_at = NOW()
FROM quotations 
WHERE ai_tasks.quotation_id = quotations.id 
    AND ai_tasks.lead_id IS NULL 
    AND ai_tasks.quotation_id IS NOT NULL
    AND ai_tasks.task_type IN ('quotation_revision', 'quotation_approval', 'client_followup');
```

### **3. Test Script for Verification**
Created `test-lead-reassignment-fix.cjs` to verify the fix works correctly.

## 🎯 **Implementation Steps**

### **Step 1: Apply the Code Fix**
✅ **COMPLETED**: Updated `app/api/quotation-approval/route.ts` to include `lead_id` in task creation.

### **Step 2: Run Backfill Script**
Execute the SQL script to fix existing orphaned tasks:

```bash
# Connect to your database and run:
psql -f fix-orphaned-quotation-tasks.sql
```

### **Step 3: Test the Fix**
Run the test script to verify everything works:

```bash
export NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
node test-lead-reassignment-fix.cjs
```

## ✅ **Expected Results After Fix**

### **Workflow Flow**
1. **Quotation Created**: ✅ Includes lead_id
2. **Rejection Task Created**: ✅ Now includes lead_id  
3. **Task Reassignment**: ✅ Both task AND lead reassigned
4. **New Assignee**: ✅ Can see both task and lead

### **User Experience**
- ✅ **Sridhar K** sees task in dashboard AND lead in "My Leads"
- ✅ **Task reassignment** transfers both task and lead ownership
- ✅ **New assignee** has complete access to work on the quotation
- ✅ **Sales Head** maintains visibility as department head

## 🏗️ **Architecture Notes**

### **Task-Lead Relationship**
```
Lead (id: 2, client: "Ramya")
  ↓
Quotation (id: 1, lead_id: 2, number: "QT-2025-0001")
  ↓  
Task (quotation_id: 1, lead_id: 2) ← This was missing!
```

### **Reassignment Logic**
```typescript
// Now works correctly because lead_id is present
if (task.lead_id) {
  // Reassign both task AND lead
  await reassignTask(taskId, newEmployeeId)
  await reassignLead(task.lead_id, newEmployeeId) ✅
}
```

## 🔍 **Verification Commands**

### **Check Orphaned Tasks**
```sql
SELECT t.id, t.task_title, t.quotation_id, t.lead_id, q.lead_id as should_be
FROM ai_tasks t 
LEFT JOIN quotations q ON t.quotation_id = q.id 
WHERE t.quotation_id IS NOT NULL AND t.lead_id IS NULL;
```

### **Verify Fix Applied**
```sql
SELECT COUNT(*) as fixed_tasks 
FROM ai_tasks t
JOIN quotations q ON t.quotation_id = q.id 
WHERE t.lead_id = q.lead_id 
  AND t.task_type IN ('quotation_revision', 'quotation_approval');
```

## 📈 **Business Impact of Fix**

### **Before Fix**
- ❌ Task reassignment broke workflow
- ❌ Employees confused about task ownership  
- ❌ Lost leads and revenue opportunities
- ❌ Manual intervention required

### **After Fix**  
- ✅ Seamless task and lead reassignment
- ✅ Complete workflow visibility
- ✅ Improved team productivity
- ✅ Better customer service

---

## 🎯 **Summary**

**Issue**: Quotation rejection tasks created without `lead_id` prevented proper task reassignment.

**Root Cause**: Missing `lead_id` in task creation logic.

**Fix**: Added `lead_id: quotation.lead_id` to task creation + backfill script for existing data.

**Result**: Task reassignment now correctly transfers both task and lead ownership.

**Business Value**: Restored complete quotation revision workflow, enabling proper task delegation and team productivity.

This fix ensures that when tasks are reassigned, the new assignee has complete access to both the task and the associated lead, maintaining workflow integrity and business continuity. 