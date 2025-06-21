package com.ooak.callmanager.api;

import android.content.Context;
import android.util.Log;
import android.content.SharedPreferences;

import org.json.JSONObject;
import org.json.JSONException;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class CallRecordingUploader {
    private static final String TAG = "CallRecordingUploader";
    private static final String API_ENDPOINT = "/api/call-recordings";
    private static final int TIMEOUT_MS = 30000; // 30 seconds
    private static final String BOUNDARY = "***" + System.currentTimeMillis() + "***";
    
    private final Context context;
    private final String baseUrl;
    private final ExecutorService executor;
    
    public CallRecordingUploader(Context context, String baseUrl) {
        this.context = context;
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        this.executor = Executors.newSingleThreadExecutor();
    }
    
    public interface UploadCallback {
        void onSuccess(String recordingId, String message);
        void onError(String error);
    }
    
    public static class CallMetadata {
        public String phoneNumber;
        public String contactName;
        public String direction; // "incoming" or "outgoing"
        public long callStartTime;
        public long callEndTime;
        public String deviceId;
        public boolean matched;
        public String employeeId;
        
        public CallMetadata(String phoneNumber, String contactName, String direction, 
                          long callStartTime, long callEndTime, String deviceId, 
                          boolean matched, String employeeId) {
            this.phoneNumber = phoneNumber;
            this.contactName = contactName;
            this.direction = direction;
            this.callStartTime = callStartTime;
            this.callEndTime = callEndTime;
            this.deviceId = deviceId;
            this.matched = matched;
            this.employeeId = employeeId;
        }
        
        public JSONObject toJSON() throws JSONException {
            JSONObject json = new JSONObject();
            json.put("phoneNumber", phoneNumber != null ? phoneNumber : "unknown");
            json.put("contactName", contactName != null ? contactName : "Unknown Contact");
            json.put("direction", direction != null ? direction : "unknown");
            json.put("callStartTime", callStartTime);
            json.put("callEndTime", callEndTime);
            json.put("deviceId", deviceId != null ? deviceId : "unknown");
            json.put("matched", matched);
            json.put("employeeId", employeeId);
            return json;
        }
    }
    
    public void uploadRecording(File audioFile, CallMetadata metadata, UploadCallback callback) {
        if (audioFile == null || !audioFile.exists()) {
            callback.onError("Audio file does not exist");
            return;
        }
        
        if (metadata == null || metadata.employeeId == null) {
            callback.onError("Employee ID is required");
            return;
        }
        
        executor.execute(() -> {
            try {
                performUpload(audioFile, metadata, callback);
            } catch (Exception e) {
                Log.e(TAG, "Upload failed", e);
                callback.onError("Upload failed: " + e.getMessage());
            }
        });
    }
    
    private void performUpload(File audioFile, CallMetadata metadata, UploadCallback callback) 
            throws IOException, JSONException {
        
        HttpURLConnection connection = null;
        try {
            // Create connection
            URL url = new URL(baseUrl + API_ENDPOINT);
            connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("POST");
            connection.setDoOutput(true);
            connection.setConnectTimeout(TIMEOUT_MS);
            connection.setReadTimeout(TIMEOUT_MS);
            
            // Set headers - IMPORTANT: Include employee ID in header
            connection.setRequestProperty("Content-Type", "multipart/form-data; boundary=" + BOUNDARY);
            connection.setRequestProperty("X-Employee-ID", metadata.employeeId);
            connection.setRequestProperty("User-Agent", "OOAK-CallManager-Android/1.0");
            
            Log.d(TAG, "🚀 Starting upload to: " + url);
            Log.d(TAG, "📱 Employee ID: " + metadata.employeeId);
            Log.d(TAG, "📞 Phone: " + metadata.phoneNumber);
            Log.d(TAG, "📂 File: " + audioFile.getName() + " (" + audioFile.length() + " bytes)");
            
            // Build multipart request
            try (OutputStream outputStream = connection.getOutputStream();
                 DataOutputStream request = new DataOutputStream(outputStream)) {
                
                // Write metadata
                writeFormField(request, "metadata", createMetadataJson(metadata));
                
                // Write audio file
                writeFileField(request, "audio", audioFile);
                
                // End multipart
                request.writeBytes("--" + BOUNDARY + "--\r\n");
                request.flush();
            }
            
            // Get response
            int responseCode = connection.getResponseCode();
            String responseMessage = connection.getResponseMessage();
            
            Log.d(TAG, "📡 Upload response: " + responseCode + " " + responseMessage);
            
            if (responseCode >= 200 && responseCode < 300) {
                // Read success response
                String responseBody = readResponse(connection.getInputStream());
                Log.d(TAG, "✅ Upload successful: " + responseBody);
                
                try {
                    JSONObject response = new JSONObject(responseBody);
                    String recordingId = response.optString("recordingId", "unknown");
                    String message = response.optString("message", "Upload successful");
                    callback.onSuccess(recordingId, message);
                    
                    // Also update call monitoring for better tracking
                    updateCallMonitoring(metadata, recordingId);
                    
                } catch (JSONException e) {
                    Log.w(TAG, "⚠️ Could not parse response JSON, but upload succeeded", e);
                    callback.onSuccess("unknown", "Upload successful");
                }
            } else {
                // Read error response
                String errorBody = readResponse(connection.getErrorStream());
                Log.e(TAG, "❌ Upload failed: " + responseCode + " - " + errorBody);
                callback.onError("Upload failed (HTTP " + responseCode + "): " + errorBody);
            }
            
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }
    
    private void updateCallMonitoring(CallMetadata metadata, String recordingId) {
        // Enhanced call monitoring update - tries multiple strategies to link recording
        new Thread(() -> {
            try {
                // Strategy 1: Try to update existing call record with recording URL
                boolean existingCallUpdated = updateExistingCallRecord(metadata, recordingId);
                
                if (!existingCallUpdated) {
                    // Strategy 2: Create new call record if no existing record found
                    createNewCallRecord(metadata, recordingId);
                }
                
            } catch (Exception e) {
                Log.e(TAG, "❌ Failed to update call monitoring", e);
            }
        }).start();
    }
    
    private boolean updateExistingCallRecord(CallMetadata metadata, String recordingId) {
        try {
            // Try to update existing call record using the new update-call API
            URL updateUrl = new URL(baseUrl + "/api/call-recordings/update-call");
            HttpURLConnection connection = (HttpURLConnection) updateUrl.openConnection();
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setRequestProperty("X-Employee-ID", metadata.employeeId);
            connection.setDoOutput(true);
            connection.setConnectTimeout(10000);
            connection.setReadTimeout(10000);
            
            // PERFECT FIX: Build the EXACT recording URL that was uploaded
            String recordingUrl = baseUrl + "/api/call-recordings/file/" + recordingId;
            
            // Calculate actual call duration in seconds
            long duration = Math.max(1, (metadata.callEndTime - metadata.callStartTime) / 1000);
            
            JSONObject updateData = new JSONObject();
            updateData.put("phone_number", metadata.phoneNumber);
            updateData.put("recording_url", recordingUrl);
            updateData.put("duration", duration);
            
            Log.d(TAG, "🔄 PERFECT UPDATE: Attempting to update existing call record");
            Log.d(TAG, "📞 Phone: " + metadata.phoneNumber);
            Log.d(TAG, "🎵 Recording URL: " + recordingUrl);
            Log.d(TAG, "⏱️ Duration: " + duration + "s");
            Log.d(TAG, "🆔 Recording ID: " + recordingId);
            
            try (OutputStream os = connection.getOutputStream()) {
                os.write(updateData.toString().getBytes(StandardCharsets.UTF_8));
            }
            
            int responseCode = connection.getResponseCode();
            if (responseCode >= 200 && responseCode < 300) {
                String response = readResponse(connection.getInputStream());
                Log.d(TAG, "✅ PERFECT SUCCESS: Updated existing call record: " + response);
                return true;
            } else {
                String errorResponse = readResponse(connection.getErrorStream());
                Log.d(TAG, "⚠️ No existing call record found to update: " + responseCode + " - " + errorResponse);
                return false;
            }
            
        } catch (Exception e) {
            Log.w(TAG, "⚠️ Could not update existing call record", e);
            return false;
        }
    }
    
    private void createNewCallRecord(CallMetadata metadata, String recordingId) {
        try {
            URL url = new URL(baseUrl + "/api/call-monitoring");
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setRequestProperty("X-Employee-ID", metadata.employeeId);
            connection.setDoOutput(true);
            connection.setConnectTimeout(10000);
            connection.setReadTimeout(10000);
            
            // Build recording URL
            String recordingUrl = baseUrl + "/api/call-recordings/file/android_" + 
                                metadata.employeeId + "_" + System.currentTimeMillis() + 
                                (recordingId != null ? "_" + recordingId : "") + 
                                getFileExtension(metadata);
            
            // Calculate actual call duration
            long duration = Math.max(1, (metadata.callEndTime - metadata.callStartTime) / 1000);
            
            JSONObject callData = new JSONObject();
            callData.put("phoneNumber", metadata.phoneNumber);
            callData.put("contactName", metadata.contactName);
            callData.put("direction", metadata.direction);
            callData.put("status", "completed");
            callData.put("duration", duration);
            callData.put("employeeId", metadata.employeeId);
            callData.put("recordingUrl", recordingUrl);
            callData.put("startTime", metadata.callStartTime);
            callData.put("endTime", metadata.callEndTime);
            
            Log.d(TAG, "📝 Creating new call record with recording");
            Log.d(TAG, "📞 Phone: " + metadata.phoneNumber);
            Log.d(TAG, "👤 Contact: " + metadata.contactName);
            Log.d(TAG, "🎵 Recording URL: " + recordingUrl);
            Log.d(TAG, "⏱️ Duration: " + duration + "s");
            
            try (OutputStream os = connection.getOutputStream()) {
                os.write(callData.toString().getBytes(StandardCharsets.UTF_8));
            }
            
            int responseCode = connection.getResponseCode();
            if (responseCode >= 200 && responseCode < 300) {
                String response = readResponse(connection.getInputStream());
                Log.d(TAG, "✅ Successfully created new call record: " + response);
            } else {
                String errorResponse = readResponse(connection.getErrorStream());
                Log.e(TAG, "❌ Failed to create call record: " + responseCode + " - " + errorResponse);
            }
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to create new call record", e);
        }
    }
    
    private String getFileExtension(CallMetadata metadata) {
        // Try to determine file extension based on common patterns
        // Default to .m4a which is most common on Android
        return ".m4a";
    }
    
    private String readResponse(InputStream inputStream) throws IOException {
        StringBuilder response = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                response.append(line);
            }
        }
        return response.toString();
    }
    
    private void writeFormField(DataOutputStream request, String fieldName, String fieldValue) throws IOException {
        request.writeBytes("--" + BOUNDARY + "\r\n");
        request.writeBytes("Content-Disposition: form-data; name=\"" + fieldName + "\"\r\n");
        request.writeBytes("Content-Type: text/plain\r\n\r\n");
        request.writeBytes(fieldValue + "\r\n");
    }
    
    private void writeFileField(DataOutputStream request, String fieldName, File file) throws IOException {
        request.writeBytes("--" + BOUNDARY + "\r\n");
        request.writeBytes("Content-Disposition: form-data; name=\"" + fieldName + "\"; filename=\"" + file.getName() + "\"\r\n");
        request.writeBytes("Content-Type: audio/mpeg\r\n\r\n");
        
        try (FileInputStream fileInput = new FileInputStream(file)) {
            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = fileInput.read(buffer)) != -1) {
                request.write(buffer, 0, bytesRead);
            }
        }
        
        request.writeBytes("\r\n");
    }
    
    private String createMetadataJson(CallMetadata metadata) throws JSONException {
        return metadata.toJSON().toString();
    }
    
    public void shutdown() {
        if (executor != null && !executor.isShutdown()) {
            executor.shutdown();
        }
    }
    
    // Utility method to get employee ID from shared preferences
    public static String getEmployeeId(Context context) {
        SharedPreferences prefs = context.getSharedPreferences("OOAK_CallManager", Context.MODE_PRIVATE);
        return prefs.getString("employee_id", null);
    }
    
    // Utility method to save employee ID
    public static void saveEmployeeId(Context context, String employeeId) {
        SharedPreferences prefs = context.getSharedPreferences("OOAK_CallManager", Context.MODE_PRIVATE);
        prefs.edit().putString("employee_id", employeeId).apply();
    }
} 