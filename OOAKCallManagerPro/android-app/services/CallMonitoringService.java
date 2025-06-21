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
import android.os.IBinder;
import android.telephony.PhoneStateListener;
import android.telephony.TelephonyManager;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import com.ooak.callmanager.MainActivity;
import com.ooak.callmanager.R;
import com.ooak.callmanager.api.OOAKCRMApiClient;
import com.ooak.callmanager.models.CallRecord;
import com.ooak.callmanager.utils.EmployeeAuthManager;
import com.ooak.callmanager.receivers.OutgoingCallReceiver;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

public class CallMonitoringService extends Service {
    
    private static final String TAG = "CallMonitoringService";
    private static final String CHANNEL_ID = "call_monitoring_channel";
    private static final int NOTIFICATION_ID = 1001;
    
    private static boolean isRunning = false;
    
    private TelephonyManager telephonyManager;
    private CallStateListener callStateListener;
    private OOAKCRMApiClient crmApiClient;
    private EmployeeAuthManager authManager;
    private OutgoingCallReceiver outgoingCallReceiver;
    
    private CallRecord currentCall;
    private Map<String, CallRecord> activeCalls = new HashMap<>();

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "CallMonitoringService created");
        
        initializeService();
        createNotificationChannel();
        startForeground(NOTIFICATION_ID, createNotification());
        
        isRunning = true;
    }

    private void initializeService() {
        telephonyManager = (TelephonyManager) getSystemService(Context.TELEPHONY_SERVICE);
        callStateListener = new CallStateListener();
        crmApiClient = new OOAKCRMApiClient(this);
        authManager = new EmployeeAuthManager(this);
        outgoingCallReceiver = new OutgoingCallReceiver();
        
        Log.d(TAG, "Service initialized - crmApiClient: " + (crmApiClient != null ? "OK" : "NULL"));
        Log.d(TAG, "Employee ID: " + authManager.getEmployeeId());
        
        // Register phone state listener
        if (telephonyManager != null) {
            telephonyManager.listen(callStateListener, PhoneStateListener.LISTEN_CALL_STATE);
            Log.d(TAG, "Phone state listener registered");
        } else {
            Log.e(TAG, "TelephonyManager is null!");
        }
        
        // Register outgoing call receiver
        IntentFilter outgoingCallFilter = new IntentFilter(Intent.ACTION_NEW_OUTGOING_CALL);
        registerReceiver(outgoingCallReceiver, outgoingCallFilter);
        Log.d(TAG, "Outgoing call receiver registered");
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
        Log.d(TAG, "Call ringing: " + phoneNumber);
        
        CallRecord call = activeCalls.get(phoneNumber);
        if (call == null) {
            // Create record for new call (could be incoming or outgoing)
            call = new CallRecord();
            call.setPhoneNumber(phoneNumber);
            call.setEmployeeId(authManager.getEmployeeId());
            call.setStartTime(new Date());
            call.setStatus("ringing");
            
            // Determine direction based on existing call records or assume incoming
            // For outgoing calls initiated through the app, we already have a record
            // For manual outgoing calls, we detect them here in RINGING state
            if (activeCalls.isEmpty()) {
                // If no active calls, this could be an outgoing call we didn't initiate
                call.setDirection("outgoing");
                call.setContactName("Mobile Call - " + phoneNumber);
                Log.d(TAG, "Detected outgoing call in ringing state: " + phoneNumber);
            } else {
                // Traditional incoming call
                call.setDirection("incoming");
                Log.d(TAG, "Incoming call ringing: " + phoneNumber);
            }
            
            activeCalls.put(phoneNumber, call);
        } else {
            // Update existing call to ringing status
            call.setStatus("ringing");
            Log.d(TAG, "Updated existing call to ringing: " + phoneNumber);
        }
        
        // Send ringing status to CRM immediately
        if (crmApiClient != null) {
            try {
                crmApiClient.updateCallStatus(call);
                Log.d(TAG, "✅ Sent ringing status to CRM: " + phoneNumber);
            } catch (Exception e) {
                Log.e(TAG, "❌ Error sending ringing status to CRM", e);
            }
        }
        
        // For incoming calls, check if this is a known contact/lead in CRM
        if ("incoming".equals(call.getDirection())) {
            final CallRecord finalCall = call;
            crmApiClient.lookupContact(phoneNumber, new OOAKCRMApiClient.ContactLookupCallback() {
                @Override
                public void onContactFound(String leadId, String taskId, String contactName) {
                    finalCall.setLeadId(leadId);
                    finalCall.setTaskId(taskId);
                    finalCall.setContactName(contactName);
                    // Update with contact info
                    try {
                        crmApiClient.updateCallStatus(finalCall);
                        Log.d(TAG, "✅ Updated call with contact info: " + contactName);
                    } catch (Exception e) {
                        Log.e(TAG, "❌ Error updating call with contact info", e);
                    }
                }
                
                @Override
                public void onContactNotFound() {
                    Log.d(TAG, "Contact not found in CRM for: " + phoneNumber);
                }
            });
        }
    }

    private void handleCallConnected(String phoneNumber) {
        Log.d(TAG, "Call connected: " + phoneNumber);
        
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
            call.setStatus("connected"); // Skip ringing since we missed it
            activeCalls.put(phoneNumber, call);
            
            Log.d(TAG, "Created new call record for missed ringing: " + phoneNumber);
        } else {
            // Update existing call to connected
            call.setStatus("connected");
            call.setConnectedTime(new Date());
            Log.d(TAG, "Updated call to connected: " + phoneNumber);
        }
        
        // Send connected status to CRM immediately
        if (crmApiClient != null) {
            try {
                crmApiClient.updateCallStatus(call);
                Log.d(TAG, "✅ Sent connected status to CRM: " + phoneNumber);
            } catch (Exception e) {
                Log.e(TAG, "❌ Error sending connected status to CRM", e);
            }
        }
        
        // Update notification
        updateNotification("Call in progress: " + phoneNumber);
    }

    private void handleCallEnded(String phoneNumber) {
        Log.d(TAG, "Call ended: " + phoneNumber);
        
        CallRecord call = activeCalls.get(phoneNumber);
        if (call == null) {
            // Create a call record for calls that weren't tracked from start
            call = new CallRecord();
            call.setPhoneNumber(phoneNumber);
            call.setEmployeeId(authManager.getEmployeeId());
            call.setStartTime(new Date(System.currentTimeMillis() - 60000)); // Assume 1 minute ago
            call.setDirection("outgoing");
            call.setContactName("Mobile Call - " + phoneNumber);
            
            Log.d(TAG, "Created call record for ended call: " + phoneNumber);
        }
        
        call.setStatus("completed");
        call.setEndTime(new Date());
        call.calculateDuration();
        
        // Final update to CRM
        Log.d(TAG, "About to send final call status to CRM - crmApiClient: " + (crmApiClient != null ? "OK" : "NULL"));
        if (crmApiClient != null) {
            try {
                crmApiClient.updateCallStatus(call);
                Log.d(TAG, "✅ Sent final call status to CRM: completed for " + phoneNumber);
            } catch (Exception e) {
                Log.e(TAG, "❌ Error sending final call status to CRM", e);
            }
        } else {
            Log.e(TAG, "❌ crmApiClient is null - cannot send final call status");
        }
        
        // Remove from active calls
        activeCalls.remove(phoneNumber);
        
        // Reset notification
        updateNotification("Call monitoring active");
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
        
        // Unregister outgoing call receiver
        if (outgoingCallReceiver != null) {
            try {
                unregisterReceiver(outgoingCallReceiver);
                Log.d(TAG, "Outgoing call receiver unregistered");
            } catch (Exception e) {
                Log.e(TAG, "Error unregistering outgoing call receiver", e);
            }
        }
        
        isRunning = false;
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        // Don't stop service when task is removed
        // Service should continue running in background
        Log.d(TAG, "Task removed, but service continues running");
    }

    // Broadcast receiver to detect outgoing calls
    private class OutgoingCallReceiver extends BroadcastReceiver {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (Intent.ACTION_NEW_OUTGOING_CALL.equals(intent.getAction())) {
                String phoneNumber = intent.getStringExtra(Intent.EXTRA_PHONE_NUMBER);
                Log.d(TAG, "🔥 OUTGOING CALL DETECTED: " + phoneNumber);
                
                if (phoneNumber != null && !phoneNumber.isEmpty()) {
                    handleOutgoingCallInitiated(phoneNumber);
                }
            }
        }
    }
    
    private void handleOutgoingCallInitiated(String phoneNumber) {
        Log.d(TAG, "📞 Outgoing call initiated: " + phoneNumber);
        
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
} 