import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  ApiResponse, 
  CallRequest, 
  CallRecord, 
  Employee, 
  AppConfig,
  CallStats,
  DeviceStatus,
  NotificationData,
  CallOutcome
} from '../types';

class ApiService {
  private api: AxiosInstance;
  private config: AppConfig | null = null;
  private retryCount = 0;
  private maxRetries = 3;

  constructor() {
    this.api = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'OOAK-Call-Manager/1.0.0',
      },
    });

    this.setupInterceptors();
    this.loadConfig();
  }

  private async loadConfig() {
    try {
      const configData = await AsyncStorage.getItem('app_config');
      if (configData) {
        this.config = JSON.parse(configData);
        this.updateApiConfig();
      }
    } catch (error) {
      console.error('Failed to load API config:', error);
    }
  }

  private updateApiConfig() {
    if (this.config) {
      this.api.defaults.baseURL = this.config.apiBaseUrl;
      this.api.defaults.headers.common['Authorization'] = `Bearer ${this.config.apiKey}`;
      this.api.defaults.headers.common['X-Device-ID'] = this.config.deviceId;
      this.api.defaults.headers.common['X-Employee-ID'] = this.config.employeeId;
    }
  }

  private setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        config.headers['X-Request-ID'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        config.headers['X-Timestamp'] = new Date().toISOString();
        return config;
      },
      (error) => {
        console.error('❌ API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        this.retryCount = 0; // Reset retry count on success
        return response;
      },
      async (error) => {
        console.error('❌ API Response Error:', error.response?.status, error.message);
        
        // Retry logic for network errors
        if (this.shouldRetry(error) && this.retryCount < this.maxRetries) {
          this.retryCount++;
          console.log(`🔄 Retrying request (${this.retryCount}/${this.maxRetries})`);
          await this.delay(1000 * this.retryCount); // Exponential backoff
          return this.api.request(error.config);
        }
        
        this.retryCount = 0;
        return Promise.reject(error);
      }
    );
  }

  private shouldRetry(error: any): boolean {
    return (
      error.code === 'NETWORK_ERROR' ||
      error.code === 'ECONNABORTED' ||
      (error.response && error.response.status >= 500)
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async updateConfig(config: AppConfig): Promise<void> {
    this.config = config;
    await AsyncStorage.setItem('app_config', JSON.stringify(config));
    this.updateApiConfig();
  }

  // Authentication & Device Management
  async registerDevice(deviceInfo: Partial<DeviceStatus>): Promise<ApiResponse<DeviceStatus>> {
    try {
      const response = await this.api.post('/api/devices/register', deviceInfo);
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to register device'
      };
    }
  }

  async sendHeartbeat(status: Partial<DeviceStatus>): Promise<ApiResponse> {
    try {
      const response = await this.api.post('/api/devices/heartbeat', {
        ...status,
        timestamp: new Date().toISOString()
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Heartbeat failed'
      };
    }
  }

  // Call Request Management
  async getPendingCalls(employeeId: string): Promise<ApiResponse<CallRequest[]>> {
    try {
      const response = await this.api.get(`/api/call-requests/pending/${employeeId}`);
      return {
        success: true,
        data: response.data.map((call: any) => ({
          ...call,
          createdAt: new Date(call.createdAt),
          updatedAt: new Date(call.updatedAt),
          scheduledTime: call.scheduledTime ? new Date(call.scheduledTime) : undefined
        }))
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch pending calls'
      };
    }
  }

  async getCallRequest(callId: string): Promise<ApiResponse<CallRequest>> {
    try {
      const response = await this.api.get(`/api/call-requests/${callId}`);
      return {
        success: true,
        data: {
          ...response.data,
          createdAt: new Date(response.data.createdAt),
          updatedAt: new Date(response.data.updatedAt),
          scheduledTime: response.data.scheduledTime ? new Date(response.data.scheduledTime) : undefined
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch call request'
      };
    }
  }

  async updateCallStatus(callId: string, status: string, data?: any): Promise<ApiResponse> {
    try {
      const response = await this.api.put(`/api/call-requests/${callId}/status`, {
        status,
        timestamp: new Date().toISOString(),
        ...data
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update call status'
      };
    }
  }

  // Call Recording Management
  async uploadRecording(
    callRecord: CallRecord,
    audioFile: string,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse> {
    try {
      const formData = new FormData();
      formData.append('callRecordId', callRecord.id);
      formData.append('taskId', callRecord.taskId);
      formData.append('audioFile', {
        uri: audioFile,
        type: 'audio/mp4',
        name: `call_${callRecord.id}_${Date.now()}.m4a`
      } as any);
      
      const metadata = {
        callId: callRecord.id,
        taskId: callRecord.taskId,
        clientPhone: callRecord.clientPhone,
        clientName: callRecord.clientName,
        officialNumber: callRecord.officialNumber,
        startTime: callRecord.startTime.toISOString(),
        endTime: callRecord.endTime?.toISOString(),
        duration: callRecord.duration,
        employeeId: callRecord.employeeId,
        callQuality: callRecord.callQuality,
        outcome: callRecord.outcome
      };
      
      formData.append('metadata', JSON.stringify(metadata));

      const response = await this.api.post('/api/call-uploads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to upload recording'
      };
    }
  }

  async getCallRecords(employeeId: string, limit = 50, offset = 0): Promise<ApiResponse<CallRecord[]>> {
    try {
      const response = await this.api.get(`/api/call-records/${employeeId}`, {
        params: { limit, offset }
      });
      return {
        success: true,
        data: response.data.map((record: any) => ({
          ...record,
          startTime: new Date(record.startTime),
          endTime: record.endTime ? new Date(record.endTime) : undefined,
          createdAt: new Date(record.createdAt),
          updatedAt: new Date(record.updatedAt),
          nextCallDate: record.nextCallDate ? new Date(record.nextCallDate) : undefined
        }))
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch call records'
      };
    }
  }

  async updateCallOutcome(callId: string, outcome: CallOutcome): Promise<ApiResponse> {
    try {
      const response = await this.api.put(`/api/call-records/${callId}/outcome`, {
        ...outcome,
        timestamp: new Date().toISOString()
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update call outcome'
      };
    }
  }

  // Employee Management
  async getEmployee(employeeId: string): Promise<ApiResponse<Employee>> {
    try {
      const response = await this.api.get(`/api/employees/${employeeId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch employee details'
      };
    }
  }

  async updateEmployeeStatus(employeeId: string, status: any): Promise<ApiResponse> {
    try {
      const response = await this.api.put(`/api/employees/${employeeId}/status`, {
        ...status,
        timestamp: new Date().toISOString()
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update employee status'
      };
    }
  }

  // Statistics & Analytics
  async getCallStats(employeeId: string, period = '30d'): Promise<ApiResponse<CallStats>> {
    try {
      const response = await this.api.get(`/api/analytics/call-stats/${employeeId}`, {
        params: { period }
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch call statistics'
      };
    }
  }

  // Notifications
  async getNotifications(employeeId: string): Promise<ApiResponse<NotificationData[]>> {
    try {
      const response = await this.api.get(`/api/notifications/${employeeId}`);
      return {
        success: true,
        data: response.data.map((notification: any) => ({
          ...notification,
          timestamp: new Date(notification.timestamp)
        }))
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch notifications'
      };
    }
  }

  async markNotificationRead(notificationId: string): Promise<ApiResponse> {
    try {
      const response = await this.api.put(`/api/notifications/${notificationId}/read`);
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to mark notification as read'
      };
    }
  }

  // System Health
  async testConnection(): Promise<ApiResponse> {
    try {
      const response = await this.api.get('/api/health');
      return {
        success: true,
        data: response.data,
        message: 'Connection successful'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Connection failed'
      };
    }
  }

  async getSystemStatus(): Promise<ApiResponse> {
    try {
      const response = await this.api.get('/api/system/status');
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get system status'
      };
    }
  }

  // Sync Management
  async syncData(lastSyncTime?: Date): Promise<ApiResponse> {
    try {
      const params = lastSyncTime ? { since: lastSyncTime.toISOString() } : {};
      const response = await this.api.post('/api/sync', params);
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Sync failed'
      };
    }
  }

  // Error Reporting
  async reportError(error: any, context?: any): Promise<void> {
    try {
      await this.api.post('/api/errors/report', {
        error: {
          message: error.message,
          stack: error.stack,
          code: error.code
        },
        context,
        timestamp: new Date().toISOString(),
        deviceId: this.config?.deviceId,
        employeeId: this.config?.employeeId
      });
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    }
  }

  // Dashboard Methods
  async getDashboardStats(): Promise<any> {
    try {
      const response = await this.api.get('/api/dashboard/stats');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch dashboard stats:', error);
      throw error;
    }
  }

  async getRecentCalls(): Promise<any[]> {
    try {
      const response = await this.api.get('/api/calls/recent');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch recent calls:', error);
      throw error;
    }
  }

  async getCalls(): Promise<any[]> {
    try {
      const response = await this.api.get('/api/calls');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch calls:', error);
      throw error;
    }
  }

  async updateCallStatus(callId: string, status: string): Promise<void> {
    try {
      await this.api.put(`/api/calls/${callId}/status`, { status });
    } catch (error: any) {
      console.error('Failed to update call status:', error);
      throw error;
    }
  }
  // Dashboard Methods
  async getDashboardStats(): Promise<any> {
    try {
      const response = await this.api.get('/api/dashboard/stats');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch dashboard stats:', error);
      throw error;
    }
  }

  async getRecentCalls(): Promise<any[]> {
    try {
      const response = await this.api.get('/api/calls/recent');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch recent calls:', error);
      throw error;
    }
  }

  async getCalls(): Promise<any[]> {
    try {
      const response = await this.api.get('/api/calls');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch calls:', error);
      throw error;
    }
  }
}

export default new ApiService(); 