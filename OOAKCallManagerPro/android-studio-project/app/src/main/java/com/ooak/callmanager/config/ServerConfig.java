package com.ooak.callmanager.config;

import android.content.Context;
import android.content.SharedPreferences;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.util.Log;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class ServerConfig {
    private static final String TAG = "ServerConfig";
    private static final String PREFS_NAME = "server_config";
    private static final String PREF_CURRENT_SERVER = "current_server_url";
    private static final String PREF_LAST_UPDATED = "last_updated";
    
    // Server options in priority order
    private static final List<String> SERVER_URLS = Arrays.asList(
        "https://portal.ooak.photography",      // Primary: Cloudflare tunnel (works everywhere)
        "https://portal.ooak.photography",          // Secondary: Local network (WiFi only)
        "http://192.168.1.116:3000",           // Tertiary: Alternative local IP
        "http://10.0.0.116:3000"               // Quaternary: Alternative network
    );
    
    private static ServerConfig instance;
    private final Context context;
    private final SharedPreferences prefs;
    private final ExecutorService executor;
    private String currentServerUrl;
    private long lastHealthCheck = 0;
    private static final long HEALTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
    
    private ServerConfig(Context context) {
        this.context = context.getApplicationContext();
        this.prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        this.executor = Executors.newSingleThreadExecutor();
        this.currentServerUrl = prefs.getString(PREF_CURRENT_SERVER, SERVER_URLS.get(0));
        
        Log.d(TAG, "ServerConfig initialized with URL: " + currentServerUrl);
    }
    
    public static synchronized ServerConfig getInstance(Context context) {
        if (instance == null) {
            instance = new ServerConfig(context);
        }
        return instance;
    }
    
    public String getServerUrl() {
        // Perform health check if needed
        if (System.currentTimeMillis() - lastHealthCheck > HEALTH_CHECK_INTERVAL) {
            checkServerHealth();
        }
        return currentServerUrl;
    }
    
    public void checkServerHealth() {
        executor.execute(() -> {
            String workingUrl = findWorkingServer();
            if (workingUrl != null && !workingUrl.equals(currentServerUrl)) {
                Log.d(TAG, "Server changed from " + currentServerUrl + " to " + workingUrl);
                updateServerUrl(workingUrl);
            }
            lastHealthCheck = System.currentTimeMillis();
        });
    }
    
    private String findWorkingServer() {
        for (String serverUrl : SERVER_URLS) {
            if (isServerReachable(serverUrl)) {
                Log.d(TAG, "✅ Server reachable: " + serverUrl);
                return serverUrl;
            } else {
                Log.d(TAG, "❌ Server unreachable: " + serverUrl);
            }
        }
        
        Log.w(TAG, "⚠️ No servers reachable, keeping current: " + currentServerUrl);
        return currentServerUrl; // Keep current if none work
    }
    
    private boolean isServerReachable(String serverUrl) {
        try {
            URL url = new URL(serverUrl + "/api/health");
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(5000); // 5 seconds
            connection.setReadTimeout(5000);
            
            int responseCode = connection.getResponseCode();
            connection.disconnect();
            
            return responseCode == 200 || responseCode == 404; // 404 is ok if no health endpoint
            
        } catch (Exception e) {
            Log.d(TAG, "Server check failed for " + serverUrl + ": " + e.getMessage());
            return false;
        }
    }
    
    private void updateServerUrl(String newUrl) {
        currentServerUrl = newUrl;
        prefs.edit()
                .putString(PREF_CURRENT_SERVER, newUrl)
                .putLong(PREF_LAST_UPDATED, System.currentTimeMillis())
                .apply();
        
        Log.i(TAG, "🔄 Updated server URL to: " + newUrl);
    }
    
    public boolean isOnWiFi() {
        ConnectivityManager cm = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm == null) return false;
        
        Network activeNetwork = cm.getActiveNetwork();
        if (activeNetwork == null) return false;
        
        NetworkCapabilities caps = cm.getNetworkCapabilities(activeNetwork);
        return caps != null && caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI);
    }
    
    public boolean isOnMobileData() {
        ConnectivityManager cm = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm == null) return false;
        
        Network activeNetwork = cm.getActiveNetwork();
        if (activeNetwork == null) return false;
        
        NetworkCapabilities caps = cm.getNetworkCapabilities(activeNetwork);
        return caps != null && caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR);
    }
    
    public String getNetworkInfo() {
        if (isOnWiFi()) {
            return "WiFi";
        } else if (isOnMobileData()) {
            return "Mobile Data";
        } else {
            return "Unknown";
        }
    }
    
    // Force refresh server selection
    public void forceRefresh() {
        lastHealthCheck = 0;
        checkServerHealth();
    }
    
    // Get all configured servers for debugging
    public List<String> getAllServers() {
        return SERVER_URLS;
    }
    
    // Manual server override (for testing)
    public void setServerUrl(String url) {
        updateServerUrl(url);
    }
} 