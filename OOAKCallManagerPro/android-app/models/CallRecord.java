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
    private Date startTime;
    private Date endTime;
    private Date connectedTime;
    private String direction;
    private String errorMessage;
    
    public CallRecord() {
        this.callId = generateCallId();
        this.callTime = new Date();
        this.uploaded = false;
        this.uploadStatus = "PENDING";
        this.status = "initiated";
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
    
    @Override
    public String toString() {
        return "CallRecord{" +
                "callId='" + callId + '\'' +
                ", phoneNumber='" + phoneNumber + '\'' +
                ", employeeId='" + employeeId + '\'' +
                ", callType='" + callType + '\'' +
                ", duration=" + duration +
                ", uploaded=" + uploaded +
                ", status='" + status + '\'' +
                ", contactName='" + contactName + '\'' +
                ", direction='" + direction + '\'' +
                '}';
    }
} 