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
            
            // Set headers
            connection.setRequestProperty("Content-Type", "multipart/form-data; boundary=" + BOUNDARY);
            connection.setRequestProperty("X-Employee-ID", metadata.employeeId);
            connection.setRequestProperty("User-Agent", "OOAK-CallManager-Android/1.0");
            
            Log.d(TAG, "🚀 Starting upload to: " + url);
            Log.d(TAG, "📱 Employee ID: " + metadata.employeeId);
            Log.d(TAG, "📞 Phone: " + metadata.phoneNumber);
            Log.d(TAG, "📂 File: " + audioFile.getName() + " (" + audioFile.length() + " bytes)");
            
            // Build multipart request
            try (OutputStream out = connection.getOutputStream();
                 BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(out, StandardCharsets.UTF_8))) {
                
                // Add metadata part
                writer.write("--" + BOUNDARY + "\r\n");
                writer.write("Content-Disposition: form-data; name=\"metadata\"\r\n");
                writer.write("Content-Type: application/json\r\n\r\n");
                writer.write(metadata.toJSON().toString());
                writer.write("\r\n");
                writer.flush();
                
                // Add audio file part
                writer.write("--" + BOUNDARY + "\r\n");
                writer.write("Content-Disposition: form-data; name=\"audio\"; filename=\"" + audioFile.getName() + "\"\r\n");
                writer.write("Content-Type: audio/mpeg\r\n\r\n");
                writer.flush();
                
                // Write audio file data
                try (FileInputStream fileInput = new FileInputStream(audioFile)) {
                    byte[] buffer = new byte[8192];
                    int bytesRead;
                    while ((bytesRead = fileInput.read(buffer)) != -1) {
                        out.write(buffer, 0, bytesRead);
                    }
                }
                
                writer.write("\r\n--" + BOUNDARY + "--\r\n");
                writer.flush();
            }
            
            // Get response
            int responseCode = connection.getResponseCode();
            Log.d(TAG, "📡 Response code: " + responseCode);
            
            String response = readResponse(connection);
            Log.d(TAG, "📨 Response: " + response);
            
            if (responseCode == 200) {
                handleSuccessResponse(response, callback);
            } else {
                handleErrorResponse(responseCode, response, callback);
            }
            
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }
    
    private String readResponse(HttpURLConnection connection) throws IOException {
        InputStream inputStream = null;
        try {
            if (connection.getResponseCode() >= 400) {
                inputStream = connection.getErrorStream();
            } else {
                inputStream = connection.getInputStream();
            }
            
            if (inputStream == null) {
                return "";
            }
            
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
                StringBuilder response = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    response.append(line);
                }
                return response.toString();
            }
        } finally {
            if (inputStream != null) {
                inputStream.close();
            }
        }
    }
    
    private void handleSuccessResponse(String response, UploadCallback callback) {
        try {
            JSONObject jsonResponse = new JSONObject(response);
            if (jsonResponse.getBoolean("success")) {
                String recordingId = jsonResponse.getString("recordingId");
                String message = jsonResponse.getString("message");
                Log.i(TAG, "✅ Upload successful: " + recordingId);
                callback.onSuccess(recordingId, message);
            } else {
                String error = jsonResponse.optString("error", "Upload failed");
                Log.e(TAG, "❌ Upload failed: " + error);
                callback.onError(error);
            }
        } catch (JSONException e) {
            Log.e(TAG, "❌ Failed to parse success response", e);
            callback.onError("Invalid response format");
        }
    }
    
    private void handleErrorResponse(int responseCode, String response, UploadCallback callback) {
        try {
            JSONObject jsonResponse = new JSONObject(response);
            String error = jsonResponse.optString("error", "HTTP " + responseCode);
            Log.e(TAG, "❌ Upload error (" + responseCode + "): " + error);
            callback.onError(error);
        } catch (JSONException e) {
            Log.e(TAG, "❌ Upload failed with code " + responseCode + ": " + response);
            callback.onError("HTTP " + responseCode + ": " + response);
        }
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