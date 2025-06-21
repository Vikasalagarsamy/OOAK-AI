package com.ooak.callmanager.config;

import android.content.Context;
import android.content.SharedPreferences;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.util.Log;

public class AppConfig {
    private static final String TAG = "AppConfig";
    private static final String PREFS_NAME = "app_config";
    private static final String PREF_SERVER_URL = "server_url";
    
    // Server options in priority order
    public static final String PRIMARY_SERVER = "https://portal.ooak.photography";     // Cloudflare tunnel
    public static final String FALLBACK_SERVER = "https://portal.ooak.photography";        // Local network
    
    private static AppConfig instance;
    private final Context context;
    private final SharedPreferences prefs;
    
    private AppConfig(Context context) {
        this.context = context.getApplicationContext();
        this.prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }
    
    public static synchronized AppConfig getInstance(Context context) {
        if (instance == null) {
            instance = new AppConfig(context);
        }
        return instance;
    }
    
    /**
     * Get the best available server URL based on current network conditions
     */
    public String getServerUrl() {
        // Always prefer the Cloudflare tunnel as it works on any network
        String serverUrl = PRIMARY_SERVER;
        
        // Log network info for debugging
        String networkInfo = getNetworkInfo();
        Log.d(TAG, "🌐 Network: " + networkInfo + ", Using server: " + serverUrl);
        
        // Store the current choice
        prefs.edit().putString(PREF_SERVER_URL, serverUrl).apply();
        
        return serverUrl;
    }
    
    /**
     * Get network information for debugging
     */
    public String getNetworkInfo() {
        ConnectivityManager cm = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm == null) return "Unknown";
        
        Network activeNetwork = cm.getActiveNetwork();
        if (activeNetwork == null) return "No Connection";
        
        NetworkCapabilities caps = cm.getNetworkCapabilities(activeNetwork);
        if (caps == null) return "Unknown";
        
        if (caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) {
            return "WiFi";
        } else if (caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)) {
            return "Mobile Data";
        } else if (caps.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)) {
            return "Ethernet";
        } else {
            return "Other";
        }
    }
    
    /**
     * Check if device is connected to WiFi
     */
    public boolean isOnWiFi() {
        return "WiFi".equals(getNetworkInfo());
    }
    
    /**
     * Check if device is using mobile data
     */
    public boolean isOnMobileData() {
        return "Mobile Data".equals(getNetworkInfo());
    }
    
    /**
     * Get last used server URL from preferences
     */
    public String getLastUsedServerUrl() {
        return prefs.getString(PREF_SERVER_URL, PRIMARY_SERVER);
    }
    
    /**
     * Manually set server URL (for testing or manual override)
     */
    public void setServerUrl(String url) {
        prefs.edit().putString(PREF_SERVER_URL, url).apply();
        Log.d(TAG, "📝 Manually set server URL to: " + url);
    }
    
    /**
     * Get all available server options
     */
    public String[] getAllServerOptions() {
        return new String[]{PRIMARY_SERVER, FALLBACK_SERVER};
    }
} 