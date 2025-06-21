# 📍 Database Monitor - Access Guide

## 🎯 **How to Access the Database Monitor**

### **Method 1: Admin Dropdown Menu (Header)**
1. **Login** as an admin user
2. Look for the **"Admin"** button in the top-right header
3. Click **Admin** → **Database Monitor**
4. **Direct URL**: `http://localhost:3000/admin/database-monitor`

### **Method 2: Sidebar Navigation (Main Menu)**
1. **Login** as an admin user  
2. Look in the **left sidebar navigation**
3. Expand **"System Administration"** section
4. Click **"Database Monitor"** with the 🔗 Database icon
5. Should show **"PRO"** badge

---

## 🔍 **Troubleshooting: If You Can't See It**

### **Check 1: Admin Permissions**
- ✅ Must be logged in as **Administrator**
- ✅ User role must have admin privileges
- ❌ Regular users cannot see admin features

### **Check 2: Header Admin Menu**
- ✅ Look for **"Admin"** button in top-right header (next to theme toggle)
- ✅ Should see gear ⚙️ icon
- ✅ Dropdown should contain:
  - Menu & Role Permissions
  - Menu Repair  
  - Menu Debug
  - Test Permissions
  - **Database Monitor** 🔗

### **Check 3: Sidebar Navigation**
- ✅ Left sidebar should show **"System Administration"** section
- ✅ Expand it to see **"Database Monitor"** with PRO badge
- ✅ Should have Database 🔗 icon

### **Check 4: Direct URL Access**
- ✅ Try navigating directly: `http://localhost:3000/admin/database-monitor`
- ✅ Should redirect to login if not authenticated
- ✅ Should show the dashboard if authenticated as admin

---

## 🏆 **What You'll See**

### **Dashboard Overview Cards**
- 🔗 **Connection Status**: Database connectivity and response time
- ✅ **Foreign Keys**: FK integrity validation status  
- ⏰ **Uptime**: System uptime tracking
- 💾 **Memory Usage**: Real-time memory consumption

### **Detailed Tabs**
- 📊 **Table Statistics**: Record counts for all major tables
- 🔗 **Foreign Keys**: Complete FK relationship validation
- 📈 **Recent Activity**: Latest quotations and leads
- 🖥️ **System Info**: Schema details and system metrics

### **Enterprise Features**
- 🔄 **Auto-Refresh**: Every 30 seconds (toggleable)
- ⚡ **Manual Refresh**: On-demand updates
- 📊 **HTML Reports**: Detailed FK validation reports
- 📱 **Mobile-Friendly**: Responsive design

---

## 🚨 **If Still Not Visible**

### **Option 1: Check User Role**
```sql
-- Check if your user has admin role
SELECT ua.id, ua.username, r.name as role_name, r.title
FROM user_accounts ua
JOIN roles r ON ua.role_id = r.id
WHERE ua.username = 'your_username';
```

### **Option 2: Force Refresh**
- Clear browser cache
- Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
- Try incognito mode

### **Option 3: Check Console**
- Open browser DevTools (F12)
- Look for JavaScript errors
- Check Network tab for failed requests

---

## ✅ **Verification Steps**

1. **✅ Login as admin user**
2. **✅ See "Admin" button in header**
3. **✅ Admin dropdown contains "Database Monitor"**  
4. **✅ Sidebar shows "System Administration" section**
5. **✅ Database Monitor accessible in sidebar**
6. **✅ Direct URL works: `/admin/database-monitor`**
7. **✅ Dashboard loads with live data**

---

## 📱 **Mobile Access**

- **Mobile Menu**: Hamburger menu → Admin → Database Monitor
- **Responsive Design**: All features work on mobile
- **Touch-Friendly**: Large buttons and touch targets

---

## 🎯 **Quick Test**

**Fastest way to verify it's working:**

1. Open: `http://localhost:3000/admin/database-monitor`
2. Login as admin if prompted
3. Should see the Database Monitor dashboard
4. Should show connection status, table stats, and FK validation

**Success! You now have enterprise-grade database monitoring! 🚀** 