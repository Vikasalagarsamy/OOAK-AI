import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Text,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  FAB,
  Portal,
  Dialog,
  List,
  Divider,
  ProgressBar,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { CallRequest, CallRecord, SimCard } from '../types';
import CallService from '../services/CallService';
import ApiService from '../services/ApiService';

const DashboardScreen: React.FC = () => {
  const [pendingCalls, setPendingCalls] = useState<CallRequest[]>([]);
  const [activeCall, setActiveCall] = useState<CallRecord | null>(null);
  const [simCards, setSimCards] = useState<SimCard[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSimDialog, setShowSimDialog] = useState(false);
  const [selectedCall, setSelectedCall] = useState<CallRequest | null>(null);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setRefreshing(true);
      
      // Load pending calls
      const employeeId = 'emp_001'; // This would come from app config
      const callsResponse = await ApiService.getPendingCalls(employeeId);
      if (callsResponse.success && callsResponse.data) {
        setPendingCalls(callsResponse.data);
      }

      // Load SIM cards
      const sims = await CallService.getSimCards();
      setSimCards(sims);

      // Check for active call
      const currentCall = CallService.getCurrentCall();
      setActiveCall(currentCall);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleMakeCall = (callRequest: CallRequest) => {
    if (simCards.length > 1) {
      setSelectedCall(callRequest);
      setShowSimDialog(true);
    } else {
      initiateCall(callRequest, 0);
    }
  };

  const initiateCall = async (callRequest: CallRequest, simSlot: number) => {
    try {
      setLoading(true);
      setShowSimDialog(false);
      
      const success = await CallService.makeCall(callRequest, simSlot);
      
      if (success) {
        Alert.alert(
          'Call Initiated',
          `Calling ${callRequest.clientName} (${callRequest.clientPhone})`,
          [{ text: 'OK' }]
        );
        loadDashboardData(); // Refresh data
      } else {
        Alert.alert(
          'Call Failed',
          'Failed to initiate the call. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Call initiation error:', error);
      Alert.alert('Error', 'An error occurred while making the call.');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#F44336';
      case 'high': return '#FF9800';
      case 'medium': return '#2196F3';
      case 'low': return '#4CAF50';
      default: return '#757575';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'priority-high';
      case 'high': return 'keyboard-arrow-up';
      case 'medium': return 'remove';
      case 'low': return 'keyboard-arrow-down';
      default: return 'help';
    }
  };

  const renderActiveCall = () => {
    if (!activeCall) return null;

    return (
      <Card style={[styles.card, styles.activeCallCard]}>
        <Card.Content>
          <View style={styles.activeCallHeader}>
            <Icon name="phone-in-talk" size={24} color="#4CAF50" />
            <Title style={styles.activeCallTitle}>Active Call</Title>
          </View>
          <Paragraph style={styles.clientName}>{activeCall.clientName}</Paragraph>
          <Paragraph style={styles.clientPhone}>{activeCall.clientPhone}</Paragraph>
          <View style={styles.callStatus}>
            <Chip 
              icon="circle" 
              style={[styles.statusChip, { backgroundColor: '#4CAF50' }]}
              textStyle={{ color: 'white' }}
            >
              {activeCall.status.toUpperCase()}
            </Chip>
            {activeCall.recordingPath && (
              <Chip 
                icon="mic" 
                style={[styles.statusChip, { backgroundColor: '#FF5722' }]}
                textStyle={{ color: 'white' }}
              >
                RECORDING
              </Chip>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderPendingCall = (call: CallRequest, index: number) => (
    <Card key={`${call.taskId}-${index}`} style={styles.card}>
      <Card.Content>
        <View style={styles.callHeader}>
          <View style={styles.callInfo}>
            <Title style={styles.clientName}>{call.clientName}</Title>
            <Paragraph style={styles.clientPhone}>{call.clientPhone}</Paragraph>
            {call.notes && (
              <Paragraph style={styles.notes} numberOfLines={2}>
                {call.notes}
              </Paragraph>
            )}
          </View>
          <View style={styles.priorityContainer}>
            <Chip 
              icon={getPriorityIcon(call.priority)}
              style={[styles.priorityChip, { backgroundColor: getPriorityColor(call.priority) }]}
              textStyle={{ color: 'white' }}
            >
              {call.priority.toUpperCase()}
            </Chip>
          </View>
        </View>
      </Card.Content>
      <Card.Actions>
        <Button 
          mode="contained" 
          onPress={() => handleMakeCall(call)}
          disabled={loading || !!activeCall}
          icon="phone"
          style={styles.callButton}
        >
          Call Now
        </Button>
      </Card.Actions>
    </Card>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadDashboardData} />
        }
      >
        {/* Active Call Section */}
        {renderActiveCall()}

        {/* Stats Section */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Today's Overview</Title>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{pendingCalls.length}</Text>
                <Text style={styles.statLabel}>Pending Calls</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{simCards.filter(s => s.isActive).length}</Text>
                <Text style={styles.statLabel}>Active SIMs</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Pending Calls Section */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Pending Calls ({pendingCalls.length})</Title>
          </Card.Content>
        </Card>

        {pendingCalls.length === 0 ? (
          <Card style={styles.card}>
            <Card.Content style={styles.emptyState}>
              <Icon name="phone-disabled" size={48} color="#BDBDBD" />
              <Paragraph style={styles.emptyText}>No pending calls</Paragraph>
              <Button mode="outlined" onPress={loadDashboardData}>
                Refresh
              </Button>
            </Card.Content>
          </Card>
        ) : (
          pendingCalls.map(renderPendingCall)
        )}
      </ScrollView>

      {/* SIM Selection Dialog */}
      <Portal>
        <Dialog visible={showSimDialog} onDismiss={() => setShowSimDialog(false)}>
          <Dialog.Title>Select SIM Card</Dialog.Title>
          <Dialog.Content>
            <Paragraph>Choose which SIM card to use for this call:</Paragraph>
            {simCards.map((sim, index) => (
              <List.Item
                key={sim.slotIndex}
                title={sim.phoneNumber}
                description={`${sim.carrierName} - Slot ${sim.slotIndex + 1}`}
                left={(props) => <List.Icon {...props} icon="sim" />}
                onPress={() => selectedCall && initiateCall(selectedCall, sim.slotIndex)}
                style={styles.simItem}
              />
            ))}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowSimDialog(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ProgressBar indeterminate color="#2196F3" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  activeCallCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  activeCallHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeCallTitle: {
    marginLeft: 8,
    color: '#4CAF50',
  },
  callHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  callInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  clientPhone: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 4,
  },
  notes: {
    fontSize: 14,
    color: '#9E9E9E',
    fontStyle: 'italic',
  },
  priorityContainer: {
    marginLeft: 16,
  },
  priorityChip: {
    minWidth: 80,
  },
  callStatus: {
    flexDirection: 'row',
    marginTop: 8,
  },
  statusChip: {
    marginRight: 8,
  },
  callButton: {
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    marginBottom: 16,
    color: '#757575',
  },
  simItem: {
    marginVertical: 4,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    padding: 16,
  },
});

export default DashboardScreen; 