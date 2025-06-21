package com.ooak.callmanager.utils;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.core.content.ContextCompat;
import java.util.ArrayList;
import java.util.List;

public class PermissionManager {
    private static final String TAG = "PermissionManager";
    
    private Context context;
    
    // Required permissions for the app
    private static final String[] REQUIRED_PERMISSIONS = {
        Manifest.permission.READ_PHONE_STATE,
        Manifest.permission.CALL_PHONE,
        Manifest.permission.READ_EXTERNAL_STORAGE,
        Manifest.permission.WRITE_EXTERNAL_STORAGE,
        Manifest.permission.RECORD_AUDIO,
        Manifest.permission.INTERNET,
        Manifest.permission.ACCESS_NETWORK_STATE,
        Manifest.permission.WAKE_LOCK,
        Manifest.permission.FOREGROUND_SERVICE,
        Manifest.permission.RECEIVE_BOOT_COMPLETED
    };
    
    // Optional permissions
    private static final String[] OPTIONAL_PERMISSIONS = {
        Manifest.permission.READ_CONTACTS,
        Manifest.permission.READ_CALL_LOG,
        Manifest.permission.WRITE_CALL_LOG,
        Manifest.permission.ACCESS_FINE_LOCATION
    };
    
    public PermissionManager(Context context) {
        this.context = context;
    }
    
    public boolean hasAllRequiredPermissions() {
        // Check storage permissions separately due to Android 13+ changes
        if (!hasStoragePermissions()) {
            return false;
        }
        
        // Check other required permissions
        for (String permission : REQUIRED_PERMISSIONS) {
            // Skip storage permissions as they're handled above
            if (permission.equals(Manifest.permission.READ_EXTERNAL_STORAGE) || 
                permission.equals(Manifest.permission.WRITE_EXTERNAL_STORAGE)) {
                continue;
            }
            if (!hasPermission(permission)) {
                return false;
            }
        }
        return true;
    }
    
    public boolean hasPermission(String permission) {
        return ContextCompat.checkSelfPermission(context, permission) == PackageManager.PERMISSION_GRANTED;
    }
    
