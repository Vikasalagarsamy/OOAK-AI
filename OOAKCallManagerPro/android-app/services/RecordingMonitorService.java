package com.ooak.callmanager.services;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Environment;
import android.os.FileObserver;
import android.os.IBinder;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import com.ooak.callmanager.MainActivity;
import com.ooak.callmanager.R;
import com.ooak.callmanager.api.OOAKCRMApiClient;
import com.ooak.callmanager.models.RecordingFile;
import com.ooak.callmanager.utils.EmployeeAuthManager;

import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class RecordingMonitorService extends Service {
    
    private static final String TAG = "RecordingMonitorService";
    private static final String CHANNEL_ID = "recording_monitor_channel";
    private static final int NOTIFICATION_ID = 1002;
    
    private static boolean isRunning = false;
    
    private List<FileObserver> fileObservers = new ArrayList<>();
    private ExecutorService executorService;
    private OOAKCRMApiClient crmApiClient;
    private EmployeeAuthManager authManager;
    
    // Common recording locations on Android devices
    private final String[] RECORDING_PATHS = {
        "/storage/emulated/0/Call recordings/",
        "/storage/emulated/0/Recordings/Call/",
        "/storage/emulated/0/MIUI/sound_recorder/call_rec/",
        "/storage/emulated/0/PhoneRecord/",
        "/storage/emulated/0/CallRecordings/",
        "/storage/emulated/0/Android/data/com.android.dialer/files/",
        "/storage/emulated/0/Sounds/Call recordings/",
        "/sdcard/Call recordings/",
        "/sdcard/Recordings/",
        Environment.getExternalStorageDirectory() + "/Call recordings/",
        Environment.getExternalStorageDirectory() + "/Recordings/Call/"
    };

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "RecordingMonitorService created");
        
        initializeService();
        createNotificationChannel();
        startForeground(NOTIFICATION_ID, createNotification());
        setupFileMonitoring();
        
        isRunning = true;
    }

    private void initializeService() {
        executorService = Executors.newFixedThreadPool(3);
        crmApiClient = new OOAKCRMApiClient(this);
        authManager = new EmployeeAuthManager(this);
    }

    private void setupFileMonitoring() {
        Log.d(TAG, "Setting up file monitoring for recording directories");
        
        for (String path : RECORDING_PATHS) {
            File directory = new File(path);
            if (directory.exists() && directory.isDirectory()) {
                Log.d(TAG, "Monitoring directory: " + path);
                
                RecordingFileObserver observer = new RecordingFileObserver(path);
                observer.startWatching();
                fileObservers.add(observer);
                
                // Also scan existing files in the directory
                scanExistingFiles(directory);
            } else {
                Log.d(TAG, "Directory does not exist: " + path);
            }
        }
        
        if (fileObservers.isEmpty()) {
            Log.w(TAG, "No recording directories found! Call recordings may not be detected.");
        }
    }

    private void scanExistingFiles(File directory) {
        executorService.execute(() -> {
            try {
                File[] files = directory.listFiles();
                if (files != null) {
                    for (File file : files) {
                        if (isRecordingFile(file)) {
                            Log.d(TAG, "Found existing recording: " + file.getName());
                            processRecordingFile(file);
                        }
                    }
                }
            } catch (Exception e) {
                Log.e(TAG, "Error scanning existing files", e);
            }
        });
    }

    private boolean isRecordingFile(File file) {
        if (!file.isFile()) return false;
        
        String name = file.getName().toLowerCase();
        return name.endsWith(".mp3") || 
               name.endsWith(".wav") || 
               name.endsWith(".m4a") || 
               name.endsWith(".3gp") || 
               name.endsWith(".amr") ||
               name.endsWith(".aac");
    }

    private class RecordingFileObserver extends FileObserver {
        private String path;
        
        public RecordingFileObserver(String path) {
            super(path, FileObserver.CREATE | FileObserver.CLOSE_WRITE | FileObserver.MOVED_TO);
            this.path = path;
        }
        
        @Override
        public void onEvent(int event, String fileName) {
            if (fileName == null) return;
            
            Log.d(TAG, "File event: " + event + " for " + fileName);
            
            File file = new File(path, fileName);
            if (isRecordingFile(file)) {
                Log.d(TAG, "New recording detected: " + fileName);
                
                // Process file in background thread
                executorService.execute(() -> processRecordingFile(file));
            }
        }
    }

    private void processRecordingFile(File file) {
        try {
            Log.d(TAG, "Processing recording file: " + file.getName());
            
            // Create recording record
            RecordingFile recording = new RecordingFile();
            recording.setFileName(file.getName());
            recording.setFilePath(file.getAbsolutePath());
            recording.setFileSize(file.length());
            recording.setEmployeeId(authManager.getEmployeeId());
            recording.setCreatedTime(file.lastModified());
            
            // Extract phone number from filename if possible
            String phoneNumber = extractPhoneNumberFromFilename(file.getName());
            recording.setPhoneNumber(phoneNumber);
            
            // Set contact name based on phone number or use default
            if (phoneNumber != null) {
                recording.setContactName("Call with " + phoneNumber);
            } else {
                recording.setContactName("Unknown Contact");
            }
            
            // Update notification
            updateNotification("Processing: " + file.getName());
            
            // Upload to existing OOAK-FUTURE call-upload endpoint
            crmApiClient.uploadRecording(recording, new OOAKCRMApiClient.UploadCallback() {
                @Override
                public void onUploadSuccess(String callId) {
                    Log.d(TAG, "Recording uploaded successfully to OOAK-FUTURE: " + callId);
                    recording.setTranscriptionId(callId);
                    recording.setStatus("uploaded");
                    
                    // Reset notification
                    updateNotification("Recording monitor active - Last upload: " + file.getName());
                }
                
                @Override
                public void onUploadError(String error) {
                    Log.e(TAG, "Failed to upload recording to OOAK-FUTURE: " + error);
                    recording.setStatus("upload_failed");
                    recording.setErrorMessage(error);
                    
                    // Reset notification
                    updateNotification("Recording monitor active - Upload failed");
                }
            });
            
        } catch (Exception e) {
            Log.e(TAG, "Error processing recording file", e);
        }
    }

    private String extractPhoneNumberFromFilename(String filename) {
        // Common patterns for phone numbers in recording filenames
        // Examples: "Call_+1234567890_20231201_143022.mp3"
        //          "Recording_1234567890.wav"
        //          "20231201_143022_+1234567890.m4a"
        
        // Remove file extension
        String nameWithoutExt = filename.replaceAll("\\.[^.]+$", "");
        
        // Look for phone number patterns
        String[] patterns = {
            "\\+?[1-9]\\d{1,14}",  // International format
            "\\d{10,}",            // Long digit sequences
            "\\+\\d{1,3}\\d{10,}"  // Country code + number
        };
        
        for (String pattern : patterns) {
            java.util.regex.Pattern p = java.util.regex.Pattern.compile(pattern);
            java.util.regex.Matcher m = p.matcher(nameWithoutExt);
            if (m.find()) {
                String number = m.group();
                // Clean up the number
                number = number.replaceAll("[^+\\d]", "");
                if (number.length() >= 10) {
                    Log.d(TAG, "Extracted phone number: " + number + " from " + filename);
                    return number;
                }
            }
        }
        
        Log.d(TAG, "Could not extract phone number from: " + filename);
        return null;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Recording Monitor",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Monitors call recordings for automatic upload to OOAK-FUTURE");
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private Notification createNotification() {
        return createNotificationWithText("Recording monitor active - Connected to OOAK-FUTURE");
    }

    private Notification createNotificationWithText(String text) {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 0, notificationIntent, 
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("OOAK Recording Monitor")
            .setContentText(text)
            .setSmallIcon(R.drawable.ic_mic)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build();
    }

    private void updateNotification(String text) {
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.notify(NOTIFICATION_ID, createNotificationWithText(text));
        }
    }

    public static boolean isRunning() {
        return isRunning;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "RecordingMonitorService started");
        return START_STICKY; // Restart if killed
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null; // Not a bound service
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "RecordingMonitorService destroyed");
        
        // Stop file observers
        for (FileObserver observer : fileObservers) {
            observer.stopWatching();
        }
        fileObservers.clear();
        
        // Shutdown executor service
        if (executorService != null) {
            executorService.shutdown();
        }
        
        isRunning = false;
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        // Don't stop service when task is removed
        Log.d(TAG, "Task removed, but recording monitor continues running");
    }
} 