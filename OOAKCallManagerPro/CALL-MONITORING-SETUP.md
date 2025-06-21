# OOAK Call Manager Pro - Call Monitoring Setup & Testing Guide

## 🔧 **FIXES APPLIED**

### 1. **Network Connectivity Fixed**
- ✅ Updated API endpoint from `localhost:3000` to `192.168.29.161:3000`
- ✅ Android app can now reach your CRM server

### 2. **API Integration Enhanced**
- ✅ Created `/api/call-status` endpoint for real-time call updates
- ✅ Enhanced `updateCallStatus()` method to send actual data to CRM
- ✅ Existing `/api/call-upload` endpoint ready for audio files

### 3. **Call Detection System**
- ✅ Android app has all required permissions (verified)
- ✅ Background services are running
- ✅ Phone state listener is active

## 📞 **HOW TO TEST CALL MONITORING**

### **Step 1: Verify Setup**
```bash
# Run diagnostic script
cd OOAKCallManagerPro
node debug-call-monitoring.js
```

### **Step 2: Monitor Android Logs**
```bash
# In terminal 1 - Monitor call detection
adb logcat | grep -E "(CallMonitoring|Call state changed)"

# In terminal 2 - Monitor API requests
adb logcat | grep "OOAKCRMApiClient"
```

### **Step 3: Test Call Detection**
1. **Make an outgoing call** from your phone
2. **Watch the logs** - you should see:
   ```
   Call state changed: 1 for +91XXXXXXXXXX  (RINGING)
   Call state changed: 2 for +91XXXXXXXXXX  (OFFHOOK/CONNECTED)
   Call state changed: 0 for +91XXXXXXXXXX  (IDLE/ENDED)
   ```

3. **Check CRM Dashboard** - call should appear in call transcriptions

### **Step 4: Test Incoming Calls**
1. **Receive a call** on your phone
2. **Answer or decline** the call
3. **Check logs and dashboard** for call records

## 🔍 **TROUBLESHOOTING**

### **Issue: No Call Detection**
```bash
# Check if service is running
adb shell dumpsys activity services | grep CallMonitoring

# Check permissions
adb shell dumpsys package com.ooak.callmanager | grep "READ_PHONE_STATE"
```

### **Issue: API Connection Failed**
```bash
# Test API connectivity
curl -X POST http://192.168.29.161:3000/api/call-status \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+919876543210","status":"test","direction":"outgoing"}'
```

### **Issue: App Not Responding**
```bash
# Restart the app service
adb shell am force-stop com.ooak.callmanager
adb shell am start -n com.ooak.callmanager/.MainActivity
```

## 📊 **EXPECTED BEHAVIOR**

### **When You Make a Call:**
1. 📱 Android detects phone state change
2. 📤 Sends call status to CRM: `{"status": "ringing", "direction": "outgoing"}`
3. 📤 Updates when connected: `{"status": "connected"}`
4. 📤 Updates when ended: `{"status": "ended", "duration": 120}`
5. 💾 Call appears in your CRM dashboard

### **When You Receive a Call:**
1. 📱 Android detects incoming call
2. 📤 Sends status: `{"status": "ringing", "direction": "incoming"}`
3. 📤 Updates based on answer/decline
4. 💾 Call logged in CRM

## 🎯 **VERIFICATION CHECKLIST**

- [ ] Android app shows "Services Running" ✅
- [ ] Employee authenticated as EMP001 ✅
- [ ] CRM server running on port 3000 ✅
- [ ] Network connectivity working ✅
- [ ] All permissions granted ✅

## 🚀 **NEXT STEPS**

### **Real-Time Testing:**
1. Make a test call right now
2. Check Android logs immediately
3. Verify call appears in CRM dashboard
4. Test both incoming and outgoing calls

### **Advanced Features:**
- Call recording upload (if recordings exist)
- Contact lookup integration
- Task/Lead association
- AI transcription processing

## 📱 **LIVE MONITORING COMMANDS**

```bash
# Terminal 1: Call state monitoring
adb logcat -s CallMonitoringService:D PhoneStateReceiver:D

# Terminal 2: API communication
adb logcat -s OOAKCRMApiClient:D

# Terminal 3: CRM server logs
npm run dev  # Your CRM server with logs
```

## 🔧 **MANUAL TEST CALL**

To test right now:
1. Open your phone dialer
2. Call any number (even if it doesn't connect)
3. Watch the terminal logs
4. Check your CRM dashboard at `http://localhost:3000`
5. Look for new entries in call transcriptions

---

**Status**: ✅ **READY FOR TESTING**
**Last Updated**: June 16, 2025
**Network**: 192.168.29.161:3000 