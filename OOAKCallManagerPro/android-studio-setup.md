# 📱 **Android Studio Setup Guide - OOAK Call Manager Pro**

## 🎯 **Build APK for Company Phones**

Complete guide to set up Android Studio and build the production APK.

## 📋 **Prerequisites**

### **System Requirements**
- **Android Studio**: Latest version (Hedgehog 2023.1.1 or newer)
- **Java JDK**: 11 or higher
- **Android SDK**: API 23+ (Android 6.0+)
- **Build Tools**: 34.0.0 or newer

### **Download Android Studio**
```bash
# Download from: https://developer.android.com/studio
# Install with default settings
# Accept all SDK licenses
```

## 🏗️ **Project Setup**

### **Step 1: Create New Android Project**

```bash
1. Open Android Studio
2. Create New Project
3. Choose "Empty Activity"
4. Configure project:
   - Name: "OOAK Call Manager Pro"
   - Package: com.ooak.callmanager
   - Language: Java
   - Minimum SDK: API 23 (Android 6.0)
   - Use legacy android.support libraries: No
```

### **Step 2: Project Structure**

```
app/
├── src/main/
│   ├── java/com/ooak/callmanager/
│   │   ├── MainActivity.java
│   │   ├── api/
│   │   │   └── OOAKCRMApiClient.java
│   │   ├── services/
│   │   │   ├── CallMonitoringService.java
│   │   │   └── RecordingMonitorService.java
│   │   ├── models/
│   │   │   ├── CallRecord.java
│   │   │   └── RecordingFile.java
│   │   ├── utils/
│   │   │   ├── EmployeeAuthManager.java
│   │   │   └── PermissionManager.java
│   │   └── receivers/
│   │       ├── BootReceiver.java
│   │       └── PhoneStateReceiver.java
│   ├── res/
│   │   ├── layout/
│   │   │   └── activity_main.xml
│   │   ├── values/
│   │   │   ├── strings.xml
│   │   │   └── colors.xml
│   │   └── drawable/
│   │       ├── ic_phone.xml
│   │       └── ic_mic.xml
│   └── AndroidManifest.xml
└── build.gradle (Module: app)
```

## 📝 **Configuration Files**

### **build.gradle (Module: app)**

```gradle
plugins {
    id 'com.android.application'
}

android {
    namespace 'com.ooak.callmanager'
    compileSdk 34

    defaultConfig {
        applicationId "com.ooak.callmanager"
        minSdk 23
        targetSdk 34
        versionCode 1
        versionName "1.0"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            signingConfig signingConfigs.debug
        }
    }
    
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.10.0'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
    implementation 'androidx.core:core:1.12.0'
    
    // HTTP client for API calls
    implementation 'com.squareup.okhttp3:okhttp:4.11.0'
    
    // JSON processing
    implementation 'org.json:json:20230618'
    
    // Testing
    testImplementation 'junit:junit:4.13.2'
    androidTestImplementation 'androidx.test.ext:junit:1.1.5'
    androidTestImplementation 'androidx.test.espresso:espresso-core:3.5.1'
}
```

### **strings.xml**

```xml
<resources>
    <string name="app_name">OOAK Call Manager Pro</string>
    <string name="employee_id_hint">Enter Employee ID</string>
    <string name="employee_name_hint">Enter Employee Name</string>
    <string name="authenticate_button">Authenticate</string>
    <string name="start_services_button">Start Background Services</string>
    <string name="status_text">Status will appear here</string>
    <string name="call_monitoring_channel">Call Monitoring</string>
    <string name="recording_monitor_channel">Recording Monitor</string>
</resources>
```

### **activity_main.xml**

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="16dp">

    <TextView
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="OOAK Call Manager Pro"
        android:textSize="24sp"
        android:textStyle="bold"
        android:gravity="center"
        android:layout_marginBottom="32dp" />

    <EditText
        android:id="@+id/employee_id_input"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:hint="@string/employee_id_hint"
        android:inputType="text"
        android:layout_marginBottom="16dp" />

    <EditText
        android:id="@+id/employee_name_input"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:hint="@string/employee_name_hint"
        android:inputType="textPersonName"
        android:layout_marginBottom="16dp" />

    <Button
        android:id="@+id/authenticate_button"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="@string/authenticate_button"
        android:layout_marginBottom="16dp" />

    <Button
        android:id="@+id/start_services_button"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="@string/start_services_button"
        android:enabled="false"
        android:layout_marginBottom="32dp" />

    <ScrollView
        android:layout_width="match_parent"
        android:layout_height="0dp"
        android:layout_weight="1">

        <TextView
            android:id="@+id/status_text"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:text="@string/status_text"
            android:textSize="14sp"
            android:fontFamily="monospace"
            android:background="#f5f5f5"
            android:padding="16dp" />

    </ScrollView>

