'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Phone, PhoneCall, PhoneIncoming, PhoneOutgoing, Clock, User, Search, Filter, RefreshCw, Upload, Download, Loader2, History, Timer, Play, Pause, Volume2, VolumeX, AlertTriangle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface CallLog {
  id: string;
  call_id?: string;
  phone_number: string;
  client_name: string;
  resolved_client_name?: string;
  sales_agent: string;
  employee_name?: string;
  employee_email?: string;
  lead_info?: {
    lead_number: string;
    lead_status: string;
  };
  is_existing_lead?: boolean;
  call_direction?: string;
  call_status?: string;
  start_time?: string;
  end_time?: string;
  duration: number;
  created_at: string;
  transcript?: string;
  confidence_score?: number;
  recording_url?: string;
  detected_language?: string;
}

interface TimeBasedStats {
  date?: string;
  dateRange?: string;
  total: number;
  incoming: number;
  outgoing: number;
  missed: number;
  unanswered: number;
  answered: number;
  duration: string;
  uniqueClients: number;
  connectedCalls: number;
}

interface CallAnalytics {
  today: TimeBasedStats;
  yesterday: TimeBasedStats;
  lastWeek: TimeBasedStats;
}

interface CallStats {
  totalCalls: number;
  activeCalls: number;
  completedCalls: number;
  processedCalls: number;
  recordedCalls: number;
  pendingUploads: number;
  totalDuration: number;
  avgDuration: number;
  todaysCalls: number;
}

