/**
 * AppWithNavigationTabs.tsx
 */

import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import AppContent from './AppContent';
import AnalysisHistoryScreen from './screens/AnalysisHistoryScreen';
import AnalysisDetailScreen from './screens/AnalysisDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

interface AppTabsProps {
  userId: string;
  apiUrl: string;
}

// Simple History Stack
const HistoryStack = React.memo(({ userId, apiUrl }: AppTabsProps) => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#fff5e6' },
      headerTintColor: '#16a34a',
      headerTitleStyle: { fontWeight: 'bold' },
    }}
  >
    <Stack.Screen name="AnalysisList" options={{ title: 'Analysis History' }}>
      {props => (
        <AnalysisHistoryScreen {...props} userId={userId} apiUrl={apiUrl} />
      )}
    </Stack.Screen>
    <Stack.Screen
      name="AnalysisDetail"
      component={AnalysisDetailScreen}
      options={{ title: 'Analysis Details' }}
    />
  </Stack.Navigator>
));

export const AppWithNavigationTabs: React.FC<AppTabsProps> = ({
  userId,
  apiUrl,
}) => {
  const [historyKey, setHistoryKey] = useState(0);

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#16a34a',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: { backgroundColor: '#fff5e6' },
        }}
      >
        <Tab.Screen
          name="New Analysis"
          component={() => <AppContent userId={userId} apiUrl={apiUrl} />}
          options={{ tabBarLabel: 'New Analysis' }}
        />
        <Tab.Screen
          name="History"
          options={{
            tabBarLabel: 'History',
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
    </NavigationContainer>
  );
};
