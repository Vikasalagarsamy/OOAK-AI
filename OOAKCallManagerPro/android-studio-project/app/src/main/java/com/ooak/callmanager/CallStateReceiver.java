package com.ooak.callmanager;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import com.ooak.callmanager.utils.EmployeeAuthManager;
import android.telephony.TelephonyManager;
import android.util.Log;

public class CallStateReceiver extends BroadcastReceiver {
    private static final String TAG = "CallStateReceiver";
    
    private static String lastPhoneNumber = null;
    private static int lastCallState = TelephonyManager.CALL_STATE_IDLE;
    private static long callStartTime = 0;
    
    @Override
    public void onReceive(Context context, Intent intent) {
        try {
            String action = intent.getAction();
            
            if (TelephonyManager.ACTION_PHONE_STATE_CHANGED.equals(action)) {
                String state = intent.getStringExtra(TelephonyManager.EXTRA_STATE);
                String phoneNumber = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER);
                
                handlePhoneStateChange(context, state, phoneNumber);
                
            } else if (Intent.ACTION_NEW_OUTGOING_CALL.equals(action)) {
                String phoneNumber = intent.getStringExtra(Intent.EXTRA_PHONE_NUMBER);
                handleOutgoingCall(context, phoneNumber);
            }
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Error in CallStateReceiver", e);
        }
    }
    
    private void handlePhoneStateChange(Context context, String state, String phoneNumber) {
        int callState = getCallStateFromString(state);
        
        Log.d(TAG, "📞 Phone state changed: " + state + " (" + callState + ") - Number: " + 
              (phoneNumber != null ? phoneNumber : "unknown"));
        
        switch (callState) {
            case TelephonyManager.CALL_STATE_RINGING:
                Log.d(TAG, "📲 Incoming call ringing: " + phoneNumber);
                lastPhoneNumber = phoneNumber;
                break;
                
            case TelephonyManager.CALL_STATE_OFFHOOK:
                if (lastCallState == TelephonyManager.CALL_STATE_RINGING || 
                    lastCallState == TelephonyManager.CALL_STATE_IDLE) {
                    
                    Log.d(TAG, "📞 Call started/answered");
                    callStartTime = System.currentTimeMillis();
                    
                    // If we have a phone number, ensure recording detection service is running
                    if (lastPhoneNumber != null) {
                        ensureRecordingDetectionServiceRunning(context);
                    }
                }
                break;
                
            case TelephonyManager.CALL_STATE_IDLE:
                if (lastCallState == TelephonyManager.CALL_STATE_OFFHOOK) {
                    long callDuration = callStartTime > 0 ? 
                        System.currentTimeMillis() - callStartTime : 0;
                    
                    Log.d(TAG, "📞 Call ended - Duration: " + (callDuration / 1000) + "s");
                    
                    // Notify recording detection service of call end
                    if (lastPhoneNumber != null && callDuration > 0) {
                        notifyCallEnded(context, lastPhoneNumber, callStartTime, callDuration);
                    }
                    
                    // Reset state
                    lastPhoneNumber = null;
                    callStartTime = 0;
                }
                break;
        }
        
        lastCallState = callState;
    }
    
    private void handleOutgoingCall(Context context, String phoneNumber) {
        Log.d(TAG, "📞 Outgoing call initiated: " + phoneNumber);
        lastPhoneNumber = phoneNumber;
        
        // Ensure recording detection service is running
        ensureRecordingDetectionServiceRunning(context);
    }
    
    private int getCallStateFromString(String state) {
        if (TelephonyManager.EXTRA_STATE_RINGING.equals(state)) {
            return TelephonyManager.CALL_STATE_RINGING;
        } else if (TelephonyManager.EXTRA_STATE_OFFHOOK.equals(state)) {
            return TelephonyManager.CALL_STATE_OFFHOOK;
        } else if (TelephonyManager.EXTRA_STATE_IDLE.equals(state)) {
            return TelephonyManager.CALL_STATE_IDLE;
        }
        return TelephonyManager.CALL_STATE_IDLE;
    }
    
    private void ensureRecordingDetectionServiceRunning(Context context) {
        try {
            // Check if employee is authenticated
            EmployeeAuthManager authManager = new EmployeeAuthManager(context);
            String employeeId = authManager.getEmployeeId();
            
            if (employeeId != null) {
                Intent serviceIntent = new Intent(context, CallRecordingDetectionService.class);
                context.startService(serviceIntent);
                Log.d(TAG, "🎤 Ensured Call Recording Detection Service is running");
            } else {
                Log.w(TAG, "⚠️ No employee authentication - skipping recording detection");
            }
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Error starting recording detection service", e);
        }
    }
    
    private void notifyCallEnded(Context context, String phoneNumber, long startTime, long duration) {
        try {
            // Send broadcast to recording detection service
            Intent intent = new Intent("com.ooak.callmanager.CALL_ENDED");
            intent.putExtra("phoneNumber", phoneNumber);
            intent.putExtra("startTime", startTime);
            intent.putExtra("duration", duration);
            context.sendBroadcast(intent);
            
            Log.d(TAG, "📡 Notified recording service of call end: " + phoneNumber);
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Error notifying call end", e);
        }
    }
} 