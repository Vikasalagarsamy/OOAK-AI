package com.ooak.callmanager;

import android.app.Service;
import android.content.Intent;
import android.net.Uri;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;
import androidx.annotation.Nullable;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.URL;

public class CallTriggerService extends Service {
    private static final String TAG = "CallTriggerService";
    private static final String API_BASE_URL = "https://portal.ooak.photography";
    private static final int POLL_INTERVAL = 15000; // 15 seconds
    
    private Handler handler;
    private Runnable pollRunnable;
    private boolean isPolling = false;
    private String employeeId;
    private String deviceId;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "CallTriggerService created");
        
        handler = new Handler(Looper.getMainLooper());
        
        // Get stored authentication info
        EmployeeAuthManager authManager = new EmployeeAuthManager(this);
        employeeId = authManager.getEmployeeId();
        deviceId = android.provider.Settings.Secure.getString(
            getContentResolver(), 
            android.provider.Settings.Secure.ANDROID_ID
        );
        
        Log.d(TAG, "Service initialized with Employee ID: " + employeeId + ", Device ID: " + deviceId);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "CallTriggerService started");
        startPolling();
        return START_STICKY; // Restart if killed by system
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "CallTriggerService destroyed");
        stopPolling();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null; // Not a bound service
    }

    private void startPolling() {
        if (isPolling) {
            Log.d(TAG, "Polling already started");
            return;
        }
        
        if (employeeId == null) {
            Log.e(TAG, "Cannot start polling - no employee ID found");
            return;
        }
        
        isPolling = true;
        Log.d(TAG, "Starting call trigger polling...");
        
        pollRunnable = new Runnable() {
            @Override
            public void run() {
                if (isPolling) {
                    pollForCallTriggers();
                    handler.postDelayed(this, POLL_INTERVAL);
                }
            }
        };
        
        handler.post(pollRunnable);
    }

    private void stopPolling() {
        isPolling = false;
        if (handler != null && pollRunnable != null) {
            handler.removeCallbacks(pollRunnable);
        }
        Log.d(TAG, "Call trigger polling stopped");
    }

    private void pollForCallTriggers() {
        new Thread(() -> {
            try {
                String url = API_BASE_URL + "/api/poll-call-triggers?employeeId=" + employeeId + "&deviceId=" + deviceId;
                Log.d(TAG, "Polling URL: " + url);
                
                HttpURLConnection connection = (HttpURLConnection) new URL(url).openConnection();
                connection.setRequestMethod("GET");
                connection.setConnectTimeout(10000);
                connection.setReadTimeout(10000);
                connection.setRequestProperty("Content-Type", "application/json");
                
                int responseCode = connection.getResponseCode();
                Log.d(TAG, "Poll response code: " + responseCode);
                
                if (responseCode == HttpURLConnection.HTTP_OK) {
                    BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
                    StringBuilder response = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        response.append(line);
                    }
                    reader.close();
                    
                    String responseBody = response.toString();
                    Log.d(TAG, "Poll response: " + responseBody);
                    
                    JSONObject jsonResponse = new JSONObject(responseBody);
                    if (jsonResponse.getBoolean("success")) {
                        JSONArray triggers = jsonResponse.getJSONArray("triggers");
                        
                        for (int i = 0; i < triggers.length(); i++) {
                            JSONObject trigger = triggers.getJSONObject(i);
                            processTrigger(trigger);
                        }
                    }
                } else {
                    Log.e(TAG, "Poll failed with response code: " + responseCode);
                }
                
                connection.disconnect();
                
            } catch (Exception e) {
                Log.e(TAG, "Error polling for call triggers", e);
            }
        }).start();
    }

    private void processTrigger(JSONObject trigger) {
        try {
            int triggerId = trigger.getInt("id");
            String phoneNumber = trigger.getString("phone_number");
            String clientName = trigger.getString("client_name");
            String status = trigger.getString("status");
            
            Log.d(TAG, "Processing trigger: ID=" + triggerId + ", Phone=" + phoneNumber + ", Client=" + clientName);
            
            if ("pending".equals(status)) {
                // Update trigger status to 'executed'
                updateTriggerStatus(triggerId, "executed", null);
                
                // Make the call
                makeCall(phoneNumber, clientName, triggerId);
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Error processing trigger", e);
        }
    }

    private void makeCall(String phoneNumber, String clientName, int triggerId) {
        try {
            Log.d(TAG, "Making call to: " + phoneNumber + " for client: " + clientName);
            
            Intent callIntent = new Intent(Intent.ACTION_CALL);
            callIntent.setData(Uri.parse("tel:" + phoneNumber));
            callIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            
            startActivity(callIntent);
            
            Log.d(TAG, "Call initiated successfully for trigger ID: " + triggerId);
            
        } catch (Exception e) {
            Log.e(TAG, "Error making call", e);
            // Update trigger status to 'failed'
            updateTriggerStatus(triggerId, "failed", "Error making call: " + e.getMessage());
        }
    }

    private void updateTriggerStatus(int triggerId, String status, String responseData) {
        new Thread(() -> {
            try {
                String url = API_BASE_URL + "/api/poll-call-triggers";
                Log.d(TAG, "Updating trigger status: " + triggerId + " to " + status);
                
                HttpURLConnection connection = (HttpURLConnection) new URL(url).openConnection();
                connection.setRequestMethod("POST");
                connection.setConnectTimeout(10000);
                connection.setReadTimeout(10000);
                connection.setRequestProperty("Content-Type", "application/json");
                connection.setDoOutput(true);
                
                JSONObject requestBody = new JSONObject();
                requestBody.put("triggerId", triggerId);
                requestBody.put("status", status);
                requestBody.put("employeeId", employeeId);
                if (responseData != null) {
                    requestBody.put("responseData", responseData);
                }
                
                OutputStreamWriter writer = new OutputStreamWriter(connection.getOutputStream());
                writer.write(requestBody.toString());
                writer.flush();
                writer.close();
                
                int responseCode = connection.getResponseCode();
                Log.d(TAG, "Update trigger status response: " + responseCode);
                
                connection.disconnect();
                
            } catch (Exception e) {
                Log.e(TAG, "Error updating trigger status", e);
            }
        }).start();
    }
} 