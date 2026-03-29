/**
 * AppWithNavigationTabs.tsx
 *
 * Navigation shell for the authenticated app.
 * Structure:
 *   NavigationContainer
 *     └── RootStack
 *           └── MainTabs (BottomTabNavigator)
 *                 ├── Dashboard tab → DashboardScreen
 *                 ├── New Analysis tab → AppContent
 *                 └── History tab      → HistoryStack
 */

import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import AppContent from './AppContent';
import AnalysisHistoryScreen from './screens/AnalysisHistoryScreen';
import AnalysisDetailScreen from './screens/AnalysisDetailScreen';
import DashboardScreen from './screens/DashboardScreen';
import SubmitForDevelopmentScreen from './screens/SubmitForDevelopmentScreen';
import DevelopmentDetailScreen from './screens/DevelopmentDetailScreen';
import type { RootStackParamList, TabParamList } from './navigation/types';

const Tab              = createBottomTabNavigator<TabParamList>();
const RootStack        = createStackNavigator<RootStackParamList>();
const HistoryNav       = createStackNavigator();
const DevelopmentNav   = createStackNavigator();

interface AppTabsProps {
  userId: string;
  username?: string;
  apiUrl: string;
}

// ── History stack (unchanged logic) ──────────────────────────────────────────
const HistoryStack = React.memo(({ userId, apiUrl }: AppTabsProps) => (
  <HistoryNav.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#fff5e6' },
      headerTintColor: '#16a34a',
      headerTitleStyle: { fontWeight: 'bold' },
    }}
  >
    <HistoryNav.Screen name="AnalysisList" options={{ title: 'Analysis History' }}>
      {props => (
        <AnalysisHistoryScreen {...props} userId={userId} apiUrl={apiUrl} />
      )}
    </HistoryNav.Screen>
    <HistoryNav.Screen
      name="AnalysisDetail"
      component={AnalysisDetailScreen}
      options={{ title: 'Analysis Details' }}
    />
  </HistoryNav.Navigator>
));

// ── Development Submission stack ─────────────────────────────────────────────
const DevelopmentStack = React.memo(({ userId, apiUrl }: AppTabsProps) => (
  <DevelopmentNav.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#f3e8ff' },
      headerTintColor: '#8b5cf6',
      headerTitleStyle: { fontWeight: 'bold' },
    }}
  >
    <DevelopmentNav.Screen
      name="DevelopmentMain"
      options={{ title: 'Submit for Development', headerShown: false }}
    >
      {props => (
        <SubmitForDevelopmentScreen {...props} userId={userId} apiUrl={apiUrl} />
      )}
    </DevelopmentNav.Screen>
    <DevelopmentNav.Screen
      name="DevelopmentDetail"
      component={DevelopmentDetailScreen}
      options={{ title: 'Submission Details' }}
    />
  </DevelopmentNav.Navigator>
));

// ── Main bottom-tab navigator (owns historyKey state) ────────────────────────
const MainTabsNavigator = React.memo(({ userId, username = '', apiUrl }: AppTabsProps) => {
  const [historyKey, setHistoryKey] = useState(0);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#16a34a',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: { backgroundColor: '#fff5e6' },
      }}
    >
      {/* Dashboard tab */}
      <Tab.Screen
        name="Dashboard"
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏠</Text>,
        }}
      >
        {() => (
          <DashboardScreen userId={userId} username={username} apiUrl={apiUrl} />
        )}
      </Tab.Screen>

      {/* New Analysis tab */}
      <Tab.Screen
        name="New Analysis"
        options={{
          tabBarLabel: 'New Analysis',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🔬</Text>,
        }}
      >
        {() => <AppContent userId={userId} apiUrl={apiUrl} />}
      </Tab.Screen>

      {/* History tab */}
      <Tab.Screen
        name="History"
        options={{
          tabBarLabel: 'History',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📊</Text>,
        }}
        listeners={({ navigation }) => ({
          tabPress: e => {
            const state = navigation.getParent()?.getState();
            const routes = state?.routes || [];
            const historyRoute = routes.find(
              (r: any) => r.name === 'History',
            );
            const historyState = historyRoute?.state;
            const historyRoutes = historyState?.routes || [];

            // If on detail screen (more than 1 route), reset
            if (historyRoutes.length > 1) {
              e.preventDefault();
              // Force remount of history stack
              setHistoryKey(prev => prev + 1);
            }
          },
        })}
      >
        {() => (
          <HistoryStack key={historyKey} userId={userId} apiUrl={apiUrl} />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
});

// ── Root navigator ────────────────────────────────────────────────────────────
export const AppWithNavigationTabs: React.FC<AppTabsProps> = ({
  userId,
  username = '',
  apiUrl,
}) => (
  <NavigationContainer>
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {/* MainTabs is the only screen in RootStack; Dashboard is now the first tab */}
      <RootStack.Screen
        name="MainTabs"
        options={{ animationEnabled: false }}
      >
        {() => <MainTabsNavigator userId={userId} username={username} apiUrl={apiUrl} />}
      </RootStack.Screen>

      {/* Development submission full-screen modal */}
      <RootStack.Screen
        name="SubmitForDevelopment"
        options={{
          animationEnabled: true,
          cardStyle: { backgroundColor: 'transparent' },
          cardOverlayEnabled: true,
        }}
      >
        {() => <DevelopmentStack userId={userId} apiUrl={apiUrl} />}
      </RootStack.Screen>
    </RootStack.Navigator>
  </NavigationContainer>
);
