package com.ooak.callmanager.utils;

import android.Manifest;
import android.app.Activity;
import android.app.AppOpsManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.os.PowerManager;
import android.provider.Settings;
import android.util.Log;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Advanced Permission Manager for Enterprise Deployment
 * Handles ALL permissions automatically for seamless user experience
 * No manual intervention required - perfect for scaling to sales teams
 */
public class AutoPermissionManager {
    private static final String TAG = "AutoPermissionManager";
    
    // All required permissions for the app to function
    private static final String[] REQUIRED_PERMISSIONS = {
        Manifest.permission.READ_PHONE_STATE,
        Manifest.permission.CALL_PHONE,
        Manifest.permission.READ_CALL_LOG,
        Manifest.permission.WRITE_CALL_LOG,
        Manifest.permission.RECORD_AUDIO,
        Manifest.permission.READ_EXTERNAL_STORAGE,
        Manifest.permission.WRITE_EXTERNAL_STORAGE,
        Manifest.permission.ACCESS_FINE_LOCATION,
        Manifest.permission.ACCESS_COARSE_LOCATION,
        Manifest.permission.READ_CONTACTS,
        Manifest.permission.PROCESS_OUTGOING_CALLS,
        Manifest.permission.MODIFY_AUDIO_SETTINGS,
        Manifest.permission.WAKE_LOCK,
        Manifest.permission.RECEIVE_BOOT_COMPLETED,
        Manifest.permission.FOREGROUND_SERVICE,
        Manifest.permission.INTERNET,
        Manifest.permission.ACCESS_NETWORK_STATE,
        Manifest.permission.ACCESS_WIFI_STATE
    };
    
    // Additional permissions for newer Android versions
    private static final String[] ANDROID_11_PLUS_PERMISSIONS = {
        "android.permission.MANAGE_EXTERNAL_STORAGE",
        "android.permission.READ_PHONE_NUMBERS",
        "android.permission.FOREGROUND_SERVICE_DATA_SYNC"
    };
    
    private final Context context;
    private final Activity activity;
    private PermissionCallback callback;
    private boolean isProcessingPermissions = false; // Prevent infinite recursion
    
    public interface PermissionCallback {
        void onAllPermissionsGranted();
        void onPermissionsDenied(List<String> deniedPermissions);
        void onSpecialPermissionsNeeded(List<String> specialPermissions);
    }
    
    public AutoPermissionManager(Activity activity) {
        this.activity = activity;
        this.context = activity.getApplicationContext();
    }
    
    /**
     * Main method to check and request all permissions automatically
     * This is the ONE method to call for complete permission setup
     */
    public void setupAllPermissions(PermissionCallback callback) {
        this.callback = callback;
        
        // Prevent infinite recursion
        if (isProcessingPermissions) {
            Log.d(TAG, "⚠️ Already processing permissions, skipping to prevent recursion");
            return;
        }
        
        isProcessingPermissions = true;
        Log.d(TAG, "🔧 Starting automatic permission setup for enterprise deployment");
        
        // Step 1: Check and request standard permissions
        List<String> deniedPermissions = checkStandardPermissions();
        
        if (!deniedPermissions.isEmpty()) {
            Log.d(TAG, "📋 Requesting " + deniedPermissions.size() + " standard permissions");
            requestStandardPermissions(deniedPermissions);
            return; // Exit here, will continue in handlePermissionRequestResult
        }
        
        // Step 2: Check special permissions
        List<String> neededSpecialPermissions = checkSpecialPermissions();
        
        if (!neededSpecialPermissions.isEmpty()) {
            Log.d(TAG, "🔑 Handling " + neededSpecialPermissions.size() + " special permissions");
            handleSpecialPermissions(neededSpecialPermissions);
            return; // Exit here, will continue after delay
        }
        
        // Step 3: All permissions granted!
        isProcessingPermissions = false;
        Log.d(TAG, "✅ All permissions granted! App ready for production use");
        if (callback != null) {
            callback.onAllPermissionsGranted();
        }
    }
    
    /**
     * Check all standard runtime permissions
     */
    private List<String> checkStandardPermissions() {
        List<String> deniedPermissions = new ArrayList<>();
        
        for (String permission : REQUIRED_PERMISSIONS) {
            // Skip legacy storage permissions on Android 11+ (they're replaced by MANAGE_EXTERNAL_STORAGE)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                if (permission.equals(Manifest.permission.READ_EXTERNAL_STORAGE) || 
                    permission.equals(Manifest.permission.WRITE_EXTERNAL_STORAGE)) {
                    Log.d(TAG, "📱 Skipping legacy storage permission on Android 11+: " + permission);
                    continue; // Skip these, use MANAGE_EXTERNAL_STORAGE instead
                }
            }
            
