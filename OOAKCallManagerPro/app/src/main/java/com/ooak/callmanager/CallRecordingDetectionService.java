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

import org.json.JSONException;

import java.io.File;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class CallRecordingDetectionService extends Service {
    private static final String TAG = "CallRecordingDetection";
    private static final String API_BASE_URL = "https://portal.ooak.photography";
    
    // Common recording storage locations on Android
    private static final String[] RECORDING_PATHS = {
        "/storage/emulated/0/MIUI/sound_recorder/call_rec/",
        "/storage/emulated/0/Call recordings/",
        "/storage/emulated/0/Recordings/Call/",
        "/storage/emulated/0/Android/data/com.android.dialer/files/Call Recordings/",
        "/storage/emulated/0/PhoneRecord/",
        "/storage/emulated/0/Call Recording/",
        "/storage/emulated/0/Sound Recorder/",
        "/storage/emulated/0/recorder/call/",
        "/storage/emulated/0/CallRecordings/",
        "/storage/emulated/0/DCIM/Call Recordings/"
    };
    
    private CallLogObserver callLogObserver;
    private CallRecordingUploader recordingUploader;
    private ExecutorService executorService;
    private Handler mainHandler;
    private String employeeId;
    private String deviceId;
    private Map<String, Long> recentCalls; // phoneNumber -> timestamp
    
    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "📱 Call Recording Detection Service created");
        
        mainHandler = new Handler(Looper.getMainLooper());
        executorService = Executors.newCachedThreadPool();
        recentCalls = new HashMap<>();
        
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
        } else {
            Log.e(TAG, "❌ No employee ID found - cannot start monitoring");
        }
    }
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "🚀 Call Recording Detection Service started");
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
            Log.d(TAG, "📞 Call log monitoring started");
        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to setup call log monitoring", e);
        }
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
                    
                    // Only process calls that completed (duration > 0) and are recent
                    long currentTime = System.currentTimeMillis();
                    if (duration > 0 && (currentTime - callDate) < 60000) { // Within last minute
                        
                        // Avoid duplicate processing
                        Long lastProcessed = recentCalls.get(phoneNumber);
                        if (lastProcessed == null || Math.abs(callDate - lastProcessed) > 5000) {
                            recentCalls.put(phoneNumber, callDate);
                            
                            String direction = getCallDirection(callType);
                            Log.d(TAG, "🔍 Processing recent call: " + phoneNumber + " (" + direction + ") Duration: " + duration + "s");
                            
                            // Look for recording after a delay to ensure it's written
                            mainHandler.postDelayed(() -> 
                                executorService.execute(() -> 
                                    searchForRecording(phoneNumber, contactName, direction, callDate, callDate + (duration * 1000))
                                ), 3000); // Wait 3 seconds
                        }
                    }
                } while (cursor.moveToNext());
                cursor.close();
            }
        } catch (Exception e) {
            Log.e(TAG, "❌ Error checking for new calls", e);
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
    
    private void searchForRecording(String phoneNumber, String contactName, String direction, long callStart, long callEnd) {
        Log.d(TAG, "🔍 Searching for recording of call to: " + phoneNumber);
        
        for (String basePath : RECORDING_PATHS) {
            File recordingDir = new File(basePath);
            if (recordingDir.exists() && recordingDir.isDirectory()) {
                Log.d(TAG, "📂 Checking directory: " + basePath);
                
                File[] files = recordingDir.listFiles();
                if (files != null) {
                    for (File file : files) {
                        if (isLikelyRecording(file, phoneNumber, callStart)) {
                            Log.d(TAG, "🎤 Found potential recording: " + file.getName());
                            uploadRecording(file, phoneNumber, contactName, direction, callStart, callEnd);
                            return; // Found one, stop searching
                        }
                    }
                }
            }
        }
        
        Log.d(TAG, "🔍 No recording found for call to: " + phoneNumber);
    }
    
    private boolean isLikelyRecording(File file, String phoneNumber, long callTime) {
        if (!file.isFile()) return false;
        
        String fileName = file.getName().toLowerCase();
        long fileTime = file.lastModified();
        
        // Check if file was modified within 2 minutes of call
        if (Math.abs(fileTime - callTime) > 120000) return false;
        
        // Check if it's an audio file
        if (!fileName.endsWith(".mp3") && !fileName.endsWith(".wav") && 
            !fileName.endsWith(".m4a") && !fileName.endsWith(".3gp") &&
            !fileName.endsWith(".amr") && !fileName.endsWith(".aac")) {
            return false;
        }
        
        // Check if filename contains phone number or timestamp
        String cleanPhone = phoneNumber.replaceAll("[^0-9]", "");
        if (fileName.contains(cleanPhone.substring(Math.max(0, cleanPhone.length() - 6)))) {
            return true;
        }
        
        // Check if it's a recent call recording by name pattern
        return fileName.contains("call") || fileName.contains("record") || 
               fileName.contains("rec_") || fileName.contains("callrec");
    }
    
    private void uploadRecording(File recordingFile, String phoneNumber, String contactName, 
                               String direction, long callStart, long callEnd) {
        
        Log.d(TAG, "📤 Uploading recording: " + recordingFile.getName());
        
        // Get contact name if not provided
        if (contactName == null || contactName.trim().isEmpty()) {
            contactName = getContactName(phoneNumber);
        }
        
        // Create metadata
        CallRecordingUploader.CallMetadata metadata = new CallRecordingUploader.CallMetadata(
            phoneNumber,
            contactName,
            direction,
            callStart,
            callEnd,
            deviceId,
            true, // matched
            employeeId
        );
        
        recordingUploader.uploadRecording(recordingFile, metadata, new CallRecordingUploader.UploadCallback() {
            @Override
            public void onSuccess(String recordingId, String message) {
                Log.i(TAG, "✅ Recording uploaded successfully: " + recordingId);
                mainHandler.post(() -> {
                    Toast.makeText(CallRecordingDetectionService.this, 
                        "Call recording uploaded: " + phoneNumber, Toast.LENGTH_SHORT).show();
                });
            }
            
            @Override
            public void onError(String error) {
                Log.e(TAG, "❌ Failed to upload recording: " + error);
                mainHandler.post(() -> {
                    Toast.makeText(CallRecordingDetectionService.this, 
                        "Failed to upload recording: " + error, Toast.LENGTH_SHORT).show();
                });
            }
        });
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