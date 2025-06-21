package com.ooak.callmanager.services;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.telephony.PhoneStateListener;
import android.telephony.TelephonyManager;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import com.ooak.callmanager.MainActivity;
import com.ooak.callmanager.R;
import com.ooak.callmanager.api.OOAKCRMApiClient;
import com.ooak.callmanager.models.CallRecord;
import com.ooak.callmanager.utils.EmployeeAuthManager;
import com.ooak.callmanager.utils.ContactHelper;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.IOException;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

public class CallMonitoringService extends Service {
    
    private static final String TAG = "CallMonitoringService";
    private static final String CHANNEL_ID = "call_monitoring_channel";
    private static final int NOTIFICATION_ID = 1001;
    
    private static boolean isRunning = false;
    
    private TelephonyManager telephonyManager;
    private CallStateListener callStateListener;
    private OOAKCRMApiClient crmApiClient;
    private EmployeeAuthManager authManager;
    private CallEventReceiver callEventReceiver;
    
    private CallRecord currentCall;
    private Map<String, CallRecord> activeCalls = new HashMap<>();
    
    private ContactHelper contactHelper;
    private OOAKCRMApiClient apiClient;
    
    // Call trigger polling
    private Handler callTriggerHandler;
    private Runnable callTriggerChecker;
    private static final int POLL_INTERVAL_MS = 5000; // Poll every 5 seconds
    private OkHttpClient httpClient;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "🎯 Call Monitoring Service created");
        
        initializeService();
        createNotificationChannel();
        startForeground(NOTIFICATION_ID, createNotification());
        
        isRunning = true;
        
        contactHelper = new ContactHelper(this);
        apiClient = new OOAKCRMApiClient(this);
        
        Log.d(TAG, contactHelper.getCacheInfo());
    }

    private void initializeService() {
        telephonyManager = (TelephonyManager) getSystemService(Context.TELEPHONY_SERVICE);
        callStateListener = new CallStateListener();
        crmApiClient = new OOAKCRMApiClient(this);
        authManager = new EmployeeAuthManager(this);
        callEventReceiver = new CallEventReceiver();
        
        Log.d(TAG, "Service initialized - crmApiClient: " + (crmApiClient != null ? "OK" : "NULL"));
        Log.d(TAG, "Employee ID: " + authManager.getEmployeeId());
        
        // Register phone state listener with NEW_OUTGOING_CALL detection
        if (telephonyManager != null) {
            telephonyManager.listen(callStateListener, 
                PhoneStateListener.LISTEN_CALL_STATE | 
                PhoneStateListener.LISTEN_CALL_FORWARDING_INDICATOR);
            Log.d(TAG, "Phone state listener registered with outgoing call detection");
        } else {
            Log.e(TAG, "TelephonyManager is null!");
        }
        
        // Register call event receiver
        IntentFilter callEventFilter = new IntentFilter();
        callEventFilter.addAction("com.ooak.callmanager.CALL_DETECTED");
        callEventFilter.addAction("com.ooak.callmanager.CALL_RINGING");
        callEventFilter.addAction("com.ooak.callmanager.CALL_CONNECTED");
        callEventFilter.addAction("com.ooak.callmanager.CALL_STARTED");
        callEventFilter.addAction("com.ooak.callmanager.CALL_ENDED");
        callEventFilter.addAction("com.ooak.callmanager.CHECK_FOR_RECORDING");
        
        // Android 14+ requires explicit export flag
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(callEventReceiver, callEventFilter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(callEventReceiver, callEventFilter);
        }
        Log.d(TAG, "Call event receiver registered");
        
        // Initialize call trigger polling
        initializeCallTriggerPolling();
    }

    private void initializeCallTriggerPolling() {
        httpClient = new OkHttpClient.Builder()
            .connectTimeout(10, java.util.concurrent.TimeUnit.SECONDS)
            .readTimeout(15, java.util.concurrent.TimeUnit.SECONDS)
            .build();
            
        callTriggerHandler = new Handler(Looper.getMainLooper());
        callTriggerChecker = new Runnable() {
            @Override
            public void run() {
                checkForCallTriggers();
                // Schedule next check
                callTriggerHandler.postDelayed(this, POLL_INTERVAL_MS);
            }
        };
        
        // Start polling after a short delay
        callTriggerHandler.postDelayed(callTriggerChecker, 2000);
        Log.d(TAG, "📡 Call trigger polling initialized");
    }
    
    private void checkForCallTriggers() {
        if (!authManager.isEmployeeAuthenticated()) {
            Log.w(TAG, "⚠️ Employee not authenticated, skipping call trigger check");
            return;
        }
        
        String employeeId = authManager.getEmployeeId();
        if (employeeId == null || employeeId.isEmpty()) {
            Log.w(TAG, "⚠️ No employee ID available for call trigger check");
            return;
        }
        
        String url = "https://portal.ooak.photography/api/check-call-triggers?employeeId=" + employeeId;
        Request request = new Request.Builder()
            .url(url)
            .get()
            .build();
            
        httpClient.newCall(request).enqueue(new okhttp3.Callback() {
            @Override
            public void onFailure(okhttp3.Call call, IOException e) {
                Log.e(TAG, "❌ Call trigger check failed: " + e.getMessage());
            }
            
            @Override
            public void onResponse(okhttp3.Call call, okhttp3.Response response) throws IOException {
                try {
                    String responseBody = response.body().string();
                    if (response.isSuccessful()) {
                        Log.d(TAG, "📡 Call trigger response: " + responseBody);
                        handleCallTriggerResponse(responseBody);
                    } else {
                        Log.w(TAG, "⚠️ Call trigger check HTTP error: " + response.code());
                    }
                } catch (Exception e) {
                    Log.e(TAG, "❌ Error processing call trigger response", e);
                }
            }
        });
    }
    
    private void handleCallTriggerResponse(String responseBody) {
        try {
            org.json.JSONObject jsonResponse = new org.json.JSONObject(responseBody);
            
            if (jsonResponse.getBoolean("success") && jsonResponse.has("triggers")) {
                org.json.JSONArray triggers = jsonResponse.getJSONArray("triggers");
                
                for (int i = 0; i < triggers.length(); i++) {
                    org.json.JSONObject trigger = triggers.getJSONObject(i);
                    
                    String phoneNumber = trigger.getString("phone_number");
                    String clientName = trigger.optString("client_name", "Unknown Client");
                    String taskId = trigger.optString("task_id", "");
                    
                    Log.i(TAG, "🔔 Call trigger received: " + clientName + " (" + phoneNumber + ")");
                    
                    // Show notification
                    showCallTriggerNotification(phoneNumber, clientName);
                    
                    // Auto-initiate call after a short delay
                    callTriggerHandler.postDelayed(() -> {
                        initiateTriggeredCall(phoneNumber, taskId, clientName);
                    }, 1000);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "❌ Error parsing call trigger response", e);
        }
    }
    
    private void showCallTriggerNotification(String phoneNumber, String clientName) {
        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_phone)
            .setContentTitle("Call Trigger Received")
            .setContentText("Calling " + clientName + " (" + phoneNumber + ")")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true);
            
        notificationManager.notify(2000, builder.build());
    }
    
    private void initiateTriggeredCall(String phoneNumber, String taskId, String clientName) {
        Log.i(TAG, "🔔 Initiating triggered call to: " + clientName + " (" + phoneNumber + ")");
        
        try {
            Intent callIntent = new Intent(Intent.ACTION_CALL);
            callIntent.setData(Uri.parse("tel:" + phoneNumber));
            callIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(callIntent);
            
            // Update service notification
            updateNotification("Calling " + clientName + " (" + phoneNumber + ")");
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Error initiating triggered call", e);
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "CallMonitoringService started");
        
        // Handle CRM commands
        if (intent != null && intent.hasExtra("action")) {
            handleCRMCommand(intent);
        }
        
        return START_STICKY; // Restart if killed
    }

    private void handleCRMCommand(Intent intent) {
        String action = intent.getStringExtra("action");
        String phoneNumber = intent.getStringExtra("phone_number");
        String taskId = intent.getStringExtra("task_id");
        String leadId = intent.getStringExtra("lead_id");
        
        Log.d(TAG, "Handling CRM command: " + action + " for " + phoneNumber);
        
        switch (action) {
            case "make_call":
                initiateCall(phoneNumber, taskId, leadId);
                break;
            case "update_status":
                updateCallStatus(taskId, intent.getStringExtra("status"));
                break;
        }
    }

    private void initiateCall(String phoneNumber, String taskId, String leadId) {
        try {
            // Create call record before making call
            currentCall = new CallRecord();
            currentCall.setPhoneNumber(phoneNumber);
            currentCall.setTaskId(taskId);
            currentCall.setLeadId(leadId);
            currentCall.setEmployeeId(authManager.getEmployeeId());
            currentCall.setStartTime(new Date());
            currentCall.setDirection("outgoing");
            currentCall.setStatus("initiating");
            
            // Store in active calls
            activeCalls.put(phoneNumber, currentCall);
            
            // Notify CRM that call is being initiated
            crmApiClient.updateCallStatus(currentCall);
            
            // Make the actual phone call
            Intent callIntent = new Intent(Intent.ACTION_CALL);
            callIntent.setData(Uri.parse("tel:" + phoneNumber));
            callIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(callIntent);
            
            Log.d(TAG, "Call initiated to: " + phoneNumber);
            
        } catch (Exception e) {
            Log.e(TAG, "Error initiating call", e);
            if (currentCall != null) {
                currentCall.setStatus("failed");
                currentCall.setErrorMessage(e.getMessage());
                crmApiClient.updateCallStatus(currentCall);
            }
        }
    }

    private void updateCallStatus(String taskId, String status) {
        // Find call by task ID and update status
        for (CallRecord call : activeCalls.values()) {
            if (taskId.equals(call.getTaskId())) {
                call.setStatus(status);
                crmApiClient.updateCallStatus(call);
                break;
            }
        }
    }

    private class CallStateListener extends PhoneStateListener {
        
        @Override
        public void onCallStateChanged(int state, String phoneNumber) {
            super.onCallStateChanged(state, phoneNumber);
            
            Log.d(TAG, "Call state changed: " + state + " for " + phoneNumber);
            
            switch (state) {
                case TelephonyManager.CALL_STATE_IDLE:
                    handleCallEnded(phoneNumber);
                    break;
                    
                case TelephonyManager.CALL_STATE_RINGING:
                    handleIncomingCall(phoneNumber);
                    break;
                    
                case TelephonyManager.CALL_STATE_OFFHOOK:
                    handleCallConnected(phoneNumber);
                    break;
            }
        }
    }

    private void handleIncomingCall(String phoneNumber) {
        Log.d(TAG, "📞 INCOMING call RINGING: " + phoneNumber);
        
        CallRecord call = activeCalls.get(phoneNumber);
        if (call == null) {
            // Create record for new incoming call
            call = new CallRecord();
            call.setPhoneNumber(phoneNumber);
            call.setEmployeeId(authManager.getEmployeeId());
            call.setStartTime(new Date());
            call.setDirection("incoming");
            
            // Try to get caller name from mobile contacts first
            String mobileContactName = contactHelper.getContactName(phoneNumber);
            if (mobileContactName != null) {
                call.setContactName(mobileContactName);
                Log.d(TAG, "📱 Found mobile contact: " + mobileContactName + " for " + phoneNumber);
            } else {
                call.setContactName("Incoming Call - " + phoneNumber);
                Log.d(TAG, "📱 No mobile contact found for: " + phoneNumber);
            }
            
            // Start ringing tracking
            call.startRinging();
            
            activeCalls.put(phoneNumber, call);
            Log.d(TAG, "✅ Created incoming call record with RINGING tracking: " + phoneNumber);
        } else {
            // Update existing call to ringing status
            call.startRinging();
            Log.d(TAG, "✅ Updated existing call to RINGING: " + phoneNumber);
        }
        
        // Send ringing status to CRM immediately (with mobile contact name if available)
        if (crmApiClient != null) {
            try {
                // Include mobile contact name in the API call
                String currentContactName = call.getContactName();
                if (currentContactName != null && !currentContactName.startsWith("Incoming Call -")) {
                    // We have a meaningful name from mobile contacts
                    call.setMobileContactName(currentContactName);
                }
                
                crmApiClient.updateCallStatus(call);
                Log.d(TAG, "✅ Sent RINGING status to CRM with contact name: " + call.getContactName());
            } catch (Exception e) {
                Log.e(TAG, "❌ Error sending ringing status to CRM", e);
            }
        }
        
        // For incoming calls, check if this is a known contact/lead in CRM (this will override mobile contact if found)
        final CallRecord finalCall = call;
        crmApiClient.lookupContact(phoneNumber, new OOAKCRMApiClient.ContactLookupCallback() {
            @Override
            public void onContactFound(String leadId, String taskId, String contactName) {
                finalCall.setLeadId(leadId);
                finalCall.setTaskId(taskId);
                // CRM name takes priority over mobile contact name
                finalCall.setContactName(contactName);
                // Update with CRM contact info
                try {
                    crmApiClient.updateCallStatus(finalCall);
                    Log.d(TAG, "✅ Updated call with CRM contact info: " + contactName + " (overriding mobile contact)");
                } catch (Exception e) {
                    Log.e(TAG, "❌ Error updating call with CRM contact info", e);
                }
            }
            
            @Override
            public void onContactNotFound() {
                Log.d(TAG, "📋 Contact not found in CRM for: " + phoneNumber + " (using mobile contact: " + finalCall.getContactName() + ")");
            }
        });
    }

    private void handleCallConnected(String phoneNumber) {
        Log.d(TAG, "📞 Call ANSWERED/CONNECTED: " + phoneNumber);
        
        CallRecord call = activeCalls.get(phoneNumber);
        if (call == null) {
            // This shouldn't happen if we properly captured RINGING state
            // But create a record as fallback
            call = new CallRecord();
            call.setPhoneNumber(phoneNumber);
            call.setEmployeeId(authManager.getEmployeeId());
            call.setStartTime(new Date());
            call.setDirection("outgoing");
            call.setContactName("Mobile Call - " + phoneNumber);
            
            // Mark as answered immediately since we missed ringing phase
            call.callAnswered();
            activeCalls.put(phoneNumber, call);
            
            Log.d(TAG, "⚠️ Created new call record for missed ringing phase: " + phoneNumber);
        } else {
            // Call was properly tracked from ringing - mark as answered
            call.callAnswered();
            Log.d(TAG, "✅ Call ANSWERED - Ringing time: " + call.getRingingDuration() + "s");
        }
        
        // Send connected status to CRM immediately
        if (crmApiClient != null) {
            try {
                crmApiClient.updateCallStatus(call);
                Log.d(TAG, "✅ Sent CONNECTED status to CRM: " + phoneNumber);
            } catch (Exception e) {
                Log.e(TAG, "❌ Error sending connected status to CRM", e);
            }
        }
        
        // Update notification
        updateNotification("Call in progress: " + phoneNumber);
    }

    private void handleCallEnded(String phoneNumber) {
        Log.d(TAG, "📞 Call ENDED: " + phoneNumber);
        
        CallRecord call = activeCalls.get(phoneNumber);
        if (call == null) {
            // Create a call record for calls that weren't tracked from start
            call = new CallRecord();
            call.setPhoneNumber(phoneNumber);
            call.setEmployeeId(authManager.getEmployeeId());
            call.setStartTime(new Date(System.currentTimeMillis() - 60000)); // Assume 1 minute ago
            call.setDirection("outgoing");
            call.setContactName("Mobile Call - " + phoneNumber);
            
            Log.d(TAG, "⚠️ Created call record for untracked ended call: " + phoneNumber);
        }
        
        // Use new real-time tracking to calculate durations
        call.callEnded();
        
        // Determine call outcome based on REAL business logic
        String finalStatus = determineCallOutcome(call);
        call.setStatus(finalStatus);
        
        Log.d(TAG, "📊 FINAL CALL SUMMARY:");
        Log.d(TAG, "   📞 Phone: " + phoneNumber);
        Log.d(TAG, "   ⏰ Ringing: " + call.getRingingDuration() + "s");
        Log.d(TAG, "   💬 Talking: " + call.getTalkingDuration() + "s");
        Log.d(TAG, "   📊 Total: " + call.getDuration() + "s");
        Log.d(TAG, "   ✅ Status: " + finalStatus);
        
        // Final update to CRM
        Log.d(TAG, "About to send final call status to CRM - crmApiClient: " + (crmApiClient != null ? "OK" : "NULL"));
        if (crmApiClient != null) {
            try {
                crmApiClient.updateCallStatus(call);
                Log.d(TAG, "✅ Sent final call status to CRM: " + finalStatus + " for " + phoneNumber);
            } catch (Exception e) {
                Log.e(TAG, "❌ Error sending final call status to CRM", e);
            }
        } else {
            Log.e(TAG, "❌ crmApiClient is null - cannot send final call status");
        }
        
        // Remove from active calls
        activeCalls.remove(phoneNumber);
        
        // TODO: Add call recording detection later
        Log.d(TAG, "💾 Call ended - will implement recording detection later: " + phoneNumber);
        
        // Update notification
        updateNotification("Call monitoring active");
    }
    
    /**
     * REAL-TIME call outcome determination based on ACTUAL call duration
     * No simulations - pure business logic based on REAL data
     */
    private String determineCallOutcome(CallRecord call) {
        boolean wasConnected = call.getConnectedTime() != null;
        String direction = call.getDirection();
        int totalDuration = call.getDuration(); // REAL-TIME total call duration
        
        Log.d(TAG, "🔍 REAL-TIME BUSINESS ANALYSIS:");
        Log.d(TAG, "   📞 Direction: " + direction);
        Log.d(TAG, "   📊 REAL Total Duration: " + totalDuration + "s");
        Log.d(TAG, "   🔗 Was Connected: " + wasConnected);
        
        // REAL-TIME BUSINESS LOGIC - Based on ACTUAL behavior
        
        // 1. If call was never marked as connected - definitely unanswered
        if (!wasConnected) {
            Log.d(TAG, "   ❌ OUTCOME: unanswered (never connected)");
            return "incoming".equals(direction) ? "missed" : "unanswered";
        }
        
        // 2. REAL-TIME: Very short calls (0-3s) = Instant disconnect/not answered
        if (totalDuration <= 3) {
            Log.d(TAG, "   ❌ OUTCOME: unanswered (too short - instant disconnect)");
            return "incoming".equals(direction) ? "missed" : "unanswered";
        }
        
        // 3. REAL-TIME: Short calls (4-8s) = Likely not answered or quick hangup
        if (totalDuration >= 4 && totalDuration <= 8) {
            Log.d(TAG, "   ❌ OUTCOME: unanswered (short duration - likely not answered)");
            return "incoming".equals(direction) ? "missed" : "unanswered";
        }
        
        // 4. REAL-TIME: Medium calls (9-15s) = Could be answered briefly or voicemail
        if (totalDuration >= 9 && totalDuration <= 15) {
            Log.d(TAG, "   ⚠️  BORDERLINE: " + totalDuration + "s - Could be brief answer or voicemail");
            Log.d(TAG, "   ❌ OUTCOME: unanswered (likely voicemail/brief pickup)");
            return "incoming".equals(direction) ? "missed" : "unanswered";
        }
        
        // 5. REAL-TIME: Longer calls (16s+) = Definitely answered conversation
        if (totalDuration >= 16) {
            Log.d(TAG, "   ✅ OUTCOME: answered (sufficient duration for actual conversation)");
            return "answered";
        }
        
        // 6. Default fallback
        Log.d(TAG, "   ⚠️  EDGE CASE: Defaulting to unanswered");
        return "incoming".equals(direction) ? "missed" : "unanswered";
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Call Monitoring",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Monitors phone calls for OOAK CRM integration");
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private Notification createNotification() {
        return createNotificationWithText("Call monitoring active");
    }

    private Notification createNotificationWithText(String text) {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 0, notificationIntent, 
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("OOAK Call Manager")
            .setContentText(text)
            .setSmallIcon(R.drawable.ic_phone)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build();
    }

    private void updateNotification(String text) {
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.notify(NOTIFICATION_ID, createNotificationWithText(text));
        }
    }

    public static boolean isRunning() {
        return isRunning;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null; // Not a bound service
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "CallMonitoringService destroyed");
        
        // Unregister phone state listener
        if (telephonyManager != null && callStateListener != null) {
            telephonyManager.listen(callStateListener, PhoneStateListener.LISTEN_NONE);
        }
        
        // Unregister call event receiver
        if (callEventReceiver != null) {
            try {
                unregisterReceiver(callEventReceiver);
                Log.d(TAG, "Call event receiver unregistered");
            } catch (Exception e) {
                Log.e(TAG, "Error unregistering call event receiver", e);
            }
        }
        
        isRunning = false;
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        super.onTaskRemoved(rootIntent);
        Log.d(TAG, "Task removed, restarting service");
        
        // Restart the service
        Intent restartServiceIntent = new Intent(getApplicationContext(), this.getClass());
        restartServiceIntent.setPackage(getPackageName());
        startService(restartServiceIntent);
    }
    
    // Broadcast receiver to handle call events from PhoneStateReceiver
    private class CallEventReceiver extends BroadcastReceiver {
        @Override
        public void onReceive(Context context, Intent intent) {
            String action = intent.getAction();
            Log.d(TAG, "📡 CallEventReceiver received: " + action);
            
            if ("com.ooak.callmanager.CALL_RINGING".equals(action)) {
                String phoneNumber = intent.getStringExtra("phone_number");
                String callType = intent.getStringExtra("call_type");
                int employeeId = intent.getIntExtra("employee_id", 0);
                long ringingStartTime = intent.getLongExtra("ringing_start_time", System.currentTimeMillis());
                
                Log.d(TAG, "🔊 CALL_RINGING received: " + phoneNumber + " (" + callType + ")");
                handleCallRinging(phoneNumber, callType, employeeId, ringingStartTime);
                
            } else if ("com.ooak.callmanager.CALL_CONNECTED".equals(action)) {
                String phoneNumber = intent.getStringExtra("phone_number");
                String callType = intent.getStringExtra("call_type");
                int employeeId = intent.getIntExtra("employee_id", 0);
                long connectedTime = intent.getLongExtra("connected_time", System.currentTimeMillis());
                long ringingDurationMs = intent.getLongExtra("ringing_duration_ms", 0);
                
                Log.d(TAG, "🔗 CALL_CONNECTED received: " + phoneNumber + " (ringing: " + (ringingDurationMs/1000) + "s)");
                handleCallConnected(phoneNumber, callType, employeeId, connectedTime, ringingDurationMs);
                
            } else if ("com.ooak.callmanager.CALL_STARTED".equals(action)) {
                String phoneNumber = intent.getStringExtra("phone_number");
                String callType = intent.getStringExtra("call_type");
                int employeeId = intent.getIntExtra("employee_id", 0);
                long startTime = intent.getLongExtra("start_time", System.currentTimeMillis());
                
                Log.d(TAG, "📞 CALL_STARTED received: " + phoneNumber + " (" + callType + ")");
                handleOutgoingCallStarted(phoneNumber);
                
            } else if ("com.ooak.callmanager.CALL_ENDED".equals(action)) {
                String phoneNumber = intent.getStringExtra("phone_number");
                int duration = intent.getIntExtra("duration", 0);
                int employeeId = intent.getIntExtra("employee_id", 0);
                long endTime = intent.getLongExtra("end_time", System.currentTimeMillis());
                String finalStatus = intent.getStringExtra("final_status");
                String direction = intent.getStringExtra("direction");
                
                Log.d(TAG, "📴 CALL_ENDED received: " + phoneNumber + " (duration: " + duration + "s, status: " + finalStatus + ", direction: " + direction + ")");
                handleCallEndedWithStatus(phoneNumber, duration, finalStatus, direction);
                
            } else if ("com.ooak.callmanager.CHECK_FOR_RECORDING".equals(action)) {
                String phoneNumber = intent.getStringExtra("phone_number");
                int callDuration = intent.getIntExtra("call_duration", 0);
                int employeeId = intent.getIntExtra("employee_id", 0);
                
                Log.d(TAG, "🎙️ CHECK_FOR_RECORDING received: " + phoneNumber);
                // Handle recording detection logic here if needed
            }
        }
    }
    
    private void handleOutgoingCallRinging(String phoneNumber) {
        Log.d(TAG, "📞 OUTGOING call RINGING detected: " + phoneNumber);
        
        CallRecord call = activeCalls.get(phoneNumber);
        if (call == null) {
            // Create new call record for outgoing call
            call = new CallRecord();
            call.setPhoneNumber(phoneNumber);
            call.setEmployeeId(authManager.getEmployeeId());
            call.setStartTime(new Date());
            call.setDirection("outgoing");
            call.setContactName("Mobile Call - " + phoneNumber);
            
            // Start ringing tracking
            call.startRinging();
            
            activeCalls.put(phoneNumber, call);
            Log.d(TAG, "✅ Created outgoing call with RINGING tracking: " + phoneNumber);
        } else {
            // Update existing call to ringing status
            call.startRinging();
            Log.d(TAG, "✅ Updated existing call to RINGING: " + phoneNumber);
        }
        
        // Send ringing status to CRM immediately
        if (crmApiClient != null) {
            try {
                crmApiClient.updateCallStatus(call);
                Log.d(TAG, "✅ Sent RINGING status to CRM: " + phoneNumber);
            } catch (Exception e) {
                Log.e(TAG, "❌ Error sending ringing status to CRM", e);
            }
        }
    }
    
    private void handleOutgoingCallStarted(String phoneNumber) {
        Log.d(TAG, "📞 REAL outgoing call detected: " + phoneNumber);
        
        CallRecord call = activeCalls.get(phoneNumber);
        if (call == null) {
            // Create new call record for outgoing call
            call = new CallRecord();
            call.setPhoneNumber(phoneNumber);
            call.setEmployeeId(authManager.getEmployeeId());
            call.setStartTime(new Date());
            call.setDirection("outgoing");
            call.setStatus("ringing");
            call.setContactName("Mobile Call - " + phoneNumber);
            
            activeCalls.put(phoneNumber, call);
            Log.d(TAG, "Created new outgoing call record: " + phoneNumber);
        } else {
            // Update existing call to ringing status
            call.setStatus("ringing");
            Log.d(TAG, "Updated existing call to ringing: " + phoneNumber);
        }
        
        // Send ringing status to CRM immediately
        if (crmApiClient != null) {
            try {
                crmApiClient.updateCallStatus(call);
                Log.d(TAG, "✅ Sent REAL ringing status to CRM: " + phoneNumber);
            } catch (Exception e) {
                Log.e(TAG, "❌ Error sending ringing status to CRM", e);
            }
        }
    }

    private void handleCallRinging(String phoneNumber, String callType, int employeeId, long ringingStartTime) {
        Log.d(TAG, "🔊 Call RINGING started: " + phoneNumber + " (" + callType + ")");
        
        CallRecord call = activeCalls.get(phoneNumber);
        if (call == null) {
            // Create new call record for ringing call
            call = new CallRecord();
            call.setPhoneNumber(phoneNumber);
            call.setEmployeeId(String.valueOf(employeeId));
            call.setStartTime(new Date(ringingStartTime));
            call.setDirection(callType.toLowerCase());
            call.setContactName("Call - " + phoneNumber);
            
            // Start ringing tracking with specific start time
            call.setRingingStartTime(new Date(ringingStartTime));
            
            activeCalls.put(phoneNumber, call);
            Log.d(TAG, "✅ Created call record for RINGING: " + phoneNumber);
        } else {
            // Update existing call to ringing status
            call.setRingingStartTime(new Date(ringingStartTime));
            Log.d(TAG, "✅ Updated existing call to RINGING: " + phoneNumber);
        }
        
        call.setStatus("ringing");
        
        // Send ringing status to CRM immediately
        if (crmApiClient != null) {
            try {
                crmApiClient.updateCallStatus(call);
                Log.d(TAG, "✅ Sent RINGING status to CRM: " + phoneNumber);
            } catch (Exception e) {
                Log.e(TAG, "❌ Error sending ringing status to CRM", e);
            }
        }
        
        // Update notification
        updateNotification("Call ringing: " + phoneNumber);
    }

    private void handleCallConnected(String phoneNumber, String callType, int employeeId, long connectedTime, long ringingDurationMs) {
        Log.d(TAG, "🔗 Call CONNECTED/ANSWERED: " + phoneNumber + " (ringing: " + (ringingDurationMs/1000) + "s)");
        
        CallRecord call = activeCalls.get(phoneNumber);
        if (call == null) {
            // Create new call record if missing
            call = new CallRecord();
            call.setPhoneNumber(phoneNumber);
            call.setEmployeeId(String.valueOf(employeeId));
            call.setStartTime(new Date(connectedTime - ringingDurationMs));
            call.setDirection(callType.toLowerCase());
            call.setContactName("Call - " + phoneNumber);
            
            // Set ringing times based on provided duration
            if (ringingDurationMs > 0) {
                call.setRingingStartTime(new Date(connectedTime - ringingDurationMs));
                call.setRingingEndTime(new Date(connectedTime));
            }
            
            activeCalls.put(phoneNumber, call);
            Log.d(TAG, "✅ Created call record for CONNECTED: " + phoneNumber);
        } else {
            // Update existing call with connection time
            call.setRingingEndTime(new Date(connectedTime));
            Log.d(TAG, "✅ Updated existing call to CONNECTED: " + phoneNumber);
        }
        
        // Mark call as answered/connected
        call.setConnectedTime(new Date(connectedTime));
        call.setWasAnswered(true);
        call.setStatus("connected");
        
        // Calculate and log ringing duration
        call.calculateRingingDuration();
        int calculatedRingingDuration = call.getRingingDuration();
        Log.d(TAG, "⏰ Calculated ringing duration: " + calculatedRingingDuration + "s");
        
        // Send connected status to CRM immediately
        if (crmApiClient != null) {
            try {
                crmApiClient.updateCallStatus(call);
                Log.d(TAG, "✅ Sent CONNECTED status to CRM: " + phoneNumber);
            } catch (Exception e) {
                Log.e(TAG, "❌ Error sending connected status to CRM", e);
            }
        }
        
        // Update notification
        updateNotification("Call in progress: " + phoneNumber);
    }

    private void handleCallEndedWithStatus(String phoneNumber, int duration, String finalStatus, String direction) {
        Log.d(TAG, "📞 Call ENDED: " + phoneNumber + " (duration: " + duration + "s, status: " + finalStatus + ", direction: " + direction + ")");
        
        CallRecord call = activeCalls.get(phoneNumber);
        if (call == null) {
            // Create a call record for calls that weren't tracked from start
            call = new CallRecord();
            call.setPhoneNumber(phoneNumber);
            call.setEmployeeId(authManager.getEmployeeId());
            call.setStartTime(new Date(System.currentTimeMillis() - (duration * 1000L))); // Start time based on duration
            call.setDirection(direction);
            call.setContactName("Mobile Call - " + phoneNumber);
            
            Log.d(TAG, "⚠️ Created call record for untracked ended call: " + phoneNumber);
        }
        
        // Set duration and final status directly from PhoneStateReceiver
        call.setDuration(duration);
        call.setStatus(finalStatus);
        call.callEnded(); // Mark as ended
        
        Log.d(TAG, "📊 FINAL CALL SUMMARY:");
        Log.d(TAG, "   📞 Phone: " + phoneNumber);
        Log.d(TAG, "   📊 Duration: " + duration + "s");
        Log.d(TAG, "   📍 Direction: " + direction);
        Log.d(TAG, "   ✅ Final Status: " + finalStatus + " (from PhoneStateReceiver)");
        
        // Final update to CRM with the exact status determined by PhoneStateReceiver
        Log.d(TAG, "About to send final call status to CRM - crmApiClient: " + (crmApiClient != null ? "OK" : "NULL"));
        if (crmApiClient != null) {
            try {
                crmApiClient.updateCallStatus(call);
                Log.d(TAG, "✅ Sent final call status to CRM: " + finalStatus + " for " + phoneNumber);
            } catch (Exception e) {
                Log.e(TAG, "❌ Error sending final call status to CRM", e);
            }
        } else {
            Log.e(TAG, "❌ crmApiClient is null - cannot send final call status");
        }
        
        // Remove from active calls
        activeCalls.remove(phoneNumber);
        
        // TODO: Add call recording detection later
        Log.d(TAG, "💾 Call ended - will implement recording detection later: " + phoneNumber);
        
        // Update notification
        updateNotification("Call monitoring active");
    }
} 