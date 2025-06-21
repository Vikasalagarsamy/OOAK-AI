package com.ooak.callmanager.config;

/**
 * API Configuration Constants
 * 
 * This configuration uses Cloudflare Tunnel to provide universal access
 * to the OOAK CRM system from any network (WiFi, Mobile Data, etc.)
 */
public class ApiConstants {
    
    // Universal API Base URL (works from anywhere)
    public static final String API_BASE_URL = "https://portal.ooak.photography";
    
    // Fallback URL for local network (if needed)
    public static final String FALLBACK_URL = "https://portal.ooak.photography";
    
    // API Endpoints
    public static final String ENDPOINT_CALL_UPLOAD = "/api/call-upload";
    public static final String ENDPOINT_CALL_UPLOADS = "/api/call-uploads";
    public static final String ENDPOINT_CALL_MONITORING = "/api/call-monitoring";
    public static final String ENDPOINT_CALL_TRIGGERS = "/api/poll-call-triggers";
    
    // Timeouts
    public static final int CONNECT_TIMEOUT_SECONDS = 30;
    public static final int READ_TIMEOUT_SECONDS = 60;
    public static final int WRITE_TIMEOUT_SECONDS = 60;
    
    // Private constructor to prevent instantiation
    private ApiConstants() {}
} 