// Audio Player Component
const AudioPlayer = ({ url }: { url: string }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(url);
    setAudioElement(audio);

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
    };
  }, [url]);

  const togglePlayPause = () => {
    if (audioElement) {
      if (isPlaying) {
        audioElement.pause();
      } else {
        audioElement.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center space-x-2 min-w-[120px]">
      <Button
        onClick={togglePlayPause}
        size="sm"
        variant="outline"
        className="h-8 w-8 p-0"
      >
        {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
      </Button>
      <div className="text-xs text-gray-600">
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>
    </div>
  );
};

export default function CallMonitoringPage() {
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [filteredCalls, setFilteredCalls] = useState<CallLog[]>([]);
  const [callStats, setCallStats] = useState<CallStats>({
    totalCalls: 0,
    activeCalls: 0,
    completedCalls: 0,
    processedCalls: 0,
    recordedCalls: 0,
    pendingUploads: 0,
    totalDuration: 0,
    avgDuration: 0,
    todaysCalls: 0
  });
  const [analytics, setAnalytics] = useState<CallAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string } | null>(null);
  
  // Constants
  const REFRESH_INTERVAL = 60000; // 60 seconds

  // Get unique employees from call logs with their names
  const employees = Array.from(new Set(
    callLogs
      .filter(call => call.sales_agent)
      .map(call => ({
        id: call.sales_agent,
        name: call.employee_name || call.sales_agent
      }))
  )).reduce((acc, emp) => {
    const existing = acc.find(e => e.id === emp.id);
    if (!existing) {
      acc.push(emp);
    }
    return acc;
  }, [] as Array<{id: string, name: string}>);

  // Fetch call transcriptions (main call data) with rate limiting
  const fetchCallLogs = async () => {
    const now = Date.now();
    if (now - lastFetchTime < 30000) { // Prevent calls more frequent than 30 seconds
      console.log('⏱️ Rate limited: Please wait before fetching again');
      return;
    }
    setLastFetchTime(now);

    try {
      const response = await fetch('/api/call-monitoring');
      if (response.ok) {
        const data = await response.json();
        setCallLogs(data?.calls || []);
        setAnalytics(data?.analytics || null);
        calculateStats(data?.calls || []);
        
        // Set current user from the first call's employee info
        if (data?.calls?.length > 0 && data.calls[0].employee_name) {
          setCurrentUser({ name: data.calls[0].employee_name });
        }
      } else {
        console.error('❌ Failed to fetch call monitoring data:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching call logs:', error);
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  };

  // Fetch call uploads (upload history)
  const fetchCallUploads = async () => {
    try {
      const response = await fetch('/api/call-uploads');
      if (response.ok) {
        const data = await response.json();
        // You can merge this with call logs if needed
        return data;
      }
    } catch (error) {
      console.error('❌ Error fetching call uploads:', error);
    }
    return [];
  };

  // Calculate call statistics
  const calculateStats = (calls: CallLog[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Filter today's calls
    const todaysCalls = calls.filter(call => 
      new Date(call.created_at) >= today
    );

    // Calculate pending uploads: calls that are completed/answered but don't have recording_url
    // and are less than 24 hours old (reasonable time for upload)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const pendingUploads = calls.filter(call => {
      const callTime = new Date(call.created_at);
      const isRecent = callTime >= oneDayAgo;
      const hasRecording = call.recording_url;
      const isAnswered = call.call_status === 'answered' || 
                        (call.duration && call.duration > 30); // Calls longer than 30 seconds likely answered
      
      return isRecent && isAnswered && !hasRecording;
    }).length;

    const stats = {
      totalCalls: calls.length,
      todaysCalls: todaysCalls.length,
      activeCalls: calls.filter(call => 
        call.transcript === 'Processing...' || 
        ['ringing', 'connected', 'in_progress'].includes(call.call_status?.toLowerCase() || '')
      ).length,
      completedCalls: calls.filter(call => 
        call.transcript && call.transcript !== 'Processing...'
      ).length,
      processedCalls: calls.filter(call => 
        call.confidence_score && call.confidence_score > 0
      ).length,
      recordedCalls: calls.filter(call => call.recording_url).length,
      pendingUploads: pendingUploads,
      totalDuration: calls.reduce((sum, call) => sum + (call.duration || 0), 0),
      avgDuration: 0
    };
    
    // Calculate average duration for calls with duration > 0
    const callsWithDuration = calls.filter(call => call.duration > 0);
    stats.avgDuration = callsWithDuration.length > 0 
      ? Math.round(stats.totalDuration / callsWithDuration.length) 
      : 0;
    
    setCallStats(stats);
  };

  // Filter calls based on search and filters
  useEffect(() => {
    let filtered = callLogs;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(call => 
        call.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.phone_number?.includes(searchTerm) ||
        call.sales_agent?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.transcript?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Employee filter
    if (selectedEmployee !== 'all') {
      filtered = filtered.filter(call => call.sales_agent === selectedEmployee);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      if (selectedStatus === 'processing') {
        filtered = filtered.filter(call => call.transcript === 'Processing...');
      } else if (selectedStatus === 'completed') {
        filtered = filtered.filter(call => call.transcript && call.transcript !== 'Processing...');
      } else if (selectedStatus === 'with_recording') {
        filtered = filtered.filter(call => call.recording_url);
      }
    }

    setFilteredCalls(filtered);
  }, [callLogs, searchTerm, selectedEmployee, selectedStatus]);

  // Auto-refresh functionality
  useEffect(() => {
    fetchCallLogs();
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchCallLogs();
        fetchCallUploads(); // Also refresh uploads
      }, 60000); // Refresh every 60 seconds to reduce server load
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Format duration
  const formatDuration = (seconds: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get status color and text
  const getStatusInfo = (call: CallLog) => {
    // Check call_status first, then status field as fallback
    const callStatus = call.call_status || (call as any).status;
    const transcript = call.transcript?.toLowerCase() || '';
    
    if (call.transcript === 'Processing...') {
      return { color: 'bg-yellow-100 text-yellow-800', text: 'Processing' };
    } else if (transcript.includes('missed call')) {
      return { color: 'bg-red-100 text-red-800', text: 'Missed Call' };
    } else if (transcript.includes('unanswered call')) {
      return { color: 'bg-orange-100 text-orange-800', text: 'Unanswered' };
    } else if (transcript.includes('ringing')) {
      return { color: 'bg-blue-100 text-blue-800', text: 'Ringing' };
    } else if (callStatus === 'completed' || transcript.includes('completed successfully')) {
      return { color: 'bg-gray-100 text-gray-800', text: 'Completed' };
    } else if (transcript.includes('connected')) {
      return { color: 'bg-green-100 text-green-800', text: 'Connected' };
    } else if (callStatus) {
      switch (callStatus.toLowerCase()) {
        case 'ringing': 
          return { color: 'bg-blue-100 text-blue-800', text: 'Ringing' };
        case 'connected': case 'active':
          return { color: 'bg-green-100 text-green-800', text: 'Connected' };
        case 'completed': case 'ended': 
          return { color: 'bg-gray-100 text-gray-800', text: 'Completed' };
        case 'missed': 
          return { color: 'bg-red-100 text-red-800', text: 'Missed Call' };
        case 'unanswered': 
          return { color: 'bg-orange-100 text-orange-800', text: 'Unanswered' };
        case 'processing': case 'transcribing':
          return { color: 'bg-yellow-100 text-yellow-800', text: 'Processing' };
        case 'error':
          return { color: 'bg-red-100 text-red-800', text: 'Error' };
        default:
          return { color: 'bg-gray-100 text-gray-800', text: callStatus };
      }
    } else {
      return { color: 'bg-gray-100 text-gray-800', text: 'Unknown' };
    }
  };

  // Get call direction icon
  const getDirectionIcon = (call: CallLog) => {
    // Extract direction from transcript or notes
    const transcript = call.transcript?.toLowerCase() || '';
    const notes = (call as any).notes?.toLowerCase() || '';
    
    let direction = '';
    if (transcript.includes('incoming') || notes.includes('direction: incoming')) {
      direction = 'incoming';
    } else if (transcript.includes('outgoing') || notes.includes('direction: outgoing')) {
      direction = 'outgoing';
    }
    
    switch (direction) {
      case 'incoming': return <PhoneIncoming className="h-4 w-4 text-blue-600" />;
      case 'outgoing': return <PhoneOutgoing className="h-4 w-4 text-green-600" />;
      default: return <Phone className="h-4 w-4 text-gray-600" />;
    }
  };

  const refreshData = async () => {
    setIsLoading(true);
    await fetchCallLogs();
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 space-y-8">
        {/* Corporate Header */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Call Analytics Dashboard</h1>
              <p className="text-gray-600 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Real-time call monitoring and performance analytics
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right mr-4">
                <div className="text-sm text-gray-500">Current Session</div>
                <div className="font-semibold text-gray-900">
                  {currentUser ? currentUser.name : 'Loading...'}
                </div>
              </div>
              <Button
                variant={autoRefresh ? "default" : "outline"}
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                Auto Refresh
              </Button>
              <Button 
                onClick={fetchCallLogs} 
                variant="outline"
                className="border-gray-300 hover:bg-gray-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Now
              </Button>
            </div>
          </div>
        </div>

        {/* Pending Uploads Alert Banner */}
        {callStats.pendingUploads > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-orange-900">
                  {callStats.pendingUploads} calls waiting for recording uploads
                </h3>
                <p className="text-xs text-orange-700 mt-1">
                  These are answered calls from the last 24 hours that should have recordings but haven't been uploaded yet. 
                  Please check employee mobile app connections or contact IT support if this persists.
                </p>
              </div>
              <Button 
                onClick={fetchCallLogs} 
                variant="outline" 
                size="sm"
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
        )}

        {/* Corporate Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* TODAY - Enhanced Corporate Design */}
            <Card className="bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-t-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold mb-1">Today's Performance</h3>
                    <p className="text-blue-100 text-sm">{analytics.today.date}</p>
                  </div>
                  <div className="bg-white/30 backdrop-blur-sm rounded-full px-4 py-2">
                    <span className="text-2xl font-bold text-white">{analytics.today.total}</span>
                  </div>
                </div>
              </div>
              <CardContent className="p-6 space-y-6">
                {/* KPI Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                    <div className="text-2xl font-bold text-blue-800">{analytics.today.total}</div>
                    <div className="text-sm font-semibold text-blue-700">Total Calls</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                    <div className="text-2xl font-bold text-green-700">{analytics.today.answered}</div>
                    <div className="text-sm font-semibold text-green-800">Connected</div>
                  </div>
                </div>
                
                {/* Metrics Row */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-emerald-100 rounded-lg border-2 border-emerald-300">
                    <div className="text-lg font-bold text-emerald-800">📞 {analytics.today.incoming}</div>
                    <div className="text-xs font-semibold text-emerald-700">Incoming</div>
                  </div>
                  <div className="text-center p-3 bg-blue-100 rounded-lg border-2 border-blue-300">
                    <div className="text-lg font-bold text-blue-800">📲 {analytics.today.outgoing}</div>
                    <div className="text-xs font-semibold text-blue-700">Outgoing</div>
                  </div>
                  <div className="text-center p-3 bg-purple-100 rounded-lg border-2 border-purple-300">
                    <div className="text-lg font-bold text-purple-800">👥 {analytics.today.uniqueClients}</div>
                    <div className="text-xs font-semibold text-purple-700">Clients</div>
                  </div>
                </div>

                {/* Alert Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-red-100 border-2 border-red-400 rounded-lg p-4 text-center">
                    <div className="text-xl font-bold text-red-800">{analytics.today.missed}</div>
                    <div className="text-sm font-semibold text-red-900">Missed Calls</div>
                  </div>
                  <div className="bg-orange-100 border-2 border-orange-400 rounded-lg p-4 text-center">
                    <div className="text-xl font-bold text-orange-800">{analytics.today.unanswered}</div>
                    <div className="text-sm font-semibold text-orange-900">Unanswered</div>
                  </div>
                </div>

                {/* Duration Summary */}
                <div className="text-center pt-4 border-t-2 border-blue-200">
                  <div className="text-lg font-bold text-gray-900">⏱️ {analytics.today.duration}</div>
                  <div className="text-sm font-semibold text-gray-700">Total Talk Time</div>
                </div>
              </CardContent>
            </Card>

            {/* YESTERDAY */}
            <Card className="bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-t-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold mb-1">Yesterday's Results</h3>
                    <p className="text-gray-200 text-sm">{analytics.yesterday.date}</p>
                  </div>
                  <div className="bg-white/30 backdrop-blur-sm rounded-full px-4 py-2">
                    <span className="text-2xl font-bold text-white">{analytics.yesterday.total}</span>
                  </div>
                </div>
              </div>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-100 rounded-lg p-4 text-center border border-gray-300">
                    <div className="text-2xl font-bold text-gray-800">{analytics.yesterday.total}</div>
                    <div className="text-sm font-semibold text-gray-700">Total Calls</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                    <div className="text-2xl font-bold text-green-700">{analytics.yesterday.answered}</div>
                    <div className="text-sm font-semibold text-green-800">Connected</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-emerald-100 rounded-lg border-2 border-emerald-300">
                    <div className="text-lg font-bold text-emerald-800">📞 {analytics.yesterday.incoming}</div>
                    <div className="text-xs font-semibold text-emerald-700">Incoming</div>
                  </div>
                  <div className="text-center p-3 bg-blue-100 rounded-lg border-2 border-blue-300">
                    <div className="text-lg font-bold text-blue-800">📲 {analytics.yesterday.outgoing}</div>
                    <div className="text-xs font-semibold text-blue-700">Outgoing</div>
                  </div>
                  <div className="text-center p-3 bg-purple-100 rounded-lg border-2 border-purple-300">
                    <div className="text-lg font-bold text-purple-800">👥 {analytics.yesterday.uniqueClients}</div>
                    <div className="text-xs font-semibold text-purple-700">Clients</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-red-100 border-2 border-red-400 rounded-lg p-4 text-center">
                    <div className="text-xl font-bold text-red-800">{analytics.yesterday.missed}</div>
                    <div className="text-sm font-semibold text-red-900">Missed</div>
                  </div>
                  <div className="bg-orange-100 border-2 border-orange-400 rounded-lg p-4 text-center">
                    <div className="text-xl font-bold text-orange-800">{analytics.yesterday.unanswered}</div>
                    <div className="text-sm font-semibold text-orange-900">Unanswered</div>
                  </div>
                </div>

                <div className="text-center pt-4 border-t-2 border-gray-300">
                  <div className="text-lg font-bold text-gray-900">⏱️ {analytics.yesterday.duration}</div>
                  <div className="text-sm font-semibold text-gray-700">Total Talk Time</div>
                </div>
              </CardContent>
            </Card>

            {/* LAST WEEK */}
            <Card className="bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-t-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold mb-1">Weekly Summary</h3>
                    <p className="text-purple-200 text-sm">{analytics.lastWeek.dateRange}</p>
                  </div>
                  <div className="bg-white/30 backdrop-blur-sm rounded-full px-4 py-2">
                    <span className="text-2xl font-bold text-white">{analytics.lastWeek.total}</span>
                  </div>
                </div>
              </div>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-purple-50 rounded-lg p-4 text-center border border-purple-200">
                    <div className="text-2xl font-bold text-purple-800">{analytics.lastWeek.total}</div>
                    <div className="text-sm font-semibold text-purple-700">Total Calls</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                    <div className="text-2xl font-bold text-green-700">{analytics.lastWeek.answered}</div>
                    <div className="text-sm font-semibold text-green-800">Connected</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-emerald-100 rounded-lg border-2 border-emerald-300">
                    <div className="text-lg font-bold text-emerald-800">📞 {analytics.lastWeek.incoming}</div>
                    <div className="text-xs font-semibold text-emerald-700">Incoming</div>
                  </div>
                  <div className="text-center p-3 bg-blue-100 rounded-lg border-2 border-blue-300">
                    <div className="text-lg font-bold text-blue-800">📲 {analytics.lastWeek.outgoing}</div>
                    <div className="text-xs font-semibold text-blue-700">Outgoing</div>
                  </div>
                  <div className="text-center p-3 bg-purple-100 rounded-lg border-2 border-purple-300">
                    <div className="text-lg font-bold text-purple-800">👥 {analytics.lastWeek.uniqueClients}</div>
                    <div className="text-xs font-semibold text-purple-700">Clients</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-red-100 border-2 border-red-400 rounded-lg p-4 text-center">
                    <div className="text-xl font-bold text-red-800">{analytics.lastWeek.missed}</div>
                    <div className="text-sm font-semibold text-red-900">Missed</div>
                  </div>
                  <div className="bg-orange-100 border-2 border-orange-400 rounded-lg p-4 text-center">
                    <div className="text-xl font-bold text-orange-800">{analytics.lastWeek.unanswered}</div>
                    <div className="text-sm font-semibold text-orange-900">Unanswered</div>
                  </div>
                </div>

                <div className="text-center pt-4 border-t-2 border-purple-200">
                  <div className="text-lg font-bold text-gray-900">⏱️ {analytics.lastWeek.duration}</div>
                  <div className="text-sm font-semibold text-gray-700">Total Talk Time</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Enterprise Call History Table */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader className="bg-gray-50 border-b border-gray-200 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">Call Activity Log</CardTitle>
                <CardDescription className="text-gray-600 flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Live monitoring • {filteredCalls.length} records
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 px-3 py-1">
                  📊 {filteredCalls.length} calls today
                </Badge>
                <Button
                  onClick={refreshData}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                  className="border-gray-300 hover:bg-gray-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Refresh Data
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {/* Enterprise Filters */}
            <div className="p-6 bg-white border-b border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Search Records</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search calls, clients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Team Member</label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger className="border-gray-300 focus:border-blue-500">
                      <SelectValue placeholder="All Employees" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Employees</SelectItem>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Call Status</label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="border-gray-300 focus:border-blue-500">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="answered">✅ Answered</SelectItem>
                      <SelectItem value="missed">❌ Missed</SelectItem>
                      <SelectItem value="unanswered">📵 Unanswered</SelectItem>
                      <SelectItem value="ringing">📞 Ringing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date Range</label>
                  <Button variant="outline" className="w-full border-gray-300 hover:bg-gray-50">
                    📅 Today
                  </Button>
                </div>
                <div className="flex items-end">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    <Download className="w-4 h-4 mr-2" />
                    Export Report
                  </Button>
                </div>
              </div>
            </div>

            {/* Professional Data Table */}
            <div className="overflow-x-auto">
              {filteredCalls.length === 0 ? (
                <div className="text-center py-16 bg-gray-50">
                  <div className="max-w-md mx-auto">
                    <Phone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Call Records Found</h3>
                    <p className="text-sm text-gray-500">Start making calls or adjust your filters to see data</p>
                  </div>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Client Information
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Team Member
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Phone Number
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Call Time
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Direction
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Lead Info
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Recording
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCalls.map((call: CallLog, index: number) => (
                      <tr key={call.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {call.resolved_client_name || call.client_name}
                              </div>
                              <div className="text-sm text-gray-500">Client</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-2">
                              <span className="text-xs font-bold text-green-700">
                                {(call.employee_name || call.sales_agent || 'U').charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {call.employee_name || call.sales_agent || 'Unknown'}
                              </div>
                              <div className="text-xs text-gray-500">Sales Agent</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-mono text-sm text-gray-900">{call.phone_number}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {new Date(call.created_at).toLocaleTimeString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(call.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{formatDuration(call.duration)}</div>
                        </td>
                        <td className="px-6 py-4">
                          {call.call_direction === 'incoming' ? (
                            <Badge className="bg-emerald-200 text-emerald-900 border-emerald-400 hover:bg-emerald-200 font-semibold">
                              📞 Incoming
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-200 text-blue-900 border-blue-400 hover:bg-blue-200 font-semibold">
                              📲 Outgoing
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            className={`font-semibold ${
                              call.call_status === 'answered' ? 'bg-green-200 text-green-900 border-green-400' :
                              call.call_status === 'missed' ? 'bg-red-200 text-red-900 border-red-400' :
                              call.call_status === 'unanswered' ? 'bg-orange-200 text-orange-900 border-orange-400' :
                              'bg-gray-200 text-gray-900 border-gray-400'
                            }`}
                          >
                            {call.call_status === 'answered' && '✅ Connected'}
                            {call.call_status === 'missed' && '❌ Missed'}
                            {call.call_status === 'unanswered' && '📵 No Answer'}
                            {call.call_status === 'ringing' && '📞 Ringing'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          {call.is_existing_lead ? (
                            <Badge className="bg-green-200 text-green-900 border-green-400 hover:bg-green-200 font-semibold">
                              📋 {call.lead_info?.lead_number}
                            </Badge>
                          ) : (
                            <span className="text-gray-500 text-sm font-medium">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {call.recording_url && (
                            <AudioPlayer url={call.recording_url} />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Corporate Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">Total Calls</CardTitle>
              <PhoneCall className="h-5 w-5 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{callStats.totalCalls}</div>
              <p className="text-xs text-gray-600 mt-1">All time</p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">Today's Calls</CardTitle>
              <Phone className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{callStats.todaysCalls}</div>
              <p className="text-xs text-gray-600 mt-1">Current day</p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">Processing</CardTitle>
              <RefreshCw className="h-5 w-5 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{callStats.activeCalls}</div>
              <p className="text-xs text-gray-600 mt-1">In progress</p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">Completed</CardTitle>
              <PhoneCall className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{callStats.completedCalls}</div>
              <p className="text-xs text-gray-600 mt-1">Finished</p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">Processed</CardTitle>
              <Upload className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{callStats.processedCalls}</div>
              <p className="text-xs text-gray-600 mt-1">Analyzed</p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">Recorded</CardTitle>
              <Volume2 className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{callStats.recordedCalls}</div>
              <p className="text-xs text-gray-600 mt-1">Recorded</p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-orange-200 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">Pending Uploads</CardTitle>
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{callStats.pendingUploads}</div>
              <p className="text-xs text-gray-600 mt-1">Awaiting upload</p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">Avg Duration</CardTitle>
              <Clock className="h-5 w-5 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{formatDuration(callStats.avgDuration)}</div>
              <p className="text-xs text-gray-600 mt-1">Per call</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 