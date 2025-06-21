package com.ooak.callmanager.api;

import android.content.Context;
import android.util.Log;

import com.ooak.callmanager.config.ServerConfig;
import com.ooak.callmanager.models.CallRecord;
import com.ooak.callmanager.models.RecordingFile;
import com.ooak.callmanager.utils.EmployeeAuthManager;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.IOException;
import java.util.concurrent.TimeUnit;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class OOAKCRMApiClient {
    
    private static final String TAG = "OOAKCRMApiClient";
    private static final String BASE_URL = "https://portal.ooak.photography"; // OOAK-FUTURE CRM - CORRECTED IP
    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");
    
    private OkHttpClient client;
    private EmployeeAuthManager authManager;
    private ServerConfig serverConfig;
    
    public OOAKCRMApiClient(Context context) {
        this.authManager = new EmployeeAuthManager(context);
        this.client = new OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(60, TimeUnit.SECONDS)
            .writeTimeout(60, TimeUnit.SECONDS)
            .build();
    }
    
    // Upload recording to existing OOAK-FUTURE call-upload endpoint
    public void uploadRecording(RecordingFile recording, UploadCallback callback) {
        try {
            File audioFile = new File(recording.getFilePath());
            if (!audioFile.exists()) {
                callback.onUploadError("Audio file not found: " + recording.getFilePath());
                return;
            }
            
            // Build multipart request matching your existing API
            MultipartBody.Builder builder = new MultipartBody.Builder()
                .setType(MultipartBody.FORM)
                .addFormDataPart("audio", audioFile.getName(),
                    RequestBody.create(audioFile, MediaType.parse("audio/*")))
                .addFormDataPart("clientName", recording.getContactName() != null ? 
                    recording.getContactName() : "Mobile Call - " + recording.getPhoneNumber())
                .addFormDataPart("taskId", recording.getTaskId() != null ? recording.getTaskId() : "")
                .addFormDataPart("notes", "Uploaded from Android device - Employee: " + 
                    authManager.getEmployeeId() + " - Phone: " + recording.getPhoneNumber());
            
            RequestBody requestBody = builder.build();
            
            Request request = new Request.Builder()
                .url(BASE_URL + "/api/call-upload")
                .post(requestBody)
                .addHeader("X-Employee-ID", authManager.getEmployeeId())
                .build();
            
            Log.d(TAG, "Uploading recording: " + recording.getFileName());
            
            client.newCall(request).enqueue(new Callback() {
                @Override
                public void onFailure(Call call, IOException e) {
                    Log.e(TAG, "Upload failed", e);
                    callback.onUploadError("Upload failed: " + e.getMessage());
                }
                
                @Override
                public void onResponse(Call call, Response response) throws IOException {
                    try {
                        String responseBody = response.body().string();
                        
                        if (response.isSuccessful()) {
                            JSONObject json = new JSONObject(responseBody);
                            String callId = json.optString("callId");
                            
                            Log.d(TAG, "Recording uploaded successfully: " + callId);
                            callback.onUploadSuccess(callId);
                        } else {
                            Log.e(TAG, "Upload failed: " + response.code() + " - " + responseBody);
                            callback.onUploadError("Upload failed: " + response.code());
                        }
                    } catch (JSONException e) {
                        Log.e(TAG, "Error parsing upload response", e);
                        callback.onUploadError("Invalid response format");
                    } finally {
                        response.close();
                    }
                }
            });
            
        } catch (Exception e) {
            Log.e(TAG, "Error preparing upload", e);
            callback.onUploadError("Upload preparation failed: " + e.getMessage());
        }
    }
    
    // Check upload history from existing endpoint
    public void getUploadHistory(UploadHistoryCallback callback) {
        Request request = new Request.Builder()
            .url(BASE_URL + "/api/call-uploads")
            .get()
            .addHeader("X-Employee-ID", authManager.getEmployeeId())
            .build();
        
        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                Log.e(TAG, "Failed to fetch upload history", e);
                callback.onError("Failed to fetch history: " + e.getMessage());
            }
            
            @Override
            public void onResponse(Call call, Response response) throws IOException {
                try {
                    if (response.isSuccessful()) {
                        String responseBody = response.body().string();
                        Log.d(TAG, "Upload history fetched successfully");
                        callback.onSuccess(responseBody);
                    } else {
                        Log.e(TAG, "History fetch failed: " + response.code());
                        callback.onError("History fetch failed: " + response.code());
                    }
                } finally {
                    response.close();
                }
            }
        });
    }
    
    // Enhanced call status update for existing system
    public void updateCallStatus(CallRecord callRecord) {
        try {
            JSONObject callData = new JSONObject();
            callData.put("phoneNumber", callRecord.getPhoneNumber());
            callData.put("contactName", callRecord.getContactName());
            callData.put("direction", callRecord.getDirection());
            callData.put("status", callRecord.getStatus());
            callData.put("employeeId", callRecord.getEmployeeId());
            callData.put("taskId", callRecord.getTaskId());
            callData.put("leadId", callRecord.getLeadId());
            
            if (callRecord.getStartTime() != null) {
                callData.put("startTime", callRecord.getStartTime().toInstant().toString());
            }
            if (callRecord.getEndTime() != null) {
                callData.put("endTime", callRecord.getEndTime().toInstant().toString());
            }
            if (callRecord.getDuration() > 0) {
                callData.put("duration", callRecord.getDuration());
            }

            // Add mobile contact name if available
            if (callRecord.getMobileContactName() != null) {
                callData.put("mobileContactName", callRecord.getMobileContactName());
            }

            RequestBody body = RequestBody.create(callData.toString(), JSON);
            Request request = new Request.Builder()
                .url(BASE_URL + "/api/call-monitoring")
                .post(body)
                .addHeader("X-Employee-ID", authManager.getEmployeeId())
                .addHeader("Content-Type", "application/json")
                .build();

            Log.d(TAG, "🚀 Sending call status update:");
            Log.d(TAG, "   📞 Phone: " + callRecord.getPhoneNumber());
            Log.d(TAG, "   📝 Status: " + callRecord.getStatus());
            Log.d(TAG, "   👤 Employee: " + callRecord.getEmployeeId());
            Log.d(TAG, "   🏢 Contact: " + callRecord.getContactName());
            Log.d(TAG, "   🌐 URL: " + BASE_URL + "/api/call-monitoring");
            Log.d(TAG, "   📊 JSON: " + callData.toString());

            client.newCall(request).enqueue(new Callback() {
                @Override
                public void onFailure(Call call, IOException e) {
                    Log.e(TAG, "❌ FAILED to send call status update!", e);
                    Log.e(TAG, "   📞 Phone: " + callRecord.getPhoneNumber());
                    Log.e(TAG, "   📝 Status: " + callRecord.getStatus());
                    Log.e(TAG, "   🔗 Error: " + e.getMessage());
                }

                @Override
                public void onResponse(Call call, Response response) throws IOException {
                    try {
                        String responseBody = response.body() != null ? response.body().string() : "No body";
                        
                        if (response.isSuccessful()) {
                            Log.d(TAG, "✅ Call status updated successfully!");
                            Log.d(TAG, "   📞 Phone: " + callRecord.getPhoneNumber());
                            Log.d(TAG, "   📝 Status: " + callRecord.getStatus());
                            Log.d(TAG, "   🎯 Response: " + responseBody);
                        } else {
                            Log.e(TAG, "❌ Call status update failed:");
                            Log.e(TAG, "   📞 Phone: " + callRecord.getPhoneNumber());
                            Log.e(TAG, "   📝 Status: " + callRecord.getStatus());
                            Log.e(TAG, "   🚫 HTTP Code: " + response.code());
                            Log.e(TAG, "   📄 Response: " + responseBody);
                        }
                    } catch (Exception e) {
                        Log.e(TAG, "❌ Error processing call status response", e);
                    } finally {
                        response.close();
                    }
                }
            });

        } catch (JSONException e) {
            Log.e(TAG, "❌ Error creating call status JSON for " + callRecord.getPhoneNumber(), e);
        } catch (Exception e) {
            Log.e(TAG, "❌ Unexpected error in updateCallStatus for " + callRecord.getPhoneNumber(), e);
        }
    }
    
    // Contact lookup in your existing system
    public interface ContactLookupCallback {
        void onContactFound(String leadId, String taskId, String contactName);
        void onContactNotFound();
    }
    
    public void lookupContact(String phoneNumber, ContactLookupCallback callback) {
        // This would integrate with your existing leads/tasks system
        // For now, return not found to avoid breaking existing functionality
        Log.d(TAG, "Contact lookup for: " + phoneNumber);
        callback.onContactNotFound();
    }
    
    // Callback interfaces
    public interface UploadCallback {
        void onUploadSuccess(String callId);
        void onUploadError(String error);
    }
    
    public interface UploadHistoryCallback {
        void onSuccess(String historyJson);
        void onError(String error);
    }
} 