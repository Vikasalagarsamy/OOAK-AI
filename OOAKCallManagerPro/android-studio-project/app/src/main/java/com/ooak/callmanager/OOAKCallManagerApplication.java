package com.ooak.callmanager;

import android.app.Application;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.os.Build;
import android.util.Log;

public class OOAKCallManagerApplication extends Application {
    private static final String TAG = "OOAKCallManagerApp";
    
    // Notification channels
    public static final String CHANNEL_CALL_MONITORING = "call_monitoring";
    public static final String CHANNEL_RECORDING_UPLOAD = "recording_upload";
    public static final String CHANNEL_GENERAL = "general";
    
    private static OOAKCallManagerApplication instance;
    
    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
        
        Log.d(TAG, "OOAK Call Manager Application starting...");
        
        // Create notification channels
        createNotificationChannels();
        
        // Initialize any global components here
        initializeGlobalComponents();
        
        Log.d(TAG, "OOAK Call Manager Application initialized successfully");
    }
    
    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            
            // Call Monitoring Channel
            NotificationChannel callChannel = new NotificationChannel(
                CHANNEL_CALL_MONITORING,
                "Call Monitoring",
                NotificationManager.IMPORTANCE_LOW
            );
            callChannel.setDescription("Notifications for active call monitoring");
            callChannel.setShowBadge(false);
            notificationManager.createNotificationChannel(callChannel);
            
            // Recording Upload Channel
            NotificationChannel uploadChannel = new NotificationChannel(
                CHANNEL_RECORDING_UPLOAD,
                "Recording Upload",
                NotificationManager.IMPORTANCE_DEFAULT
            );
            uploadChannel.setDescription("Notifications for recording upload status");
            notificationManager.createNotificationChannel(uploadChannel);
            
            // General Channel
            NotificationChannel generalChannel = new NotificationChannel(
                CHANNEL_GENERAL,
                "General",
                NotificationManager.IMPORTANCE_DEFAULT
            );
            generalChannel.setDescription("General app notifications");
            notificationManager.createNotificationChannel(generalChannel);
            
            Log.d(TAG, "Notification channels created");
        }
    }
    
    private void initializeGlobalComponents() {
        // Initialize any global components, databases, or services here
        // For example: database initialization, crash reporting, analytics, etc.
        
        Log.d(TAG, "Global components initialized");
    }
    
    public static OOAKCallManagerApplication getInstance() {
        return instance;
    }
    
    public static Context getAppContext() {
        return instance.getApplicationContext();
    }
} 