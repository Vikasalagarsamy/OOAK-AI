# 📋 Menu Permissions Management Guide

## Overview
The Frontend Menu Permissions Manager allows you to control role-based access to menu items directly from the web interface. No more SQL scripts required!

## 🚀 Quick Start

### 1. Access the Manager
- Login as Administrator
- Go to `/admin` dashboard
- Click "Manage Menu Access" under "Menu Permissions"

### 2. Select a Role
- Choose a role from the left panel
- Each role shows its current permission count
- Role colors help identify permission levels

### 3. Configure Permissions
You have **4 permission types** for each menu item:

| Permission | Icon | Description |
|------------|------|-------------|
| **View** 👁️ | Blue | Can see and access the menu item |
| **Add** ➕ | Green | Can create new items in this section |
| **Edit** ✏️ | Orange | Can modify existing items |
| **Delete** 🗑️ | Red | Can remove items |

### 4. Smart Permission Logic
- **Turning OFF View** → Automatically disables Add, Edit, Delete
- **Turning ON Add/Edit/Delete** → Automatically enables View
- Changes save instantly (no "Save" button needed)

## ⚡ Quick Setup Templates

### Available Templates:
1. **Administrator (Full Access)** 👑
   - Complete access to all features
   - Perfect for system admins

2. **Sales Executive** 👤
   - Lead management focused
   - Limited admin access

3. **Sales Manager** 📊
   - Team management + reporting
   - Enhanced lead permissions

4. **HR Manager** 👥
   - People & organization management
   - Employee administration

5. **Read Only Access** 👁️
   - View-only across most areas
   - Perfect for observers

### To Apply a Template:
1. Select a role
2. Go to "Quick Templates" tab
3. Click "Apply Template" on desired template
4. Confirm the bulk update

## 🔧 Advanced Features

### Bulk Operations
- **Replace Mode**: Clears existing permissions and applies template
- **Merge Mode**: Adds template permissions to existing ones
- **Clear All**: Remove all permissions for a role

### API Endpoints

#### Get All Permissions
```bash
GET /api/admin/menu-permissions
```

#### Update Single Permission
```bash
POST /api/admin/menu-permissions
{
  "roleId": 2,
  "menuStringId": "dashboard",
  "permissions": {
    "can_view": true,
    "can_add": false,
    "can_edit": false,
    "can_delete": false
  }
}
```

#### Bulk Update Permissions
```bash
POST /api/admin/menu-permissions/bulk
{
  "roleId": 2,
  "action": "replace",
  "permissions": {
    "dashboard": { "can_view": true, ... },
    "leads_create": { "can_view": true, ... }
  }
}
```

## 📊 Current Role Structure

| Role ID | Title | Description |
|---------|-------|-------------|
| 1 | Administrator | Full system access |
| 2 | Sales Executive | Limited lead management |
| 3 | Manager | General management role |
| 4 | Sales Head | Senior sales management |
| 5 | Employee | Basic employee access |
| 7 | Sales Manager | Sales team management |
| 8 | Admin Head | Administrative head role |

## 🎯 Common Use Cases

### Setting Up a New Sales Executive
1. Select "Sales Executive" role
2. Go to "Quick Templates" tab
3. Apply "Sales Executive" template
4. Customize if needed (e.g., remove quotation deletion rights)

### Creating a Custom Role
1. Select the role
2. Start with "Read Only Access" template
3. Add specific permissions manually
4. Test with a user account

### Restricting Administrator Access
1. Select "Administrator" role
2. Manually toggle OFF sensitive permissions
3. Keep essential admin functions enabled

## 🔒 Security Best Practices

### 1. Principle of Least Privilege
- Start with minimal permissions
- Add permissions as needed
- Regularly review role permissions

### 2. Permission Hierarchy
- View permission is required for all others
- Delete permission should be most restricted
- Test permissions with actual user accounts

### 3. Role Separation
- Don't give sales roles admin permissions
- Keep HR and Finance permissions separate
- Create specific roles for specific functions

## 📈 Monitoring & Maintenance

### Weekly Tasks
- [ ] Review new user role assignments
- [ ] Check for permission changes requests
- [ ] Verify template applications worked correctly

### Monthly Tasks  
- [ ] Audit all role permissions
- [ ] Update templates based on business needs
- [ ] Clean up unused permissions

### Permission Statistics
The system tracks:
- Total permissions per role
- Most/least restrictive roles
- Recent permission changes
- Template usage frequency

## 🛠️ Troubleshooting

### Common Issues

**Issue**: User can't see a menu item
- **Check**: View permission is enabled
- **Fix**: Toggle View permission ON

**Issue**: User can see but can't create items
- **Check**: Add permission is enabled
- **Fix**: Toggle Add permission ON

**Issue**: Template application failed
- **Check**: Database connection
- **Fix**: Refresh page and try again

**Issue**: Permission changes not reflecting
- **Check**: User needs to logout/login
- **Fix**: Ask user to refresh or re-login

### Database Integration
The system connects directly to PostgreSQL:
- Host: localhost:54322
- Database: postgres
- Tables: `roles`, `menu_items`, `role_menu_permissions`

## 🎉 Success! You're Ready!

You now have a powerful, user-friendly menu permissions system that:
- ✅ Eliminates manual SQL scripting
- ✅ Provides instant permission updates
- ✅ Offers quick setup templates
- ✅ Includes safety features and validation
- ✅ Scales with your business needs

**Next Steps:**
1. Set up permissions for your current roles
2. Test with actual user accounts
3. Train your team on the new system
4. Customize templates for your specific needs

---

*For technical support or feature requests, contact your development team.* 