</LinearLayout>
```

## 🔧 **Building the APK**

### **Step 1: Copy Source Files**

```bash
1. Copy all Java files from OOAKCallManagerPro/android-app/ to your project
2. Update package declarations to match: com.ooak.callmanager
3. Copy AndroidManifest.xml content
4. Add resource files (strings.xml, activity_main.xml)
```

### **Step 2: Sync Project**

```bash
1. In Android Studio: File → Sync Project with Gradle Files
2. Wait for sync to complete
3. Resolve any import errors
4. Build → Clean Project
5. Build → Rebuild Project
```

### **Step 3: Generate Signed APK**

```bash
1. Build → Generate Signed Bundle / APK
2. Choose "APK"
3. Create new keystore:
   - Keystore path: Choose location
   - Password: Create strong password
   - Key alias: "ooak-call-manager"
   - Key password: Same as keystore
   - Validity: 25 years
   - Certificate info: Fill company details
4. Choose "release" build variant
5. Click "Create"
```

### **Step 4: Locate APK**

```bash
# APK will be generated at:
app/release/app-release.apk

# Copy this file to distribute to company phones
```

## 📱 **Installation on Company Phones**

### **Enable Unknown Sources**

```bash
# Android 8.0+:
1. Settings → Apps & notifications → Special app access
2. Install unknown apps → Chrome (or file manager)
3. Allow from this source

# Android 7.0 and below:
1. Settings → Security
2. Enable "Unknown sources"
```

### **Install APK**

```bash
1. Transfer app-release.apk to phone
2. Open file manager
3. Navigate to APK file
4. Tap to install
5. Grant installation permission
6. Tap "Install"
7. Open app when installation completes
```

## 🔐 **Permissions Setup**

### **Required Permissions**

```bash
When app first opens, grant these permissions:
✅ Phone calls - Allow
✅ Microphone - Allow  
✅ Storage - Allow
✅ Contacts - Allow (optional)
✅ Location - Deny (not needed)
```

### **Battery Optimization**

```bash
1. Settings → Battery → Battery Optimization
2. Find "OOAK Call Manager Pro"
3. Select "Don't optimize"
4. Confirm selection
```

### **Auto-start Permission**

```bash
# On MIUI/ColorOS/EMUI:
1. Settings → Apps → OOAK Call Manager Pro
2. Permissions → Auto-start → Enable
3. Background activity → Enable
```

## 🧪 **Testing Checklist**

### **App Installation Test**

```bash
- [ ] APK installs without errors
- [ ] App opens successfully
- [ ] All permissions granted
- [ ] Employee authentication works
- [ ] Background services start
- [ ] Status shows "services running"
```

### **Recording Detection Test**

```bash
- [ ] Make a test call
- [ ] Call recording is enabled
- [ ] End call
- [ ] Wait 30-60 seconds
- [ ] Check app status for "Processing: filename.mp3"
- [ ] Verify upload in OOAK-FUTURE dashboard
```

### **Background Operation Test**

```bash
- [ ] Close app (don't force stop)
- [ ] Make another test call
- [ ] Recording still gets uploaded
- [ ] Services survive phone sleep
- [ ] Services restart after reboot
```

## 🚀 **Production Deployment**

### **Mass Distribution**

```bash
1. Build single APK file
2. Test on 1-2 phones first
3. Create installation guide for employees
4. Distribute APK via:
   - Email attachment
   - Shared drive
   - USB transfer
   - Internal app store
```

### **Employee Onboarding**

```bash
1. Provide unique Employee ID for each person
2. Install APK on their company phone
3. Complete authentication setup
4. Test with one call
5. Verify upload appears in dashboard
6. Train on basic troubleshooting
```

### **Monitoring & Support**

```bash
1. Check dashboard regularly for uploads
2. Monitor for failed uploads
3. Provide employee support for:
   - Permission issues
   - Battery optimization
   - Recording location problems
4. Update APK as needed
```

---

## 🎯 **Ready to Build!**

Your Android Studio project is configured to build a production-ready APK that:

✅ **Integrates perfectly** → With your existing OOAK-FUTURE system  
✅ **Requires zero CRM changes** → Uses current `/api/call-upload` endpoint  
✅ **Handles all edge cases** → Comprehensive error handling  
✅ **Operates 24/7** → Background services with auto-restart  

### **Next Steps:**
1. **Set up Android Studio** → Follow this guide
2. **Build the APK** → Generate signed release
3. **Test on one phone** → Verify complete workflow
4. **Deploy to all devices** → Mass distribution

**Your call management revolution starts now!** 📱🚀 