import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiResponse, CallRequest, CallRecord, Employee } from '../types';

class ApiService {
  private api: AxiosInstance;
  private baseUrl: string = '';
  private apiKey: string = '';

  constructor() {
    this.api = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
    this.loadConfig();
  }

  private async loadConfig() {
    try {
      const config = await AsyncStorage.getItem('app_config');
      if (config) {
        const { apiBaseUrl, apiKey } = JSON.parse(config);
        this.baseUrl = apiBaseUrl;
        this.apiKey = apiKey;
        this.api.defaults.baseURL = apiBaseUrl;
        this.api.defaults.headers.common['Authorization'] = `Bearer ${apiKey}`;
      }
    } catch (error) {
      console.error('Failed to load API config:', error);
    }
  }

  private setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`);
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
        return response;
      },
      (error) => {
        console.error('❌ API Response Error:', error.response?.status, error.message);
        return Promise.reject(error);
      }
    );
  }

  async updateConfig(apiBaseUrl: string, apiKey: string) {
    this.baseUrl = apiBaseUrl;
    this.apiKey = apiKey;
    this.api.defaults.baseURL = apiBaseUrl;
    this.api.defaults.headers.common['Authorization'] = `Bearer ${apiKey}`;
    
    await AsyncStorage.setItem('app_config', JSON.stringify({
      apiBaseUrl,
      apiKey
    }));
  }

  // Get pending call requests for this device
  async getPendingCalls(employeeId: string): Promise<ApiResponse<CallRequest[]>> {
    try {
      const response = await this.api.get(`/api/call-requests/pending/${employeeId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch pending calls'
      };
    }
  }

  // Update call status
  async updateCallStatus(callId: string, status: string, data?: any): Promise<ApiResponse> {
    try {
      const response = await this.api.put(`/api/call-requests/${callId}/status`, {
        status,
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

  // Upload call recording
  async uploadRecording(
    taskId: string, 
    audioFile: string, 
    metadata: any,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse> {
    try {
      const formData = new FormData();
      formData.append('taskId', taskId);
      formData.append('audioFile', {
        uri: audioFile,
        type: 'audio/mp4',
        name: `call_${taskId}_${Date.now()}.m4a`
      } as any);
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

  // Get employee details
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

  // Send heartbeat to keep connection alive
  async sendHeartbeat(employeeId: string): Promise<ApiResponse> {
    try {
      const response = await this.api.post('/api/heartbeat', {
        employeeId,
        timestamp: new Date().toISOString(),
        status: 'online'
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

  // Test API connection
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
}

export default new ApiService(); 