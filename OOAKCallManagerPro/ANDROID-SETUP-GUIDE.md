# 📱 OOAK Call Manager Pro - Android Setup Guide

## 🎯 **Overview**
Complete Android app integration with your OOAK-FUTURE CRM system for seamless call management, recording, and transcription.

## 📋 **Prerequisites**
- Android Studio installed
- Android device with API level 23+ (Android 6.0+)
- Company phones with call recording capability
- OOAK-FUTURE CRM running on localhost:3000
- Employee authentication system

## 🏗️ **Architecture**

```
OOAK-FUTURE CRM Dashboard → API Call → Android Background Service → Phone Dialer
                                                    ↓
Recording Files → File Monitor → Upload Service → Transcription → CRM Update
```

## 📱 **Android App Components**

### 1. **Main Activity** (`MainActivity.java`)
- Employee authentication
- Permission management
- Service initialization
- Status monitoring

### 2. **Call Monitoring Service** (`CallMonitoringService.java`)
- Listens for phone state changes
- Handles CRM-triggered calls
- Real-time call status updates
- Background operation (24/7)

### 3. **Recording Monitor Service** (`RecordingMonitorService.java`)
- Monitors recording directories
- Automatic file detection
- Upload to transcription service
- File processing management

### 4. **CRM API Client** (`OOAKCRMApiClient.java`)
- Communication with OOAK-FUTURE
- Call status synchronization
- Contact lookup
- Command polling

## 🔧 **Installation Steps**

### Step 1: **Database Setup**
Add these tables to your OOAK-FUTURE Supabase database:

```sql
-- Call Records Table
CREATE TABLE call_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id VARCHAR UNIQUE NOT NULL,
  phone_number VARCHAR NOT NULL,
  employee_id VARCHAR NOT NULL,
  task_id UUID REFERENCES tasks(id),
  lead_id UUID REFERENCES leads(id),
  direction VARCHAR CHECK (direction IN ('incoming', 'outgoing')),
  status VARCHAR NOT NULL,
  start_time TIMESTAMPTZ,
  connected_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  duration_seconds INTEGER,
  contact_name VARCHAR,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Call Commands Table
CREATE TABLE call_commands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action VARCHAR NOT NULL,
  phone_number VARCHAR NOT NULL,
  task_id UUID REFERENCES tasks(id),
  lead_id UUID REFERENCES leads(id),
  employee_id VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Call Recordings Table
CREATE TABLE call_recordings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recording_id VARCHAR UNIQUE NOT NULL,
  file_name VARCHAR NOT NULL,
  file_path VARCHAR NOT NULL,
  file_size BIGINT,
  phone_number VARCHAR,
  employee_id VARCHAR NOT NULL,
  transcription_id VARCHAR,
  status VARCHAR NOT NULL,
  created_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Step 2: **CRM API Integration**
Add these API endpoints to your OOAK-FUTURE project:

```javascript
// app/api/calls/trigger/route.js
export async function POST(request) {
  const { phone_number, task_id, employee_id } = await request.json();
  
  // Insert call command for mobile app
  const { data, error } = await supabase
    .from('call_commands')
    .insert({
      action: 'make_call',
      phone_number,
      task_id,
      employee_id,
      status: 'pending'
    });
  
  return NextResponse.json({ success: true });
}
```

### Step 3: **Android Project Setup**

1. **Create new Android project** in Android Studio
2. **Copy all Java files** to appropriate directories
3. **Update `AndroidManifest.xml`** with permissions and services
4. **Add dependencies** to `build.gradle`:

```gradle
dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.squareup.okhttp3:okhttp:4.11.0'
    implementation 'androidx.core:core:1.10.1'
}
```

### Step 4: **App Configuration**

1. **Update API endpoints** in `OOAKCRMApiClient.java`:
```java
private static final String BASE_URL = "http://YOUR_CRM_SERVER:3000";
```

2. **Configure recording paths** in `RecordingMonitorService.java` based on your phone model

3. **Set up employee authentication** system

### Step 5: **CRM Dashboard Integration**

Add "Call" button to your task dashboard:

```javascript
// In your task component
const handleCallClick = async (phoneNumber, taskId, employeeId) => {
  try {
    const response = await fetch('/api/calls/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone_number: phoneNumber,
        task_id: taskId,
        employee_id: employeeId
      })
    });
    
    if (response.ok) {
      toast.success('Call initiated on employee device');
    }
  } catch (error) {
    toast.error('Failed to initiate call');
  }
};
```

## 🔐 **Permissions Required**

The app requires these Android permissions:
- `CALL_PHONE` - Make phone calls
- `READ_PHONE_STATE` - Monitor call states
- `RECORD_AUDIO` - Access call recordings
- `READ_EXTERNAL_STORAGE` - Access recording files
- `FOREGROUND_SERVICE` - Background operation
- `RECEIVE_BOOT_COMPLETED` - Auto-start after reboot

## 📂 **Recording File Locations**

The app monitors these common recording directories:
- `/storage/emulated/0/Call recordings/`
- `/storage/emulated/0/Recordings/Call/`
- `/storage/emulated/0/MIUI/sound_recorder/call_rec/`
- `/storage/emulated/0/PhoneRecord/`
- `/storage/emulated/0/CallRecordings/`

## 🔄 **Workflow**

### **Outgoing Call Flow:**
1. Employee clicks "Call" in CRM dashboard
2. API creates call command in database
3. Android app polls for commands
4. App initiates phone call using `tel:` protocol
5. Call state changes are monitored
6. Status updates sent to CRM in real-time

### **Recording Processing Flow:**
1. Phone system saves call recording
2. File monitor detects new recording
3. Phone number extracted from filename
4. File uploaded to transcription service
5. Recording status updated in CRM
6. Transcription results linked to call record

## 🚀 **Deployment**

### **For Each Employee Device:**

1. **Install APK** on company phone
2. **Grant all permissions** when prompted
3. **Authenticate employee** with ID and name
4. **Start background services**
5. **Disable battery optimization** for the app
6. **Test call functionality**

### **Battery Optimization Settings:**
- Go to Settings → Battery → Battery Optimization
- Find "OOAK Call Manager"
- Select "Don't optimize"

## 🔧 **Troubleshooting**

### **Common Issues:**

**App not detecting recordings:**
- Check recording file locations
- Verify file permissions
- Ensure recording is enabled in phone settings

**Calls not triggering:**
- Check internet connection
- Verify CRM API endpoints
- Check employee authentication

**Background services stopping:**
- Disable battery optimization
- Check auto-start permissions
- Verify foreground service notifications

**Permission denied errors:**
- Re-grant all permissions in app settings
- Check Android version compatibility

## 📊 **Monitoring & Analytics**

### **CRM Dashboard Features:**
- Real-time call status
- Call duration tracking
- Recording availability
- Employee call statistics
- Failed call notifications

### **Mobile App Status:**
- Service running indicators
- Last sync timestamp
- Recording upload queue
- Error notifications

## 🔒 **Security Considerations**

- All API calls use authentication tokens
- Employee identification via device ID
- Encrypted file transfers
- Secure recording storage
- Privacy compliance for call recordings

## 📞 **Support**

For technical support:
1. Check Android Studio logs
2. Review CRM API logs
3. Verify database connections
4. Test with sample calls

## 🎯 **Next Steps**

1. **Deploy to test devices**
2. **Train employees on usage**
3. **Monitor call quality**
4. **Optimize recording detection**
5. **Scale to all company phones**

---

**🚀 Ready to revolutionize your call management system!** 