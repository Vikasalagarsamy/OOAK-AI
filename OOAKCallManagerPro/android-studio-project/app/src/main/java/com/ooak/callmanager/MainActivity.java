package com.ooak.callmanager;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.util.Log;
import android.view.View;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.google.android.material.textfield.TextInputEditText;
import com.google.android.material.button.MaterialButton;
import com.ooak.callmanager.services.CallMonitoringService;
import com.ooak.callmanager.services.RecordingMonitorService;
import com.ooak.callmanager.utils.EmployeeAuthManager;
import com.ooak.callmanager.utils.AutoPermissionManager;
import java.io.File;
import java.util.List;

public class MainActivity extends AppCompatActivity implements AutoPermissionManager.PermissionCallback {
    private static final String TAG = "MainActivity";
    private static final int PERMISSION_REQUEST_CODE = 1001;
    
    private TextInputEditText usernameInput;
    private TextInputEditText passwordInput;
    private MaterialButton authenticateButton;
    private MaterialButton startServicesButton;
    private MaterialButton stopServicesButton;
    private MaterialButton clearAuthButton;
    private MaterialButton checkUploadsButton;
    private MaterialButton testUploadButton;
    private MaterialButton permissionStatusButton;
    private MaterialButton fixStoragePermissionsButton;
    private TextView statusText;
    private TextView employeeDetailsText;
    private TextView uploadStatusText;
    
    private EmployeeAuthManager authManager;
    private AutoPermissionManager permissionManager;
    private boolean isAuthenticated = false;
    private boolean servicesRunning = false;
    private boolean allPermissionsGranted = false;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        Log.d(TAG, "🚀 OOAK Call Manager Pro - Enterprise Edition Starting");
        
        authManager = new EmployeeAuthManager(this);
        permissionManager = new AutoPermissionManager(this);
        
        initializeViews();
        setupClickListeners();
        
        // Start comprehensive permission setup for enterprise deployment
        setupEnterprisePermissions();
        
