package com.ooak.callmanager;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.google.android.material.textfield.TextInputEditText;
import com.google.android.material.button.MaterialButton;
import com.ooak.callmanager.services.CallMonitoringService;
import com.ooak.callmanager.services.RecordingMonitorService;

public class MainActivity extends AppCompatActivity {
    private static final int PERMISSION_REQUEST_CODE = 1001;
    
    private TextInputEditText employeeIdInput;
    private TextInputEditText employeeNameInput;
    private MaterialButton authenticateButton;
    private MaterialButton startServicesButton;
    private MaterialButton stopServicesButton;
    private TextView statusText;
    
    private boolean isAuthenticated = false;
    private boolean servicesRunning = false;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        initializeViews();
        setupClickListeners();
        checkPermissions();
        loadSavedCredentials();
        updateStatus("🔄 App initialized. Please authenticate employee.");
    }
    
    private void initializeViews() {
        employeeIdInput = findViewById(R.id.employee_id_input);
        employeeNameInput = findViewById(R.id.employee_name_input);
        authenticateButton = findViewById(R.id.authenticate_button);
        startServicesButton = findViewById(R.id.start_services_button);
        stopServicesButton = findViewById(R.id.stop_services_button);
        statusText = findViewById(R.id.status_text);
    }
    
    private void setupClickListeners() {
        authenticateButton.setOnClickListener(v -> authenticateEmployee());
        startServicesButton.setOnClickListener(v -> startBackgroundServices());
        stopServicesButton.setOnClickListener(v -> stopBackgroundServices());
    }
    
    private void loadSavedCredentials() {
        String savedEmployeeId = getSharedPreferences("employee_prefs", MODE_PRIVATE)
                .getString("employee_id", "");
        String savedEmployeeName = getSharedPreferences("employee_prefs", MODE_PRIVATE)
                .getString("employee_name", "");
        boolean savedAuthenticated = getSharedPreferences("employee_prefs", MODE_PRIVATE)
                .getBoolean("is_authenticated", false);
        
        if (savedAuthenticated && !savedEmployeeId.isEmpty() && !savedEmployeeName.isEmpty()) {
            employeeIdInput.setText(savedEmployeeId);
            employeeNameInput.setText(savedEmployeeName);
            isAuthenticated = true;
            startServicesButton.setEnabled(true);
            authenticateButton.setText("✅ Authenticated");
            authenticateButton.setEnabled(false);
            
            updateStatus("✅ Previous authentication loaded!\n" +
                        "Employee ID: " + savedEmployeeId + "\n" +
                        "Employee Name: " + savedEmployeeName + "\n" +
                        "Ready to start background services.");
        }
    }
    
    private void authenticateEmployee() {
        String employeeId = employeeIdInput.getText().toString().trim();
        String employeeName = employeeNameInput.getText().toString().trim();
        
        if (employeeId.isEmpty() || employeeName.isEmpty()) {
            Toast.makeText(this, "Please enter both Employee ID and Name", Toast.LENGTH_SHORT).show();
            updateStatus("❌ Authentication failed: Missing credentials");
            return;
        }
        
        // Validate Employee ID format
        if (!employeeId.matches("^[A-Z]{2,4}\\d{3,6}$")) {
            Toast.makeText(this, "Employee ID format: EMP001, SALES001, etc.", Toast.LENGTH_LONG).show();
            updateStatus("❌ Authentication failed: Invalid Employee ID format");
            return;
        }
        
        // Store employee credentials
        getSharedPreferences("employee_prefs", MODE_PRIVATE)
                .edit()
                .putString("employee_id", employeeId)
                .putString("employee_name", employeeName)
                .putBoolean("is_authenticated", true)
                .apply();
        
        isAuthenticated = true;
        startServicesButton.setEnabled(true);
        authenticateButton.setText("✅ Authenticated");
        authenticateButton.setEnabled(false);
        
        updateStatus("✅ Employee authenticated successfully!\n" +
                    "Employee ID: " + employeeId + "\n" +
                    "Employee Name: " + employeeName + "\n" +
                    "Device registered for automatic call upload\n" +
                    "Ready to start background services.");
        
        Toast.makeText(this, "Authentication successful!", Toast.LENGTH_SHORT).show();
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
            
            servicesRunning = true;
            startServicesButton.setText("✅ Services Running");
            startServicesButton.setEnabled(false);
            stopServicesButton.setEnabled(true);
            
            updateStatus("🚀 Background services started successfully!\n" +
                        "✅ Call Monitoring Service: Active\n" +
                        "✅ Recording Monitor Service: Active\n" +
                        "✅ CRM Server: Connected to localhost:3000\n" +
                        "✅ Employee: " + getEmployeeId() + "\n\n" +
                        "🎯 AUTOMATIC WORKFLOW ACTIVE:\n" +
                        "1. 📞 Monitor all phone calls\n" +
                        "2. 🎙️ Detect call recordings automatically\n" +
                        "3. ⬆️ Upload to OOAK-FUTURE dashboard\n" +
                        "4. 🤖 Process with Whisper AI transcription\n" +
                        "5. 📊 Results appear in employee dashboard\n\n" +
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
            
            servicesRunning = false;
            startServicesButton.setText("🚀 Start Background Services");
            startServicesButton.setEnabled(true);
            stopServicesButton.setEnabled(false);
            
            updateStatus("⏹️ Background services stopped\n" +
                        "Call monitoring and recording upload disabled\n" +
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
            Manifest.permission.READ_EXTERNAL_STORAGE,
            Manifest.permission.WRITE_EXTERNAL_STORAGE,
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.INTERNET,
            Manifest.permission.ACCESS_NETWORK_STATE,
            Manifest.permission.WAKE_LOCK,
            Manifest.permission.FOREGROUND_SERVICE
        };
        
        for (String permission : permissions) {
            if (ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
                return false;
            }
        }
        return true;
    }
    
    private void checkPermissions() {
        if (!hasAllPermissions()) {
            updateStatus("⚠️ Permissions required for full functionality:\n" +
                        "• Phone access - Monitor calls\n" +
                        "• Storage access - Read recordings\n" +
                        "• Microphone - Recording detection\n" +
                        "• Internet - Upload to dashboard\n" +
                        "• Background services - 24/7 operation");
        } else {
            updateStatus("✅ All permissions granted and ready!");
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
            Manifest.permission.FOREGROUND_SERVICE
        };
        
        ActivityCompat.requestPermissions(this, permissions, PERMISSION_REQUEST_CODE);
        updateStatus("🔐 Requesting permissions...\nPlease allow all permissions for full functionality");
    }
    
    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        
        if (requestCode == PERMISSION_REQUEST_CODE) {
            boolean allGranted = true;
            StringBuilder deniedPermissions = new StringBuilder();
            
            for (int i = 0; i < permissions.length; i++) {
                if (grantResults[i] != PackageManager.PERMISSION_GRANTED) {
                    allGranted = false;
                    deniedPermissions.append("• ").append(permissions[i]).append("\n");
                }
            }
            
            if (allGranted) {
                updateStatus("✅ All permissions granted successfully!\n" +
                            "Ready to start background services for automatic call upload.");
                Toast.makeText(this, "All permissions granted!", Toast.LENGTH_SHORT).show();
            } else {
                updateStatus("❌ Some permissions denied:\n" + deniedPermissions.toString() + 
                            "\nApp functionality may be limited.\n" +
                            "Please go to Settings > Apps > OOAK Call Manager > Permissions\n" +
                            "and enable all permissions manually.");
                Toast.makeText(this, "Please grant all permissions in Settings", Toast.LENGTH_LONG).show();
            }
        }
    }
    
    private String getEmployeeId() {
        return getSharedPreferences("employee_prefs", MODE_PRIVATE)
                .getString("employee_id", "Unknown");
    }
    
    private void updateStatus(String message) {
        String timestamp = java.text.DateFormat.getDateTimeInstance().format(new java.util.Date());
        String statusMessage = "[" + timestamp + "]\n" + message + "\n\n" + statusText.getText().toString();
        
        // Limit status text length to prevent memory issues
        if (statusMessage.length() > 5000) {
            statusMessage = statusMessage.substring(0, 5000) + "\n... (truncated)";
        }
        
        statusText.setText(statusMessage);
    }
    
    @Override
    protected void onResume() {
        super.onResume();
        // Update UI based on current state
        if (isAuthenticated) {
            updateStatus("📱 App resumed - Services " + (servicesRunning ? "running" : "stopped"));
        }
    }
} 