import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/ApiService';
import { AuthService } from '../services/AuthService';

const { width } = Dimensions.get('window');

interface DashboardStats {
  todaysCalls: number;
  completedCalls: number;
  pendingCalls: number;
  uploadQueue: number;
  successRate: number;
  avgCallDuration: string;
}

interface RecentCall {
  id: string;
  clientName: string;
  phone: string;
  company: string;
  status: 'completed' | 'missed' | 'pending';
  duration?: string;
  time: string;
}

export default function DashboardScreen() {
  const [stats, setStats] = useState<DashboardStats>({
    todaysCalls: 0,
    completedCalls: 0,
    pendingCalls: 0,
    uploadQueue: 0,
    successRate: 0,
    avgCallDuration: '0:00',
  });
  const [recentCalls, setRecentCalls] = useState<RecentCall[]>([]);
  const [user, setUser] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
    loadUserData();
    
    // Set up real-time updates
    const interval = setInterval(loadDashboardData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadUserData = async () => {
    const userData = await AuthService.getUser();
    setUser(userData);
  };

  const loadDashboardData = async () => {
    try {
      // Load real-time stats
      const statsData = await ApiService.getDashboardStats();
      setStats(statsData);

      // Load recent calls
      const callsData = await ApiService.getRecentCalls();
      setRecentCalls(callsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Load demo data for now
      setStats({
        todaysCalls: 12,
        completedCalls: 8,
        pendingCalls: 3,
        uploadQueue: 2,
        successRate: 85,
        avgCallDuration: '4:32',
      });
      setRecentCalls(getDemoRecentCalls());
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getDemoRecentCalls = (): RecentCall[] => [
    {
      id: '1',
      clientName: 'Rajesh Kumar',
      phone: '+919876543210',
      company: 'Tech Solutions',
      status: 'completed',
      duration: '5:23',
      time: '10:30 AM',
    },
    {
      id: '2',
      clientName: 'Priya Sharma',
      phone: '+919876543211',
      company: 'Digital Marketing',
      status: 'completed',
      duration: '3:45',
      time: '11:15 AM',
    },
    {
      id: '3',
      clientName: 'Amit Patel',
      phone: '+919876543212',
      company: 'E-commerce Ltd',
      status: 'missed',
      time: '12:00 PM',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'missed': return '#FF4444';
      case 'pending': return '#FF9800';
      default: return '#757575';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'checkmark-circle';
      case 'missed': return 'close-circle';
      case 'pending': return 'time';
      default: return 'help-circle';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning</Text>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
        </View>
        <TouchableOpacity style={styles.profileButton}>
          <Ionicons name="person-circle" size={32} color="#2196F3" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <View style={styles.statsGrid}>
            <StatCard
              title="Today's Calls"
              value={stats.todaysCalls}
              icon="call"
              color="#2196F3"
              trend="+12%"
            />
            <StatCard
              title="Completed"
              value={stats.completedCalls}
              icon="checkmark-circle"
              color="#4CAF50"
              trend="+8%"
            />
            <StatCard
              title="Pending"
              value={stats.pendingCalls}
              icon="time"
              color="#FF9800"
              trend="-5%"
            />
            <StatCard
              title="Success Rate"
              value={`${stats.successRate}%`}
              icon="trending-up"
              color="#9C27B0"
              trend="+3%"
            />
          </View>
        </View>

        {/* Performance Metrics */}
        <View style={styles.metricsContainer}>
          <Text style={styles.sectionTitle}>Performance</Text>
          <View style={styles.metricsCard}>
            <View style={styles.metricRow}>
              <View style={styles.metricItem}>
                <Ionicons name="time-outline" size={20} color="#666" />
                <Text style={styles.metricLabel}>Avg Duration</Text>
                <Text style={styles.metricValue}>{stats.avgCallDuration}</Text>
              </View>
              <View style={styles.metricItem}>
                <Ionicons name="cloud-upload-outline" size={20} color="#666" />
                <Text style={styles.metricLabel}>Upload Queue</Text>
                <Text style={styles.metricValue}>{stats.uploadQueue}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Calls */}
        <View style={styles.recentCallsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Calls</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {recentCalls.map(call => (
            <View key={call.id} style={styles.callItem}>
              <View style={styles.callIcon}>
                <Ionicons 
                  name={getStatusIcon(call.status)} 
                  size={20} 
                  color={getStatusColor(call.status)} 
                />
              </View>
              <View style={styles.callDetails}>
                <Text style={styles.callName}>{call.clientName}</Text>
                <Text style={styles.callCompany}>{call.company}</Text>
              </View>
              <View style={styles.callMeta}>
                <Text style={styles.callTime}>{call.time}</Text>
                {call.duration && (
                  <Text style={styles.callDuration}>{call.duration}</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <QuickActionButton
              icon="call"
              title="New Call"
              color="#4CAF50"
              onPress={() => {}}
            />
            <QuickActionButton
              icon="history"
              title="Call History"
              color="#2196F3"
              onPress={() => {}}
            />
            <QuickActionButton
              icon="analytics"
              title="Reports"
              color="#FF9800"
              onPress={() => {}}
            />
            <QuickActionButton
              icon="settings"
              title="Settings"
              color="#757575"
              onPress={() => {}}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: string;
  color: string;
  trend?: string;
}

function StatCard({ title, value, icon, color, trend }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <Ionicons name={icon as any} size={24} color={color} />
        {trend && (
          <Text style={[styles.trendText, { color: trend.startsWith('+') ? '#4CAF50' : '#FF4444' }]}>
            {trend}
          </Text>
        )}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );
}

interface QuickActionButtonProps {
  icon: string;
  title: string;
  color: string;
  onPress: () => void;
}

function QuickActionButton({ icon, title, color, onPress }: QuickActionButtonProps) {
  return (
    <TouchableOpacity style={styles.quickActionButton} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <Text style={styles.quickActionTitle}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
  },
  greeting: {
    fontSize: 14,
    color: '#666666',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  profileButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    width: (width - 52) / 2,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trendText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: '#666666',
  },
  metricsContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  metricsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  recentCallsContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  callItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  callIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  callDetails: {
    flex: 1,
  },
  callName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  callCompany: {
    fontSize: 14,
    color: '#666666',
  },
  callMeta: {
    alignItems: 'flex-end',
  },
  callTime: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  callDuration: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: (width - 52) / 2,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
}); 