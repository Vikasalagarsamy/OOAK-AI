package com.ooak.callmanager.receivers;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.telephony.TelephonyManager;
import android.util.Log;
import android.database.Cursor;
import android.provider.CallLog;
import com.ooak.callmanager.models.CallRecord;
import com.ooak.callmanager.utils.EmployeeAuthManager;

public class PhoneStateReceiver extends BroadcastReceiver {
    private static final String TAG = "PhoneStateReceiver";
    
    private static String lastPhoneNumber = "";
    private static long callStartTime = 0;
    private static boolean isCallActive = false;
    
    // Add static variables for REAL-TIME tracking
    private static String currentCallState = TelephonyManager.EXTRA_STATE_IDLE;
    private static long realTimeCallStart = 0;
    private static long realTimeRingingStart = 0;
    private static boolean isOutgoingCall = false;
    
    @Override
    public void onReceive(Context context, Intent intent) {
        try {
            String action = intent.getAction();
            Log.d(TAG, "📡 Broadcast received: " + action);
            
            if (TelephonyManager.ACTION_PHONE_STATE_CHANGED.equals(action)) {
                String state = intent.getStringExtra(TelephonyManager.EXTRA_STATE);
                String phoneNumber = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER);
                
                Log.d(TAG, "📞 PHONE_STATE_CHANGED: state=" + state + ", number=" + phoneNumber);
                handlePhoneStateChange(context, state, phoneNumber);
            } else if (Intent.ACTION_NEW_OUTGOING_CALL.equals(action)) {
                String phoneNumber = intent.getStringExtra(Intent.EXTRA_PHONE_NUMBER);
                Log.d(TAG, "🔥 NEW_OUTGOING_CALL RECEIVED: number=" + phoneNumber + " at time=" + System.currentTimeMillis());
                handleOutgoingCall(context, phoneNumber);
            } else {
                Log.d(TAG, "⚠️ Unknown action received: " + action);
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

        Log.d(TAG, "🔄 REAL-TIME STATE TRANSITION: " + currentCallState + " → " + state);
        Log.d(TAG, "📞 Phone state changed: " + state + ", Number: " + phoneNumber);
        
        // REAL-TIME DETECTION: IDLE → OFFHOOK = OUTGOING CALL START
        if (TelephonyManager.EXTRA_STATE_IDLE.equals(currentCallState) && 
            TelephonyManager.EXTRA_STATE_OFFHOOK.equals(state)) {
            
            // This is an OUTGOING call - REAL-TIME ringing start
            realTimeRingingStart = System.currentTimeMillis();
            realTimeCallStart = realTimeRingingStart;
            isOutgoingCall = true;
            
            // Get phone number from call log immediately
            String outgoingNumber = getLastOutgoingCallNumber(context);
            lastPhoneNumber = outgoingNumber != null ? outgoingNumber : "Unknown";
            
            Log.i(TAG, "🔥 REAL-TIME OUTGOING CALL DETECTED: " + lastPhoneNumber);
            Log.i(TAG, "⏰ REAL-TIME RINGING START: " + realTimeRingingStart);
            
            // Send RINGING broadcast immediately
            Intent ringingIntent = new Intent("com.ooak.callmanager.CALL_RINGING");
            ringingIntent.putExtra("phone_number", lastPhoneNumber);
            ringingIntent.putExtra("call_type", "OUTGOING");
            ringingIntent.putExtra("employee_id", authManager.getEmployeeId());
            ringingIntent.putExtra("ringing_start_time", realTimeRingingStart);
            context.sendBroadcast(ringingIntent);
            
            // Since call is already connected, send CONNECTED immediately with 0 ringing time
            Intent connectedIntent = new Intent("com.ooak.callmanager.CALL_CONNECTED");
            connectedIntent.putExtra("phone_number", lastPhoneNumber);
            connectedIntent.putExtra("call_type", "OUTGOING");
            connectedIntent.putExtra("employee_id", authManager.getEmployeeId());
            connectedIntent.putExtra("connected_time", System.currentTimeMillis());
            connectedIntent.putExtra("ringing_duration_ms", 0); // REAL-TIME: Instant connection
            context.sendBroadcast(connectedIntent);
            
            Log.i(TAG, "📡 REAL-TIME BROADCASTS SENT - Instant connection detected");
        }
        // REAL-TIME DETECTION: RINGING state for incoming calls
        else if (TelephonyManager.EXTRA_STATE_RINGING.equals(state)) {
            handleIncomingCall(context, phoneNumber, authManager);
        }
        // REAL-TIME DETECTION: Call ended
        else if (TelephonyManager.EXTRA_STATE_IDLE.equals(state)) {
            if (isOutgoingCall || isCallActive) {
                handleCallEnded(context, authManager);
            }
        }
        
        // Update current state for next transition
        currentCallState = state;
    }
    
    private void handleIncomingCall(Context context, String phoneNumber, EmployeeAuthManager authManager) {
        Log.i(TAG, "📞 INCOMING call RINGING: " + phoneNumber);
        
        lastPhoneNumber = phoneNumber != null ? phoneNumber : "Unknown";
        isCallActive = true; // Mark as active for tracking
        realTimeCallStart = System.currentTimeMillis();
        realTimeRingingStart = realTimeCallStart;
        isOutgoingCall = false; // This is incoming
        
        // Create call record for incoming call
        CallRecord callRecord = new CallRecord(lastPhoneNumber, authManager.getEmployeeId(), "INCOMING");
        callRecord.setEmployeeName(authManager.getEmployeeName());
        
        // Send RINGING status to CRM immediately
        Intent ringingIntent = new Intent("com.ooak.callmanager.CALL_RINGING");
        ringingIntent.putExtra("phone_number", lastPhoneNumber);
        ringingIntent.putExtra("call_type", "INCOMING");
        ringingIntent.putExtra("employee_id", authManager.getEmployeeId());
        ringingIntent.putExtra("ringing_start_time", realTimeRingingStart);
        ringingIntent.putExtra("status", "ringing"); // Send ringing status
        context.sendBroadcast(ringingIntent);
        
        // Also send call detected for backward compatibility
        Intent callDetectedIntent = new Intent("com.ooak.callmanager.CALL_DETECTED");
        callDetectedIntent.putExtra("phone_number", lastPhoneNumber);
        callDetectedIntent.putExtra("call_type", "INCOMING");
        callDetectedIntent.putExtra("employee_id", authManager.getEmployeeId());
        context.sendBroadcast(callDetectedIntent);
        
        Log.i(TAG, "📡 INCOMING CALL RINGING broadcasts sent for: " + lastPhoneNumber);
    }
    
    private String getLastOutgoingCallNumber(Context context) {
        try {
            Log.d(TAG, "🔍 Querying call log for recent outgoing call...");
            
            // Query the call log for the most recent outgoing call
            String[] projection = {CallLog.Calls.NUMBER, CallLog.Calls.DATE, CallLog.Calls.TYPE};
            String selection = CallLog.Calls.TYPE + " = ?";
            String[] selectionArgs = {String.valueOf(CallLog.Calls.OUTGOING_TYPE)};
            String sortOrder = CallLog.Calls.DATE + " DESC LIMIT 1";
            
            Cursor cursor = context.getContentResolver().query(
                CallLog.Calls.CONTENT_URI,
                projection,
                selection,
                selectionArgs,
                sortOrder
            );
            
            if (cursor != null) {
                Log.d(TAG, "📊 Call log cursor count: " + cursor.getCount());
                
                if (cursor.moveToFirst()) {
                    int numberIndex = cursor.getColumnIndex(CallLog.Calls.NUMBER);
                    int dateIndex = cursor.getColumnIndex(CallLog.Calls.DATE);
                    int typeIndex = cursor.getColumnIndex(CallLog.Calls.TYPE);
                    
                    if (numberIndex >= 0 && dateIndex >= 0 && typeIndex >= 0) {
                        String number = cursor.getString(numberIndex);
                        long callDate = cursor.getLong(dateIndex);
                        int callType = cursor.getInt(typeIndex);
                        
                        long currentTime = System.currentTimeMillis();
                        long timeDiff = currentTime - callDate;
                        
                        Log.d(TAG, "📱 Last call log entry:");
                        Log.d(TAG, "   Number: " + number);
                        Log.d(TAG, "   Type: " + callType + " (OUTGOING=" + CallLog.Calls.OUTGOING_TYPE + ")");
                        Log.d(TAG, "   Date: " + callDate + " (current: " + currentTime + ")");
                        Log.d(TAG, "   Time diff: " + timeDiff + "ms (" + (timeDiff/1000) + "s)");
                        
                        // Use a longer time window (30 seconds) to catch the call
                        if (timeDiff < 30000) { // 30 seconds
                            Log.d(TAG, "✅ Found recent outgoing call number: " + number);
                            cursor.close();
                            return number;
                        } else {
                            Log.d(TAG, "⏰ Last outgoing call too old: " + (timeDiff/1000) + "s ago");
                        }
                    } else {
                        Log.e(TAG, "❌ Column indices not found - number:" + numberIndex + " date:" + dateIndex + " type:" + typeIndex);
                    }
                } else {
                    Log.d(TAG, "📭 No call log entries found");
                }
                cursor.close();
            } else {
                Log.e(TAG, "❌ Call log cursor is null - permission issue?");
            }
        } catch (SecurityException e) {
            Log.e(TAG, "❌ SecurityException reading call log - missing READ_CALL_LOG permission?", e);
        } catch (Exception e) {
            Log.e(TAG, "❌ Error reading call log for outgoing number", e);
        }
        
        Log.d(TAG, "❌ Could not determine outgoing call number from call log");
        return null;
    }
    
    private void handleCallEnded(Context context, EmployeeAuthManager authManager) {
        if (!isCallActive && !isOutgoingCall) {
            return;
        }
        
        long callEndTime = System.currentTimeMillis();
        long realTimeCallDuration = realTimeCallStart > 0 ? callEndTime - realTimeCallStart : 0;
        int duration = (int) (realTimeCallDuration / 1000); // REAL-TIME duration in seconds
        
        Log.i(TAG, "📞 REAL-TIME CALL ENDED");
        Log.i(TAG, "⏰ REAL-TIME Call Duration: " + duration + " seconds (" + realTimeCallDuration + "ms)");
        Log.i(TAG, "📱 Phone Number: " + lastPhoneNumber);
        Log.i(TAG, "🔄 Was Outgoing Call: " + isOutgoingCall);
        Log.i(TAG, "🔄 Current State: " + currentCallState);
        
        // Determine final status based on call flow and duration
        String finalStatus;
        if (isOutgoingCall) {
            // For outgoing calls, use the existing business logic
            if (duration <= 3) {
                finalStatus = "unanswered";
                Log.i(TAG, "   ❌ OUTGOING: unanswered (too short - instant disconnect)");
            } else if (duration >= 4 && duration <= 8) {
                finalStatus = "unanswered";
                Log.i(TAG, "   ❌ OUTGOING: unanswered (short duration - likely not answered)");
            } else if (duration >= 9 && duration <= 15) {
                finalStatus = "unanswered";
                Log.i(TAG, "   ❌ OUTGOING: unanswered (likely voicemail/brief pickup)");
            } else {
                finalStatus = "answered";
                Log.i(TAG, "   ✅ OUTGOING: answered (sufficient duration for conversation)");
            }
        } else {
            // For incoming calls - check if we ever went to OFFHOOK (answered)
            // If the call never reached OFFHOOK state, it was missed
            if (duration == 0 || duration <= 2) {
                finalStatus = "missed";
                Log.i(TAG, "   ❌ INCOMING: missed (never answered or very brief)");
            } else if (duration >= 3) {
                finalStatus = "answered";
                Log.i(TAG, "   ✅ INCOMING: answered (call was picked up)");
            } else {
                finalStatus = "missed";
                Log.i(TAG, "   ❌ INCOMING: missed (default)");
            }
        }
        
        // Create final call record with REAL-TIME data
        CallRecord callRecord = new CallRecord(lastPhoneNumber, authManager.getEmployeeId(), "COMPLETED");
        callRecord.setEmployeeName(authManager.getEmployeeName());
        callRecord.setDuration(duration);
        callRecord.setStatus(finalStatus);
        
        // Broadcast call ended event with REAL-TIME data and final status
        Intent callEndedIntent = new Intent("com.ooak.callmanager.CALL_ENDED");
        callEndedIntent.putExtra("phone_number", lastPhoneNumber);
        callEndedIntent.putExtra("duration", duration);
        callEndedIntent.putExtra("employee_id", authManager.getEmployeeId());
        callEndedIntent.putExtra("end_time", callEndTime);
        callEndedIntent.putExtra("real_time_start", realTimeCallStart);
        callEndedIntent.putExtra("final_status", finalStatus); // Add final status
        callEndedIntent.putExtra("direction", isOutgoingCall ? "outgoing" : "incoming");
        context.sendBroadcast(callEndedIntent);
        
        // REAL-TIME: Reset all tracking variables
        isCallActive = false;
        isOutgoingCall = false;
        callStartTime = 0;
        realTimeCallStart = 0;
        realTimeRingingStart = 0;
        
        Log.i(TAG, "📡 REAL-TIME call ended broadcast sent with status: " + finalStatus + " - All variables reset");
        
        // Trigger recording detection after a short delay
        Intent recordingCheckIntent = new Intent("com.ooak.callmanager.CHECK_FOR_RECORDING");
        recordingCheckIntent.putExtra("phone_number", lastPhoneNumber);
        recordingCheckIntent.putExtra("call_duration", duration);
        recordingCheckIntent.putExtra("employee_id", authManager.getEmployeeId());
        
        // Send delayed broadcast to allow recording file to be created
        android.os.Handler handler = new android.os.Handler();
        handler.postDelayed(() -> context.sendBroadcast(recordingCheckIntent), 5000); // 5 second delay
    }
    
    private void handleOutgoingCall(Context context, String phoneNumber) {
        Log.i(TAG, "🔥 NEW_OUTGOING_CALL broadcast received for: " + phoneNumber);
        Log.i(TAG, "🔧 DEBUG - Current callStartTime BEFORE: " + callStartTime);
        Log.i(TAG, "🔧 DEBUG - Current isCallActive BEFORE: " + isCallActive);
        Log.i(TAG, "🔧 DEBUG - Current lastPhoneNumber BEFORE: " + lastPhoneNumber);
        
        EmployeeAuthManager authManager = new EmployeeAuthManager(context);
        
        if (!authManager.isEmployeeAuthenticated()) {
            Log.d(TAG, "Employee not authenticated, ignoring outgoing call");
            return;
        }
        
        lastPhoneNumber = phoneNumber != null ? phoneNumber : "Unknown";
        callStartTime = System.currentTimeMillis(); // ⏰ THIS IS THE CRITICAL RINGING START TIME
        
        Log.i(TAG, "✅ OUTGOING CALL AUTHENTICATED - RINGING STARTED: " + lastPhoneNumber);
        Log.i(TAG, "⏰ RINGING START TIME SET TO: " + callStartTime);
        Log.i(TAG, "🔧 DEBUG - Current callStartTime AFTER: " + callStartTime);
        Log.i(TAG, "🔧 DEBUG - Current isCallActive AFTER: " + isCallActive);
        Log.i(TAG, "🔧 DEBUG - Current lastPhoneNumber AFTER: " + lastPhoneNumber);
        
        // Create call record for outgoing call in RINGING state
        CallRecord callRecord = new CallRecord(lastPhoneNumber, authManager.getEmployeeId(), "OUTGOING");
        callRecord.setEmployeeName(authManager.getEmployeeName());
        
        // Broadcast RINGING event immediately when call starts dialing
        Intent ringingIntent = new Intent("com.ooak.callmanager.CALL_RINGING");
        ringingIntent.putExtra("phone_number", lastPhoneNumber);
        ringingIntent.putExtra("call_type", "OUTGOING");
        ringingIntent.putExtra("employee_id", authManager.getEmployeeId());
        ringingIntent.putExtra("ringing_start_time", callStartTime);
        context.sendBroadcast(ringingIntent);
        
        Log.i(TAG, "📡 Broadcasted CALL_RINGING event for outgoing call: " + lastPhoneNumber + " at time: " + callStartTime);
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