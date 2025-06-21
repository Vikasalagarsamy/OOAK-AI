package com.ooak.callmanager.models;

import java.io.File;
import java.util.Date;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class RecordingFile {
    private String filePath;
    private String fileName;
    private long fileSize;
    private Date dateCreated;
    private Date dateModified;
    private String phoneNumber;
    private String fileExtension;
    private boolean processed;
    private String uploadStatus;
    
    // Additional fields for enhanced recording tracking
    private String contactName;
    private String taskId;
    private String employeeId;
    private long createdTime;
    private String transcriptionId;
    private String status;
    private String errorMessage;
    
    public RecordingFile() {
        this.processed = false;
        this.uploadStatus = "PENDING";
        this.status = "detected";
    }
    
    public RecordingFile(File file) {
        this();
        this.filePath = file.getAbsolutePath();
        this.fileName = file.getName();
        this.fileSize = file.length();
        this.dateCreated = new Date(file.lastModified());
        this.dateModified = new Date(file.lastModified());
        this.createdTime = file.lastModified();
        this.fileExtension = getFileExtension(fileName);
        this.phoneNumber = extractPhoneNumber(fileName);
    }
    
    private String getFileExtension(String fileName) {
        int lastDot = fileName.lastIndexOf('.');
        if (lastDot > 0 && lastDot < fileName.length() - 1) {
            return fileName.substring(lastDot + 1).toLowerCase();
        }
        return "";
    }
    
    private String extractPhoneNumber(String fileName) {
        // Common patterns for phone numbers in recording filenames
        String[] patterns = {
            "\\+?\\d{10,15}",           // Basic phone number
            "\\+\\d{1,3}\\d{10}",       // International format
            "\\d{3}-\\d{3}-\\d{4}",     // US format with dashes
            "\\(\\d{3}\\)\\d{3}-\\d{4}" // US format with parentheses
        };
        
        for (String pattern : patterns) {
            Pattern p = Pattern.compile(pattern);
            Matcher m = p.matcher(fileName);
            if (m.find()) {
                String number = m.group();
                // Clean up the number
                number = number.replaceAll("[^\\d+]", "");
                if (number.length() >= 10) {
                    return number;
                }
            }
        }
        
        return "Unknown";
    }
    
    public boolean isValidRecording() {
        String[] validExtensions = {"mp3", "wav", "m4a", "3gp", "amr", "aac", "ogg"};
        for (String ext : validExtensions) {
            if (ext.equals(fileExtension)) {
                return true;
            }
        }
        return false;
    }
    
    public boolean isRecentFile() {
        // Consider files created within last 24 hours as recent
        long twentyFourHoursAgo = System.currentTimeMillis() - (24 * 60 * 60 * 1000);
        return dateModified.getTime() > twentyFourHoursAgo;
    }
    
    public String getClientName() {
        if (contactName != null && !contactName.isEmpty()) {
            return contactName;
        }
        if (!"Unknown".equals(phoneNumber)) {
            return "Mobile Call - " + phoneNumber;
        }
        return "Mobile Call - " + fileName;
    }
    
    // Getters and Setters
    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }
    
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    
    public long getFileSize() { return fileSize; }
    public void setFileSize(long fileSize) { this.fileSize = fileSize; }
    
    public Date getDateCreated() { return dateCreated; }
    public void setDateCreated(Date dateCreated) { this.dateCreated = dateCreated; }
    
    public Date getDateModified() { return dateModified; }
    public void setDateModified(Date dateModified) { this.dateModified = dateModified; }
    
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    
    public String getFileExtension() { return fileExtension; }
    public void setFileExtension(String fileExtension) { this.fileExtension = fileExtension; }
    
    public boolean isProcessed() { return processed; }
    public void setProcessed(boolean processed) { this.processed = processed; }
    
    public String getUploadStatus() { return uploadStatus; }
    public void setUploadStatus(String uploadStatus) { this.uploadStatus = uploadStatus; }
    
    // Additional getters and setters
    public String getContactName() { 
        if (contactName != null && !contactName.isEmpty()) {
            return contactName;
        }
        return getClientName();
    }
    public void setContactName(String contactName) { this.contactName = contactName; }
    
    public String getTaskId() { return taskId; }
    public void setTaskId(String taskId) { this.taskId = taskId; }
    
    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }
    
    public long getCreatedTime() { return createdTime; }
    public void setCreatedTime(long createdTime) { 
        this.createdTime = createdTime;
        this.dateCreated = new Date(createdTime);
    }
    
    public String getTranscriptionId() { return transcriptionId; }
    public void setTranscriptionId(String transcriptionId) { this.transcriptionId = transcriptionId; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    
    @Override
    public String toString() {
        return "RecordingFile{" +
                "fileName='" + fileName + '\'' +
                ", fileSize=" + fileSize +
                ", phoneNumber='" + phoneNumber + '\'' +
                ", fileExtension='" + fileExtension + '\'' +
                ", processed=" + processed +
                ", uploadStatus='" + uploadStatus + '\'' +
                ", status='" + status + '\'' +
                '}';
    }
} 