// Type definitions for OOAK Call Manager

export interface Employee {
  id: string;
  name: string;
  email: string;
  officialNumber: string;
  simSlot?: number; // 0 or 1 for dual SIM
  isActive: boolean;
}

export interface CallRequest {
  taskId: string;
  clientPhone: string;
  clientName: string;
  employeeId: string;
  officialNumber: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  notes?: string;
}

export interface CallRecord {
  id: string;
  taskId: string;
  clientPhone: string;
  clientName: string;
  officialNumber: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in seconds
  status: 'pending' | 'ringing' | 'connected' | 'ended' | 'failed';
  recordingPath?: string;
  uploadStatus: 'pending' | 'uploading' | 'completed' | 'failed';
  uploadProgress?: number;
  notes?: string;
}

export interface AppConfig {
  apiBaseUrl: string;
  apiKey: string;
  employeeId: string;
  autoUpload: boolean;
  recordingQuality: 'low' | 'medium' | 'high';
  maxRetries: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface CallStats {
  totalCalls: number;
  completedCalls: number;
  failedCalls: number;
  totalDuration: number;
  averageDuration: number;
  uploadsPending: number;
}

export interface SimCard {
  slotIndex: number;
  phoneNumber: string;
  carrierName: string;
  isActive: boolean;
}

export interface UploadProgress {
  taskId: string;
  progress: number;
  status: 'uploading' | 'completed' | 'failed';
  error?: string;
} 