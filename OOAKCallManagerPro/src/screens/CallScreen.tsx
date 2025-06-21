import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ApiService } from '../services/ApiService';

interface Call {
  id: string;
  clientName: string;
  phone: string;
  priority: 'Urgent' | 'High' | 'Medium' | 'Low';
  company: string;
  status: 'pending' | 'in_progress' | 'completed';
  scheduledTime?: string;
  notes?: string;
}

export default function CallScreen() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCalls();
  }, []);

  const loadCalls = async () => {
    try {
      setIsLoading(true);
      const data = await ApiService.getCalls();
      setCalls(data);
    } catch (error) {
      console.error('Failed to load calls:', error);
      // Load demo data for now
      setCalls(getDemoCalls());
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCalls();
    setRefreshing(false);
  };

  const getDemoCalls = (): Call[] => [
    {
      id: '1',
      clientName: 'Rajesh Kumar',
      phone: '+919876543210',
      priority: 'High',
      company: 'Tech Solutions',
      status: 'pending',
      scheduledTime: '10:30 AM',
    },
    {
      id: '2',
      clientName: 'Priya Sharma',
      phone: '+919876543211',
      priority: 'Medium',
      company: 'Digital Marketing',
      status: 'pending',
      scheduledTime: '11:00 AM',
    },
    {
      id: '3',
      clientName: 'Amit Patel',
      phone: '+919876543212',
      priority: 'Urgent',
      company: 'E-commerce Ltd',
      status: 'in_progress',
      scheduledTime: '09:45 AM',
    },
  ];

  const handleCall = async (call: Call) => {
    try {
      const url = `tel:${call.phone}`;
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
        // Update call status to in_progress
        updateCallStatus(call.id, 'in_progress');
      } else {
        Alert.alert('Error', 'Phone calls are not supported on this device');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to make call');
    }
  };

  const updateCallStatus = async (callId: string, status: Call['status']) => {
    try {
      await ApiService.updateCallStatus(callId, status);
      setCalls(prevCalls =>
        prevCalls.map(call =>
          call.id === callId ? { ...call, status } : call
        )
      );
    } catch (error) {
      console.error('Failed to update call status:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return '#FF4444';
      case 'High': return '#FF8800';
      case 'Medium': return '#2196F3';
      default: return '#4CAF50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF9800';
      case 'in_progress': return '#2196F3';
      case 'completed': return '#4CAF50';
      default: return '#757575';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      default: return 'Unknown';
    }
  };

  const pendingCalls = calls.filter(call => call.status === 'pending');
  const inProgressCalls = calls.filter(call => call.status === 'in_progress');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Active Calls</Text>
        <Text style={styles.headerSubtitle}>
          {pendingCalls.length} pending • {inProgressCalls.length} in progress
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* In Progress Calls */}
        {inProgressCalls.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="call" size={16} color="#2196F3" /> In Progress ({inProgressCalls.length})
            </Text>
            {inProgressCalls.map(call => (
              <CallCard
                key={call.id}
                call={call}
                onCall={handleCall}
                onUpdateStatus={updateCallStatus}
                getPriorityColor={getPriorityColor}
                getStatusColor={getStatusColor}
                getStatusText={getStatusText}
              />
            ))}
          </View>
        )}

        {/* Pending Calls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="time" size={16} color="#FF9800" /> Pending Calls ({pendingCalls.length})
          </Text>
          {pendingCalls.map(call => (
            <CallCard
              key={call.id}
              call={call}
              onCall={handleCall}
              onUpdateStatus={updateCallStatus}
              getPriorityColor={getPriorityColor}
              getStatusColor={getStatusColor}
              getStatusText={getStatusText}
            />
          ))}
        </View>

        {calls.length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <Ionicons name="call-outline" size={64} color="#CCCCCC" />
            <Text style={styles.emptyStateText}>No calls scheduled</Text>
            <Text style={styles.emptyStateSubtext}>
              Your call queue is empty. New calls will appear here.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

interface CallCardProps {
  call: Call;
  onCall: (call: Call) => void;
  onUpdateStatus: (callId: string, status: Call['status']) => void;
  getPriorityColor: (priority: string) => string;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
}

function CallCard({ 
  call, 
  onCall, 
  onUpdateStatus, 
  getPriorityColor, 
  getStatusColor, 
  getStatusText 
}: CallCardProps) {
  const handleCompleteCall = () => {
    Alert.alert(
      'Complete Call',
      'Mark this call as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Complete', onPress: () => onUpdateStatus(call.id, 'completed') },
      ]
    );
  };

  return (
    <View style={styles.callCard}>
      <View style={styles.callHeader}>
        <View style={styles.callInfo}>
          <Text style={styles.clientName}>{call.clientName}</Text>
          <Text style={styles.clientPhone}>{call.phone}</Text>
          <Text style={styles.clientCompany}>{call.company}</Text>
          {call.scheduledTime && (
            <Text style={styles.scheduledTime}>
              <Ionicons name="time-outline" size={12} color="#666" /> {call.scheduledTime}
            </Text>
          )}
        </View>
        <View style={styles.badges}>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(call.priority) }]}>
            <Text style={styles.priorityText}>{call.priority}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(call.status) }]}>
            <Text style={styles.statusText}>{getStatusText(call.status)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.callActions}>
        <TouchableOpacity 
          style={styles.callButton}
          onPress={() => onCall(call)}
        >
          <Ionicons name="call" size={16} color="#FFFFFF" />
          <Text style={styles.callButtonText}>Call</Text>
        </TouchableOpacity>

        {call.status === 'in_progress' && (
          <TouchableOpacity 
            style={styles.completeButton}
            onPress={handleCompleteCall}
          >
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            <Text style={styles.completeButtonText}>Complete</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={styles.detailsButton}
          onPress={() => Alert.alert('Call Details', `Client: ${call.clientName}\nCompany: ${call.company}\nPhone: ${call.phone}\nPriority: ${call.priority}\nStatus: ${getStatusText(call.status)}`)}
        >
          <Ionicons name="information-circle-outline" size={16} color="#666" />
          <Text style={styles.detailsButtonText}>Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  callCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  callHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  callInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  clientPhone: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
    marginBottom: 2,
  },
  clientCompany: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  scheduledTime: {
    fontSize: 12,
    color: '#666666',
    flexDirection: 'row',
    alignItems: 'center',
  },
  badges: {
    alignItems: 'flex-end',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  priorityText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  callActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  callButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  callButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  completeButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  detailsButton: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailsButtonText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 20,
  },
}); 