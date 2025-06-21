import { NativeModules, PermissionsAndroid, Platform } from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CallRecord, CallRequest, SimCard } from '../types';
import ApiService from './ApiService';

class CallService {
  private audioRecorderPlayer: AudioRecorderPlayer;
  private currentRecording: string | null = null;
  private activeCall: CallRecord | null = null;
  private recordingStartTime: Date | null = null;

  constructor() {
    this.audioRecorderPlayer = new AudioRecorderPlayer();
  }

  // Request necessary permissions
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true; // iOS permissions handled differently
    }

    try {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.CALL_PHONE,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      ];

      const granted = await PermissionsAndroid.requestMultiple(permissions);
      
      return Object.values(granted).every(
        permission => permission === PermissionsAndroid.RESULTS.GRANTED
      );
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  // Get available SIM cards
  async getSimCards(): Promise<SimCard[]> {
    try {
      // This would use a native module to get SIM card info
      // For now, return mock data
      return [
        {
          slotIndex: 0,
          phoneNumber: '+917550040892',
          carrierName: 'Airtel',
          isActive: true
        },
        {
          slotIndex: 1,
          phoneNumber: '+919876543210',
          carrierName: 'Jio',
          isActive: true
        }
      ];
    } catch (error) {
      console.error('Failed to get SIM cards:', error);
      return [];
    }
  }

  // Make a call using specific SIM
  async makeCall(callRequest: CallRequest, simSlot: number = 0): Promise<boolean> {
    try {
      console.log(`📞 Making call to ${callRequest.clientPhone} using SIM ${simSlot}`);
      
      // Create call record
      const callRecord: CallRecord = {
        id: `call_${Date.now()}`,
        taskId: callRequest.taskId,
        clientPhone: callRequest.clientPhone,
        clientName: callRequest.clientName,
        officialNumber: callRequest.officialNumber,
        startTime: new Date(),
        status: 'pending',
        uploadStatus: 'pending'
      };

      this.activeCall = callRecord;
      await this.saveCallRecord(callRecord);

      // Update call status to ringing
      await ApiService.updateCallStatus(callRecord.id, 'ringing', {
        startTime: callRecord.startTime.toISOString()
      });

      // Use native module to make call with specific SIM
      // This would be implemented in native Android code
      const { CallManager } = NativeModules;
      if (CallManager) {
        const success = await CallManager.makeCall(
          callRequest.clientPhone,
          simSlot,
          callRecord.id
        );
        
        if (success) {
          callRecord.status = 'ringing';
          await this.saveCallRecord(callRecord);
          return true;
        }
      }

      // Fallback: use standard call intent
      const { Linking } = require('react-native');
      await Linking.openURL(`tel:${callRequest.clientPhone}`);
      
      return true;
    } catch (error) {
      console.error('Failed to make call:', error);
      if (this.activeCall) {
        this.activeCall.status = 'failed';
        await this.saveCallRecord(this.activeCall);
      }
      return false;
    }
  }

  // Start call recording
  async startRecording(callId: string): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.error('Recording permission denied');
        return false;
      }

      const recordingPath = `${RNFS.DocumentDirectoryPath}/call_${callId}_${Date.now()}.m4a`;
      
      console.log('🎙️ Starting call recording:', recordingPath);
      
      await this.audioRecorderPlayer.startRecorder(recordingPath, {
        SampleRate: 22050,
        Channels: 1,
        AudioQuality: 'High',
        AudioEncoding: 'aac',
        OutputFormat: 'mpeg_4',
      });

      this.currentRecording = recordingPath;
      this.recordingStartTime = new Date();

      if (this.activeCall) {
        this.activeCall.recordingPath = recordingPath;
        await this.saveCallRecord(this.activeCall);
      }

      return true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      return false;
    }
  }

  // Stop call recording
  async stopRecording(): Promise<string | null> {
    try {
      if (!this.currentRecording) {
        return null;
      }

      console.log('⏹️ Stopping call recording');
      
      const result = await this.audioRecorderPlayer.stopRecorder();
      const recordingPath = this.currentRecording;
      
      this.currentRecording = null;
      this.recordingStartTime = null;

      // Update call record with recording info
      if (this.activeCall) {
        this.activeCall.recordingPath = recordingPath;
        this.activeCall.endTime = new Date();
        this.activeCall.duration = this.activeCall.endTime.getTime() - this.activeCall.startTime.getTime();
        this.activeCall.status = 'ended';
        await this.saveCallRecord(this.activeCall);
      }

      return recordingPath;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      return null;
    }
  }

  // Handle call state changes (from native module)
  async onCallStateChanged(callId: string, state: string, phoneNumber?: string) {
    console.log(`📱 Call state changed: ${callId} -> ${state}`);
    
    if (!this.activeCall || this.activeCall.id !== callId) {
      return;
    }

    switch (state) {
      case 'RINGING':
        this.activeCall.status = 'ringing';
        break;
      case 'OFFHOOK': // Call connected
        this.activeCall.status = 'connected';
        await this.startRecording(callId);
        break;
      case 'IDLE': // Call ended
        this.activeCall.status = 'ended';
        this.activeCall.endTime = new Date();
        if (this.activeCall.startTime) {
          this.activeCall.duration = Math.floor(
            (this.activeCall.endTime.getTime() - this.activeCall.startTime.getTime()) / 1000
          );
        }
        await this.stopRecording();
        await this.uploadRecording(this.activeCall);
        break;
    }

    await this.saveCallRecord(this.activeCall);
    await ApiService.updateCallStatus(callId, this.activeCall.status, {
      endTime: this.activeCall.endTime?.toISOString(),
      duration: this.activeCall.duration
    });
  }

  // Upload recording to server
  async uploadRecording(callRecord: CallRecord): Promise<boolean> {
    if (!callRecord.recordingPath) {
      return false;
    }

    try {
      console.log('📤 Uploading call recording:', callRecord.recordingPath);
      
      callRecord.uploadStatus = 'uploading';
      await this.saveCallRecord(callRecord);

      const metadata = {
        callId: callRecord.id,
        taskId: callRecord.taskId,
        clientPhone: callRecord.clientPhone,
        clientName: callRecord.clientName,
        officialNumber: callRecord.officialNumber,
        startTime: callRecord.startTime.toISOString(),
        endTime: callRecord.endTime?.toISOString(),
        duration: callRecord.duration
      };

      const result = await ApiService.uploadRecording(
        callRecord.taskId,
        callRecord.recordingPath,
        metadata,
        (progress) => {
          callRecord.uploadProgress = progress;
          this.saveCallRecord(callRecord);
        }
      );

      if (result.success) {
        callRecord.uploadStatus = 'completed';
        console.log('✅ Recording uploaded successfully');
        
        // Delete local file after successful upload
        await RNFS.unlink(callRecord.recordingPath);
      } else {
        callRecord.uploadStatus = 'failed';
        console.error('❌ Recording upload failed:', result.error);
      }

      await this.saveCallRecord(callRecord);
      return result.success;
    } catch (error) {
      console.error('Upload error:', error);
      callRecord.uploadStatus = 'failed';
      await this.saveCallRecord(callRecord);
      return false;
    }
  }

  // Save call record to local storage
  private async saveCallRecord(callRecord: CallRecord) {
    try {
      const key = `call_record_${callRecord.id}`;
      await AsyncStorage.setItem(key, JSON.stringify(callRecord));
      
      // Also maintain a list of all call records
      const allCallsKey = 'all_call_records';
      const existingCalls = await AsyncStorage.getItem(allCallsKey);
      const callIds = existingCalls ? JSON.parse(existingCalls) : [];
      
      if (!callIds.includes(callRecord.id)) {
        callIds.push(callRecord.id);
        await AsyncStorage.setItem(allCallsKey, JSON.stringify(callIds));
      }
    } catch (error) {
      console.error('Failed to save call record:', error);
    }
  }

  // Get all call records
  async getAllCallRecords(): Promise<CallRecord[]> {
    try {
      const allCallsKey = 'all_call_records';
      const callIds = await AsyncStorage.getItem(allCallsKey);
      
      if (!callIds) {
        return [];
      }

      const ids = JSON.parse(callIds);
      const records: CallRecord[] = [];

      for (const id of ids) {
        const recordData = await AsyncStorage.getItem(`call_record_${id}`);
        if (recordData) {
          const record = JSON.parse(recordData);
          // Convert date strings back to Date objects
          record.startTime = new Date(record.startTime);
          if (record.endTime) {
            record.endTime = new Date(record.endTime);
          }
          records.push(record);
        }
      }

      return records.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    } catch (error) {
      console.error('Failed to get call records:', error);
      return [];
    }
  }

  // Retry failed uploads
  async retryFailedUploads(): Promise<number> {
    const records = await this.getAllCallRecords();
    const failedUploads = records.filter(r => r.uploadStatus === 'failed' && r.recordingPath);
    
    let successCount = 0;
    for (const record of failedUploads) {
      const success = await this.uploadRecording(record);
      if (success) {
        successCount++;
      }
    }

    return successCount;
  }

  // Get current active call
  getCurrentCall(): CallRecord | null {
    return this.activeCall;
  }

  // Clear active call
  clearActiveCall() {
    this.activeCall = null;
  }
}

export default new CallService(); 