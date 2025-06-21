package com.ooak.callmanager.utils;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

public class EmployeeAuthManager {
    private static final String TAG = "EmployeeAuthManager";
    private static final String PREFS_NAME = "employee_prefs";
    private static final String KEY_EMPLOYEE_ID = "employee_id";
    private static final String KEY_EMPLOYEE_NAME = "employee_name";
    private static final String KEY_IS_AUTHENTICATED = "is_authenticated";
    private static final String KEY_DEVICE_ID = "device_id";
    private static final String KEY_AUTH_TOKEN = "auth_token";
    
    private Context context;
    private SharedPreferences prefs;
    
    public EmployeeAuthManager(Context context) {
        this.context = context;
        this.prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }
    
    public boolean authenticateEmployee(String employeeId, String employeeName) {
        try {
            // Validate input
            if (employeeId == null || employeeId.trim().isEmpty() ||
                employeeName == null || employeeName.trim().isEmpty()) {
                Log.e(TAG, "Invalid employee credentials");
                return false;
            }
            
            // Validate Employee ID format
            if (!employeeId.matches("^[A-Z]{2,4}\\d{3,6}$")) {
                Log.e(TAG, "Invalid Employee ID format: " + employeeId);
                return false;
            }
            
            // Generate device ID
            String deviceId = generateDeviceId(employeeId);
            
            // Store credentials
            SharedPreferences.Editor editor = prefs.edit();
            editor.putString(KEY_EMPLOYEE_ID, employeeId);
            editor.putString(KEY_EMPLOYEE_NAME, employeeName);
            editor.putString(KEY_DEVICE_ID, deviceId);
            editor.putBoolean(KEY_IS_AUTHENTICATED, true);
            editor.putLong("auth_timestamp", System.currentTimeMillis());
            editor.apply();
            
            Log.i(TAG, "Employee authenticated successfully: " + employeeId);
            return true;
            
        } catch (Exception e) {
            Log.e(TAG, "Authentication failed", e);
            return false;
        }
    }
    
    public boolean isEmployeeAuthenticated() {
        return prefs.getBoolean(KEY_IS_AUTHENTICATED, false) &&
               !prefs.getString(KEY_EMPLOYEE_ID, "").isEmpty() &&
               !prefs.getString(KEY_EMPLOYEE_NAME, "").isEmpty();
    }
    
    public String getEmployeeId() {
        return prefs.getString(KEY_EMPLOYEE_ID, "");
    }
    
    public String getEmployeeName() {
        return prefs.getString(KEY_EMPLOYEE_NAME, "");
    }
    
    public String getDeviceId() {
        return prefs.getString(KEY_DEVICE_ID, "");
    }
    
    public String getEmployeeInfo() {
        if (!isEmployeeAuthenticated()) {
            return "Not authenticated";
        }
        
        return getEmployeeName() + " (" + getEmployeeId() + ")";
    }
    
    public void clearAuthentication() {
        SharedPreferences.Editor editor = prefs.edit();
        editor.clear();
        editor.apply();
        Log.i(TAG, "Employee authentication cleared");
    }
    
    private String generateDeviceId(String employeeId) {
        // Generate a unique device ID based on employee ID and timestamp
        long timestamp = System.currentTimeMillis();
        String deviceId = employeeId + "_DEVICE_" + timestamp;
        return deviceId;
    }
    
    public long getAuthTimestamp() {
        return prefs.getLong("auth_timestamp", 0);
    }
    
    public boolean isAuthenticationExpired() {
        // Authentication expires after 30 days
        long authTime = getAuthTimestamp();
        long thirtyDaysInMillis = 30L * 24 * 60 * 60 * 1000;
        return (System.currentTimeMillis() - authTime) > thirtyDaysInMillis;
    }
    
    public String getAuthSummary() {
        if (!isEmployeeAuthenticated()) {
            return "❌ Not authenticated";
        }
        
        if (isAuthenticationExpired()) {
            return "⚠️ Authentication expired";
        }
        
        return "✅ " + getEmployeeInfo() + " (Device: " + getDeviceId() + ")";
    }
} 