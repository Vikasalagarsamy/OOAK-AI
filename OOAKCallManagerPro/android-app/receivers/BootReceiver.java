package com.ooak.callmanager.receivers;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.util.Log;
import com.ooak.callmanager.services.CallMonitoringService;
import com.ooak.callmanager.services.RecordingMonitorService;

public class BootReceiver extends BroadcastReceiver {
    private static final String TAG = "BootReceiver";
    
    @Override
    public void onReceive(Context context, Intent intent) {
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction()) ||
            Intent.ACTION_MY_PACKAGE_REPLACED.equals(intent.getAction()) ||
            Intent.ACTION_PACKAGE_REPLACED.equals(intent.getAction())) {
            
            Log.i(TAG, "Boot completed or package updated, checking if services should be started");
            
            // Check if employee is authenticated
            SharedPreferences prefs = context.getSharedPreferences("employee_prefs", Context.MODE_PRIVATE);
            boolean isAuthenticated = prefs.getBoolean("is_authenticated", false);
            String employeeId = prefs.getString("employee_id", "");
            
            if (isAuthenticated && !employeeId.isEmpty()) {
                Log.i(TAG, "Employee authenticated, starting background services for: " + employeeId);
                
                try {
                    // Start Call Monitoring Service
                    Intent callMonitorIntent = new Intent(context, CallMonitoringService.class);
                    context.startForegroundService(callMonitorIntent);
                    
                    // Start Recording Monitor Service
                    Intent recordingMonitorIntent = new Intent(context, RecordingMonitorService.class);
                    context.startForegroundService(recordingMonitorIntent);
                    
                    Log.i(TAG, "Background services started successfully after boot");
                    
                } catch (Exception e) {
                    Log.e(TAG, "Failed to start services after boot", e);
                }
            } else {
                Log.i(TAG, "Employee not authenticated, services not started");
            }
        }
    }
} 