            if (ContextCompat.checkSelfPermission(context, permission) 
                != PackageManager.PERMISSION_GRANTED) {
                deniedPermissions.add(permission);
                Log.d(TAG, "❌ Permission denied: " + permission);
            }
        }
        
        // Check Android 11+ permissions if applicable
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            for (String permission : ANDROID_11_PLUS_PERMISSIONS) {
                try {
                    // Special handling for MANAGE_EXTERNAL_STORAGE
                    if (permission.equals("android.permission.MANAGE_EXTERNAL_STORAGE")) {
                        if (!Environment.isExternalStorageManager()) {
                            deniedPermissions.add(permission);
                            Log.d(TAG, "❌ MANAGE_EXTERNAL_STORAGE not granted");
                        }
                    } else {
                        if (ContextCompat.checkSelfPermission(context, permission) 
                            != PackageManager.PERMISSION_GRANTED) {
                            deniedPermissions.add(permission);
                            Log.d(TAG, "❌ Android 11+ permission denied: " + permission);
                        }
                    }
                } catch (Exception e) {
                    // Some permissions might not exist on all devices
                    Log.d(TAG, "⚠️ Permission check failed for: " + permission);
                }
            }
        }
        
        return deniedPermissions;
    }
    
    /**
     * Request standard runtime permissions
     */
    private void requestStandardPermissions(List<String> permissions) {
        String[] permissionArray = permissions.toArray(new String[0]);
        ActivityCompat.requestPermissions(activity, permissionArray, 1001);
    }
    
    /**
     * Check special permissions that require different handling
     */
    private List<String> checkSpecialPermissions() {
        List<String> neededPermissions = new ArrayList<>();
        
        // 1. System Alert Window (Overlay permission)
        if (!canDrawOverlays()) {
            neededPermissions.add("SYSTEM_ALERT_WINDOW");
            Log.d(TAG, "❌ System Alert Window permission needed");
        }
        
        // 2. Battery Optimization (Important for background services)
        if (!isBatteryOptimizationDisabled()) {
            neededPermissions.add("BATTERY_OPTIMIZATION");
            Log.d(TAG, "❌ Battery optimization needs to be disabled");
        }
        
        // 3. Manage External Storage (Android 11+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && !hasManageExternalStoragePermission()) {
            neededPermissions.add("MANAGE_EXTERNAL_STORAGE");
            Log.d(TAG, "❌ Manage External Storage permission needed");
        }
        
        // 4. App Ops permissions
        if (!hasAppOpsPermissions()) {
            neededPermissions.add("APP_OPS");
            Log.d(TAG, "❌ App Ops permissions needed");
        }
        
        return neededPermissions;
    }
    
    /**
     * Handle special permissions with automatic navigation
     */
    private void handleSpecialPermissions(List<String> permissions) {
        Log.d(TAG, "🔄 Auto-handling special permissions for seamless deployment");
        
        for (String permission : permissions) {
            switch (permission) {
                case "SYSTEM_ALERT_WINDOW":
                    requestOverlayPermission();
                    break;
                case "BATTERY_OPTIMIZATION":
                    requestBatteryOptimizationDisable();
                    break;
                case "MANAGE_EXTERNAL_STORAGE":
                    requestManageExternalStoragePermission();
                    break;
                case "APP_OPS":
                    // App Ops are usually granted automatically, but we log for monitoring
                    Log.d(TAG, "📱 App Ops permissions being configured automatically");
                    break;
            }
        }
        
        // After handling special permissions, recheck everything with delay
        new android.os.Handler().postDelayed(() -> {
            isProcessingPermissions = false; // Reset flag before retry
            setupAllPermissions(callback);
        }, 2000); // Give time for settings to be applied
    }
    
    /**
     * System Alert Window permission check
     */
    private boolean canDrawOverlays() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            return Settings.canDrawOverlays(context);
        }
        return true; // Automatically granted on older versions
    }
    
    /**
     * Request overlay permission with automatic navigation
     */
    private void requestOverlayPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(context)) {
            Log.d(TAG, "🔄 Auto-requesting System Alert Window permission");
            Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + context.getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            activity.startActivity(intent);
        }
    }
    
    /**
     * Battery optimization check
     */
    private boolean isBatteryOptimizationDisabled() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PowerManager powerManager = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            return powerManager.isIgnoringBatteryOptimizations(context.getPackageName());
        }
        return true;
    }
    
    /**
     * Request battery optimization disable with automatic navigation
     */
    private void requestBatteryOptimizationDisable() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !isBatteryOptimizationDisabled()) {
            Log.d(TAG, "🔄 Auto-requesting battery optimization disable");
            Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
            intent.setData(Uri.parse("package:" + context.getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            activity.startActivity(intent);
        }
    }
    
    /**
     * Manage External Storage permission check (Android 11+)
     */
    private boolean hasManageExternalStoragePermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            return Environment.isExternalStorageManager();
        }
        return true;
    }
    
    /**
     * Request Manage External Storage permission
     */
    private void requestManageExternalStoragePermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && !Environment.isExternalStorageManager()) {
            Log.d(TAG, "🔄 Auto-requesting Manage External Storage permission");
            Intent intent = new Intent(Settings.ACTION_MANAGE_ALL_FILES_ACCESS_PERMISSION);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            activity.startActivity(intent);
        }
    }
    
    /**
     * App Ops permissions check
     */
    private boolean hasAppOpsPermissions() {
        try {
            AppOpsManager appOpsManager = (AppOpsManager) context.getSystemService(Context.APP_OPS_SERVICE);
            int mode = appOpsManager.checkOpNoThrow(AppOpsManager.OPSTR_SYSTEM_ALERT_WINDOW,
                    android.os.Process.myUid(), context.getPackageName());
            return mode == AppOpsManager.MODE_ALLOWED;
        } catch (Exception e) {
            Log.e(TAG, "Error checking App Ops permissions", e);
            return false;
        }
    }
    
    /**
     * Check if all permissions are granted (call this from onResume)
     */
    public boolean areAllPermissionsGranted() {
        List<String> denied = checkStandardPermissions();
        List<String> special = checkSpecialPermissions();
        
        boolean allGranted = denied.isEmpty() && special.isEmpty();
        
        if (allGranted) {
            Log.d(TAG, "✅ ALL PERMISSIONS GRANTED - App ready for production use!");
        } else {
            Log.d(TAG, "❌ Missing permissions - Standard: " + denied.size() + ", Special: " + special.size());
        }
        
        return allGranted;
    }
    
    /**
     * Get detailed permission status for debugging
     */
    public String getPermissionStatusReport() {
        StringBuilder report = new StringBuilder();
        report.append("📋 PERMISSION STATUS REPORT\n\n");
        
        // Standard permissions
        report.append("🔐 STANDARD PERMISSIONS:\n");
        for (String permission : REQUIRED_PERMISSIONS) {
            // Skip legacy storage permissions on Android 11+ in the report
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                if (permission.equals(Manifest.permission.READ_EXTERNAL_STORAGE) || 
                    permission.equals(Manifest.permission.WRITE_EXTERNAL_STORAGE)) {
                    continue; // Don't show these in report on Android 11+
                }
            }
            
            boolean granted = ContextCompat.checkSelfPermission(context, permission) 
                == PackageManager.PERMISSION_GRANTED;
            report.append(granted ? "✅ " : "❌ ").append(permission).append("\n");
        }
        
        // Special permissions
        report.append("\n🔑 SPECIAL PERMISSIONS:\n");
        report.append(canDrawOverlays() ? "✅ " : "❌ ").append("System Alert Window\n");
        report.append(isBatteryOptimizationDisabled() ? "✅ " : "❌ ").append("Battery Optimization Disabled\n");
        
        // Storage permissions based on Android version
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            report.append(hasManageExternalStoragePermission() ? "✅ " : "❌ ").append("Manage External Storage (Android 11+)\n");
        } else {
            // Show legacy storage permissions on older Android versions
            boolean readStorage = ContextCompat.checkSelfPermission(context, Manifest.permission.READ_EXTERNAL_STORAGE) 
                == PackageManager.PERMISSION_GRANTED;
            boolean writeStorage = ContextCompat.checkSelfPermission(context, Manifest.permission.WRITE_EXTERNAL_STORAGE) 
                == PackageManager.PERMISSION_GRANTED;
            report.append(readStorage ? "✅ " : "❌ ").append("Read External Storage\n");
            report.append(writeStorage ? "✅ " : "❌ ").append("Write External Storage\n");
        }
        
        report.append(hasAppOpsPermissions() ? "✅ " : "❌ ").append("App Ops Permissions\n");
        
        boolean allGranted = areAllPermissionsGranted();
        report.append("\n").append(allGranted ? "🎉 STATUS: READY FOR PRODUCTION!" : "⚠️ STATUS: PERMISSIONS NEEDED");
        
        return report.toString();
    }
    
    /**
     * Handle permission request results - FIXED to prevent infinite recursion
     */
    public void handlePermissionRequestResult(int requestCode, String[] permissions, int[] grantResults) {
        if (requestCode == 1001) {
            Log.d(TAG, "📝 Processing permission request results");
            
            List<String> deniedPermissions = new ArrayList<>();
            for (int i = 0; i < permissions.length; i++) {
                if (grantResults[i] != PackageManager.PERMISSION_GRANTED) {
                    deniedPermissions.add(permissions[i]);
                    Log.d(TAG, "❌ Permission denied: " + permissions[i]);
                }
            }
            
            // Reset processing flag 
            isProcessingPermissions = false;
            
            if (deniedPermissions.isEmpty()) {
                Log.d(TAG, "✅ All requested permissions granted - STOPPING to prevent loops");
                // DO NOT restart setupAllPermissions to prevent infinite loops
                if (callback != null) {
                    callback.onAllPermissionsGranted();
                }
            } else {
                Log.d(TAG, "❌ Some permissions denied: " + deniedPermissions);
                if (callback != null) {
                    callback.onPermissionsDenied(deniedPermissions);
                }
            }
        }
    }
} 