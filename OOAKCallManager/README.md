# OOAK Call Manager 📞

Professional call management app with automatic recording and CRM integration for OOAK business operations.

## 🚀 Features

### Core Functionality
- **Automated Call Management**: Receive call requests from web dashboard
- **Dual SIM Support**: Make calls using specific official SIM cards
- **Automatic Call Recording**: Record both sides of conversations
- **Auto Upload**: Seamlessly upload recordings to CRM system
- **Task Integration**: Link calls to specific tasks and leads
- **Real-time Status Updates**: Live call status tracking

### User Interface
- **Modern Material Design**: Clean, professional interface
- **Dashboard**: View pending calls and active call status
- **Call History**: Track all calls with upload status
- **Settings**: Configure API, recording quality, and preferences
- **Progress Tracking**: Visual upload progress indicators

### Technical Features
- **Background Processing**: Continue recording even when app is minimized
- **Retry Logic**: Automatic retry for failed uploads
- **Offline Support**: Store recordings locally until upload is possible
- **Permission Management**: Comprehensive Android permission handling
- **Error Handling**: Robust error handling and user feedback

## 📱 Screenshots

*Dashboard showing pending calls and active call status*
*Call history with upload progress tracking*
*Settings screen for API configuration*

## 🛠️ Installation

### Prerequisites
- Node.js 16+ 
- React Native CLI
- Android Studio
- Android SDK (API level 21+)
- Physical Android device (for testing call functionality)

### Setup Instructions

1. **Clone and Install Dependencies**
   ```bash
   cd OOAKCallManager
   npm install
   ```

2. **Android Setup**
   ```bash
   # Install Android dependencies
   cd android
   ./gradlew clean
   cd ..
   
   # Link native dependencies
   npx react-native link
   ```

3. **Configure Permissions**
   - The app requires several sensitive permissions
   - Users must grant all permissions for full functionality
   - Permissions include: Phone, Microphone, Storage, SMS

4. **Build and Install**
   ```bash
   # Debug build
   npx react-native run-android
   
   # Release build
   npm run build:android
   npm run install:android
   ```

## ⚙️ Configuration

### API Setup
1. Open the app and go to Settings
2. Tap "Configure API"
3. Enter your CRM API base URL
4. Enter your API key
5. Test connection and save

### SIM Card Configuration
- The app automatically detects available SIM cards
- Configure which SIM to use for each employee
- Supports dual SIM devices

### Recording Settings
- **Quality**: Low (8kHz), Medium (16kHz), High (22kHz)
- **Auto Upload**: Enable/disable automatic upload
- **Max Retries**: Configure retry attempts for failed uploads

## 🔧 API Integration

### Required Endpoints

Your CRM system needs to implement these endpoints:

```typescript
// Get pending calls for employee
GET /api/call-requests/pending/{employeeId}

// Update call status
PUT /api/call-requests/{callId}/status

// Upload call recording
POST /api/call-uploads

// Get employee details
GET /api/employees/{employeeId}

// Health check
GET /api/health

// Heartbeat
POST /api/heartbeat
```

### Webhook Integration
The app can receive real-time call requests via:
- Push notifications
- Background sync
- Polling (configurable interval)

## 📋 Usage Workflow

### For Employees
1. **Setup**: Configure API credentials and permissions
2. **Receive**: Get call requests from dashboard
3. **Call**: Tap "Call Now" to initiate call with official number
4. **Record**: App automatically records conversation
5. **Upload**: Recording uploads automatically after call ends
6. **Track**: Monitor upload status in call history

### For Administrators
1. **Deploy**: Install app on dedicated Android devices
2. **Configure**: Set up API integration and SIM cards
3. **Monitor**: Track call activity through CRM dashboard
4. **Manage**: Handle failed uploads and device status

## 🔒 Security & Compliance

### Data Protection
- All recordings encrypted during storage and transmission
- Secure API authentication with bearer tokens
- Local data automatically cleared after successful upload
- No sensitive data stored permanently on device

### Privacy Compliance
- Recording consent handled by business process
- Data retention policies configurable
- GDPR/privacy law compliance features
- Audit trail for all call activities

### Access Control
- Employee-specific API keys
- Device-level authentication
- Role-based permissions
- Secure configuration management

## 🚨 Troubleshooting

### Common Issues

**Permissions Denied**
- Go to Android Settings > Apps > OOAK Call Manager > Permissions
- Enable all required permissions
- Restart the app

**Recording Not Working**
- Check microphone permission
- Ensure device supports call recording
- Try different recording quality settings

**Upload Failures**
- Check internet connection
- Verify API credentials in settings
- Use "Retry Failed Uploads" button

**SIM Card Not Detected**
- Ensure SIM cards are properly inserted
- Check if device supports dual SIM
- Restart the app

### Debug Mode
Enable debug logging in settings to troubleshoot issues:
- API request/response logging
- Call state change tracking
- Upload progress monitoring
- Error stack traces

## 📊 Performance

### Optimizations
- Efficient background processing
- Minimal battery usage during standby
- Compressed audio uploads
- Smart retry algorithms
- Local caching for offline scenarios

### Resource Usage
- **Storage**: ~50MB app + recordings (auto-cleaned)
- **RAM**: ~100MB during active use
- **Battery**: Optimized for all-day usage
- **Network**: Efficient upload with compression

## 🔄 Updates & Maintenance

### Automatic Updates
- Over-the-air configuration updates
- Background app updates via Play Store
- API compatibility checks
- Feature flag management

### Monitoring
- Real-time device status reporting
- Upload success/failure metrics
- Call quality analytics
- Performance monitoring

## 🤝 Support

### Documentation
- API integration guide
- Deployment checklist
- User training materials
- Troubleshooting guides

### Contact
- Technical Support: [Your support email]
- Integration Help: [Your integration email]
- Bug Reports: [Your bug report system]

## 📄 License

Copyright © 2024 OOAK Team. All rights reserved.

This software is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

---

**Built with ❤️ for OOAK Business Operations**

*Professional call management made simple and efficient* 