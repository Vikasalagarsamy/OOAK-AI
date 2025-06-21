# 🚀 Quick Setup Guide - OOAK Call Manager

## Immediate Deployment (5 minutes)

### 1. Prerequisites Check ✅
```bash
# Check if you have these installed:
node --version    # Should be 16+
npm --version     # Should be 8+
adb --version     # Android Debug Bridge
```

### 2. Connect Android Device 📱
- Enable Developer Options on Android device
- Enable USB Debugging
- Connect via USB cable
- Accept debugging prompt on device

### 3. Deploy the App 🚀
```bash
# Run the automated deployment script
./deploy.sh
```

This script will:
- ✅ Check device connection
- 🧹 Clean previous builds  
- 📦 Install dependencies
- 🔨 Build the APK
- 📲 Install on device

### 4. First Launch Setup ⚙️

**On the Android device:**

1. **Open OOAK Call Manager**
2. **Grant Permissions** (tap "Allow" for all):
   - Phone access
   - Microphone
   - Storage
   - SMS (for SIM detection)

3. **Configure API** (Settings tab):
   - Tap "Configure API"
   - Enter your CRM API URL: `https://your-domain.com`
   - Enter API key from your CRM system
   - Tap "Test & Save"

4. **Verify Setup**:
   - Dashboard should show "0 Pending Calls"
   - Settings should show your SIM cards
   - History should be empty (ready for calls)

## 🔧 Integration with Your CRM

### Required API Endpoints
Your existing CRM needs these endpoints:

```typescript
// 1. Get pending calls for this device
GET /api/call-requests/pending/{employeeId}
Response: [{ taskId, clientPhone, clientName, priority, notes }]

// 2. Update call status  
PUT /api/call-requests/{callId}/status
Body: { status: "ringing|connected|ended", duration?, endTime? }

// 3. Upload call recording
POST /api/call-uploads
Body: FormData with audioFile + metadata

// 4. Health check
GET /api/health
Response: { status: "ok" }
```

### Quick API Integration
Add these to your existing CRM:

```javascript
// In your existing task management system
app.get('/api/call-requests/pending/:employeeId', (req, res) => {
  // Return tasks that need calls for this employee
  const pendingTasks = tasks.filter(t => 
    t.assigned_to_employee_id === req.params.employeeId && 
    t.status === 'ASSIGNED'
  );
  
  res.json(pendingTasks.map(task => ({
    taskId: task.id,
    clientPhone: task.client_phone,
    clientName: task.client_name,
    officialNumber: '+917550040892', // Your official number
    priority: task.priority || 'medium',
    notes: task.notes
  })));
});

app.post('/api/call-uploads', upload.single('audioFile'), (req, res) => {
  // Save the uploaded call recording
  // Link it to the task ID from metadata
  const { taskId } = JSON.parse(req.body.metadata);
  
  // Your existing file upload logic
  saveCallRecording(req.file, taskId);
  
  res.json({ success: true });
});
```

## 📱 Device Recommendations

### Recommended Android Devices
- **Budget**: Redmi Note series (₹8,000-12,000)
- **Mid-range**: Samsung Galaxy A series (₹15,000-20,000)  
- **Premium**: OnePlus Nord series (₹20,000-25,000)

### Key Requirements
- ✅ Dual SIM support
- ✅ Android 8.0+ (API level 26+)
- ✅ 4GB+ RAM
- ✅ Good call quality
- ✅ Reliable microphone

## 🔄 Daily Operations

### For Employees
1. **Morning**: Open app, check pending calls
2. **Calling**: Tap "Call Now" → App handles everything
3. **Evening**: Check upload status in History tab

### For Administrators  
1. **Monitor**: Check CRM dashboard for call activity
2. **Manage**: Handle any failed uploads
3. **Scale**: Add more devices as needed

## 🚨 Troubleshooting

### Common Issues & Fixes

**"No pending calls" but tasks exist in CRM**
- Check API URL in Settings
- Verify employee ID mapping
- Test API connection

**"Recording failed"**
- Grant microphone permission
- Check device call recording support
- Try different recording quality

**"Upload failed"**
- Check internet connection
- Verify API credentials
- Use "Retry Failed Uploads"

**"SIM not detected"**
- Ensure SIM cards are inserted properly
- Restart the app
- Check dual SIM settings

## 📊 Success Metrics

After setup, you should see:
- ✅ Calls initiated from official numbers
- ✅ Automatic call recordings
- ✅ Seamless upload to CRM
- ✅ Complete call history tracking
- ✅ Zero manual intervention needed

## 🎯 Next Steps

1. **Deploy on 1 device** → Test with real calls
2. **Verify integration** → Check recordings in CRM  
3. **Scale to team** → Deploy on all employee devices
4. **Monitor & optimize** → Track success rates

---

**🎉 You're ready to revolutionize your call management!**

*Professional calling with zero hassle - exactly what OOAK needs.* 