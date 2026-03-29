/**
 * SubmitForDevelopmentScreen.tsx
 * 
 * Full-screen page accessible from Dashboard with top tabs for
 * Capture and History views of development submissions.
 * V28.4 - Modern UI/UX with design system
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme';
import DevelopmentCaptureScreen from './DevelopmentCaptureScreen';
import DevelopmentHistoryScreen from './DevelopmentHistoryScreen';

interface SubmitForDevelopmentScreenProps {
  userId: string;
  apiUrl: string;
}

type TabType = 'capture' | 'history';

const SubmitForDevelopmentScreen: React.FC<SubmitForDevelopmentScreenProps> = ({
  userId,
  apiUrl,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('capture');

  return (
    <View style={styles.container}>
      {/* Top Tab Navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'capture' && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab('capture')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'capture' && styles.tabTextActive,
            ]}
          >
            📸 Capture
          </Text>
          {activeTab === 'capture' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'history' && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab('history')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'history' && styles.tabTextActive,
            ]}
          >
            📋 History
          </Text>
          {activeTab === 'history' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={styles.content}>
        {activeTab === 'capture' && (
          <DevelopmentCaptureScreen userId={userId} apiUrl={apiUrl} />
        )}
        {activeTab === 'history' && (
          <DevelopmentHistoryScreen userId={userId} apiUrl={apiUrl} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBg,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primaryLight,
    ...Shadows.xs,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing[5],
    paddingHorizontal: Spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: Colors.primaryLight,
  },
  tabText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.gray500,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: Typography.weights.bold,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    width: '60%',
    backgroundColor: Colors.primary,
    borderTopLeftRadius: BorderRadius.sm,
    borderTopRightRadius: BorderRadius.sm,
  },
  content: {
    flex: 1,
  },
});

export default SubmitForDevelopmentScreen;
