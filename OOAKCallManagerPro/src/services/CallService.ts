import { Linking, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Call {
  id: string;
  clientName: string;
  phone: string;
  company: string;
  priority: 'Urgent' | 'High' | 'Medium' | 'Low';
  status: 'pending' | 'in_progress' | 'completed' | 'missed' | 'cancelled';
  scheduledTime?: string;
  startTime?: Date;
  endTime?: Date;
  duration?: number; // in seconds
  notes?: string;
  outcome?: 'interested' | 'not_interested' | 'callback' | 'no_answer' | 'busy';
  nextCallDate?: Date;
  leadId?: string;
  employeeId?: string;
}

export interface CallStats {
  todaysCalls: number;
  completedCalls: number;
  pendingCalls: number;
  missedCalls: number;
  totalDuration: number;
  avgDuration: string;
  successRate: number;
  uploadQueue: number;
}

class CallService {
  private calls: Call[] = [];
  private currentCall: Call | null = null;
  private callStartTime: Date | null = null;

  constructor() {
    this.loadCallsFromStorage();
  }

  // Storage Management
  private async loadCallsFromStorage() {
    try {
      const storedCalls = await AsyncStorage.getItem('calls_data');
      if (storedCalls) {
        this.calls = JSON.parse(storedCalls);
      } else {
        // Load demo data for prototype
        this.calls = this.getDemoCalls();
        await this.saveCallsToStorage();
      }
    } catch (error) {
      console.error('Failed to load calls from storage:', error);
      this.calls = this.getDemoCalls();
    }
  }

  private async saveCallsToStorage() {
    try {
      await AsyncStorage.setItem('calls_data', JSON.stringify(this.calls));
    } catch (error) {
      console.error('Failed to save calls to storage:', error);
    }
  }

  // Demo Data
  private getDemoCalls(): Call[] {
    return [
      {
        id: '1',
        clientName: 'Rajesh Kumar',
        phone: '+919876543210',
        company: 'Tech Solutions',
        priority: 'High',
        status: 'pending',
        scheduledTime: '10:30 AM',
        leadId: 'lead_001',
        employeeId: 'emp_001',
      },
      {
        id: '2',
        clientName: 'Priya Sharma',
        phone: '+919876543211',
        company: 'Digital Marketing',
        priority: 'Medium',
        status: 'completed',
        scheduledTime: '11:00 AM',
        startTime: new Date(Date.now() - 3600000), // 1 hour ago
        endTime: new Date(Date.now() - 3300000), // 55 minutes ago
        duration: 300, // 5 minutes
        outcome: 'interested',
        notes: 'Interested in premium package. Follow up next week.',
        leadId: 'lead_002',
        employeeId: 'emp_001',
      },
      {
        id: '3',
        clientName: 'Amit Patel',
        phone: '+919876543212',
        company: 'E-commerce Ltd',
        priority: 'Urgent',
        status: 'missed',
        scheduledTime: '09:45 AM',
        leadId: 'lead_003',
        employeeId: 'emp_001',
      },
      {
        id: '4',
        clientName: 'Sneha Reddy',
        phone: '+919876543213',
        company: 'Fashion Boutique',
        priority: 'Medium',
        status: 'in_progress',
        scheduledTime: '12:15 PM',
        startTime: new Date(),
        leadId: 'lead_004',
        employeeId: 'emp_001',
      },
    ];
  }

  // Call Management
  async makeCall(call: Call): Promise<boolean> {
    try {
      const url = `tel:${call.phone}`;
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        // Update call status to in_progress
        await this.updateCallStatus(call.id, 'in_progress');
        this.currentCall = { ...call, status: 'in_progress' };
        this.callStartTime = new Date();
        
        // Open phone dialer
        await Linking.openURL(url);
        return true;
      } else {
        Alert.alert('Error', 'Phone calls are not supported on this device');
        return false;
      }
    } catch (error) {
      console.error('Failed to make call:', error);
      Alert.alert('Error', 'Failed to initiate call');
      return false;
    }
  }

  async endCall(outcome?: Call['outcome'], notes?: string): Promise<void> {
    if (!this.currentCall || !this.callStartTime) return;

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - this.callStartTime.getTime()) / 1000);

    await this.updateCall(this.currentCall.id, {
      status: 'completed',
      endTime,
      duration,
      outcome,
      notes,
    });

    this.currentCall = null;
    this.callStartTime = null;
  }

  async updateCallStatus(callId: string, status: Call['status']): Promise<void> {
    const callIndex = this.calls.findIndex(call => call.id === callId);
    if (callIndex !== -1) {
      this.calls[callIndex].status = status;
      await this.saveCallsToStorage();
    }
  }

  async updateCall(callId: string, updates: Partial<Call>): Promise<void> {
    const callIndex = this.calls.findIndex(call => call.id === callId);
    if (callIndex !== -1) {
      this.calls[callIndex] = { ...this.calls[callIndex], ...updates };
      await this.saveCallsToStorage();
    }
  }

  async addCall(call: Omit<Call, 'id'>): Promise<string> {
    const newCall: Call = {
      ...call,
      id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    
    this.calls.push(newCall);
    await this.saveCallsToStorage();
    return newCall.id;
  }

  async scheduleCallback(callId: string, callbackDate: Date, notes?: string): Promise<void> {
    await this.updateCall(callId, {
      nextCallDate: callbackDate,
      notes: notes || 'Callback scheduled',
      outcome: 'callback',
    });

    // Create new call for callback
    const originalCall = this.calls.find(call => call.id === callId);
    if (originalCall) {
      await this.addCall({
        clientName: originalCall.clientName,
        phone: originalCall.phone,
        company: originalCall.company,
        priority: originalCall.priority,
        status: 'pending',
        scheduledTime: callbackDate.toLocaleTimeString(),
        notes: `Callback from previous call: ${notes || 'Follow up required'}`,
        leadId: originalCall.leadId,
        employeeId: originalCall.employeeId,
      });
    }
  }

  // Data Retrieval
  getCalls(): Call[] {
    return this.calls;
  }

  getPendingCalls(): Call[] {
    return this.calls.filter(call => call.status === 'pending');
  }

  getCompletedCalls(): Call[] {
    return this.calls.filter(call => call.status === 'completed');
  }

  getCallById(callId: string): Call | undefined {
    return this.calls.find(call => call.id === callId);
  }

  getCurrentCall(): Call | null {
    return this.currentCall;
  }

  // Statistics
  getCallStats(): CallStats {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysCalls = this.calls.filter(call => {
      const callDate = call.startTime || new Date(call.scheduledTime || '');
      return callDate >= today;
    });

    const completedCalls = todaysCalls.filter(call => call.status === 'completed');
    const pendingCalls = this.calls.filter(call => call.status === 'pending');
    const missedCalls = todaysCalls.filter(call => call.status === 'missed');

    const totalDuration = completedCalls.reduce((sum, call) => sum + (call.duration || 0), 0);
    const avgDurationSeconds = completedCalls.length > 0 ? totalDuration / completedCalls.length : 0;
    const avgDuration = this.formatDuration(avgDurationSeconds);

    const successRate = todaysCalls.length > 0 
      ? Math.round((completedCalls.length / todaysCalls.length) * 100) 
      : 0;

    return {
      todaysCalls: todaysCalls.length,
      completedCalls: completedCalls.length,
      pendingCalls: pendingCalls.length,
      missedCalls: missedCalls.length,
      totalDuration,
      avgDuration,
      successRate,
      uploadQueue: completedCalls.filter(call => !call.notes).length, // Calls without notes need upload
    };
  }

  getRecentCalls(limit: number = 10): Call[] {
    return this.calls
      .filter(call => call.status === 'completed' || call.status === 'missed')
      .sort((a, b) => {
        const aTime = a.endTime || a.startTime || new Date(a.scheduledTime || '');
        const bTime = b.endTime || b.startTime || new Date(b.scheduledTime || '');
        return bTime.getTime() - aTime.getTime();
      })
      .slice(0, limit);
  }

  // Utility Functions
  private formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'Urgent': return '#FF4444';
      case 'High': return '#FF8800';
      case 'Medium': return '#2196F3';
      case 'Low': return '#4CAF50';
      default: return '#757575';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'in_progress': return '#2196F3';
      case 'pending': return '#FF9800';
      case 'missed': return '#FF4444';
      case 'cancelled': return '#757575';
      default: return '#757575';
    }
  }

  // Real-time sync (placeholder for API integration)
  async syncWithServer(): Promise<void> {
    try {
      // This will be implemented when connecting to real API
      console.log('Syncing calls with server...');
      // const response = await ApiService.syncCalls(this.calls);
      // Handle server response and update local data
    } catch (error) {
      console.error('Failed to sync with server:', error);
    }
  }

  async cleanup() {
    // Cleanup resources
    this.currentCall = null;
    this.callStartTime = null;
  }
}

export default new CallService(); 