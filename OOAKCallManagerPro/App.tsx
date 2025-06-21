import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, Alert, AppState } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Import screens from OOAKCallManagerPro
import LoginScreen from './OOAKCallManagerPro/src/screens/LoginScreen';
import DashboardScreen from './OOAKCallManagerPro/src/screens/DashboardScreen';
import CallScreen from './OOAKCallManagerPro/src/screens/CallScreen';
import CallHistoryScreen from './OOAKCallManagerPro/src/screens/CallHistoryScreen';
import SettingsScreen from './OOAKCallManagerPro/src/screens/SettingsScreen';

// Import services
import { AuthService } from './OOAKCallManagerPro/src/services/AuthService';
import CallService from './OOAKCallManagerPro/src/services/CallService';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Initialize services
const callService = new CallService();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Calls') {
            iconName = focused ? 'call' : 'call-outline';
          } else if (route.name === 'History') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Calls" component={CallScreen} />
      <Tab.Screen name="History" component={CallHistoryScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [appState, setAppState] = useState(AppState.currentState);

  useEffect(() => {
    checkAuthStatus();
    setupCallMonitoring();
    
    // Monitor app state changes for call detection
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AuthService.getToken();
      setIsAuthenticated(!!token);
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const setupCallMonitoring = () => {
    // Since we can't access call logs directly, we'll implement alternative monitoring
    console.log('Setting up call monitoring...');
    
    // Monitor for app state changes that might indicate calls
    // This is a workaround for the lack of direct call log access
    startCallStateMonitoring();
  };

  const handleAppStateChange = (nextAppState: string) => {
    if (appState.match(/inactive|background/) && nextAppState === 'active') {
      // App came back to foreground - check if user was on a call
      checkForRecentCalls();
    }
    setAppState(nextAppState);
  };

  const startCallStateMonitoring = () => {
    // This is a simplified monitoring approach
    // In a production app, you'd need native modules for better call detection
    
    setInterval(() => {
      // Check for any ongoing calls that were initiated through the app
      const currentCall = callService.getCurrentCall();
      if (currentCall && currentCall.status === 'in_progress') {
        // Update call duration in real-time
        console.log('Monitoring active call:', currentCall.clientName);
      }
    }, 5000); // Check every 5 seconds
  };

  const checkForRecentCalls = async () => {
    try {
      // This is where we'd check for new calls if we had access to call logs
      // For now, we'll show a notification to manually update call status
      
      const currentCall = callService.getCurrentCall();
      if (currentCall) {
        Alert.alert(
          'Call Status Update',
          `Were you on a call with ${currentCall.clientName}?`,
          [
            {
              text: 'No',
              style: 'cancel',
            },
            {
              text: 'Yes, Update Status',
              onPress: () => {
                // Navigate to call outcome screen
                console.log('User confirmed call - should show outcome modal');
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Failed to check for recent calls:', error);
    }
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    AuthService.logout();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading OOAK Call Manager Pro...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" backgroundColor="#2196F3" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login">
            {(props) => <LoginScreen {...props} onLogin={handleLogin} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Main" component={TabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
}); 