    public boolean hasStoragePermissions() {
        // Handle Android 13+ storage permission changes
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            // On Android 13+, check MANAGE_EXTERNAL_STORAGE or legacy permissions
            return ContextCompat.checkSelfPermission(context, Manifest.permission.MANAGE_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED ||
                   (ContextCompat.checkSelfPermission(context, Manifest.permission.READ_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED &&
                    ContextCompat.checkSelfPermission(context, Manifest.permission.WRITE_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED);
        } else {
            // Pre-Android 13
            return ContextCompat.checkSelfPermission(context, Manifest.permission.READ_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED &&
                   ContextCompat.checkSelfPermission(context, Manifest.permission.WRITE_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED;
        }
    }
    
    public List<String> getMissingRequiredPermissions() {
        List<String> missingPermissions = new ArrayList<>();
        
        // Check storage permissions separately
        if (!hasStoragePermissions()) {
            missingPermissions.add("android.permission.READ_EXTERNAL_STORAGE");
            missingPermissions.add("android.permission.WRITE_EXTERNAL_STORAGE");
        }
        
        // Check other required permissions
        for (String permission : REQUIRED_PERMISSIONS) {
            // Skip storage permissions as they're handled above
            if (permission.equals(Manifest.permission.READ_EXTERNAL_STORAGE) || 
                permission.equals(Manifest.permission.WRITE_EXTERNAL_STORAGE)) {
                continue;
            }
            if (!hasPermission(permission)) {
                missingPermissions.add(permission);
            }
        }
        return missingPermissions;
    }
    
    public List<String> getMissingOptionalPermissions() {
        List<String> missingPermissions = new ArrayList<>();
        for (String permission : OPTIONAL_PERMISSIONS) {
            if (!hasPermission(permission)) {
                missingPermissions.add(permission);
            }
        }
        return missingPermissions;
    }
    
    public String[] getAllRequiredPermissions() {
        return REQUIRED_PERMISSIONS.clone();
    }
    
    public String[] getAllOptionalPermissions() {
        return OPTIONAL_PERMISSIONS.clone();
    }
    
    public String getPermissionStatus() {
        StringBuilder status = new StringBuilder();
        
        status.append("📋 PERMISSION STATUS:\n\n");
        
        // Required permissions
        status.append("🔴 REQUIRED PERMISSIONS:\n");
        for (String permission : REQUIRED_PERMISSIONS) {
            boolean granted = hasPermission(permission);
            status.append(granted ? "✅ " : "❌ ");
            status.append(getPermissionDisplayName(permission));
            status.append("\n");
        }
        
        status.append("\n🟡 OPTIONAL PERMISSIONS:\n");
        for (String permission : OPTIONAL_PERMISSIONS) {
            boolean granted = hasPermission(permission);
            status.append(granted ? "✅ " : "⚪ ");
            status.append(getPermissionDisplayName(permission));
            status.append("\n");
        }
        
        return status.toString();
    }
    
    private String getPermissionDisplayName(String permission) {
        switch (permission) {
            case Manifest.permission.READ_PHONE_STATE:
                return "Phone State (Monitor calls)";
            case Manifest.permission.CALL_PHONE:
                return "Make Calls (Call functionality)";
            case Manifest.permission.READ_EXTERNAL_STORAGE:
                return "Read Storage (Access recordings)";
            case Manifest.permission.WRITE_EXTERNAL_STORAGE:
                return "Write Storage (Save files)";
            case Manifest.permission.RECORD_AUDIO:
                return "Microphone (Recording detection)";
            case Manifest.permission.INTERNET:
                return "Internet (Upload to CRM)";
            case Manifest.permission.ACCESS_NETWORK_STATE:
                return "Network State (Connection status)";
            case Manifest.permission.WAKE_LOCK:
                return "Wake Lock (Background operation)";
            case Manifest.permission.FOREGROUND_SERVICE:
                return "Foreground Service (24/7 monitoring)";
            case Manifest.permission.RECEIVE_BOOT_COMPLETED:
                return "Boot Receiver (Auto-start)";
            case Manifest.permission.READ_CONTACTS:
                return "Contacts (Caller identification)";
            case Manifest.permission.READ_CALL_LOG:
                return "Call Log (Call history)";
            case Manifest.permission.WRITE_CALL_LOG:
                return "Write Call Log (Update history)";
            case Manifest.permission.ACCESS_FINE_LOCATION:
                return "Location (Call location tracking)";
            default:
                return permission.substring(permission.lastIndexOf('.') + 1);
        }
    }
    
    public boolean isPermissionCritical(String permission) {
        for (String required : REQUIRED_PERMISSIONS) {
            if (required.equals(permission)) {
                return true;
            }
        }
        return false;
    }
    
    public String getPermissionRationale(String permission) {
        switch (permission) {
            case Manifest.permission.READ_PHONE_STATE:
                return "This permission is required to monitor phone calls and detect when recordings are made.";
            case Manifest.permission.CALL_PHONE:
                return "This permission allows the app to make calls when requested from the CRM system.";
            case Manifest.permission.READ_EXTERNAL_STORAGE:
                return "This permission is required to access call recording files stored on your device.";
            case Manifest.permission.WRITE_EXTERNAL_STORAGE:
                return "This permission allows the app to manage recording files and temporary data.";
            case Manifest.permission.RECORD_AUDIO:
                return "This permission helps detect when call recordings are being made.";
            case Manifest.permission.INTERNET:
                return "This permission is required to upload call recordings to the OOAK-FUTURE CRM system.";
            case Manifest.permission.ACCESS_NETWORK_STATE:
                return "This permission helps determine the best time to upload recordings based on network availability.";
            case Manifest.permission.WAKE_LOCK:
                return "This permission ensures the app can continue monitoring calls even when the device is sleeping.";
            case Manifest.permission.FOREGROUND_SERVICE:
                return "This permission allows the app to run continuously in the background for 24/7 call monitoring.";
            default:
                return "This permission is required for the app to function properly.";
        }
    }
    
    public int getPermissionCount() {
        return REQUIRED_PERMISSIONS.length + OPTIONAL_PERMISSIONS.length;
    }
    
    public int getGrantedPermissionCount() {
        int count = 0;
        for (String permission : REQUIRED_PERMISSIONS) {
            if (hasPermission(permission)) count++;
        }
        for (String permission : OPTIONAL_PERMISSIONS) {
            if (hasPermission(permission)) count++;
        }
        return count;
    }
    
    public double getPermissionCompletionPercentage() {
        return (double) getGrantedPermissionCount() / getPermissionCount() * 100;
    }
} 