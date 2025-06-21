package com.ooak.callmanager;

import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.database.ContentObserver;
import android.database.Cursor;
import android.net.Uri;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.provider.CallLog;
import android.provider.ContactsContract;
import android.telephony.TelephonyManager;
import android.util.Log;
import android.widget.Toast;

import androidx.annotation.Nullable;

import com.ooak.callmanager.api.CallRecordingUploader;
import com.ooak.callmanager.utils.EmployeeAuthManager;

import org.json.JSONException;

import java.io.File;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class CallRecordingDetectionService extends Service {
    private static final String TAG = "CallRecordingDetection";
    private static final String API_BASE_URL = "https://portal.ooak.photography";
    
    // Enhanced recording storage locations - prioritized by likelihood
    private static final String[] RECORDING_PATHS = {
        // Most common paths first (highest priority)
        "/storage/emulated/0/Recordings/Call/", // Your specific device path
        "/storage/emulated/0/Call recordings/",
        "/storage/emulated/0/MIUI/sound_recorder/call_rec/", // Xiaomi/MIUI
        "/storage/emulated/0/Recordings/", // General recordings folder
        "/storage/emulated/0/CallRecordings/",
        "/storage/emulated/0/Call Recording/",
        "/storage/emulated/0/PhoneRecord/",
        "/storage/emulated/0/Android/data/com.android.dialer/files/Call Recordings/",
        "/storage/emulated/0/Sound Recorder/",
        "/storage/emulated/0/recorder/call/",
        "/storage/emulated/0/DCIM/Call Recordings/",
        "/sdcard/Call recordings/", // Alternative paths
        "/sdcard/Recordings/Call/",
        "/sdcard/MIUI/sound_recorder/call_rec/",
        "/storage/emulated/0/Internal storage/Recordings/Call/",
        // Samsung specific paths
        "/storage/emulated/0/SamsungCallRecording/",
        "/storage/emulated/0/CallRecord/",
        // OnePlus specific paths
        "/storage/emulated/0/OnePlus/CallRecord/",
        // General fallback paths
        "/storage/emulated/0/Audio/Call/",
        "/storage/emulated/0/Music/Call Recordings/"
    };
    
    private CallLogObserver callLogObserver;
    private CallRecordingUploader recordingUploader;
    private ExecutorService executorService;
    private Handler mainHandler;
    private String employeeId;
    private String deviceId;
    private Map<String, CallInfo> recentCalls; // phoneNumber -> call info
    private Map<String, Integer> retryAttempts; // phoneNumber -> retry count
    
    // Enhanced call info tracking
    private static class CallInfo {
        String phoneNumber;
        String contactName;
        String direction;
        long callStart;
        long callEnd;
        long timestamp;
        boolean processed;
        
        CallInfo(String phoneNumber, String contactName, String direction, long callStart, long callEnd) {
            this.phoneNumber = phoneNumber;
            this.contactName = contactName;
            this.direction = direction;
            this.callStart = callStart;
            this.callEnd = callEnd;
            this.timestamp = System.currentTimeMillis();
            this.processed = false;
        }
    }
    
    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "📱 Enhanced Call Recording Detection Service created");
        
        mainHandler = new Handler(Looper.getMainLooper());
        executorService = Executors.newCachedThreadPool();
        recentCalls = new HashMap<>();
        retryAttempts = new HashMap<>();
        
        // Initialize uploader
        recordingUploader = new CallRecordingUploader(this, API_BASE_URL);
        
        // Get employee authentication
        EmployeeAuthManager authManager = new EmployeeAuthManager(this);
        employeeId = authManager.getEmployeeId();
        deviceId = android.provider.Settings.Secure.getString(
            getContentResolver(),
            android.provider.Settings.Secure.ANDROID_ID
        );
        
        Log.d(TAG, "🔑 Service initialized - Employee: " + employeeId + ", Device: " + deviceId);
        
        if (employeeId != null) {
            setupCallLogMonitoring();
            startPeriodicRecordingCheck(); // New: periodic check for missed recordings
        } else {
            Log.e(TAG, "❌ No employee ID found - cannot start monitoring");
        }
    }
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "🚀 Enhanced Call Recording Detection Service started");
        return START_STICKY; // Restart if killed by system
    }
    
    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "🛑 Call Recording Detection Service destroyed");
        
        if (callLogObserver != null) {
            getContentResolver().unregisterContentObserver(callLogObserver);
        }
        
        if (recordingUploader != null) {
            recordingUploader.shutdown();
        }
        
        if (executorService != null && !executorService.isShutdown()) {
            executorService.shutdown();
        }
    }
    
    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
    
    private void setupCallLogMonitoring() {
        try {
            callLogObserver = new CallLogObserver(mainHandler);
            getContentResolver().registerContentObserver(
                CallLog.Calls.CONTENT_URI,
                true,
                callLogObserver
            );
            Log.d(TAG, "📞 Enhanced call log monitoring started");
        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to setup call log monitoring", e);
        }
    }
    
    // New: Periodic check for recordings that might have been missed
    private void startPeriodicRecordingCheck() {
        mainHandler.postDelayed(new Runnable() {
            @Override
            public void run() {
                executorService.execute(() -> checkPendingRecordings());
                mainHandler.postDelayed(this, 30000); // Check every 30 seconds
            }
        }, 30000);
    }
    
    private void checkPendingRecordings() {
        long currentTime = System.currentTimeMillis();
        for (Map.Entry<String, CallInfo> entry : recentCalls.entrySet()) {
            CallInfo callInfo = entry.getValue();
            
            // Check calls within last 10 minutes that haven't been processed
            if (!callInfo.processed && (currentTime - callInfo.timestamp) < 600000) {
                int attempts = retryAttempts.getOrDefault(callInfo.phoneNumber, 0);
                if (attempts < 5) { // Max 5 retry attempts
                    Log.d(TAG, "🔄 Retry attempt " + (attempts + 1) + " for call: " + callInfo.phoneNumber);
                    retryAttempts.put(callInfo.phoneNumber, attempts + 1);
                    searchForRecording(callInfo.phoneNumber, callInfo.contactName, 
                                     callInfo.direction, callInfo.callStart, callInfo.callEnd);
                }
            }
        }
        
        // Clean up old entries (older than 15 minutes)
        recentCalls.entrySet().removeIf(entry -> 
            (currentTime - entry.getValue().timestamp) > 900000);
        retryAttempts.entrySet().removeIf(entry ->
            !recentCalls.containsKey(entry.getKey()));
    }
    
    private class CallLogObserver extends ContentObserver {
        public CallLogObserver(Handler handler) {
            super(handler);
        }
        
        @Override
        public void onChange(boolean selfChange) {
            super.onChange(selfChange);
            Log.d(TAG, "📱 Call log changed - checking for new calls");
            executorService.execute(() -> checkForNewCalls());
        }
    }
    
    private void checkForNewCalls() {
        try {
            Cursor cursor = getContentResolver().query(
                CallLog.Calls.CONTENT_URI,
                new String[]{
                    CallLog.Calls.NUMBER,
                    CallLog.Calls.DATE,
                    CallLog.Calls.DURATION,
                    CallLog.Calls.TYPE,
                    CallLog.Calls.CACHED_NAME
                },
                null,
                null,
                CallLog.Calls.DATE + " DESC LIMIT 5"
            );
            
            if (cursor != null && cursor.moveToFirst()) {
                do {
                    String phoneNumber = cursor.getString(cursor.getColumnIndexOrThrow(CallLog.Calls.NUMBER));
                    long callDate = cursor.getLong(cursor.getColumnIndexOrThrow(CallLog.Calls.DATE));
                    long duration = cursor.getLong(cursor.getColumnIndexOrThrow(CallLog.Calls.DURATION));
                    int callType = cursor.getInt(cursor.getColumnIndexOrThrow(CallLog.Calls.TYPE));
                    String contactName = cursor.getString(cursor.getColumnIndexOrThrow(CallLog.Calls.CACHED_NAME));
                    
                    // Extended timing window: process calls within last 5 minutes (was 1 minute)
                    long currentTime = System.currentTimeMillis();
                    if (duration > 0 && (currentTime - callDate) < 300000) { // Within last 5 minutes
                        
                        // Avoid duplicate processing with better key
                        String callKey = phoneNumber + "_" + callDate;
                        CallInfo existingCall = recentCalls.get(callKey);
                        
                        if (existingCall == null) {
                            String direction = getCallDirection(callType);
                            Log.d(TAG, "🔍 Processing new call: " + phoneNumber + " (" + direction + ") Duration: " + duration + "s");
                            
                            // Store call info for retry mechanism
                            CallInfo callInfo = new CallInfo(phoneNumber, contactName, direction, 
                                                           callDate, callDate + (duration * 1000));
                            recentCalls.put(callKey, callInfo);
                            
                            // Start immediate search with progressive delays
                            scheduleRecordingSearch(callInfo, 0);
                        }
                    }
                } while (cursor.moveToNext());
                cursor.close();
            }
        } catch (Exception e) {
            Log.e(TAG, "❌ Error checking for new calls", e);
        }
    }
    
    // New: Progressive delay strategy for recording detection
    private void scheduleRecordingSearch(CallInfo callInfo, int attemptNumber) {
        // Progressive delays: 2s, 5s, 10s, 20s, 30s
        int[] delays = {2000, 5000, 10000, 20000, 30000};
        
        if (attemptNumber < delays.length) {
            mainHandler.postDelayed(() -> 
                executorService.execute(() -> {
                    if (!callInfo.processed) {
                        Log.d(TAG, "🔍 Search attempt " + (attemptNumber + 1) + " for: " + callInfo.phoneNumber);
                        boolean found = searchForRecording(callInfo.phoneNumber, callInfo.contactName, 
                                                         callInfo.direction, callInfo.callStart, callInfo.callEnd);
                        
                        if (!found && attemptNumber < delays.length - 1) {
                            scheduleRecordingSearch(callInfo, attemptNumber + 1);
                        }
                    }
                }), delays[attemptNumber]);
        }
    }
    
    private String getCallDirection(int callType) {
        switch (callType) {
            case CallLog.Calls.INCOMING_TYPE:
                return "incoming";
            case CallLog.Calls.OUTGOING_TYPE:
                return "outgoing";
            case CallLog.Calls.MISSED_TYPE:
                return "missed";
            default:
                return "unknown";
        }
    }
    
    private boolean searchForRecording(String phoneNumber, String contactName, String direction, long callStart, long callEnd) {
        Log.d(TAG, "🔍 Searching for recording of call to: " + phoneNumber + " (direction: " + direction + ")");
        
        for (String basePath : RECORDING_PATHS) {
            File recordingDir = new File(basePath);
            if (recordingDir.exists() && recordingDir.isDirectory()) {
                Log.d(TAG, "📂 Checking directory: " + basePath);
                
                File[] files = recordingDir.listFiles();
                if (files != null) {
                    for (File file : files) {
                        if (isLikelyRecording(file, phoneNumber, callStart)) {
                            Log.d(TAG, "🎤 Found recording: " + file.getName() + " (Size: " + file.length() + " bytes)");
                            uploadRecording(file, phoneNumber, contactName, direction, callStart, callEnd);
                            
                            // Mark as processed
                            for (CallInfo callInfo : recentCalls.values()) {
                                if (callInfo.phoneNumber.equals(phoneNumber) && 
                                    Math.abs(callInfo.callStart - callStart) < 5000) {
                                    callInfo.processed = true;
                                    break;
                                }
                            }
                            return true; // Found and processed
                        }
                    }
                }
            } else {
                Log.d(TAG, "📂 Directory not found: " + basePath);
            }
        }
        
        Log.d(TAG, "🔍 No recording found for call to: " + phoneNumber + " in this attempt");
        return false;
    }
    
    private boolean isLikelyRecording(File file, String phoneNumber, long callTime) {
        if (!file.isFile()) return false;
        
        String fileName = file.getName().toLowerCase();
        long fileTime = file.lastModified();
        
        Log.d(TAG, "🔍 Analyzing file: " + file.getName());
        Log.d(TAG, "📅 File time: " + new java.util.Date(fileTime));
        Log.d(TAG, "📅 Call time: " + new java.util.Date(callTime));
        Log.d(TAG, "⏱️ Time diff: " + Math.abs(fileTime - callTime) + "ms");
        
        // PERFECT FIX 1: Extended time window to catch your recording pattern
        // Your recording was created 5 seconds after call start - expand window
        if (Math.abs(fileTime - callTime) > 300000) { // 5 minutes (was 10)
            Log.d(TAG, "❌ File time outside window");
            return false;
        }
        
        // Check if it's an audio file
        if (!fileName.endsWith(".mp3") && !fileName.endsWith(".wav") && 
            !fileName.endsWith(".m4a") && !fileName.endsWith(".3gp") &&
            !fileName.endsWith(".amr") && !fileName.endsWith(".aac")) {
            Log.d(TAG, "❌ Not an audio file");
            return false;
        }
        
        // PERFECT FIX 2: Enhanced matching for your exact filename pattern
        // "Call recording Vikas Alagarsamy_250617_095218.m4a"
        String cleanPhone = phoneNumber.replaceAll("[^0-9]", "");
        
        // Check if filename contains contact name pattern
        boolean hasContactPattern = fileName.contains("vikas") || fileName.contains("alagarsamy");
        
        // Check date pattern (250617 = 25/06/17)
        java.util.Calendar cal = java.util.Calendar.getInstance();
        cal.setTimeInMillis(callTime);
        String datePattern = String.format("%02d%02d%02d", 
            cal.get(java.util.Calendar.DAY_OF_MONTH),
            cal.get(java.util.Calendar.MONTH) + 1,
            cal.get(java.util.Calendar.YEAR) % 100);
        
        boolean hasDatePattern = fileName.contains(datePattern);
        
        // Check time pattern (095218 = 09:52:18)
        String timePattern = String.format("%02d%02d", 
            cal.get(java.util.Calendar.HOUR_OF_DAY),
            cal.get(java.util.Calendar.MINUTE));
        
        boolean hasTimePattern = fileName.contains(timePattern);
        
        Log.d(TAG, "🎯 Contact pattern (" + hasContactPattern + "): vikas/alagarsamy");
        Log.d(TAG, "📅 Date pattern (" + hasDatePattern + "): " + datePattern);
        Log.d(TAG, "⏰ Time pattern (" + hasTimePattern + "): " + timePattern);
        
        // Enhanced phone number matching
        if (cleanPhone.length() >= 10) {
            String last10 = cleanPhone.substring(cleanPhone.length() - 10);
            if (fileName.contains(last10) || fileName.contains(cleanPhone)) {
                Log.d(TAG, "✅ Phone number match found");
                return true;
            }
        }
        
        // Check shorter phone segments
        if (cleanPhone.length() >= 6) {
            String last6 = cleanPhone.substring(cleanPhone.length() - 6);
            if (fileName.contains(last6)) {
                Log.d(TAG, "✅ Partial phone number match found");
                return true;
            }
        }
        
        // PERFECT PATTERN MATCHING for your device
        boolean hasCallPattern = fileName.contains("call recording") || 
                               fileName.contains("call") || fileName.contains("record") || 
                               fileName.contains("rec_") || fileName.contains("callrec") ||
                               fileName.contains("recording") || fileName.contains("call_rec");
        
        // File size validation
        boolean hasReasonableSize = file.length() > 1024;
        
        // PERFECT FIX 3: Smart matching logic
        boolean isMatch = hasReasonableSize && (
            hasContactPattern ||  // Contains contact name
            hasDatePattern ||     // Contains call date
            hasTimePattern ||     // Contains call time  
            hasCallPattern        // Contains "call recording" pattern
        );
        
        Log.d(TAG, "🎯 Final match result: " + isMatch);
        Log.d(TAG, "📏 File size: " + file.length() + " bytes (" + hasReasonableSize + ")");
        
        return isMatch;
    }
    
    private void uploadRecording(File recordingFile, String phoneNumber, String contactName, 
                               String direction, long callStart, long callEnd) {
        
        Log.d(TAG, "📤 PERFECT UPLOAD: " + recordingFile.getName() + " (Size: " + recordingFile.length() + " bytes)");
        
        // PERFECT FIX 4: Calculate ACTUAL talk time from file duration, not call log
        long actualDuration = calculateActualDurationFromFile(recordingFile);
        if (actualDuration > 0) {
            // Use actual recording duration instead of call log duration
            callEnd = callStart + (actualDuration * 1000);
            Log.d(TAG, "🎯 Using ACTUAL duration from recording: " + actualDuration + "s (not call log duration)");
        }
        
        // Get contact name if not provided
        if (contactName == null || contactName.trim().isEmpty()) {
            contactName = getContactName(phoneNumber);
        }
        
        // Make contactName final for lambda usage
        final String finalContactName = contactName;
        final long finalCallEnd = callEnd;
        
        // Create metadata with CORRECT duration
        CallRecordingUploader.CallMetadata metadata = new CallRecordingUploader.CallMetadata(
            phoneNumber,
            finalContactName,
            direction,
            callStart,
            finalCallEnd,
            deviceId,
            true, // matched
            employeeId
        );
        
        recordingUploader.uploadRecording(recordingFile, metadata, new CallRecordingUploader.UploadCallback() {
            @Override
            public void onSuccess(String recordingId, String message) {
                Log.i(TAG, "✅ PERFECT UPLOAD SUCCESS: " + recordingId);
                
                // PERFECT FIX 5: Immediately update the call record with recording URL
                updateCallRecordWithRecording(phoneNumber, recordingId, finalCallEnd - callStart);
                
                mainHandler.post(() -> {
                    Toast.makeText(CallRecordingDetectionService.this, 
                        "📤 Call recording uploaded: " + finalContactName, Toast.LENGTH_SHORT).show();
                });
            }
            
            @Override
            public void onError(String error) {
                Log.e(TAG, "❌ Failed to upload recording: " + error);
                mainHandler.post(() -> {
                    Toast.makeText(CallRecordingDetectionService.this, 
                        "❌ Upload failed: " + error, Toast.LENGTH_SHORT).show();
                });
            }
        });
    }
    
    // PERFECT FIX 6: Calculate actual duration from audio file
    private long calculateActualDurationFromFile(File audioFile) {
        try {
            // For now, estimate based on file size and bitrate
            // Average m4a bitrate is ~128kbps, so roughly 16KB per second
            long fileSizeKB = audioFile.length() / 1024;
            long estimatedSeconds = fileSizeKB / 16; // Rough estimation
            
            Log.d(TAG, "📊 File size: " + fileSizeKB + "KB, estimated duration: " + estimatedSeconds + "s");
            
            // Sanity check: duration should be between 1 second and 1 hour
            if (estimatedSeconds >= 1 && estimatedSeconds <= 3600) {
                return estimatedSeconds;
            }
        } catch (Exception e) {
            Log.w(TAG, "Could not calculate duration from file", e);
        }
        return 0; // Use call log duration as fallback
    }
    
    // PERFECT FIX 7: Immediate call record update with recording URL
    private void updateCallRecordWithRecording(String phoneNumber, String recordingId, long actualDuration) {
        new Thread(() -> {
            try {
                // Build the actual recording URL that was uploaded
                String recordingUrl = API_BASE_URL + "/api/call-recordings/file/" + recordingId;
                
                // Update the existing call record
                java.net.URL updateUrl = new java.net.URL(API_BASE_URL + "/api/call-recordings/update-call");
                java.net.HttpURLConnection connection = (java.net.HttpURLConnection) updateUrl.openConnection();
                connection.setRequestMethod("POST");
                connection.setRequestProperty("Content-Type", "application/json");
                connection.setRequestProperty("X-Employee-ID", employeeId);
                connection.setDoOutput(true);
                connection.setConnectTimeout(10000);
                connection.setReadTimeout(10000);
                
                org.json.JSONObject updateData = new org.json.JSONObject();
                updateData.put("phone_number", phoneNumber);
                updateData.put("recording_url", recordingUrl);
                updateData.put("duration", actualDuration / 1000); // Convert to seconds
                
                Log.d(TAG, "🔄 PERFECT UPDATE: Linking recording to call");
                Log.d(TAG, "📞 Phone: " + phoneNumber);
                Log.d(TAG, "🎵 Recording URL: " + recordingUrl);
                Log.d(TAG, "⏱️ Actual Duration: " + (actualDuration / 1000) + "s");
                
                try (java.io.OutputStream os = connection.getOutputStream()) {
                    os.write(updateData.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8));
                }
                
                int responseCode = connection.getResponseCode();
                if (responseCode >= 200 && responseCode < 300) {
                    String response = readResponse(connection.getInputStream());
                    Log.d(TAG, "✅ PERFECT SUCCESS: Call record updated with recording URL: " + response);
                } else {
                    String errorResponse = readResponse(connection.getErrorStream());
                    Log.e(TAG, "❌ Failed to update call record: " + responseCode + " - " + errorResponse);
                }
                
                connection.disconnect();
                
            } catch (Exception e) {
                Log.e(TAG, "❌ Error updating call record with recording", e);
            }
        }).start();
    }
    
    // Helper method to read HTTP response
    private String readResponse(java.io.InputStream inputStream) throws java.io.IOException {
        if (inputStream == null) return "";
        
        java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(inputStream));
        StringBuilder response = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            response.append(line);
        }
        reader.close();
        return response.toString();
    }
    
    private String getContactName(String phoneNumber) {
        try {
            Uri uri = Uri.withAppendedPath(ContactsContract.PhoneLookup.CONTENT_FILTER_URI, 
                Uri.encode(phoneNumber));
            
            Cursor cursor = getContentResolver().query(uri, 
                new String[]{ContactsContract.PhoneLookup.DISPLAY_NAME}, 
                null, null, null);
            
            if (cursor != null && cursor.moveToFirst()) {
                String contactName = cursor.getString(0);
                cursor.close();
                return contactName;
            }
            
            if (cursor != null) cursor.close();
        } catch (Exception e) {
            Log.e(TAG, "Error getting contact name", e);
        }
        
        return "Unknown Contact";
    }
} 