// Add this component to your OOAK-FUTURE CRM dashboard
// File: components/call-manager-integration.tsx

import React, { useState, useEffect } from 'react';
import { Phone, PhoneCall, Clock, CheckCircle, XCircle, Loader } from 'lucide-react';
import { toast } from 'sonner';

interface CallManagerProps {
  taskId: string;
  leadId: string;
  phoneNumber: string;
  employeeId: string;
  contactName?: string;
}

interface CallStatus {
  status: 'idle' | 'initiating' | 'ringing' | 'connected' | 'completed' | 'failed';
  duration?: number;
  startTime?: Date;
  error?: string;
}

export function CallManagerIntegration({ 
  taskId, 
  leadId, 
  phoneNumber, 
  employeeId, 
  contactName 
}: CallManagerProps) {
  const [callStatus, setCallStatus] = useState<CallStatus>({ status: 'idle' });
  const [isLoading, setIsLoading] = useState(false);
  const [callHistory, setCallHistory] = useState<any[]>([]);

  // Poll for call status updates
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (callStatus.status !== 'idle' && callStatus.status !== 'completed' && callStatus.status !== 'failed') {
      interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/calls/status?task_id=${taskId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.call) {
              setCallStatus({
                status: data.call.status,
                duration: data.call.duration_seconds,
                startTime: data.call.start_time ? new Date(data.call.start_time) : undefined,
                error: data.call.error_message
              });
            }
          }
        } catch (error) {
          console.error('Error polling call status:', error);
        }
      }, 2000); // Poll every 2 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callStatus.status, taskId]);

  // Load call history on component mount
  useEffect(() => {
    loadCallHistory();
  }, [taskId, phoneNumber]);

  const loadCallHistory = async () => {
    try {
      const response = await fetch(`/api/calls/history?task_id=${taskId}&phone=${phoneNumber}`);
      if (response.ok) {
        const data = await response.json();
        setCallHistory(data.calls || []);
      }
    } catch (error) {
      console.error('Error loading call history:', error);
    }
  };

  const initiateCall = async () => {
    if (!phoneNumber || !employeeId) {
      toast.error('Missing phone number or employee information');
      return;
    }

    setIsLoading(true);
    setCallStatus({ status: 'initiating' });

    try {
      const response = await fetch('/api/calls/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          task_id: taskId,
          lead_id: leadId,
          employee_id: employeeId,
          contact_name: contactName
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Call initiated on employee device');
        setCallStatus({ status: 'ringing' });
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to initiate call');
      }
    } catch (error) {
      console.error('Call initiation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to initiate call: ${errorMessage}`);
      setCallStatus({ status: 'failed', error: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (callStatus.status) {
      case 'idle':
        return <Phone className="w-4 h-4" />;
      case 'initiating':
      case 'ringing':
        return <Loader className="w-4 h-4 animate-spin" />;
      case 'connected':
        return <PhoneCall className="w-4 h-4 text-green-600" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Phone className="w-4 h-4" />;
    }
  };

  const getStatusText = () => {
    switch (callStatus.status) {
      case 'idle':
        return 'Ready to call';
      case 'initiating':
        return 'Initiating call...';
      case 'ringing':
        return 'Ringing...';
      case 'connected':
        return `Connected ${callStatus.duration ? `(${Math.floor(callStatus.duration / 60)}:${(callStatus.duration % 60).toString().padStart(2, '0')})` : ''}`;
      case 'completed':
        return `Call completed ${callStatus.duration ? `(${Math.floor(callStatus.duration / 60)}:${(callStatus.duration % 60).toString().padStart(2, '0')})` : ''}`;
      case 'failed':
        return `Call failed: ${callStatus.error || 'Unknown error'}`;
      default:
        return 'Unknown status';
    }
  };

  const getStatusColor = () => {
    switch (callStatus.status) {
      case 'idle':
        return 'text-gray-600';
      case 'initiating':
      case 'ringing':
        return 'text-blue-600';
      case 'connected':
        return 'text-green-600';
      case 'completed':
        return 'text-green-700';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-4">
      {/* Call Action Button */}
      <div className="flex items-center space-x-3">
        <button
          onClick={initiateCall}
          disabled={isLoading || callStatus.status !== 'idle'}
          className={`
            flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors
            ${callStatus.status === 'idle' && !isLoading
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {getStatusIcon()}
          <span>
            {callStatus.status === 'idle' ? 'Call Now' : 'Calling...'}
          </span>
        </button>

        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Phone:</span>
          <span className="text-sm text-gray-600">{phoneNumber}</span>
        </div>
      </div>

      {/* Call Status */}
      {callStatus.status !== 'idle' && (
        <div className={`flex items-center space-x-2 text-sm ${getStatusColor()}`}>
          {getStatusIcon()}
          <span>{getStatusText()}</span>
        </div>
      )}

      {/* Call History */}
      {callHistory.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Calls</h4>
          <div className="space-y-2">
            {callHistory.slice(0, 5).map((call, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    call.status === 'completed' ? 'bg-green-500' : 
                    call.status === 'failed' ? 'bg-red-500' : 'bg-gray-400'
                  }`} />
                  <div>
                    <div className="text-sm font-medium">
                      {call.direction === 'outgoing' ? 'Outgoing' : 'Incoming'} Call
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(call.start_time)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {call.duration_seconds ? formatDuration(call.duration_seconds) : 'No duration'}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    {call.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recording Status */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <span className="text-sm text-blue-700">
            Call recording and transcription enabled
          </span>
        </div>
      </div>
    </div>
  );
}

// Usage in your task dashboard component:
/*
import { CallManagerIntegration } from '@/components/call-manager-integration';

// In your task component:
<CallManagerIntegration
  taskId={task.id}
  leadId={task.lead_id}
  phoneNumber={task.lead?.phone || task.phone}
  employeeId={currentUser.employee_id}
  contactName={task.lead?.name}
/>
*/ 