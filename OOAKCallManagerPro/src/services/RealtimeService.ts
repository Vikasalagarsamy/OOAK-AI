import { EventEmitter } from 'events';
import CallService, { Call, CallStats } from './CallService';

export interface RealtimeEvent {
  type: 'call_update' | 'stats_update' | 'new_call' | 'call_completed' | 'notification';
  data: any;
  timestamp: Date;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
}

class RealtimeService extends EventEmitter {
  private isConnected: boolean = false;
  private updateInterval: NodeJS.Timeout | null = null;
  private notifications: Notification[] = [];
  private lastStatsUpdate: Date = new Date();

  constructor() {
    super();
    this.setupRealtimeUpdates();
  }

  // Connection Management
  connect(): void {
    if (this.isConnected) return;

    console.log('🔗 Connecting to real-time service...');
    this.isConnected = true;
    
    // Simulate connection delay
    setTimeout(() => {
      this.emit('connected');
      this.addNotification({
        title: 'Connected',
        message: 'Real-time updates are now active',
        type: 'success',
      });
      
      this.startPeriodicUpdates();
    }, 1000);
  }

  disconnect(): void {
    if (!this.isConnected) return;

    console.log('🔌 Disconnecting from real-time service...');
    this.isConnected = false;
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    this.emit('disconnected');
  }

  isConnectedToRealtime(): boolean {
    return this.isConnected;
  }

  // Real-time Updates
  private setupRealtimeUpdates(): void {
    // Simulate incoming calls
    setInterval(() => {
      if (this.isConnected && Math.random() < 0.1) { // 10% chance every interval
        this.simulateIncomingCall();
      }
    }, 30000); // Check every 30 seconds

    // Simulate call completions
    setInterval(() => {
      if (this.isConnected && Math.random() < 0.15) { // 15% chance
        this.simulateCallCompletion();
      }
    }, 45000); // Check every 45 seconds
  }

  private startPeriodicUpdates(): void {
    // Update stats every 30 seconds
    this.updateInterval = setInterval(() => {
      if (this.isConnected) {
        this.broadcastStatsUpdate();
      }
    }, 30000);
  }

  private simulateIncomingCall(): void {
    const newCallData = this.generateRandomCall();
    
    this.emit('event', {
      type: 'new_call',
      data: newCallData,
      timestamp: new Date(),
    } as RealtimeEvent);

    this.addNotification({
      title: 'New Call Scheduled',
      message: `Call with ${newCallData.clientName} from ${newCallData.company}`,
      type: 'info',
    });
  }

  private simulateCallCompletion(): void {
    const pendingCalls = CallService.getPendingCalls();
    if (pendingCalls.length === 0) return;

    const randomCall = pendingCalls[Math.floor(Math.random() * pendingCalls.length)];
    const outcomes: Call['outcome'][] = ['interested', 'not_interested', 'callback', 'no_answer', 'busy'];
    const randomOutcome = outcomes[Math.floor(Math.random() * outcomes.length)];

    // Update the call
    CallService.updateCall(randomCall.id, {
      status: 'completed',
      outcome: randomOutcome,
      endTime: new Date(),
      duration: Math.floor(Math.random() * 600) + 60, // 1-10 minutes
      notes: this.generateRandomNotes(randomOutcome),
    });

    this.emit('event', {
      type: 'call_completed',
      data: { ...randomCall, outcome: randomOutcome },
      timestamp: new Date(),
    } as RealtimeEvent);

    this.addNotification({
      title: 'Call Completed',
      message: `Call with ${randomCall.clientName} marked as ${randomOutcome}`,
      type: randomOutcome === 'interested' ? 'success' : 'info',
    });
  }

  private broadcastStatsUpdate(): void {
    const stats = CallService.getCallStats();
    
    this.emit('event', {
      type: 'stats_update',
      data: stats,
      timestamp: new Date(),
    } as RealtimeEvent);

    this.lastStatsUpdate = new Date();
  }

