package com.ooak.callmanager.utils;

import android.content.Context;
import android.database.Cursor;
import android.provider.ContactsContract;
import android.text.TextUtils;
import android.util.Log;
import java.util.HashMap;
import java.util.Map;

public class ContactHelper {
    private static final String TAG = "ContactHelper";
    private Context context;
    private Map<String, String> contactCache = new HashMap<>();
    private long lastCacheUpdate = 0;
    private static final long CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    public ContactHelper(Context context) {
        this.context = context;
    }

    /**
     * Get contact name from phone's contact list
     * @param phoneNumber The phone number to lookup
     * @return Contact name if found, null otherwise
     */
    public String getContactName(String phoneNumber) {
        if (TextUtils.isEmpty(phoneNumber)) {
            return null;
        }

        // Clean phone number for matching
        String cleanPhone = normalizePhoneNumber(phoneNumber);
        if (TextUtils.isEmpty(cleanPhone)) {
            return null;
        }

        // Check cache first
        long now = System.currentTimeMillis();
        if (now - lastCacheUpdate > CACHE_DURATION) {
            refreshContactCache();
        }

        // Try exact match first
        String contactName = contactCache.get(cleanPhone);
        if (contactName != null) {
            Log.d(TAG, "📱 Found contact: " + phoneNumber + " -> " + contactName);
            return contactName;
        }

        // Try fuzzy matching for different phone number formats
        for (Map.Entry<String, String> entry : contactCache.entrySet()) {
            String cachedPhone = entry.getKey();
            if (phoneNumbersMatch(cleanPhone, cachedPhone)) {
                Log.d(TAG, "📱 Found contact (fuzzy): " + phoneNumber + " -> " + entry.getValue());
                return entry.getValue();
            }
        }

        Log.d(TAG, "📱 No contact found for: " + phoneNumber);
        return null;
    }

    /**
     * Refresh the contact cache by reading from phone's contact database
     */
    private void refreshContactCache() {
        Log.d(TAG, "🔄 Refreshing contact cache...");
        contactCache.clear();

        Cursor cursor = null;
        try {
            cursor = context.getContentResolver().query(
                ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
                new String[]{
                    ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
                    ContactsContract.CommonDataKinds.Phone.NUMBER
                },
                null,
                null,
                ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME + " ASC"
            );

            if (cursor != null && cursor.moveToFirst()) {
                int nameIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME);
                int numberIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER);

                int count = 0;
                do {
                    String name = cursor.getString(nameIndex);
                    String number = cursor.getString(numberIndex);

                    if (!TextUtils.isEmpty(name) && !TextUtils.isEmpty(number)) {
                        String cleanNumber = normalizePhoneNumber(number);
                        if (!TextUtils.isEmpty(cleanNumber)) {
                            contactCache.put(cleanNumber, name);
                            count++;
                        }
                    }
                } while (cursor.moveToNext());

                Log.d(TAG, "✅ Loaded " + count + " contacts into cache");
            }
        } catch (SecurityException e) {
            Log.w(TAG, "❌ No READ_CONTACTS permission: " + e.getMessage());
        } catch (Exception e) {
            Log.e(TAG, "❌ Error reading contacts: " + e.getMessage());
        } finally {
            if (cursor != null) {
                cursor.close();
            }
        }

        lastCacheUpdate = System.currentTimeMillis();
    }

    /**
     * Normalize phone number for consistent matching
     */
    private String normalizePhoneNumber(String phoneNumber) {
        if (TextUtils.isEmpty(phoneNumber)) {
            return null;
        }

        // Remove all non-digit characters
        String cleaned = phoneNumber.replaceAll("[^0-9]", "");

        // Handle common country codes
        if (cleaned.startsWith("91") && cleaned.length() == 12) {
            // Remove India country code
            cleaned = cleaned.substring(2);
        } else if (cleaned.startsWith("1") && cleaned.length() == 11) {
            // Remove US/Canada country code
            cleaned = cleaned.substring(1);
        }

        // Ensure minimum length
        if (cleaned.length() < 7) {
            return null;
        }

        return cleaned;
    }

    /**
     * Check if two phone numbers match allowing for different formats
     */
    private boolean phoneNumbersMatch(String phone1, String phone2) {
        if (TextUtils.isEmpty(phone1) || TextUtils.isEmpty(phone2)) {
            return false;
        }

        // Exact match
        if (phone1.equals(phone2)) {
            return true;
        }

        // Check if one is a suffix of the other (for different country code formats)
        int minLength = Math.min(phone1.length(), phone2.length());
        if (minLength >= 7) {
            String suffix1 = phone1.substring(Math.max(0, phone1.length() - minLength));
            String suffix2 = phone2.substring(Math.max(0, phone2.length() - minLength));
            return suffix1.equals(suffix2);
        }

        return false;
    }

    /**
     * Force refresh of contact cache
     */
    public void forceRefresh() {
        lastCacheUpdate = 0;
        refreshContactCache();
    }

    /**
     * Get cache statistics for debugging
     */
    public String getCacheInfo() {
        return "Contacts cached: " + contactCache.size() + 
               ", Last updated: " + (System.currentTimeMillis() - lastCacheUpdate) / 1000 + "s ago";
    }
} 