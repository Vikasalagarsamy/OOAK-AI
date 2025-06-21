import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import CallService, { Call } from '../services/CallService';

export default function CallHistoryScreen() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [filteredCalls, setFilteredCalls] = useState<Call[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'completed' | 'missed' | 'pending'>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCalls();
  }, []);

  useEffect(() => {
    filterCalls();
  }, [calls, searchQuery, selectedFilter]);

  const loadCalls = async () => {
    try {
      const allCalls = CallService.getCalls();
      setCalls(allCalls.sort((a, b) => {
        const aTime = a.endTime || a.startTime || new Date(a.scheduledTime || '');
        const bTime = b.endTime || b.startTime || new Date(b.scheduledTime || '');
        return bTime.getTime() - aTime.getTime();
      }));
    } catch (error) {
      console.error('Failed to load calls:', error);
    }
  };

  const filterCalls = () => {
    let filtered = calls;

    // Filter by status
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(call => call.status === selectedFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(call =>
        call.clientName.toLowerCase().includes(query) ||
        call.company.toLowerCase().includes(query) ||
        call.phone.includes(query)
      );
    }

    setFilteredCalls(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCalls();
    setRefreshing(false);
  };

  const handleCallPress = (call: Call) => {
    const statusText = call.status.charAt(0).toUpperCase() + call.status.slice(1);
    const durationText = call.duration 
      ? `Duration: ${Math.floor(call.duration / 60)}:${(call.duration % 60).toString().padStart(2, '0')}`
      : '';
    
    Alert.alert(
      'Call Details',
      `Client: ${call.clientName}\nCompany: ${call.company}\nPhone: ${call.phone}\nStatus: ${statusText}\n${durationText}\nPriority: ${call.priority}${call.notes ? `\nNotes: ${call.notes}` : ''}`,
      [
        { text: 'Close', style: 'cancel' },
        { text: 'Call Again', onPress: () => handleCallAgain(call) }
      ]
    );
  };

  const handleCallAgain = async (call: Call) => {
    try {
      const success = await CallService.makeCall(call);
      if (success) {
        Alert.alert('Call Started', `Calling ${call.clientName}...`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to make call');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'missed': return '❌';
      case 'pending': return '⏰';
      case 'in_progress': return '📞';
      case 'cancelled': return '🚫';
      default: return '❓';
    }
  };

  const getOutcomeIcon = (outcome?: string) => {
    switch (outcome) {
      case 'interested': return '😊';
      case 'not_interested': return '😐';
      case 'callback': return '📞';
      case 'no_answer': return '📵';
      case 'busy': return '📞';
      default: return '';
    }
  };

  const formatDate = (call: Call) => {
    const date = call.endTime || call.startTime || new Date(call.scheduledTime || '');
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filters = [
    { key: 'all', label: 'All', count: calls.length },
    { key: 'completed', label: 'Completed', count: calls.filter(c => c.status === 'completed').length },
    { key: 'missed', label: 'Missed', count: calls.filter(c => c.status === 'missed').length },
    { key: 'pending', label: 'Pending', count: calls.filter(c => c.status === 'pending').length },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Call History</Text>
        <Text style={styles.headerSubtitle}>{filteredCalls.length} calls</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, company, or phone..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterTab,
              selectedFilter === filter.key && styles.activeFilterTab
            ]}
            onPress={() => setSelectedFilter(filter.key as any)}
          >
            <Text style={[
              styles.filterText,
              selectedFilter === filter.key && styles.activeFilterText
            ]}>
              {filter.label} ({filter.count})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Call List */}
      <ScrollView
        style={styles.callList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredCalls.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📞</Text>
            <Text style={styles.emptyTitle}>No calls found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try adjusting your search' : 'Your call history will appear here'}
            </Text>
          </View>
        ) : (
          filteredCalls.map((call) => (
            <TouchableOpacity
              key={call.id}
              style={styles.callItem}
              onPress={() => handleCallPress(call)}
            >
              <View style={styles.callIconContainer}>
                <Text style={styles.callStatusIcon}>{getStatusIcon(call.status)}</Text>
                {call.outcome && (
                  <Text style={styles.callOutcomeIcon}>{getOutcomeIcon(call.outcome)}</Text>
                )}
              </View>

              <View style={styles.callDetails}>
                <View style={styles.callHeader}>
                  <Text style={styles.callName}>{call.clientName}</Text>
                  <View style={[
                    styles.priorityBadge,
                    { backgroundColor: CallService.getPriorityColor(call.priority) }
                  ]}>
                    <Text style={styles.priorityText}>{call.priority}</Text>
                  </View>
                </View>
                
                <Text style={styles.callCompany}>{call.company}</Text>
                <Text style={styles.callPhone}>{call.phone}</Text>
                
                {call.notes && (
                  <Text style={styles.callNotes} numberOfLines={2}>
                    💬 {call.notes}
                  </Text>
                )}
              </View>

              <View style={styles.callMeta}>
                <Text style={styles.callTime}>{formatDate(call)}</Text>
                {call.duration && (
                  <Text style={styles.callDuration}>
                    {Math.floor(call.duration / 60)}:{(call.duration % 60).toString().padStart(2, '0')}
                  </Text>
                )}
                <Text style={[
                  styles.callStatus,
                  { color: CallService.getStatusColor(call.status) }
                ]}>
                  {call.status.charAt(0).toUpperCase() + call.status.slice(1)}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchInput: {
    height: 44,
    backgroundColor: '#F5F5F5',
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 12,
  },
  activeFilterTab: {
    backgroundColor: '#2196F3',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  callList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  callItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  callIconContainer: {
    alignItems: 'center',
    marginRight: 12,
    minWidth: 40,
  },
  callStatusIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  callOutcomeIcon: {
    fontSize: 16,
  },
  callDetails: {
    flex: 1,
  },
  callHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  callName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  callCompany: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  callPhone: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
    marginBottom: 4,
  },
  callNotes: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  callMeta: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minWidth: 80,
  },
  callTime: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  callDuration: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
    marginBottom: 4,
  },
  callStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666666',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 20,
  },
}); 