  // Data Generation
  private generateRandomCall(): Omit<Call, 'id'> {
    const names = [
      'Arjun Mehta', 'Kavya Patel', 'Rohit Sharma', 'Ananya Singh', 'Vikram Gupta',
      'Priya Reddy', 'Aditya Kumar', 'Shreya Joshi', 'Rahul Verma', 'Neha Agarwal'
    ];
    
    const companies = [
      'Tech Innovations Pvt Ltd', 'Digital Solutions Inc', 'Smart Systems Corp',
      'Future Technologies', 'Global Enterprises', 'Modern Solutions Ltd',
      'Advanced Systems', 'Creative Technologies', 'Business Solutions Pro'
    ];

    const priorities: Call['priority'][] = ['Urgent', 'High', 'Medium', 'Low'];

    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomCompany = companies[Math.floor(Math.random() * companies.length)];
    const randomPriority = priorities[Math.floor(Math.random() * priorities.length)];

    return {
      clientName: randomName,
      phone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      company: randomCompany,
      priority: randomPriority,
      status: 'pending',
      scheduledTime: new Date(Date.now() + Math.random() * 3600000).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      leadId: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      employeeId: 'emp_001',
    };
  }

  private generateRandomNotes(outcome: Call['outcome']): string {
    const notes: { [key: string]: string[] } = {
      interested: [
        'Very interested in our premium package. Wants to schedule a demo.',
        'Showed strong interest. Requested detailed pricing information.',
        'Positive response. Will discuss with team and get back to us.',
        'Interested in enterprise solution. Needs technical specifications.',
      ],
      not_interested: [
        'Not interested at this time. Budget constraints mentioned.',
        'Already using a competitor solution. Happy with current setup.',
        'Not the right fit for their business model.',
        'Timing is not right. Suggested to follow up in 6 months.',
      ],
      callback: [
        'Requested callback next week. Best time is morning 10-11 AM.',
        'Needs to discuss with decision maker. Will call back tomorrow.',
        'Interested but busy today. Scheduled follow-up for Friday.',
        'Wants more information via email before next call.',
      ],
      no_answer: [
        'Phone went to voicemail. Left detailed message.',
        'No response. Will try again later today.',
        'Phone was busy. Will attempt callback in 1 hour.',
      ],
      busy: [
        'Client was in a meeting. Requested callback in 2 hours.',
        'Busy with urgent work. Will call back tomorrow morning.',
        'Asked to call back after lunch around 2 PM.',
      ],
    };

    const outcomeKey = outcome || 'interested';
    const outcomeNotes = notes[outcomeKey] || ['Call completed.'];
    return outcomeNotes[Math.floor(Math.random() * outcomeNotes.length)];
  }

  // Notifications
  private addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): void {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date(),
      read: false,
    };

    this.notifications.unshift(newNotification);
    
    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }

    this.emit('notification', newNotification);
  }

  getNotifications(): Notification[] {
    return this.notifications;
  }

  getUnreadNotifications(): Notification[] {
    return this.notifications.filter(n => !n.read);
  }

  markNotificationAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.emit('notification_read', notification);
    }
  }

  markAllNotificationsAsRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.emit('all_notifications_read');
  }

  clearNotifications(): void {
    this.notifications = [];
    this.emit('notifications_cleared');
  }

  // API Simulation
  async syncWithServer(): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (Math.random() < 0.9) { // 90% success rate
          resolve({
            success: true,
            message: 'Data synchronized successfully',
          });
          
          this.addNotification({
            title: 'Sync Complete',
            message: 'All data has been synchronized with server',
            type: 'success',
          });
        } else {
          resolve({
            success: false,
            message: 'Sync failed. Please try again.',
          });
          
          this.addNotification({
            title: 'Sync Failed',
            message: 'Unable to sync with server. Check your connection.',
            type: 'error',
          });
        }
      }, 2000); // Simulate network delay
    });
  }

  // Performance Metrics
  getConnectionMetrics(): {
    isConnected: boolean;
    lastUpdate: Date;
    uptime: number;
    notificationCount: number;
    unreadCount: number;
  } {
    return {
      isConnected: this.isConnected,
      lastUpdate: this.lastStatsUpdate,
      uptime: this.isConnected ? Date.now() - this.lastStatsUpdate.getTime() : 0,
      notificationCount: this.notifications.length,
      unreadCount: this.getUnreadNotifications().length,
    };
  }

  // Manual triggers for testing
  triggerTestCall(): void {
    this.simulateIncomingCall();
  }

  triggerTestCompletion(): void {
    this.simulateCallCompletion();
  }

  triggerStatsUpdate(): void {
    this.broadcastStatsUpdate();
  }

  // Cleanup
  cleanup(): void {
    this.disconnect();
    this.removeAllListeners();
    this.notifications = [];
  }
}

export default new RealtimeService(); 