import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import PortfolioScreen from './src/screens/PortfolioScreen';
import WatchlistScreen from './src/screens/WatchlistScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = { Portfolio: '📊', Watchlist: '👁️', Profile: '👤' };
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{icons[name]}</Text>;
}

function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarStyle: {
          backgroundColor: '#161b22',
          borderTopColor: '#30363d',
          borderTopWidth: 1,
          paddingTop: 6,
          height: 60,
        },
        tabBarActiveTintColor: '#388bfd',
        tabBarInactiveTintColor: '#484f58',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
        headerStyle: { backgroundColor: '#161b22', shadowColor: 'transparent', borderBottomColor: '#30363d' },
        headerTintColor: '#e6edf3',
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
        headerStatusBarHeight: 0,
      })}
    >
      <Tab.Screen name="Portfolio" component={PortfolioScreen}
        options={{ title: 'Portfolio', headerTitle: '📊  Portfolio' }} />
      <Tab.Screen name="Watchlist" component={WatchlistScreen}
        options={{ title: 'Watchlist', headerTitle: '👁️  Watchlist' }} />
      <Tab.Screen name="Profile" component={ProfileScreen}
        options={{ title: 'Profile', headerTitle: '👤  Profile' }} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="Main" component={AppTabs} />
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="light" backgroundColor="#080c11" />
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
