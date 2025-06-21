package com.ooak.callmanager.utils;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;
import android.os.Handler;
import android.os.Looper;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.URL;

public class EmployeeAuthManager {
    private static final String TAG = "EmployeeAuthManager";
    private static final String PREFS_NAME = "employee_prefs";
    private static final String KEY_EMPLOYEE_ID = "employee_id";
    private static final String KEY_EMPLOYEE_NAME = "employee_name";
    private static final String KEY_USERNAME = "username";
    private static final String KEY_EMAIL = "email";
    private static final String KEY_IS_AUTHENTICATED = "is_authenticated";
    private static final String KEY_DEVICE_ID = "device_id";
    private static final String KEY_AUTH_TOKEN = "auth_token";
    private static final String API_BASE_URL = "https://portal.ooak.photography";
    
    private Context context;
    private SharedPreferences prefs;
    
    // Callback interface for authentication results
    public interface AuthCallback {
        void onAuthenticationResult(boolean success, String message, EmployeeInfo employeeInfo);
    }
    
    // Employee info class
    public static class EmployeeInfo {
        public String employeeId;
        public String name;
        public String email;
        public String validUntil;
        
        public EmployeeInfo(String employeeId, String name, String email, String validUntil) {
            this.employeeId = employeeId;
            this.name = name;
            this.email = email;
            this.validUntil = validUntil;
        }
    }
    
    public EmployeeAuthManager(Context context) {
        this.context = context;
        this.prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }
    
    // Real CRM authentication method
    public void authenticateWithCRMCredentials(String username, String password, AuthCallback callback) {
        new Thread(() -> {
            try {
                // Generate device ID
                String deviceId = android.provider.Settings.Secure.getString(
                    context.getContentResolver(), 
                    android.provider.Settings.Secure.ANDROID_ID
                );
                
                Log.d(TAG, "Authenticating with CRM: " + username);
                
                // Create JSON payload
                JSONObject payload = new JSONObject();
                payload.put("username", username);
                payload.put("password", password);
                payload.put("deviceId", deviceId);
                
                // Make HTTP request to mobile-auth API
                URL url = new URL(API_BASE_URL + "/api/mobile-auth");
                HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                connection.setRequestMethod("POST");
                connection.setRequestProperty("Content-Type", "application/json");
                connection.setDoOutput(true);
                connection.setConnectTimeout(10000);
                connection.setReadTimeout(10000);
                
                // Send request
                OutputStreamWriter writer = new OutputStreamWriter(connection.getOutputStream());
                writer.write(payload.toString());
                writer.flush();
                writer.close();
                
                int responseCode = connection.getResponseCode();
                Log.d(TAG, "CRM Auth response code: " + responseCode);
                
                if (responseCode == HttpURLConnection.HTTP_OK) {
                    // Read response
                    BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
                    StringBuilder response = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        response.append(line);
                    }
                    reader.close();
                    
                    JSONObject jsonResponse = new JSONObject(response.toString());
                    Log.d(TAG, "CRM Auth response: " + jsonResponse.toString());
                    
                    if (jsonResponse.getBoolean("success")) {
                        // Parse employee data
                        JSONObject employee = jsonResponse.getJSONObject("employee");
                        JSONObject auth = jsonResponse.getJSONObject("authentication");
                        
                        String employeeId = employee.getString("employeeId");
                        String employeeName = employee.getString("name");
                        String email = employee.getString("email");
                        String validUntil = auth.getString("validUntil");
                        String authDeviceId = auth.getString("deviceId");
                        
                        // Store credentials
                        SharedPreferences.Editor editor = prefs.edit();
                        editor.putString(KEY_EMPLOYEE_ID, employeeId);
                        editor.putString(KEY_EMPLOYEE_NAME, employeeName);
                        editor.putString(KEY_USERNAME, username);
                        editor.putString(KEY_EMAIL, email);
                        editor.putString(KEY_DEVICE_ID, authDeviceId);
                        editor.putBoolean(KEY_IS_AUTHENTICATED, true);
                        editor.putLong("auth_timestamp", System.currentTimeMillis());
                        editor.apply();
                        
                        Log.i(TAG, "CRM Authentication successful: " + employeeId);
                        
                        // Success callback
                        EmployeeInfo employeeInfo = new EmployeeInfo(employeeId, employeeName, email, validUntil);
                        new Handler(Looper.getMainLooper()).post(() -> {
                            callback.onAuthenticationResult(true, "Authentication successful", employeeInfo);
                        });
                        
                    } else {
                        String errorMessage = jsonResponse.optString("error", "Authentication failed");
                        Log.e(TAG, "CRM Authentication failed: " + errorMessage);
                        
                        new Handler(Looper.getMainLooper()).post(() -> {
                            callback.onAuthenticationResult(false, errorMessage, null);
                        });
                    }
                } else {
                    // Read error response
                    BufferedReader errorReader = new BufferedReader(new InputStreamReader(connection.getErrorStream()));
                    StringBuilder errorResponse = new StringBuilder();
                    String line;
                    while ((line = errorReader.readLine()) != null) {
                        errorResponse.append(line);
                    }
                    errorReader.close();
                    
                    String errorMessage = "Authentication failed";
                    try {
                        JSONObject errorJson = new JSONObject(errorResponse.toString());
                        errorMessage = errorJson.optString("error", errorMessage);
                    } catch (Exception e) {
                        // Ignore JSON parsing error
                    }
                    
                    Log.e(TAG, "CRM Auth HTTP error: " + responseCode + " - " + errorMessage);
                    
                    final String finalErrorMessage = errorMessage;
                    new Handler(Looper.getMainLooper()).post(() -> {
                        callback.onAuthenticationResult(false, finalErrorMessage, null);
                    });
                }
                
                connection.disconnect();
                
            } catch (Exception e) {
                Log.e(TAG, "CRM Authentication error", e);
                new Handler(Looper.getMainLooper()).post(() -> {
                    callback.onAuthenticationResult(false, "Network error: " + e.getMessage(), null);
                });
            }
        }).start();
    }
    
    // Simple local authentication for fallback
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
    
    public String getUsername() {
        return prefs.getString(KEY_USERNAME, "");
    }
    
    public String getEmail() {
        return prefs.getString(KEY_EMAIL, "");
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
    
    public String getEmployeeDetailsForDisplay() {
        if (!isEmployeeAuthenticated()) {
            return "Not authenticated";
        }
        
        String details = "👤 " + getEmployeeName() + "\n";
        details += "🆔 " + getEmployeeId() + "\n";
        
        String email = getEmail();
        if (!email.isEmpty()) {
            details += "📧 " + email + "\n";
        }
        
        details += "📱 Device: " + getDeviceId();
        
        return details;
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