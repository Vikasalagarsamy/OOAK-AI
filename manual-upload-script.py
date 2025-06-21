#!/usr/bin/env python3
"""
OOAK Manual Call Recording Upload Script
=====================================
This script helps upload specific call recordings from Android device to CRM system.
"""

import requests
import os
import sys
from datetime import datetime

# Configuration
CRM_BASE_URL = "https://portal.ooak.photography"
EMPLOYEE_ID = "EMP-25-0001"

def upload_recording(file_path, phone_number, contact_name, call_duration_seconds):
    """Upload a call recording to the CRM system"""
    
    if not os.path.exists(file_path):
        print(f"❌ Error: File not found: {file_path}")
        return False
    
    # Prepare metadata
    timestamp = int(datetime.now().timestamp() * 1000)
    call_start = timestamp - (call_duration_seconds * 1000)  # Calculate start time
    call_end = timestamp
    
    metadata = {
        "phoneNumber": phone_number,
        "contactName": contact_name,
        "direction": "outgoing",  # Adjust if needed
        "callStartTime": call_start,
        "callEndTime": call_end,
        "deviceId": "manual_upload",
        "matched": True,
        "employeeId": EMPLOYEE_ID
    }
    
    # Prepare file upload
    filename = os.path.basename(file_path)
    
    try:
        with open(file_path, 'rb') as audio_file:
            files = {
                'audio': (filename, audio_file, 'audio/mp4')
            }
            data = {
                'metadata': str(metadata).replace("'", '"')
            }
            headers = {
                'X-Employee-ID': EMPLOYEE_ID
            }
            
            print(f"🚀 Uploading {filename} to CRM system...")
            print(f"📞 Phone: {phone_number}")
            print(f"👤 Contact: {contact_name}")
            print(f"⏱️ Duration: {call_duration_seconds} seconds")
            
            response = requests.post(
                f"{CRM_BASE_URL}/api/call-recordings",
                files=files,
                data=data,
                headers=headers,
                timeout=60
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Upload successful!")
                print(f"📊 Recording ID: {result.get('recordingId', 'Unknown')}")
                print(f"📝 Message: {result.get('message', 'Success')}")
                return True
            else:
                print(f"❌ Upload failed: HTTP {response.status_code}")
                print(f"Error: {response.text}")
                return False
                
    except Exception as e:
        print(f"❌ Upload error: {str(e)}")
        return False

def main():
    print("📱 OOAK Manual Call Recording Upload")
    print("=" * 40)
    
    # Your specific recording file
    recording_file = "/path/to/your/recording.m4a"  # Update this path
    phone_number = "+919677362524"  # Your call's phone number
    contact_name = "Vikas Alagarsamy"  # Contact name
    duration_seconds = 12  # Actual talk duration in seconds
    
    # For your specific case from the screenshots:
    if len(sys.argv) > 1:
        recording_file = sys.argv[1]
    
    # Example for your exact recording:
    # recording_file = "/storage/emulated/0/Internal storage/Recordings/Call/Call recording Vikas Alagarsamy_250617_090228.m4a"
    
    if upload_recording(recording_file, phone_number, contact_name, duration_seconds):
        print("\n🎉 Success! Recording uploaded to CRM system.")
        print(f"🌐 Check the call monitoring dashboard: {CRM_BASE_URL}/call-monitoring")
    else:
        print("\n❌ Upload failed. Please check the error messages above.")

if __name__ == "__main__":
    main() 