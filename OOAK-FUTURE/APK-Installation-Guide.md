# 📱 OOAK Call Manager Pro - Installation Guide

## 🎉 **APK Ready with Unified CRM Authentication!**

**APK File**: `OOAK-CallManager-Pro-CRM-Auth.apk` (6.9 MB)  
**Built**: June 16, 2025  
**Features**: Unified CRM username/password authentication

---

## 📥 **Installation Steps**

### **Method 1: Direct Install (Recommended)**

1. **📂 Transfer APK to your phone**:
   - Copy `OOAK-CallManager-Pro-CRM-Auth.apk` to your phone via:
     - USB cable
     - Email attachment
     - Cloud storage (Google Drive, Dropbox)
     - AirDrop (if available)

2. **🔓 Enable Unknown Sources**:
   - Go to **Settings** → **Security** → **Unknown Sources** → **Enable**
   - Or **Settings** → **Apps** → **Special Access** → **Install Unknown Apps** → **Enable for your file manager**

3. **📱 Install APK**:
   - Open file manager on phone
   - Navigate to APK file location
   - Tap `OOAK-CallManager-Pro-CRM-Auth.apk`
   - Tap **Install**
   - Tap **Open** when installation completes

### **Method 2: ADB Install (Developer)**

```bash
# Connect phone via USB with Developer Mode enabled
adb install OOAK-CallManager-Pro-CRM-Auth.apk
```

---

## 🔐 **Using Unified CRM Authentication**

### **Login Credentials**
Use the **EXACT SAME** username and password as your OOAK CRM login:

```
📱 OOAK Call Manager Pro Login
┌─────────────────────────────────┐
│ Username: [your_crm_username]   │
│ Password: [your_crm_password]   │
│                                 │
│     🔐 Login with CRM           │
│        Credentials              │
└─────────────────────────────────┘
```

### **Available Test Accounts**
Based on your `user_accounts` table:
- **Username**: `admin` → Employee: Admin User (EMP001)
- **Username**: `pradeep` → Employee: Pradeep Sales (EMP002)
- **Username**: `manager` → Employee: Manager User (EMP003)
- **Username**: `durga.ooak` → Employee: Durga Devi (EMP007)
- **Username**: `deepikadevimurali` → Employee: DEEPIKA DEVI M (EMP022)

---

## 🚀 **First Time Setup**

1. **📱 Open OOAK Call Manager Pro**
2. **👤 Enter CRM Username & Password**
3. **🔐 Tap "Login with CRM Credentials"**
4. **✅ Grant Required Permissions**:
   - Phone access
   - Storage access
   - Microphone access
   - Internet access
5. **🚀 Tap "Start Background Services"**
6. **📊 View Dashboard**: http://192.168.0.243:3000

---

## 🎯 **Key Features**

✅ **Unified Authentication** - Same login as CRM  
✅ **Real-time Call Monitoring** - Track all calls live  
✅ **Automatic Recording Upload** - Background processing  
✅ **Dynamic Status Updates** - Ringing → Answered/Missed  
✅ **Employee Dashboard** - Personalized call analytics  
✅ **Multi-user Support** - Team can share devices  
✅ **30-day Authentication** - Stay logged in  

---

## 🔧 **Troubleshooting**

### **Authentication Issues**
- ✅ Use exact CRM username (case-sensitive)
- ✅ Use exact CRM password 
- ✅ Check internet connection
- ✅ Verify CRM server is running (192.168.0.243:3000)

### **Permission Issues**
- ✅ Grant all requested permissions
- ✅ Check phone security settings
- ✅ Restart app after granting permissions

### **Call Monitoring Issues**
- ✅ Start background services
- ✅ Keep app running in background
- ✅ Check notification panel for service status

---

## 📊 **Dashboard Access**

Once authenticated, view your real-time call data at:
**http://192.168.0.243:3000**

Each employee sees their personalized dashboard with:
- 📞 Live call monitoring
- 📈 Call statistics
- 🎙️ Recording transcriptions
- ⏱️ Call duration analytics

---

## 🆔 **Technical Details**

- **Package**: `com.ooak.callmanager`
- **Version**: Debug Build
- **Min SDK**: Android 7.0+
- **Target SDK**: Android 14
- **Size**: 6.9 MB
- **Permissions**: Phone, Storage, Microphone, Internet, Background Services

---

## 💡 **Support**

**Authentication API**: `/api/mobile-auth`  
**CRM Integration**: Uses `user_accounts` table  
**Password Verification**: bcrypt compatibility  
**Session Management**: 30-day validity  

**🎉 Enjoy unified authentication across OOAK CRM and Mobile App!** 