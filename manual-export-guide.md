# 📋 **Manual Data Export/Import Guide**

Since direct sync has authentication challenges, here's how to manually sync your data:

## **🔗 Quick Links**
- **Remote Studio**: https://aavofqdzjhyfjygkxynq.supabase.co  
- **Local Studio**: http://127.0.0.1:54323

---

## **📥 Step 1: Export from Remote (Priority Order)**

**Go to your Remote Supabase Studio** and export tables in this order:

### **Core Tables (Export First):**
1. **`roles`** - User roles and permissions
2. **`departments`** - Company departments  
3. **`designations`** - Job titles/positions
4. **`companies`** - Company information
5. **`branches`** - Company branches
6. **`lead_sources`** - Lead source types

### **User & Employee Tables:**
7. **`user_accounts`** - User login accounts
8. **`employees`** - Employee records

### **Business Data:**
9. **`leads`** - Sales leads
10. **`quotations`** - Quote information
11. **`notifications`** - System notifications
12. **`vendors`** - Vendor information
13. **`clients`** - Client records
14. **`tasks`** - Task management

### **WhatsApp Integration:**
15. **`whatsapp_config`** - WhatsApp settings
16. **`whatsapp_templates`** - Message templates  
17. **`whatsapp_messages`** - Message history

---

## **📥 Export Process (For Each Table):**

1. **Open Remote Studio** → Go to **Table Editor**
2. **Select table** (e.g., `companies`)
3. **Click the export button** (usually 3 dots menu → Export)
4. **Choose CSV format**
5. **Download the file**

---

## **📤 Step 2: Import to Local**

1. **Open Local Studio**: http://127.0.0.1:54323
2. **Go to Table Editor**
3. **Select the same table**
4. **Click Import** (usually + button or Import option)
5. **Upload the CSV file**
6. **Map columns** if needed
7. **Import data**

---

## **⚡ Quick Copy Method (Alternative)**

### **For Small Tables, Use SQL Copy:**

1. **In Remote Studio** → Go to **SQL Editor**
2. **Run this query** for each table:
```sql
SELECT * FROM roles;
```
3. **Copy the results**
4. **In Local Studio** → **SQL Editor**
5. **Create INSERT statements**:
```sql
INSERT INTO roles (id, title, description, status) VALUES
(1, 'Admin', 'Administrator', 'active'),
(2, 'User', 'Regular User', 'active');
```

---

## **🔍 Verification Steps**

After importing each table:

1. **Check record counts** match
2. **Verify relationships** work (foreign keys)
3. **Test sample queries**

---

## **⚠️ Important Notes**

- **Follow the order above** to avoid foreign key constraint errors
- **Export/import in small batches** if tables are large
- **Check for ID conflicts** (auto-increment sequences)
- **Backup local data** before importing if you have existing data

---

## **🚀 Pro Tips**

- **Start with small tables** (`roles`, `departments`) to get familiar
- **Use browser dev tools** to bulk copy data if CSV export isn't available
- **Save export files** for future reference
- **Test one table at a time** to isolate any issues

---

**🎯 Goal:** Get your core business data (companies, employees, leads) synced first, then add the rest! 