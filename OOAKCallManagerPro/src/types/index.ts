// Production TypeScript types for OOAK Call Manager

export interface Employee {
  id: string;
  name: string;
  email: string;
  officialNumber: string;
  simSlot?: number; // 0 or 1 for dual SIM
  isActive: boolean;
  department?: string;
  role?: string;
}

export interface CallRequest {
  id: string;
  taskId: string;
  clientPhone: string;
  clientName: string;
  clientCompany?: string;
  employeeId: string;
  officialNumber: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  notes?: string;
  scheduledTime?: Date;
  leadId?: string;
  quotationId?: string;
  status: 'pending' | 'assigned' | 'calling' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

export interface CallRecord {
  id: string;
  taskId: string;
  callRequestId: string;
  clientPhone: string;
  clientName: string;
  clientCompany?: string;
  officialNumber: string;
  employeeId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in seconds
  status: 'pending' | 'ringing' | 'connected' | 'ended' | 'failed' | 'missed';
  recordingPath?: string;
  recordingUrl?: string;
  uploadStatus: 'pending' | 'uploading' | 'completed' | 'failed';
  uploadProgress?: number;
  transcription?: string;
  notes?: string;
  callQuality?: 'poor' | 'fair' | 'good' | 'excellent';
  outcome?: 'interested' | 'not_interested' | 'callback' | 'no_response' | 'converted';
  nextAction?: string;
  nextCallDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppConfig {
  apiBaseUrl: string;
  apiKey: string;
  employeeId: string;
  deviceId: string;
  autoUpload: boolean;
  recordingQuality: 'low' | 'medium' | 'high';
  maxRetries: number;
  syncInterval: number; // in minutes
  offlineMode: boolean;
  notificationsEnabled: boolean;
  autoAnswer?: boolean;
  callTimeout: number; // in seconds
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: number;
  timestamp?: string;
}

export interface CallStats {
  totalCalls: number;
  completedCalls: number;
  failedCalls: number;
  missedCalls: number;
  totalDuration: number;
  averageDuration: number;
  uploadsPending: number;
  uploadsCompleted: number;
  uploadsFailed: number;
  conversionRate: number;
  todaysCalls: number;
  thisWeekCalls: number;
  thisMonthCalls: number;
}

export interface SimCard {
  slotIndex: number;
  phoneNumber: string;
  carrierName: string;
  networkType: string;
  isActive: boolean;
  signalStrength?: number;
  isRoaming?: boolean;
  dataEnabled?: boolean;
}

export interface UploadProgress {
  taskId: string;
  callRecordId: string;
  progress: number;
  status: 'uploading' | 'completed' | 'failed' | 'paused';
  error?: string;
  retryCount: number;
  estimatedTimeRemaining?: number;
  uploadSpeed?: number; // bytes per second
}

export interface NotificationData {
  id: string;
  type: 'call_request' | 'upload_complete' | 'upload_failed' | 'system_update';
  title: string;
  message: string;
  data?: any;
  timestamp: Date;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
}

export interface DeviceStatus {
  deviceId: string;
  employeeId: string;
  isOnline: boolean;
  lastSeen: Date;
  batteryLevel?: number;
  storageAvailable?: number;
  networkStatus: 'wifi' | 'cellular' | 'offline';
  appVersion: string;
  osVersion: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}

export interface CallMetrics {
  callId: string;
  audioQuality: number; // 0-100
  networkLatency: number; // ms
  packetLoss: number; // percentage
  jitter: number; // ms
  signalStrength: number; // dBm
  backgroundNoise: number; // dB
}

export interface CRMIntegration {
  leadId?: string;
  contactId?: string;
  opportunityId?: string;
  accountId?: string;
  customFields?: Record<string, any>;
  tags?: string[];
  source?: string;
  campaign?: string;
}

export interface CallTemplate {
  id: string;
  name: string;
  script: string;
  category: 'sales' | 'support' | 'follow_up' | 'survey';
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
}

export interface CallOutcome {
  outcome: 'interested' | 'not_interested' | 'callback' | 'no_response' | 'converted' | 'do_not_call';
  notes: string;
  nextAction?: string;
  nextCallDate?: Date;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  followUpRequired: boolean;
}

// Navigation types
export type RootStackParamList = {
  Dashboard: undefined;
  CallHistory: undefined;
  Settings: undefined;
  CallScreen: { callRequest: CallRequest };
  CallDetails: { callRecord: CallRecord };
};

// Component props types
export interface CallCardProps {
  callRequest: CallRequest;
  onCall: (request: CallRequest) => void;
  onViewDetails: (request: CallRequest) => void;
  disabled?: boolean;
}

export interface CallHistoryItemProps {
  callRecord: CallRecord;
  onViewDetails: (record: CallRecord) => void;
  onRetryUpload?: (record: CallRecord) => void;
}

export interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  color?: string;
  subtitle?: string;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Sync types
export interface SyncStatus {
  lastSync: Date;
  pendingUploads: number;
  pendingDownloads: number;
  syncInProgress: boolean;
  errors: AppError[];
} 