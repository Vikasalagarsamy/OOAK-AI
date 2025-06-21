package com.ooak.callmanager.models;

import java.util.Date;

public class CallRecord {
    private String callId;
    private String phoneNumber;
    private String employeeId;
    private String employeeName;
    private Date callTime;
    private int duration;
    private String callType; // INCOMING, OUTGOING, MISSED
    private String recordingPath;
    private boolean uploaded;
    private String uploadStatus;
    
    // Additional fields for enhanced call tracking
    private String status;
    private String taskId;
    private String leadId;
    private String contactName;
    private String mobileContactName; // Contact name from mobile phone contacts
    private Date startTime;
    private Date endTime;
    private Date connectedTime;
    private String direction;
    private String errorMessage;
    
    // NEW: Real-time tracking fields
    private Date ringingStartTime;  // When call started ringing
    private Date ringingEndTime;    // When call was picked up (or ended if unanswered)
    private int ringingDuration;    // Time spent ringing (in seconds)
    private int talkingDuration;    // Time spent talking (in seconds)
    private boolean wasAnswered;    // True if call was actually picked up
    
    public CallRecord() {
        this.callId = generateCallId();
        this.callTime = new Date();
        this.uploaded = false;
        this.uploadStatus = "PENDING";
        this.status = "initiated";
        this.wasAnswered = false;
    }
    
    public CallRecord(String phoneNumber, String employeeId, String callType) {
        this();
        this.phoneNumber = phoneNumber;
        this.employeeId = employeeId;
        this.callType = callType;
    }
    
    private String generateCallId() {
        return "CALL_" + System.currentTimeMillis() + "_" + (int)(Math.random() * 1000);
    }
    
    public void calculateDuration() {
        if (startTime != null && endTime != null) {
            this.duration = (int) ((endTime.getTime() - startTime.getTime()) / 1000);
        }
    }
    
    // NEW: Calculate ringing and talking durations separately
    public void calculateRingingDuration() {
        if (ringingStartTime != null && ringingEndTime != null) {
            this.ringingDuration = (int) ((ringingEndTime.getTime() - ringingStartTime.getTime()) / 1000);
        }
    }
    
    public void calculateTalkingDuration() {
        if (connectedTime != null && endTime != null) {
            this.talkingDuration = (int) ((endTime.getTime() - connectedTime.getTime()) / 1000);
        }
    }
    
    // NEW: Set ringing start (when call is initiated)
    public void startRinging() {
        this.ringingStartTime = new Date();
        this.status = "ringing";
    }
    
    // NEW: Set ringing end and connected start (when call is picked up)
    public void callAnswered() {
        this.ringingEndTime = new Date();
        this.connectedTime = new Date();
        this.wasAnswered = true;
        this.status = "connected";
        calculateRingingDuration();
    }
    
    // NEW: Set call end and calculate final durations
    public void callEnded() {
        this.endTime = new Date();
        
        if (!wasAnswered) {
            // Call was never answered - ringing ended when call ended
            this.ringingEndTime = this.endTime;
            this.talkingDuration = 0;
        } else {
            // Call was answered - calculate talking time
            calculateTalkingDuration();
        }
        
        calculateRingingDuration();
        calculateDuration(); // Total duration
    }
    
    // Getters and Setters
    public String getCallId() { return callId; }
    public void setCallId(String callId) { this.callId = callId; }
    
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    
    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }
    
    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
    
    public Date getCallTime() { return callTime; }
    public void setCallTime(Date callTime) { this.callTime = callTime; }
    
    public int getDuration() { return duration; }
    public void setDuration(int duration) { this.duration = duration; }
    
    public String getCallType() { return callType; }
    public void setCallType(String callType) { this.callType = callType; }
    
    public String getRecordingPath() { return recordingPath; }
    public void setRecordingPath(String recordingPath) { this.recordingPath = recordingPath; }
    
    public boolean isUploaded() { return uploaded; }
    public void setUploaded(boolean uploaded) { this.uploaded = uploaded; }
    
    public String getUploadStatus() { return uploadStatus; }
    public void setUploadStatus(String uploadStatus) { this.uploadStatus = uploadStatus; }
    
    // Additional getters and setters
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public String getTaskId() { return taskId; }
    public void setTaskId(String taskId) { this.taskId = taskId; }
    
    public String getLeadId() { return leadId; }
    public void setLeadId(String leadId) { this.leadId = leadId; }
    
    public String getContactName() { return contactName; }
    public void setContactName(String contactName) { this.contactName = contactName; }
    
    public String getMobileContactName() { return mobileContactName; }
    public void setMobileContactName(String mobileContactName) { this.mobileContactName = mobileContactName; }
    
    public Date getStartTime() { return startTime; }
    public void setStartTime(Date startTime) { this.startTime = startTime; }
    
    public Date getEndTime() { return endTime; }
    public void setEndTime(Date endTime) { this.endTime = endTime; }
    
    public Date getConnectedTime() { return connectedTime; }
    public void setConnectedTime(Date connectedTime) { this.connectedTime = connectedTime; }
    
    public String getDirection() { return direction; }
    public void setDirection(String direction) { this.direction = direction; }
    
    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    
    // NEW: Getters and setters for real-time tracking
    public Date getRingingStartTime() { return ringingStartTime; }
    public void setRingingStartTime(Date ringingStartTime) { this.ringingStartTime = ringingStartTime; }
    
    public Date getRingingEndTime() { return ringingEndTime; }
    public void setRingingEndTime(Date ringingEndTime) { this.ringingEndTime = ringingEndTime; }
    
    public int getRingingDuration() { return ringingDuration; }
    public void setRingingDuration(int ringingDuration) { this.ringingDuration = ringingDuration; }
    
    public int getTalkingDuration() { return talkingDuration; }
    public void setTalkingDuration(int talkingDuration) { this.talkingDuration = talkingDuration; }
    
    public boolean wasAnswered() { return wasAnswered; }
    public void setWasAnswered(boolean wasAnswered) { this.wasAnswered = wasAnswered; }
    
    @Override
    public String toString() {
        return "CallRecord{" +
                "callId='" + callId + '\'' +
                ", phoneNumber='" + phoneNumber + '\'' +
                ", employeeId='" + employeeId + '\'' +
                ", callType='" + callType + '\'' +
                ", duration=" + duration +
                ", ringingDuration=" + ringingDuration +
                ", talkingDuration=" + talkingDuration +
                ", wasAnswered=" + wasAnswered +
                ", uploaded=" + uploaded +
                ", status='" + status + '\'' +
                '}';
    }
} 