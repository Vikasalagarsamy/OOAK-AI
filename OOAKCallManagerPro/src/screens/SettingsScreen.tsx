import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Alert,
  StyleSheet,
  Switch,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  TextInput,
  Surface,
  Text,
  List,
  Divider,
  RadioButton,
  Chip,
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

// Import services and types
import ApiService from '../services/ApiService';
import CallService from '../services/CallService';
import { AppConfig, SimCard } from '../types';

interface SettingsScreenProps {
  navigation: any;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [simCards, setSimCards] = useState<SimCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'failed'>('unknown');

  // Form states
  const [apiBaseUrl, setApiBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [autoUpload, setAutoUpload] = useState(true);
  const [recordingQuality, setRecordingQuality] = useState<'low' | 'medium' | 'high'>('high');
  const [syncInterval, setSyncInterval] = useState('5');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [callTimeout, setCallTimeout] = useState('30');

  useEffect(() => {
    loadSettings();
    loadSimCards();
  }, []);

  const loadSettings = async () => {
    try {
      const configData = await AsyncStorage.getItem('app_config');
      if (configData) {
        const parsedConfig: AppConfig = JSON.parse(configData);
        setConfig(parsedConfig);
        
        // Populate form fields
        setApiBaseUrl(parsedConfig.apiBaseUrl);
        setApiKey(parsedConfig.apiKey);
        setEmployeeId(parsedConfig.employeeId);
        setAutoUpload(parsedConfig.autoUpload);
        setRecordingQuality(parsedConfig.recordingQuality);
        setSyncInterval(parsedConfig.syncInterval.toString());
        setNotificationsEnabled(parsedConfig.notificationsEnabled);
        setCallTimeout(parsedConfig.callTimeout.toString());
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSimCards = async () => {
    try {
      const sims = await CallService.getSimCards();
      setSimCards(sims);
    } catch (error) {
      console.error('Failed to load SIM cards:', error);
    }
  };

  const testConnection = async () => {
    try {
      setConnectionStatus('unknown');
      const result = await ApiService.testConnection();
      setConnectionStatus(result.success ? 'connected' : 'failed');
      
      Alert.alert(
        result.success ? 'Connection Successful' : 'Connection Failed',
        result.success ? 'Successfully connected to OOAK servers' : result.error || 'Unable to connect to servers',
        [{ text: 'OK' }]
      );
    } catch (error) {
      setConnectionStatus('failed');
      Alert.alert('Connection Error', 'Failed to test connection');
    }
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      
      const newConfig: AppConfig = {
        apiBaseUrl: apiBaseUrl.trim(),
        apiKey: apiKey.trim(),
        employeeId: employeeId.trim(),
        deviceId: config?.deviceId || `device_${Date.now()}`,
        autoUpload,
        recordingQuality,
        maxRetries: 3,
        syncInterval: parseInt(syncInterval) || 5,
        offlineMode: false,
        notificationsEnabled,
        callTimeout: parseInt(callTimeout) || 30,
      };

      await AsyncStorage.setItem('app_config', JSON.stringify(newConfig));
      await ApiService.updateConfig(newConfig);
      setConfig(newConfig);
      
      Alert.alert('Success', 'Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const resetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('app_config');
              await loadSettings();
              Alert.alert('Success', 'Settings reset to default values');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset settings');
            }
          },
        },
      ]
    );
  };