        loadSavedCredentials();
        updateStatus("🔄 OOAK Call Manager Pro - Enterprise Edition\n📱 Setting up for seamless deployment...\n🔧 Configuring all permissions automatically...");
    }
    
    /**
     * Enterprise-grade permission setup - NO manual intervention required
     */
    private void setupEnterprisePermissions() {
        Log.d(TAG, "🔧 Starting enterprise permission setup");
        updateStatus("🔧 Setting up enterprise permissions...\n📋 This process is fully automatic\n⏱️ Please wait a moment...");
        
        permissionManager.setupAllPermissions(this);
    }
    
    // AutoPermissionManager.PermissionCallback implementation
    @Override
    public void onAllPermissionsGranted() {
        Log.d(TAG, "✅ All permissions granted! Enterprise deployment successful");
        
        runOnUiThread(() -> {
            updateStatus("✅ ALL PERMISSIONS GRANTED!\n🚀 Enterprise deployment successful\n\n" +
                        "📱 Storage permissions: ✅ Granted\n" +
                        "📞 Phone permissions: ✅ Granted\n" +
                        "🎙️ Microphone permissions: ✅ Granted\n" +
                        "🔐 System permissions: ✅ Granted\n\n" +
                        "🚀 AUTOMATICALLY STARTING BACKGROUND SERVICES...");
            
            // Enable all buttons now that permissions are granted
            startServicesButton.setEnabled(true);
            checkUploadsButton.setEnabled(true);
            testUploadButton.setEnabled(true);
            permissionStatusButton.setText("✅ All Permissions Granted");
            permissionStatusButton.setEnabled(false);
            
            // Hide fix storage permissions button
            fixStoragePermissionsButton.setVisibility(View.GONE);
            
            allPermissionsGranted = true;
            
            // AUTOMATICALLY START BACKGROUND SERVICES if authenticated
            if (isAuthenticated) {
                Log.d(TAG, "🚀 Auto-starting background services since user is authenticated");
                
                // Delay start to allow UI update
                new android.os.Handler().postDelayed(() -> {
                    startBackgroundServices();
                    updateStatus("🎯 AUTOMATIC DEPLOYMENT COMPLETE!\n✅ All permissions granted\n✅ Background services started\n\n" +
                                "📞 Call monitoring: ACTIVE\n" +
                                "🎙️ Recording detection: ACTIVE\n" +
                                "⬆️ CRM upload: ACTIVE\n\n" +
                                "💡 App ready for enterprise use!\n" +
                                "You can now close the app - services will run 24/7 in background.");
                }, 1000);
            } else {
                updateStatus("✅ ALL PERMISSIONS GRANTED!\n🔐 Please authenticate with CRM to start monitoring");
            }
        });
    }
    
    @Override
    public void onPermissionsDenied(List<String> deniedPermissions) {
        Log.e(TAG, "❌ Some permissions denied: " + deniedPermissions);
        
        runOnUiThread(() -> {
            updateStatus("⚠️ PERMISSION SETUP INCOMPLETE\n❌ Some permissions were denied\n\n" +
                        "Missing permissions:\n" + String.join("\n", deniedPermissions) + "\n\n" +
                        "🔄 Retrying automatic setup...");
            
            // Check if storage permissions are missing on Android 11+
            boolean needsStorageFix = false;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                for (String permission : deniedPermissions) {
                    if (permission.contains("EXTERNAL_STORAGE") || permission.contains("MANAGE_EXTERNAL_STORAGE")) {
                        needsStorageFix = true;
                        break;
                    }
                }
            }
            
            // Show fix storage permissions button if needed
            if (fixStoragePermissionsButton != null) {
                if (needsStorageFix) {
                    fixStoragePermissionsButton.setVisibility(View.VISIBLE);
                    updateStatus("⚠️ PERMISSION SETUP INCOMPLETE\n❌ Storage permissions missing on Android 11+\n\n" +
                                "Missing:\n" + String.join("\n", deniedPermissions) + "\n\n" +
                                "📁 Please click 'Fix Storage Permissions' button below");
                } else {
                    fixStoragePermissionsButton.setVisibility(View.GONE);
                }
            }
        });
    }
    
    @Override
    public void onSpecialPermissionsNeeded(List<String> specialPermissions) {
        Log.d(TAG, "🔑 Special permissions needed: " + specialPermissions);
        
        runOnUiThread(() -> {
            updateStatus("🔑 Setting up special permissions...\n📱 The app will guide you through automated setup\n\n" +
                        "Required:\n" + String.join("\n", specialPermissions) + "\n\n" +
                        "⏱️ This is automatic - please follow any prompts");
        });
    }
    
    private void initializeViews() {
        usernameInput = findViewById(R.id.username_input);
        passwordInput = findViewById(R.id.password_input);
        authenticateButton = findViewById(R.id.authenticate_button);
        startServicesButton = findViewById(R.id.start_services_button);
        stopServicesButton = findViewById(R.id.stop_services_button);
        clearAuthButton = findViewById(R.id.clear_auth_button);
        checkUploadsButton = findViewById(R.id.check_uploads_button);
        testUploadButton = findViewById(R.id.test_upload_button);
        statusText = findViewById(R.id.status_text);
        employeeDetailsText = findViewById(R.id.employee_details_text);
        uploadStatusText = findViewById(R.id.upload_status_text);
        
        // Add permission status button if it exists in layout
        try {
            permissionStatusButton = findViewById(R.id.permission_status_button);
        } catch (Exception e) {
            // Button doesn't exist in layout, that's fine
        }
        
        // Add fix storage permissions button if it exists in layout
        try {
            fixStoragePermissionsButton = findViewById(R.id.fix_storage_permissions_button);
        } catch (Exception e) {
            // Button doesn't exist in layout, that's fine
        }
    }
    
    private void setupClickListeners() {
        authenticateButton.setOnClickListener(v -> authenticateWithCRM());
        startServicesButton.setOnClickListener(v -> startBackgroundServices());
        stopServicesButton.setOnClickListener(v -> stopBackgroundServices());
        clearAuthButton.setOnClickListener(v -> clearAuthentication());
        checkUploadsButton.setOnClickListener(v -> checkUploads());
        testUploadButton.setOnClickListener(v -> testRecordingUpload());
        
        // Permission status button
        if (permissionStatusButton != null) {
            permissionStatusButton.setOnClickListener(v -> showPermissionStatusReport());
        }
        
        // Fix storage permissions button
        if (fixStoragePermissionsButton != null) {
            fixStoragePermissionsButton.setOnClickListener(v -> fixStoragePermissions());
        }
    }
    
    /**
     * Show detailed permission status report
     */
    private void showPermissionStatusReport() {
        String report = permissionManager.getPermissionStatusReport();
        updateStatus(report);
        Log.d(TAG, "📋 Permission Status Report:\n" + report);
    }
    
    private void loadSavedCredentials() {
        if (authManager.isEmployeeAuthenticated()) {
            String username = authManager.getUsername();
            if (!username.isEmpty()) {
                usernameInput.setText(username);
            }
            
            isAuthenticated = true;
            updateUIForAuthenticatedState();
            
            String details = authManager.getEmployeeDetailsForDisplay();
            employeeDetailsText.setText(details);
            
            updateStatus("✅ Previous authentication loaded!\n" +
                        authManager.getEmployeeInfo() + "\n" +
                        "Ready to start background services.");
        } else {
            updateUIForUnauthenticatedState();
        }
    }
    
    private void authenticateWithCRM() {
        String username = usernameInput.getText().toString().trim();
        String password = passwordInput.getText().toString().trim();
        
        if (username.isEmpty()) {
            Toast.makeText(this, "Please enter your username", Toast.LENGTH_SHORT).show();
            updateStatus("❌ Authentication failed: Username required");
            return;
        }
        
        if (password.isEmpty()) {
            Toast.makeText(this, "Please enter your password", Toast.LENGTH_SHORT).show();
            updateStatus("❌ Authentication failed: Password required");
            return;
        }
        
        // Show loading state
        authenticateButton.setText("🔄 Authenticating...");
        authenticateButton.setEnabled(false);
        updateStatus("🔄 Authenticating with OOAK CRM system...\n🆔 Username: " + username);
        
        // Authenticate with CRM using real API
        authManager.authenticateWithCRMCredentials(username, password, new EmployeeAuthManager.AuthCallback() {
            @Override
            public void onAuthenticationResult(boolean success, String message, EmployeeAuthManager.EmployeeInfo employeeInfo) {
                // Run on UI thread
                new Handler(Looper.getMainLooper()).post(() -> {
                    if (success) {
                        isAuthenticated = true;
                        
                        runOnUiThread(() -> {
                            updateUIForAuthenticatedState();
                            
                            // Update employee details display
                            employeeDetailsText.setText("👤 " + employeeInfo.name + 
                                                       "\n🆔 " + employeeInfo.employeeId + 
                                                       "\n📧 " + employeeInfo.email + 
                                                       "\n⏰ Valid Until: " + employeeInfo.validUntil.substring(0, 10));
                            
                            updateStatus("✅ Authentication successful!\n👤 Employee: " + employeeInfo.name + 
                                        "\n🆔 Employee ID: " + employeeInfo.employeeId + 
                                        "\n📧 Email: " + employeeInfo.email + 
                                        "\n⏰ Valid Until: " + employeeInfo.validUntil.substring(0, 10) +
                                        "\n\n🔐 CRM Connection: Active");
                            
                            Toast.makeText(MainActivity.this, "Welcome, " + employeeInfo.name + "!", Toast.LENGTH_LONG).show();
                            
                            // AUTOMATICALLY START BACKGROUND SERVICES if permissions are granted
                            if (allPermissionsGranted) {
                                Log.d(TAG, "🚀 Auto-starting background services since permissions are already granted");
                                
                                // Delay start to allow UI update
                                new android.os.Handler().postDelayed(() -> {
                                    startBackgroundServices();
                                    updateStatus("🎯 AUTOMATIC DEPLOYMENT COMPLETE!\n✅ Authentication successful\n✅ Background services started\n\n" +
                                                "📞 Call monitoring: ACTIVE\n" +
                                                "🎙️ Recording detection: ACTIVE\n" +
                                                "⬆️ CRM upload: ACTIVE\n\n" +
                                                "💡 App ready for enterprise use!\n" +
                                                "Employee: " + employeeInfo.name + " (ID: " + employeeInfo.employeeId + ")\n" +
                                                "You can now close the app - services will run 24/7 in background.");
                                }, 1500);
                            } else {
                                updateStatus("✅ Authentication successful!\n⚠️ Please grant all permissions to start monitoring\n\n" +
                                            "Employee: " + employeeInfo.name + " (ID: " + employeeInfo.employeeId + ")");
                            }
                        });
                    } else {
                        // Authentication failed
                        updateUIForUnauthenticatedState();
                        updateStatus("❌ Authentication failed: " + message + "\n\n" +
                                    "Please check:\n" +
                                    "• Username is correct\n" +
                                    "• Password is correct\n" +
                                    "• You are registered in OOAK CRM system\n" +
                                    "• Your account is active\n" +
                                    "• Device has internet connection");
                        Toast.makeText(MainActivity.this, "Authentication failed: " + message, Toast.LENGTH_LONG).show();
                    }
                });
            }
        });
    }
    
    private void updateUIForAuthenticatedState() {
        authenticateButton.setText("✅ Authenticated");
        authenticateButton.setEnabled(false);
        startServicesButton.setEnabled(true);
        clearAuthButton.setEnabled(true);
        usernameInput.setEnabled(false);
        passwordInput.setEnabled(false);
    }
    
    private void updateUIForUnauthenticatedState() {
        authenticateButton.setText("🔐 Authenticate with CRM");
        authenticateButton.setEnabled(true);
        startServicesButton.setEnabled(false);
        stopServicesButton.setEnabled(false);
        clearAuthButton.setEnabled(false);
        usernameInput.setEnabled(true);
        passwordInput.setEnabled(true);
        employeeDetailsText.setText("Not authenticated");
    }
    
    private void clearAuthentication() {
        authManager.clearAuthentication();
        isAuthenticated = false;
        servicesRunning = false;
        
        // Stop services if running
        try {
            stopService(new Intent(this, CallMonitoringService.class));
            stopService(new Intent(this, RecordingMonitorService.class));
            stopService(new Intent(this, CallTriggerService.class));
            stopService(new Intent(this, CallRecordingDetectionService.class));
        } catch (Exception e) {
            // Ignore errors when stopping services
        }
        
        updateUIForUnauthenticatedState();
        usernameInput.setText("");
        passwordInput.setText("");
        
        updateStatus("🔄 Authentication cleared.\n🆔 Please enter your username and password to authenticate again.");
        Toast.makeText(this, "Authentication cleared", Toast.LENGTH_SHORT).show();
    }
    
    private void startBackgroundServices() {
        if (!hasAllPermissions()) {
            requestPermissions();
            return;
        }
        
        try {
            // Start Call Monitoring Service
            Intent callMonitorIntent = new Intent(this, CallMonitoringService.class);
            startForegroundService(callMonitorIntent);
            
            // Start Recording Monitor Service  
            Intent recordingMonitorIntent = new Intent(this, RecordingMonitorService.class);
            startForegroundService(recordingMonitorIntent);
            
            // Start Call Trigger Service for API-based call triggers
            Intent callTriggerIntent = new Intent(this, CallTriggerService.class);
            startService(callTriggerIntent);
            
            // Start Call Recording Detection Service (NEW)
            Intent recordingDetectionIntent = new Intent(this, CallRecordingDetectionService.class);
            startService(recordingDetectionIntent);
            
            servicesRunning = true;
            startServicesButton.setText("✅ Services Running");
            startServicesButton.setEnabled(false);
            stopServicesButton.setEnabled(true);
            
            updateStatus("🚀 Background services started successfully!\n" +
                        "✅ Call Monitoring Service: Active\n" +
                        "✅ Recording Monitor Service: Active\n" +
                        "✅ Call Trigger Service: Active (API polling)\n" +
                        "✅ Call Recording Detection: Active (NEW)\n" +
                        "✅ CRM Server: Connected to " + authManager.getEmployeeInfo() + "\n" +
                        "✅ Employee: " + authManager.getEmployeeInfo() + "\n\n" +
                        "🎯 AUTOMATIC WORKFLOW ACTIVE:\n" +
                        "1. 📞 Monitor all phone calls in real-time\n" +
                        "2. 📊 Track call status: ringing → answered/missed\n" +
                        "3. 🎙️ Detect call recordings automatically\n" +
                        "4. ⬆️ Upload to OOAK CRM dashboard\n" +
                        "5. 🤖 Process with Whisper AI transcription\n" +
                        "6. 📈 Results appear in employee dashboard\n" +
                        "7. 📲 Auto-dial calls from task dashboard\n\n" +
                        "💡 You can now close this app safely.\n" +
                        "Services will continue running in background 24/7.");
            
            Toast.makeText(this, "Background services started! App will work in background.", Toast.LENGTH_LONG).show();
            
        } catch (Exception e) {
            updateStatus("❌ Failed to start services: " + e.getMessage());
            Toast.makeText(this, "Failed to start services. Check permissions.", Toast.LENGTH_LONG).show();
        }
    }
    
    private void stopBackgroundServices() {
        try {
            // Stop services
            stopService(new Intent(this, CallMonitoringService.class));
            stopService(new Intent(this, RecordingMonitorService.class));
            stopService(new Intent(this, CallTriggerService.class));
            stopService(new Intent(this, CallRecordingDetectionService.class));
            
            servicesRunning = false;
            startServicesButton.setText("🚀 Start Background Services");
            startServicesButton.setEnabled(true);
            stopServicesButton.setEnabled(false);
            
            updateStatus("⏹️ Background services stopped\n" +
                        "Call monitoring and recording upload disabled\n" +
                        "Employee: " + authManager.getEmployeeInfo() + "\n" +
                        "Tap 'Start Background Services' to resume");
            
            Toast.makeText(this, "Background services stopped", Toast.LENGTH_SHORT).show();
            
        } catch (Exception e) {
            updateStatus("❌ Error stopping services: " + e.getMessage());
        }
    }
    
    private boolean hasAllPermissions() {
        String[] permissions = {
            Manifest.permission.READ_PHONE_STATE,
            Manifest.permission.CALL_PHONE,
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.INTERNET,
            Manifest.permission.ACCESS_NETWORK_STATE,
            Manifest.permission.WAKE_LOCK,
            Manifest.permission.FOREGROUND_SERVICE,
            Manifest.permission.READ_CALL_LOG,
            Manifest.permission.PROCESS_OUTGOING_CALLS
        };
        
        // Check standard permissions
        for (String permission : permissions) {
            if (ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
                Log.d(TAG, "❌ Missing permission: " + permission);
                return false;
            }
        }
        
        // Check storage permissions based on Android version
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            // Android 11+ uses MANAGE_EXTERNAL_STORAGE
            if (!Environment.isExternalStorageManager()) {
                Log.d(TAG, "❌ Missing MANAGE_EXTERNAL_STORAGE permission on Android 11+");
                return false;
            }
        } else {
            // Android 10 and below use legacy permissions
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED ||
                ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                Log.d(TAG, "❌ Missing legacy storage permissions on Android 10-");
                return false;
            }
        }
        
        Log.d(TAG, "✅ All permissions granted for Android " + Build.VERSION.SDK_INT);
        return true;
    }
    
    private void checkPermissions() {
        if (!hasAllPermissions()) {
            updateStatus("⚠️ Permissions required for call monitoring.\nTap 'Start Background Services' to grant permissions.");
        }
    }
    
    private void requestPermissions() {
        String[] permissions = {
            Manifest.permission.READ_PHONE_STATE,
            Manifest.permission.CALL_PHONE,
            Manifest.permission.READ_EXTERNAL_STORAGE,
            Manifest.permission.WRITE_EXTERNAL_STORAGE,
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.INTERNET,
            Manifest.permission.ACCESS_NETWORK_STATE,
            Manifest.permission.WAKE_LOCK,
            Manifest.permission.FOREGROUND_SERVICE,
            Manifest.permission.READ_CALL_LOG,
            Manifest.permission.PROCESS_OUTGOING_CALLS
        };
        
        ActivityCompat.requestPermissions(this, permissions, 1001);
    }
    
    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        
        // Handle permission results with the new AutoPermissionManager for enterprise deployment
        permissionManager.handlePermissionRequestResult(requestCode, permissions, grantResults);
    }
    
    private void updateStatus(String message) {
        statusText.setText(message);
    }
    
    @Override
    protected void onResume() {
        super.onResume();
        
        // DISABLED: Permission checking to prevent infinite loops
        // All permissions should already be granted by this point
        Log.d(TAG, "🔄 App resumed - skipping permission check to prevent loops");
        
        // Refresh authentication status when app resumes
        if (authManager.isEmployeeAuthenticated()) {
            if (!isAuthenticated) {
                loadSavedCredentials();
            }
        } else {
            if (isAuthenticated) {
                // Authentication expired, reset UI
                updateUIForUnauthenticatedState();
                isAuthenticated = false;
                updateStatus("⚠️ Authentication expired. Please authenticate again.");
            }
        }
    }
    
    private void checkUploads() {
        if (!isAuthenticated) {
            Toast.makeText(this, "Please authenticate first", Toast.LENGTH_SHORT).show();
            return;
        }
        
        checkUploadsButton.setText("🔄 Checking...");
        checkUploadsButton.setEnabled(false);
        uploadStatusText.setText("Checking recording uploads...");
        
        new Thread(() -> {
            try {
                String employeeId = authManager.getEmployeeId();
                String url = "https://portal.ooak.photography/api/call-monitoring?employee_id=" + employeeId;
                
                java.net.HttpURLConnection connection = (java.net.HttpURLConnection) new java.net.URL(url).openConnection();
                connection.setRequestMethod("GET");
                connection.setConnectTimeout(10000);
                connection.setReadTimeout(10000);
                
                int responseCode = connection.getResponseCode();
                
                if (responseCode == 200) {
                    java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(connection.getInputStream()));
                    StringBuilder response = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        response.append(line);
                    }
                    reader.close();
                    
                    org.json.JSONObject jsonResponse = new org.json.JSONObject(response.toString());
                    org.json.JSONArray calls = jsonResponse.getJSONArray("calls");
                    
                    int totalCalls = calls.length();
                    int callsWithRecordings = 0;
                    StringBuilder recentCalls = new StringBuilder();
                    
                    for (int i = 0; i < Math.min(5, totalCalls); i++) {
                        org.json.JSONObject call = calls.getJSONObject(i);
                        String phone = call.optString("phone_number", "Unknown");
                        String recordingUrl = call.optString("recording_url", null);
                        String timestamp = call.optString("timestamp", "Unknown");
                        
                        if (recordingUrl != null && !recordingUrl.isEmpty()) {
                            callsWithRecordings++;
                            recentCalls.append("✅ ").append(phone).append(" - ").append(timestamp.substring(0, 10)).append("\n");
                        } else {
                            recentCalls.append("❌ ").append(phone).append(" - No recording\n");
                        }
                    }
                    
                    final String statusMessage = "📊 Upload Status for " + authManager.getEmployeeName() + ":\n\n" +
                            "Total Calls: " + totalCalls + "\n" +
                            "Calls with Recordings: " + callsWithRecordings + "\n" +
                            "Success Rate: " + (totalCalls > 0 ? (callsWithRecordings * 100 / totalCalls) : 0) + "%\n\n" +
                            "Recent Calls:\n" + recentCalls.toString();
                    
                    new Handler(Looper.getMainLooper()).post(() -> {
                        uploadStatusText.setText(statusMessage);
                        checkUploadsButton.setText("🔍 Check Uploads");
                        checkUploadsButton.setEnabled(true);
                    });
                    
                } else {
                    final String errorMsg = "Failed to check uploads: HTTP " + responseCode;
                    new Handler(Looper.getMainLooper()).post(() -> {
                        uploadStatusText.setText(errorMsg);
                        checkUploadsButton.setText("🔍 Check Uploads");
                        checkUploadsButton.setEnabled(true);
                    });
                }
                
                connection.disconnect();
                
            } catch (Exception e) {
                final String errorMsg = "Error checking uploads: " + e.getMessage();
                new Handler(Looper.getMainLooper()).post(() -> {
                    uploadStatusText.setText(errorMsg);
                    checkUploadsButton.setText("🔍 Check Uploads");
                    checkUploadsButton.setEnabled(true);
                });
            }
        }).start();
    }
    
    private void testRecordingUpload() {
        if (!isAuthenticated) {
            Toast.makeText(this, "Please authenticate first", Toast.LENGTH_SHORT).show();
            return;
        }
        
        testUploadButton.setText("🔄 Testing...");
        testUploadButton.setEnabled(false);
        uploadStatusText.setText("Creating test recording and uploading...");
        
        new Thread(() -> {
            try {
                // Create a small test audio file
                File testDir = new File(getExternalFilesDir(null), "test_recordings");
                if (!testDir.exists()) {
                    testDir.mkdirs();
                }
                
                File testFile = new File(testDir, "test_call_" + System.currentTimeMillis() + ".mp3");
                
                // Create a minimal MP3-like file (just for testing - won't be valid audio)
                try (java.io.FileOutputStream fos = new java.io.FileOutputStream(testFile)) {
                    fos.write("TEST_AUDIO_DATA_FOR_UPLOAD_TESTING".getBytes());
                }
                
                Log.d("TestUpload", "Created test file: " + testFile.getAbsolutePath());
                
                // Create metadata
                com.ooak.callmanager.api.CallRecordingUploader.CallMetadata metadata = 
                    new com.ooak.callmanager.api.CallRecordingUploader.CallMetadata(
                        "9999999999", // test phone number
                        "Test Contact", // contact name
                        "outgoing", // direction
                        System.currentTimeMillis() - 60000, // call start (1 minute ago)
                        System.currentTimeMillis(), // call end (now)
                        android.provider.Settings.Secure.getString(getContentResolver(), android.provider.Settings.Secure.ANDROID_ID), // device ID
                        true, // matched
                        authManager.getEmployeeId() // employee ID
                    );
                
                // Upload using CallRecordingUploader
                com.ooak.callmanager.api.CallRecordingUploader uploader = 
                    new com.ooak.callmanager.api.CallRecordingUploader(this, "https://portal.ooak.photography");
                
                uploader.uploadRecording(testFile, metadata, new com.ooak.callmanager.api.CallRecordingUploader.UploadCallback() {
                    @Override
                    public void onSuccess(String recordingId, String message) {
                        Log.d("TestUpload", "Upload successful: " + recordingId);
                        
                        new Handler(Looper.getMainLooper()).post(() -> {
                            uploadStatusText.setText("✅ Test upload successful!\n" +
                                    "Recording ID: " + recordingId + "\n" +
                                    "Message: " + message + "\n" +
                                    "Employee: " + authManager.getEmployeeId() + "\n" +
                                    "Time: " + new java.text.SimpleDateFormat("HH:mm:ss").format(new java.util.Date()));
                            testUploadButton.setText("🧪 Test Upload");
                            testUploadButton.setEnabled(true);
                            Toast.makeText(MainActivity.this, "Test upload successful!", Toast.LENGTH_LONG).show();
                        });
                        
                        // Clean up test file
                        testFile.delete();
                    }
                    
                    @Override
                    public void onError(String error) {
                        Log.e("TestUpload", "Upload failed: " + error);
                        
                        new Handler(Looper.getMainLooper()).post(() -> {
                            uploadStatusText.setText("❌ Test upload failed:\n" + error + "\n" +
                                    "Employee ID: " + authManager.getEmployeeId() + "\n" +
                                    "Time: " + new java.text.SimpleDateFormat("HH:mm:ss").format(new java.util.Date()));
                            testUploadButton.setText("🧪 Test Upload");
                            testUploadButton.setEnabled(true);
                            Toast.makeText(MainActivity.this, "Test upload failed: " + error, Toast.LENGTH_LONG).show();
                        });
                        
                        // Clean up test file
                        testFile.delete();
                    }
                });
                
            } catch (Exception e) {
                Log.e("TestUpload", "Error creating test file", e);
                new Handler(Looper.getMainLooper()).post(() -> {
                    uploadStatusText.setText("❌ Error creating test file: " + e.getMessage());
                    testUploadButton.setText("🧪 Test Upload");
                    testUploadButton.setEnabled(true);
                });
            }
        }).start();
    }
    
    private void manualRecordingUpload() {
        // Implementation of manual recording upload
    }
    
    private void fixStoragePermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            if (!Environment.isExternalStorageManager()) {
                updateStatus("🔧 Opening storage permission settings...\n📁 Please grant 'All files access' permission\n⏱️ The app will automatically continue after permission is granted");
                
                try {
                    Intent intent = new Intent(Settings.ACTION_MANAGE_ALL_FILES_ACCESS_PERMISSION);
                    startActivity(intent);
                } catch (Exception e) {
                    // Fallback to app settings
                    Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                    intent.setData(Uri.parse("package:" + getPackageName()));
                    startActivity(intent);
                    updateStatus("🔧 Please go to Permissions > Files and Media\n📁 Enable 'All files access'\n⏱️ Return to the app after granting permission");
                }
            } else {
                updateStatus("✅ Storage permissions already granted!\n📁 Manage External Storage: OK");
                Toast.makeText(this, "Storage permissions already granted!", Toast.LENGTH_SHORT).show();
            }
        } else {
            updateStatus("✅ Storage permissions OK for this Android version\n📁 Legacy storage permissions are handled automatically");
            Toast.makeText(this, "Storage permissions OK for this Android version", Toast.LENGTH_SHORT).show();
        }
    }
} 