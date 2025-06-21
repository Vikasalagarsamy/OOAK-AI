package com.ooak.callmanager;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;
import com.ooak.callmanager.services.CallMonitoringService;
import com.ooak.callmanager.services.RecordingMonitorService;
import com.ooak.callmanager.utils.EmployeeAuthManager;

public class BootReceiver extends BroadcastReceiver {
    private static final String TAG = "BootReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction()) ||
            Intent.ACTION_MY_PACKAGE_REPLACED.equals(intent.getAction()) ||
            Intent.ACTION_PACKAGE_REPLACED.equals(intent.getAction())) {
            
            Log.d(TAG, "📱 Device boot completed - checking authentication");
            
            // Check if employee is authenticated
            EmployeeAuthManager authManager = new EmployeeAuthManager(context);
            if (authManager.isEmployeeAuthenticated()) {
                Log.d(TAG, "✅ Employee authenticated - starting background services");
                
                try {
                    // Start all background services
                    Intent callMonitorIntent = new Intent(context, CallMonitoringService.class);
                    context.startForegroundService(callMonitorIntent);
                    
                    Intent recordingMonitorIntent = new Intent(context, RecordingMonitorService.class);
                    context.startForegroundService(recordingMonitorIntent);
                    
                    Intent callTriggerIntent = new Intent(context, CallTriggerService.class);
                    context.startService(callTriggerIntent);
                    
                    Intent recordingDetectionIntent = new Intent(context, CallRecordingDetectionService.class);
                    context.startService(recordingDetectionIntent);
                    
                    Log.d(TAG, "🚀 All background services started successfully on boot");
                    
                } catch (Exception e) {
                    Log.e(TAG, "❌ Failed to start services on boot", e);
                }
            } else {
                Log.d(TAG, "⚠️ Employee not authenticated - services not started");
            }
        }
    }
} 