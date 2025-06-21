import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Alert,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Import screens
import DashboardScreen from './screens/DashboardScreen';
import CallHistoryScreen from './screens/CallHistoryScreen';
import SettingsScreen from './screens/SettingsScreen';

// Import services
import CallService from './services/CallService';
import ApiService from './services/ApiService';

const Tab = createBottomTabNavigator();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#2196F3',
    accent: '#FF9800',
    background: '#F5F5F5',
    surface: '#FFFFFF',
    text: '#212121',
    onSurface: '#757575',
  },
};

const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('🚀 Initializing OOAK Call Manager...');

      // Request permissions
      const permissionsGranted = await CallService.requestPermissions();
      setHasPermissions(permissionsGranted);

      if (!permissionsGranted) {
        Alert.alert(
          'Permissions Required',
          'This app needs phone and recording permissions to function properly. Please grant all permissions and restart the app.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Test API connection
      const connectionTest = await ApiService.testConnection();
      if (!connectionTest.success) {
        console.warn('⚠️ API connection failed:', connectionTest.error);
        // Continue anyway - user can configure in settings
      }

      setIsInitialized(true);
      console.log('✅ App initialized successfully');
    } catch (error) {
      console.error('❌ App initialization failed:', error);
      Alert.alert(
        'Initialization Error',
        'Failed to initialize the app. Please restart and try again.',
        [{ text: 'OK' }]
      );
    }
  };

  if (!isInitialized) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
        <View style={styles.loadingContent}>
          <Icon name="phone" size={64} color="#2196F3" />
          <Text style={styles.loadingTitle}>OOAK Call Manager</Text>
          <Text style={styles.loadingSubtitle}>Initializing...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!hasPermissions) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
        <View style={styles.loadingContent}>
          <Icon name="warning" size={64} color="#FF9800" />
          <Text style={styles.loadingTitle}>Permissions Required</Text>
          <Text style={styles.loadingSubtitle}>
            Please grant all permissions and restart the app
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <StatusBar barStyle="dark-content" backgroundColor="#2196F3" />
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName: string;

              switch (route.name) {
                case 'Dashboard':
                  iconName = 'dashboard';
                  break;
                case 'History':
                  iconName = 'history';
                  break;
                case 'Settings':
                  iconName = 'settings';
                  break;
                default:
                  iconName = 'help';
              }

              return <Icon name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#2196F3',
            tabBarInactiveTintColor: '#757575',
            tabBarStyle: {
              backgroundColor: '#FFFFFF',
              borderTopColor: '#E0E0E0',
              borderTopWidth: 1,
            },
            headerStyle: {
              backgroundColor: '#2196F3',
            },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          })}
        >
          <Tab.Screen 
            name="Dashboard" 
            component={DashboardScreen}
            options={{
              title: 'Call Dashboard',
              tabBarBadge: undefined, // Will be set dynamically based on pending calls
            }}
          />
          <Tab.Screen 
            name="History" 
            component={CallHistoryScreen}
            options={{
              title: 'Call History',
            }}
          />
          <Tab.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{
              title: 'Settings',
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
    marginTop: 20,
    marginBottom: 10,
  },
  loadingSubtitle: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
  },
});

export default App; 