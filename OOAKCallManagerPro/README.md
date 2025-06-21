# OOAK Call Manager Pro - Local Setup

A professional mobile-first call management system with local Supabase integration and automatic transcription processing.

## 🚀 Quick Start

### 1. Start the Mobile App
```bash
cd OOAKCallManagerPro
python3 -m http.server 8081
```
Access at: **http://localhost:8081/app-full.html**

### 2. Start the Audio Upload Server (Optional)
```bash
python3 simple-upload-server.py
```
This runs on port 8083 and handles audio file uploads for transcription.

### 3. Login
- **Demo Login**: Use the "Demo Login" button
- **Custom Login**: Use any `@ooak.com` email address

## 📱 Features

### ✅ Completed Features
- **Professional UI**: Modern, mobile-first design with OOAK branding
- **Authentication**: Local demo authentication system
- **Call Recording**: Browser-based audio recording with microphone access
- **Call Management**: Create, save, and track calls with metadata
- **Real-time Stats**: Today's calls, completion rates, success metrics
- **Call History**: Searchable call history with detailed information
- **Offline Support**: Local storage with sync capabilities
- **Audio Upload**: Automatic upload to transcription service
- **Transcription Status**: Track transcription progress with visual indicators

### 🎯 Call Recording Workflow
1. **New Call** → Enter contact details
2. **Record** → Tap microphone to start/stop recording
3. **Save** → Audio automatically uploads to transcription service
4. **Track** → Monitor transcription status in call history

### 📊 Dashboard Stats
- **Today's Calls**: Total calls made today
- **Completed**: Successfully completed calls
- **Pending Upload**: Calls waiting to sync
- **Success Rate**: Completion percentage

## 🎤 Audio Processing Workflow

### 1. Recording
- Browser captures audio using MediaRecorder API
- Audio stored as WAV format in memory
- Real-time timer shows recording duration

### 2. Upload
- Audio automatically uploads to transcription service
- Metadata includes call details (contact, duration, etc.)
- Fallback to manual download if upload fails

### 3. Transcription Status
- **⏳ Pending**: Waiting to upload
- **📤 Uploaded**: Successfully uploaded
- **⚙️ Processing**: Being transcribed
- **📝 Completed**: Transcription ready
- **❌ Failed**: Upload/processing failed

### 4. Integration with Your Transcription Service
The app uploads audio files to your existing transcription service. Simply:
1. Update `TRANSCRIPTION_CONFIG.uploadUrl` to your service endpoint
2. Or set `saveToFolder: true` and specify the folder your service monitors
3. Your transcription service processes files automatically

## 🔧 Configuration

### Supabase Setup
Update in `app-full.html`:
```javascript
const SUPABASE_URL = 'http://localhost:54321';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

### Transcription Service
Update in `app-full.html`:
```javascript
const TRANSCRIPTION_CONFIG = {
    uploadUrl: 'http://localhost:8083/upload-audio',
    saveToFolder: true,
    folderPath: './uploads/audio/',
    filePrefix: 'call_',
    fileExtension: '.wav'
};
```

## 📁 File Structure
```
OOAKCallManagerPro/
├── app-full.html              # Main mobile app
├── simple-upload-server.py    # Audio upload server
├── manifest.json              # PWA manifest
├── sw.js                      # Service worker
├── uploads/audio/             # Audio files directory
└── README.md                  # This file
```

## 🌐 Mobile Access

### Option 1: Local Network
- Connect phone to same WiFi
- Access: `http://[your-computer-ip]:8081/app-full.html`

### Option 2: PWA Installation
- Open in mobile browser
- Tap "Add to Home Screen"
- Use like a native app

## 🔄 Data Sync

### Local Storage
- All calls saved locally first
- Works offline
- Automatic sync when online

### Supabase Integration
- Calls sync to your local Supabase instance
- Real-time status updates
- Backup and restore capabilities

## 🛠️ Development

### Adding New Features
1. Update `app-full.html` for UI changes
2. Modify JavaScript functions for functionality
3. Update `simple-upload-server.py` for backend changes

### Customization
- **Branding**: Update colors, logo, and text in CSS
- **Fields**: Add custom call fields in the form
- **Workflow**: Modify call status and processing logic

## 📋 Next Steps

### Connect to Your Transcription Service
1. Update the `uploadUrl` in the configuration
2. Your transcription service will receive audio files automatically
3. The mobile app will track transcription status

### Phase 1: Core Functionality ✅
- [x] Mobile app interface
- [x] Call recording
- [x] Audio upload
- [x] Local storage
- [x] Basic sync

### Phase 2: Transcription Integration
- [ ] Connect to your existing transcription service
- [ ] Real-time transcription status updates
- [ ] Transcript display in call history
- [ ] Search transcripts

### Phase 3: Advanced Features
- [ ] Call analytics and reporting
- [ ] Team management
- [ ] Advanced search and filtering
- [ ] Export capabilities

## 🚨 Troubleshooting

### Common Issues

**Microphone not working:**
- Check browser permissions
- Use HTTPS or localhost only
- Ensure microphone is not used by other apps

**Upload failing:**
- Check if upload server is running on port 8083
- Verify CORS settings
- Check network connectivity

**App not loading:**
- Ensure web server is running on port 8081
- Check browser console for errors
- Try clearing browser cache

### Browser Compatibility
- **Chrome/Edge**: Full support
- **Safari**: Full support (iOS 14.3+)
- **Firefox**: Full support
- **Mobile browsers**: Optimized for mobile use

## 📞 Support

For technical support or customization requests, contact the OOAK development team.

---

**OOAK Call Manager Pro** - Professional call management made simple. 