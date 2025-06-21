import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert } from 'react-native';

export default function App() {
  const handleCallDemo = () => {
    Alert.alert(
      '📞 Call Demo',
      'OOAK Call Manager is ready!\n\n✅ Device: Samsung S24 Ultra\n✅ Deployment: Successful\n✅ Ready for CRM integration',
      [{ text: 'Awesome!', style: 'default' }]
    );
  };

  const handleSettingsDemo = () => {
    Alert.alert(
      '⚙️ Settings Demo',
      'Configure:\n• API URL\n• Recording Quality\n• SIM Card Selection\n• Auto Upload Settings',
      [{ text: 'Got it!', style: 'default' }]
    );
  };

  const handleHistoryDemo = () => {
    Alert.alert(
      '📊 History Demo',
      'Track:\n• Call Records\n• Upload Status\n• Duration & Quality\n• Failed Upload Retries',
      [{ text: 'Perfect!', style: 'default' }]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📞 OOAK Call Manager</Text>
        <Text style={styles.subtitle}>Professional Call Management</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>✅ Deployment Successful!</Text>
        </View>
      </View>

      <View style={styles.deviceInfo}>
        <Text style={styles.deviceTitle}>📱 Your Device</Text>
        <Text style={styles.deviceText}>Samsung Galaxy S24 Ultra</Text>
        <Text style={styles.deviceText}>Perfect for call management!</Text>
      </View>

      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>🎯 Ready Features</Text>
        
        <TouchableOpacity style={styles.featureCard} onPress={handleCallDemo}>
          <Text style={styles.featureIcon}>📞</Text>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Call Management</Text>
            <Text style={styles.featureDesc}>Automatic recording & CRM integration</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.featureCard} onPress={handleHistoryDemo}>
          <Text style={styles.featureIcon}>📊</Text>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Call History</Text>
            <Text style={styles.featureDesc}>Track all calls & upload status</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.featureCard} onPress={handleSettingsDemo}>
          <Text style={styles.featureIcon}>⚙️</Text>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Settings</Text>
            <Text style={styles.featureDesc}>Configure API & preferences</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.nextSteps}>
        <Text style={styles.sectionTitle}>🚀 Next Steps</Text>
        <View style={styles.stepItem}>
          <Text style={styles.stepNumber}>1</Text>
          <Text style={styles.stepText}>Configure API settings</Text>
        </View>
        <View style={styles.stepItem}>
          <Text style={styles.stepNumber}>2</Text>
          <Text style={styles.stepText}>Test call functionality</Text>
        </View>
        <View style={styles.stepItem}>
          <Text style={styles.stepNumber}>3</Text>
          <Text style={styles.stepText}>Deploy to team devices</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.mainButton} onPress={handleCallDemo}>
        <Text style={styles.buttonText}>🎉 Start Using OOAK Call Manager</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 30,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 20,
  },
  statusBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  deviceInfo: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  deviceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  deviceText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  featuresSection: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  featureCard: {
    backgroundColor: 'white',
    flexDirection: 'row',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featureIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 14,
    color: '#666',
  },
  nextSteps: {
    margin: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  stepNumber: {
    backgroundColor: '#2196F3',
    color: 'white',
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: 'bold',
    marginRight: 16,
  },
  stepText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  mainButton: {
    backgroundColor: '#4CAF50',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 40,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