  const clearCallHistory = () => {
    Alert.alert(
      'Clear Call History',
      'Are you sure you want to delete all call history? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear call records index
              await AsyncStorage.removeItem('call_records_index');
              
              // Clear individual call records
              const keys = await AsyncStorage.getAllKeys();
              const callRecordKeys = keys.filter(key => key.startsWith('call_record_'));
              await AsyncStorage.multiRemove(callRecordKeys);
              
              Alert.alert('Success', 'Call history cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear call history');
            }
          },
        },
      ]
    );
  };

  const retryFailedUploads = async () => {
    try {
      const successCount = await CallService.retryFailedUploads();
      Alert.alert(
        'Upload Retry Complete',
        `Successfully uploaded ${successCount} recordings.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to retry uploads');
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#4CAF50';
      case 'failed': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'failed': return 'Failed';
      default: return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* API Configuration */}
      <Card style={styles.card} elevation={2}>
        <Card.Content>
          <Title style={styles.cardTitle}>🔗 API Configuration</Title>
          
          <TextInput
            label="API Base URL"
            value={apiBaseUrl}
            onChangeText={setApiBaseUrl}
            mode="outlined"
            style={styles.input}
            placeholder="https://api.ooak.co.in"
          />
          
          <TextInput
            label="API Key"
            value={apiKey}
            onChangeText={setApiKey}
            mode="outlined"
            style={styles.input}
            secureTextEntry
            placeholder="Enter your API key"
          />
          
          <TextInput
            label="Employee ID"
            value={employeeId}
            onChangeText={setEmployeeId}
            mode="outlined"
            style={styles.input}
            placeholder="emp_001"
          />
          
          <View style={styles.connectionStatus}>
            <View style={styles.statusIndicator}>
              <View 
                style={[
                  styles.statusDot, 
                  { backgroundColor: getConnectionStatusColor() }
                ]} 
              />
              <Text style={styles.statusText}>
                Status: {getConnectionStatusText()}
              </Text>
            </View>
            <Button
              mode="outlined"
              onPress={testConnection}
              style={styles.testButton}
              icon="wifi"
            >
              Test Connection
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Recording Settings */}
      <Card style={styles.card} elevation={2}>
        <Card.Content>
          <Title style={styles.cardTitle}>🎙️ Recording Settings</Title>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Auto Upload Recordings</Text>
              <Text style={styles.settingDescription}>
                Automatically upload recordings after calls end
              </Text>
            </View>
            <Switch
              value={autoUpload}
              onValueChange={setAutoUpload}
            />
          </View>
          
          <Divider style={styles.divider} />
          
          <Text style={styles.settingLabel}>Recording Quality</Text>
          <RadioButton.Group
            onValueChange={(value) => setRecordingQuality(value as 'low' | 'medium' | 'high')}
            value={recordingQuality}
          >
            <View style={styles.radioOption}>
              <RadioButton value="low" />
              <View style={styles.radioLabel}>
                <Text>Low (8kHz, 32kbps)</Text>
                <Text style={styles.radioDescription}>Smaller file size, basic quality</Text>
              </View>
            </View>
            <View style={styles.radioOption}>
              <RadioButton value="medium" />
              <View style={styles.radioLabel}>
                <Text>Medium (16kHz, 64kbps)</Text>
                <Text style={styles.radioDescription}>Balanced quality and size</Text>
              </View>
            </View>
            <View style={styles.radioOption}>
              <RadioButton value="high" />
              <View style={styles.radioLabel}>
                <Text>High (22kHz, 128kbps)</Text>
                <Text style={styles.radioDescription}>Best quality, larger files</Text>
              </View>
            </View>
          </RadioButton.Group>
        </Card.Content>
      </Card>

      {/* SIM Card Information */}
      <Card style={styles.card} elevation={2}>
        <Card.Content>
          <Title style={styles.cardTitle}>📱 SIM Card Information</Title>
          
          {simCards.map((sim, index) => (
            <Surface key={index} style={styles.simCard} elevation={1}>
              <View style={styles.simInfo}>
                <Text style={styles.simSlot}>SIM {sim.slotIndex + 1}</Text>
                <Text style={styles.simNumber}>{sim.phoneNumber}</Text>
                <Text style={styles.simCarrier}>{sim.carrierName} • {sim.networkType}</Text>
                {sim.signalStrength && (
                  <Text style={styles.simSignal}>Signal: {sim.signalStrength} dBm</Text>
                )}
              </View>
              <Chip
                mode="flat"
                style={[
                  styles.simStatusChip,
                  { backgroundColor: sim.isActive ? '#E8F5E8' : '#FFEBEE' },
                ]}
                textStyle={{ color: sim.isActive ? '#4CAF50' : '#F44336' }}
              >
                {sim.isActive ? 'Active' : 'Inactive'}
              </Chip>
            </Surface>
          ))}
        </Card.Content>
      </Card>

      {/* App Settings */}
      <Card style={styles.card} elevation={2}>
        <Card.Content>
          <Title style={styles.cardTitle}>⚙️ App Settings</Title>
          
          <TextInput
            label="Sync Interval (minutes)"
            value={syncInterval}
            onChangeText={setSyncInterval}
            mode="outlined"
            style={styles.input}
            keyboardType="numeric"
            placeholder="5"
          />
          
          <TextInput
            label="Call Timeout (seconds)"
            value={callTimeout}
            onChangeText={setCallTimeout}
            mode="outlined"
            style={styles.input}
            keyboardType="numeric"
            placeholder="30"
          />
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive notifications for new calls and updates
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
            />
          </View>
        </Card.Content>
      </Card>

      {/* Data Management */}
      <Card style={styles.card} elevation={2}>
        <Card.Content>
          <Title style={styles.cardTitle}>💾 Data Management</Title>
          
          <Button
            mode="outlined"
            onPress={retryFailedUploads}
            style={styles.actionButton}
            icon="refresh"
          >
            Retry Failed Uploads
          </Button>
          
          <Button
            mode="outlined"
            onPress={clearCallHistory}
            style={styles.actionButton}
            icon="delete"
            textColor="#F44336"
          >
            Clear Call History
          </Button>
          
          <Button
            mode="outlined"
            onPress={resetSettings}
            style={styles.actionButton}
            icon="restore"
            textColor="#FF9800"
          >
            Reset All Settings
          </Button>
        </Card.Content>
      </Card>

      {/* App Information */}
      <Card style={styles.card} elevation={2}>
        <Card.Content>
          <Title style={styles.cardTitle}>ℹ️ App Information</Title>
          
          <List.Item
            title="Version"
            description="1.0.0"
            left={(props) => <List.Icon {...props} icon="information" />}
          />
          <List.Item
            title="Device ID"
            description={config?.deviceId || 'Not set'}
            left={(props) => <List.Icon {...props} icon="cellphone" />}
          />
          <List.Item
            title="Last Sync"
            description="Just now"
            left={(props) => <List.Icon {...props} icon="sync" />}
          />
        </Card.Content>
      </Card>

      {/* Save Button */}
      <View style={styles.saveContainer}>
        <Button
          mode="contained"
          onPress={saveSettings}
          loading={isSaving}
          disabled={isSaving}
          style={styles.saveButton}
          icon="content-save"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  connectionStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  testButton: {
    minWidth: 120,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  divider: {
    marginVertical: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  radioLabel: {
    flex: 1,
    marginLeft: 8,
  },
  radioDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  simCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  simInfo: {
    flex: 1,
  },
  simSlot: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  simNumber: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
  },
  simCarrier: {
    fontSize: 12,
    color: '#666',
  },
  simSignal: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  simStatusChip: {
    minWidth: 60,
  },
  actionButton: {
    marginBottom: 8,
  },
  saveContainer: {
    marginTop: 16,
    marginBottom: 32,
  },
  saveButton: {
    paddingVertical: 8,
    backgroundColor: '#2196F3',
  },
});

export default SettingsScreen; 