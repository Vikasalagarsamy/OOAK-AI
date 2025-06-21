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
  List,
  Divider,
  ProgressBar,
  IconButton,
  Menu,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { CallRecord } from '../types';
import CallService from '../services/CallService';

const CallHistoryScreen: React.FC = () => {
  const [callRecords, setCallRecords] = useState<CallRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [retryingUploads, setRetryingUploads] = useState(false);
  const [menuVisible, setMenuVisible] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    loadCallHistory();
  }, []);

  const loadCallHistory = async () => {
    try {
      setRefreshing(true);
      const records = await CallService.getAllCallRecords();
      setCallRecords(records);
    } catch (error) {
      console.error('Failed to load call history:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const retryFailedUploads = async () => {
    try {
      setRetryingUploads(true);
      const successCount = await CallService.retryFailedUploads();
      
      Alert.alert(
        'Upload Retry Complete',
        `Successfully uploaded ${successCount} recordings.`,
        [{ text: 'OK' }]
      );
      
      await loadCallHistory(); // Refresh the list
    } catch (error) {
      console.error('Failed to retry uploads:', error);
      Alert.alert('Error', 'Failed to retry uploads. Please try again.');
    } finally {
      setRetryingUploads(false);
    }
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return 'N/A';
    
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDateTime = (date: Date): string => {
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
      case 'ended':
        return '#4CAF50';
      case 'connected':
        return '#2196F3';
      case 'ringing':
        return '#FF9800';
      case 'failed':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const getUploadStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'uploading':
        return '#2196F3';
      case 'failed':
        return '#F44336';
      case 'pending':
        return '#FF9800';
      default:
        return '#757575';
    }
  };

  const getUploadStatusIcon = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'cloud-done';
      case 'uploading':
        return 'cloud-upload';
      case 'failed':
        return 'cloud-off';
      case 'pending':
        return 'cloud-queue';
      default:
        return 'help';
    }
  };

  const toggleMenu = (recordId: string) => {
    setMenuVisible(prev => ({
      ...prev,
      [recordId]: !prev[recordId]
    }));
  };

  const renderCallRecord = (record: CallRecord) => (
    <Card key={record.id} style={styles.card}>
      <Card.Content>
        <View style={styles.recordHeader}>
          <View style={styles.recordInfo}>
            <Title style={styles.clientName}>{record.clientName}</Title>
            <Paragraph style={styles.clientPhone}>{record.clientPhone}</Paragraph>
            <Paragraph style={styles.dateTime}>
              {formatDateTime(record.startTime)}
            </Paragraph>
          </View>
          
          <View style={styles.recordActions}>
            <Menu
              visible={menuVisible[record.id] || false}
              onDismiss={() => toggleMenu(record.id)}
              anchor={
                <IconButton
                  icon="more-vert"
                  onPress={() => toggleMenu(record.id)}
                />
              }
            >
              <Menu.Item
                onPress={() => {
                  toggleMenu(record.id);
                  // Handle view details
                }}
                title="View Details"
                leadingIcon="info"
              />
              {record.uploadStatus === 'failed' && (
                <Menu.Item
                  onPress={() => {
                    toggleMenu(record.id);
                    // Handle retry upload
                  }}
                  title="Retry Upload"
                  leadingIcon="refresh"
                />
              )}
            </Menu>
          </View>
        </View>

        <View style={styles.recordDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Duration:</Text>
            <Text style={styles.detailValue}>{formatDuration(record.duration)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Official Number:</Text>
            <Text style={styles.detailValue}>{record.officialNumber}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Task ID:</Text>
            <Text style={styles.detailValue}>{record.taskId}</Text>
          </View>
        </View>

        <View style={styles.statusContainer}>
          <Chip 
            icon="phone"
            style={[styles.statusChip, { backgroundColor: getStatusColor(record.status) }]}
            textStyle={{ color: 'white' }}
          >
            {record.status.toUpperCase()}
          </Chip>
          
          <Chip 
            icon={getUploadStatusIcon(record.uploadStatus)}
            style={[styles.statusChip, { backgroundColor: getUploadStatusColor(record.uploadStatus) }]}
            textStyle={{ color: 'white' }}
          >
            {record.uploadStatus.toUpperCase()}
          </Chip>
        </View>

        {record.uploadStatus === 'uploading' && record.uploadProgress !== undefined && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>Uploading: {record.uploadProgress}%</Text>
            <ProgressBar 
              progress={record.uploadProgress / 100} 
              color="#2196F3" 
              style={styles.progressBar}
            />
          </View>
        )}
      </Card.Content>
    </Card>
  );

  const failedUploads = callRecords.filter(r => r.uploadStatus === 'failed');
  const pendingUploads = callRecords.filter(r => r.uploadStatus === 'pending');
  const uploadingCount = callRecords.filter(r => r.uploadStatus === 'uploading').length;

  return (
    <View style={styles.container}>
      {/* Stats Header */}
      <Card style={styles.statsCard}>
        <Card.Content>
          <Title>Upload Status</Title>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{callRecords.length}</Text>
              <Text style={styles.statLabel}>Total Calls</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#F44336' }]}>{failedUploads.length}</Text>
              <Text style={styles.statLabel}>Failed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#FF9800' }]}>{pendingUploads.length}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#2196F3' }]}>{uploadingCount}</Text>
              <Text style={styles.statLabel}>Uploading</Text>
            </View>
          </View>
          
          {failedUploads.length > 0 && (
            <Button
              mode="contained"
              onPress={retryFailedUploads}
              loading={retryingUploads}
              disabled={retryingUploads}
              icon="refresh"
              style={styles.retryButton}
            >
              Retry Failed Uploads ({failedUploads.length})
            </Button>
          )}
        </Card.Content>
      </Card>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadCallHistory} />
        }
      >
        {callRecords.length === 0 ? (
          <Card style={styles.card}>
            <Card.Content style={styles.emptyState}>
              <Icon name="history" size={48} color="#BDBDBD" />
              <Paragraph style={styles.emptyText}>No call history</Paragraph>
              <Button mode="outlined" onPress={loadCallHistory}>
                Refresh
              </Button>
            </Card.Content>
          </Card>
        ) : (
          callRecords.map(renderCallRecord)
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  statsCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recordInfo: {
    flex: 1,
  },
  recordActions: {
    marginLeft: 16,
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
  dateTime: {
    fontSize: 14,
    color: '#9E9E9E',
  },
  recordDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#212121',
  },
  statusContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  statusChip: {
    marginRight: 8,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  progressBar: {
    height: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
  },
  retryButton: {
    marginTop: 8,
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
});

export default CallHistoryScreen; 