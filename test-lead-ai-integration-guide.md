# 🎯 AI Task Integration Testing Guide

## ✅ **Prerequisites (COMPLETED)**
- [x] Database schema fixed (ai_tasks table created)
- [x] Integration hooks added to lead assignment functions
- [x] All required services and components deployed

## 🧪 **Step-by-Step Testing Process**

### **Step 1: Fix Database Schema** ⚙️
**URL:** `http://localhost:3001/fix-database-schema.html`

1. Click **"Check Database Schema"**
2. If issues found, click **"Fix Required Issues"**
3. Wait for success confirmation
4. Re-check to confirm schema is ready

### **Step 2: Create a New Lead** 📝
**URL:** `http://localhost:3001/sales/create-lead`

1. **Fill in lead details:**
   ```
   Client Name: "Tech Solutions Inc"
   Contact Person: "John Smith" 
   Phone: "+91-9876543210"
   Email: "john@techsolutions.com"
   Estimated Value: ₹75,000
   ```

2. **Important:** Set status to **UNASSIGNED** initially
3. **Save the lead** (don't assign yet)

### **Step 3: Assign the Lead** 🎯
**URL:** `http://localhost:3001/sales/unassigned-lead` or `/sales/leads`

1. **Find your new lead** in the unassigned leads list
2. **Click "Assign"** button
3. **Select yourself** as the assignee
4. **Confirm assignment**

### **Step 4: Check for AI-Generated Task** ✅
**URL:** `http://localhost:3001/tasks/dashboard`

**Expected Result:**
- New task: `"Initial contact with Tech Solutions Inc"`
- Due date: 24 hours from assignment
- Priority: Medium
- Status: Pending
- Assigned to: You (or sales team member)

### **Step 5: Monitor Console Logs** 🔍
Check your server console for these messages:
```
🚀 Triggering AI task generation for lead assignment...
🎯 Lead assignment hook triggered for lead [ID]
✅ Rule triggered: Initial Contact Task on Lead Assignment
✅ Task created successfully: Initial contact with Tech Solutions Inc
✅ AI generated 1 task(s) for lead [LEAD_NUMBER]
```

### **Step 6: View Integration Analytics** 📊
**URL:** `http://localhost:3001/tasks/integration`

Check for:
- Lead assignment events
- Task generation metrics
- Performance analytics
- AI insights

---

## 🐛 **Troubleshooting**

### **No Tasks Generated?**
1. **Check console logs** for error messages
2. **Verify database schema** is properly set up
3. **Ensure lead assignment** actually triggered (status changed from UNASSIGNED to ASSIGNED)
4. **Check if `ai_tasks` table** has any new records

### **Database Errors?**
- Run the corrected SQL script manually
- Check for RLS policy errors
- Verify table permissions

### **Integration Not Working?**
- Ensure integration hooks are called in assignment functions
- Check if `triggerLeadAssignmentTasks` function exists
- Verify import statements are correct

---

## 🎯 **What Should Happen**

When you assign a lead, the system should:

1. **Update lead status** from UNASSIGNED → ASSIGNED
2. **Trigger AI business rule**: `lead_assignment_initial_contact`
3. **Generate AI task**: "Initial contact with [Client Name]"
4. **Assign task** to appropriate sales team member
5. **Set SLA**: 24-hour deadline
6. **Log activity**: Track assignment and task creation
7. **Show in dashboard**: Task appears in task list

---

## 📋 **Quick Test Commands**

### Check if tables exist:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('ai_tasks', 'task_generation_log', 'lead_task_performance');
```

### Check for generated tasks:
```sql
SELECT * FROM ai_tasks 
WHERE automation_source = 'lead_assignment_initial_contact' 
ORDER BY created_at DESC LIMIT 5;
```

### Check task generation logs:
```sql
SELECT * FROM task_generation_log 
ORDER BY triggered_at DESC LIMIT 10;
```

---

## 🎉 **Success Indicators**

✅ **Database schema ready**  
✅ **Lead created successfully**  
✅ **Lead assigned without errors**  
✅ **AI task generated automatically**  
✅ **Task visible in dashboard**  
✅ **Console logs show success**  
✅ **Integration analytics updated**  

If all indicators are green, your AI task integration is working perfectly! 🚀 