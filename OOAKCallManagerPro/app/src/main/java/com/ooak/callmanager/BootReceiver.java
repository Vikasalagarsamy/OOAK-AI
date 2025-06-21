package com.ooak.callmanager;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

public class BootReceiver extends BroadcastReceiver {
    private static final String TAG = "BootReceiver";
    
    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        Log.d(TAG, "📱 Received broadcast: " + action);
        
        if (Intent.ACTION_BOOT_COMPLETED.equals(action) || 
            Intent.ACTION_MY_PACKAGE_REPLACED.equals(action) ||
            Intent.ACTION_PACKAGE_REPLACED.equals(action)) {
            
            Log.d(TAG, "🚀 Starting OOAK Call Manager services...");
            
            try {
                // Check if user is authenticated
                EmployeeAuthManager authManager = new EmployeeAuthManager(context);
                String employeeId = authManager.getEmployeeId();
                
                if (employeeId != null) {
                    Log.d(TAG, "✅ Employee authenticated: " + employeeId);
                    
                    // Start Call Trigger Service
                    Intent callTriggerIntent = new Intent(context, CallTriggerService.class);
                    context.startService(callTriggerIntent);
                    Log.d(TAG, "📞 Call Trigger Service started");
                    
                    // Start Call Recording Detection Service
                    Intent recordingDetectionIntent = new Intent(context, CallRecordingDetectionService.class);
                    context.startService(recordingDetectionIntent);
                    Log.d(TAG, "🎤 Call Recording Detection Service started");
                    
                } else {
                    Log.w(TAG, "⚠️ No employee authentication found - services not started");
                }
                
            } catch (Exception e) {
                Log.e(TAG, "❌ Error starting services", e);
            }
        }
    }
} 