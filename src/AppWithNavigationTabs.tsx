/**
 * AppWithNavigationTabs.tsx
 *
 * Sets up the bottom tab navigation for the main application screens:
 * 1. New Analysis: The main screen for performing analysis.
 * 2. History: A stack navigator to show past analyses and their details.
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import AppContent from './AppContent'; // The main analysis screen
import AnalysisHistoryScreen from './screens/AnalysisHistoryScreen';
import AnalysisDetailScreen from './screens/AnalysisDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

interface AppTabsProps {
    userId: string;
    apiUrl: string;
}

// A stack navigator for the History tab, so we can go from a list to a detail view.
const HistoryStack = ({ userId, apiUrl }: AppTabsProps) => (
    <Stack.Navigator
        screenOptions={{
            headerStyle: { backgroundColor: '#fff5e6' },
            headerTintColor: '#16a34a',
            headerTitleStyle: { fontWeight: 'bold' },
        }}
    >
        <Stack.Screen name="AnalysisList" options={{ title: 'Analysis History' }}>
            {props => <AnalysisHistoryScreen {...props} userId={userId} apiUrl={apiUrl} />}
        </Stack.Screen>
        <Stack.Screen name="AnalysisDetail" component={AnalysisDetailScreen} options={{ title: 'Analysis Details' }} />
    </Stack.Navigator>
);

export const AppWithNavigationTabs: React.FC<AppTabsProps> = ({ userId, apiUrl }) => {
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
                    options={{
                        tabBarLabel: 'New Analysis',
                        // You can add an icon here if you want
                    }}
                >
                    {/* Pass userId and apiUrl to the main analysis content screen */}
                    {() => <AppContent userId={userId} apiUrl={apiUrl} />}
                </Tab.Screen>
                <Tab.Screen
                    name="History"
                    options={{
                        tabBarLabel: 'History',
                        // You can add an icon here if you want
                    }}
                >
                    {/* The History tab has its own navigation stack */}
                    {() => <HistoryStack userId={userId} apiUrl={apiUrl} />}
                </Tab.Screen>
            </Tab.Navigator>
        </NavigationContainer>
    );
};