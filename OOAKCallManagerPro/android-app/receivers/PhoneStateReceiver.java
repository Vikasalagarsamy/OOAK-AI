package com.ooak.callmanager.receivers;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.telephony.TelephonyManager;
import android.util.Log;
import com.ooak.callmanager.models.CallRecord;
import com.ooak.callmanager.utils.EmployeeAuthManager;

public class PhoneStateReceiver extends BroadcastReceiver {
    private static final String TAG = "PhoneStateReceiver";
    
    private static String lastPhoneNumber = "";
    private static long callStartTime = 0;
    private static boolean isCallActive = false;
    
    @Override
    public void onReceive(Context context, Intent intent) {
        try {
            String action = intent.getAction();
            
            if (TelephonyManager.ACTION_PHONE_STATE_CHANGED.equals(action)) {
                String state = intent.getStringExtra(TelephonyManager.EXTRA_STATE);
                String phoneNumber = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER);
                
                handlePhoneStateChange(context, state, phoneNumber);
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Error in PhoneStateReceiver", e);
        }
    }
    
    private void handlePhoneStateChange(Context context, String state, String phoneNumber) {
        EmployeeAuthManager authManager = new EmployeeAuthManager(context);
        
        if (!authManager.isEmployeeAuthenticated()) {
            Log.d(TAG, "Employee not authenticated, ignoring phone state change");
            return;
        }
        
        Log.d(TAG, "Phone state changed: " + state + ", Number: " + phoneNumber);
        
        switch (state) {
            case TelephonyManager.EXTRA_STATE_RINGING:
                handleIncomingCall(context, phoneNumber, authManager);
                break;
                
            case TelephonyManager.EXTRA_STATE_OFFHOOK:
                handleCallStarted(context, phoneNumber, authManager);
                break;
                
            case TelephonyManager.EXTRA_STATE_IDLE:
                handleCallEnded(context, authManager);
                break;
        }
    }
    
    private void handleIncomingCall(Context context, String phoneNumber, EmployeeAuthManager authManager) {
        Log.i(TAG, "Incoming call detected: " + phoneNumber);
        
        lastPhoneNumber = phoneNumber != null ? phoneNumber : "Unknown";
        
        // Create call record for incoming call
        CallRecord callRecord = new CallRecord(lastPhoneNumber, authManager.getEmployeeId(), "INCOMING");
        callRecord.setEmployeeName(authManager.getEmployeeName());
        
        // Broadcast call detected event
        Intent callDetectedIntent = new Intent("com.ooak.callmanager.CALL_DETECTED");
        callDetectedIntent.putExtra("phone_number", lastPhoneNumber);
        callDetectedIntent.putExtra("call_type", "INCOMING");
        callDetectedIntent.putExtra("employee_id", authManager.getEmployeeId());
        context.sendBroadcast(callDetectedIntent);
    }
    
    private void handleCallStarted(Context context, String phoneNumber, EmployeeAuthManager authManager) {
        Log.i(TAG, "Call started: " + phoneNumber);
        
        if (phoneNumber != null) {
            lastPhoneNumber = phoneNumber;
        }
        
        isCallActive = true;
        callStartTime = System.currentTimeMillis();
        
        // Determine call type (if we didn't get it from ringing, it's likely outgoing)
        String callType = lastPhoneNumber.equals(phoneNumber) ? "INCOMING" : "OUTGOING";
        
        // Create call record
        CallRecord callRecord = new CallRecord(lastPhoneNumber, authManager.getEmployeeId(), callType);
        callRecord.setEmployeeName(authManager.getEmployeeName());
        
        // Broadcast call started event
        Intent callStartedIntent = new Intent("com.ooak.callmanager.CALL_STARTED");
        callStartedIntent.putExtra("phone_number", lastPhoneNumber);
        callStartedIntent.putExtra("call_type", callType);
        callStartedIntent.putExtra("employee_id", authManager.getEmployeeId());
        callStartedIntent.putExtra("start_time", callStartTime);
        context.sendBroadcast(callStartedIntent);
    }
    
    private void handleCallEnded(Context context, EmployeeAuthManager authManager) {
        if (!isCallActive) {
            return;
        }
        
        long callEndTime = System.currentTimeMillis();
        int duration = (int) ((callEndTime - callStartTime) / 1000); // Duration in seconds
        
        Log.i(TAG, "Call ended. Duration: " + duration + " seconds, Number: " + lastPhoneNumber);
        
        // Create final call record
        CallRecord callRecord = new CallRecord(lastPhoneNumber, authManager.getEmployeeId(), "COMPLETED");
        callRecord.setEmployeeName(authManager.getEmployeeName());
        callRecord.setDuration(duration);
        
        // Broadcast call ended event
        Intent callEndedIntent = new Intent("com.ooak.callmanager.CALL_ENDED");
        callEndedIntent.putExtra("phone_number", lastPhoneNumber);
        callEndedIntent.putExtra("duration", duration);
        callEndedIntent.putExtra("employee_id", authManager.getEmployeeId());
        callEndedIntent.putExtra("end_time", callEndTime);
        context.sendBroadcast(callEndedIntent);
        
        // Reset call state
        isCallActive = false;
        callStartTime = 0;
        
        // Trigger recording detection after a short delay
        Intent recordingCheckIntent = new Intent("com.ooak.callmanager.CHECK_FOR_RECORDING");
        recordingCheckIntent.putExtra("phone_number", lastPhoneNumber);
        recordingCheckIntent.putExtra("call_duration", duration);
        recordingCheckIntent.putExtra("employee_id", authManager.getEmployeeId());
        
        // Send delayed broadcast to allow recording file to be created
        android.os.Handler handler = new android.os.Handler();
        handler.postDelayed(() -> context.sendBroadcast(recordingCheckIntent), 5000); // 5 second delay
    }
    
    public static boolean isCallCurrentlyActive() {
        return isCallActive;
    }
    
    public static String getLastPhoneNumber() {
        return lastPhoneNumber;
    }
    
    public static long getCallStartTime() {
        return callStartTime;
    }
} 