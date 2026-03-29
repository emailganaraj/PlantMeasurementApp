/**
 * DevelopmentHistoryScreen.tsx
 * 
 * Displays list of development submissions for the user.
 * Fetches from GET /development-history/{userId}
 * Mirrors AnalysisHistoryScreen pattern
 * V28.4 - Modern UI/UX with design system
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme';

interface DevelopmentHistoryScreenProps {
  userId: string;
  apiUrl: string;
}

const DevelopmentHistoryScreen: React.FC<DevelopmentHistoryScreenProps> = ({
  userId,
  apiUrl,
}) => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/development-history/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch development submissions');
      }
      const data = await response.json();
      setSubmissions(data.submissions || []);
    } catch (error) {
      console.error('Fetch submissions error:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSubmissions();
    }, [apiUrl, userId]),
  );

  const renderItem = ({
    item,
    index,
  }: {
    item: any;
    index: number;
  }) => {
    const submissionName = item.analysis_name || 'Untitled Submission';
    const runNumber = submissions.length - index;
    const date = new Date(item.timestamp).toLocaleDateString();
    const time = new Date(item.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    const germinationPercentage = item.germination_percentage || 0;

    // Manual measurements (if available)
    const manualMeasurements = item.manual_measurements?.measurements || [];
    let manualAvgLength = 0;
    let manualSvi = 0;
    if (manualMeasurements.length > 0) {
      const totalManualLength = manualMeasurements.reduce(
        (acc: number, m: any) => acc + (m.root_length_cm + m.shoot_length_cm),
        0,
      );
      manualAvgLength = totalManualLength / manualMeasurements.length;
      manualSvi = manualAvgLength * germinationPercentage;
    }

    // Get thumbnail from development submission - show ONLY original image
    const thumbnailUrl = item.original_image;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate('DevelopmentDetail', {
            submission: item,
            apiUrl: apiUrl,
          })
        }
      >
        {thumbnailUrl && (
          <Image
            source={{ uri: `${apiUrl}${thumbnailUrl}` }}
            style={styles.thumbnail}
          />
        )}
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.submissionName} numberOfLines={1}>
              {submissionName}
            </Text>
            <Text style={styles.runNumber}>#{runNumber}</Text>
          </View>
          <Text style={styles.dateTime}>
            {date} at {time}
          </Text>

          {/* Metadata Display */}
          <View style={styles.metadataGrid}>
            <View style={styles.metadataBox}>
              <Text style={styles.metadataLabel}>Seeds Kept</Text>
              <Text style={styles.metadataValue}>
                {item.total_seeds_kept || 0}
              </Text>
            </View>
            <View style={styles.metadataBox}>
              <Text style={styles.metadataLabel}>Germinated</Text>
              <Text style={styles.metadataValue}>
                {item.total_seeds_germinated || 0}
              </Text>
            </View>
            <View style={styles.metadataBox}>
              <Text style={styles.metadataLabel}>Germ %</Text>
              <Text style={styles.metadataValue}>
                {germinationPercentage.toFixed(0)}%
              </Text>
            </View>
          </View>

          {/* Manual Measurements Row */}
          {manualAvgLength > 0 && (
            <View style={[styles.metadataGrid, styles.manualStatsGrid]}>
              <View style={styles.metadataBox}>
                <Text style={styles.metadataLabel}>Avg. Length (Manual)</Text>
                <Text style={styles.metadataValue}>
                  {manualAvgLength.toFixed(2)} cm
                </Text>
              </View>
              <View style={[styles.metadataBox, styles.sviBox]}>
                <Text style={[styles.metadataLabel, styles.sviLabel]}>
                  SVI (Manual)
                </Text>
                <Text style={[styles.metadataValue, styles.sviValue]}>
                  {manualSvi.toFixed(0)}
                </Text>
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && submissions.length === 0) {
    return (
      <ActivityIndicator
        size="large"
        color={Colors.primary}
        style={styles.loadingIndicator}
      />
    );
  }

  return (
    <SafeAreaView style={styles.screenContainer} edges={['left', 'right']}>
      <FlatList
        data={submissions}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        style={styles.container}
        contentContainerStyle={{ padding: Spacing[5] }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No development submissions yet.</Text>
        }
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchSubmissions}
            colors={[Colors.primary]}
          />
        }
      />
      
      {/* Bottom Navigation */}
      <SafeAreaView style={styles.bottomNav} edges={['bottom']}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Dashboard' })}
        >
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabel}>Dashboard</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.primaryBg,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBg,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing[8],
    marginVertical: Spacing[2],
    marginHorizontal: Spacing[1],
    flexDirection: 'row',
    ...Shadows.sm,
    borderLeftWidth: 5,
    borderLeftColor: Colors.purple,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray100,
    marginRight: Spacing[8],
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing[1],
  },
  submissionName: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.gray800,
    flex: 1,
  },
  runNumber: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.white,
    backgroundColor: Colors.purple,
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[1],
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  dateTime: {
    fontSize: Typography.sizes.sm,
    color: Colors.gray500,
    marginBottom: Spacing[3],
  },
  metadataGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing[2],
  },
  metadataBox: {
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    flex: 1,
  },
  metadataLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.gray600,
    fontWeight: Typography.weights.semibold,
  },
  metadataValue: {
    fontSize: 13,
    fontWeight: Typography.weights.bold,
    color: Colors.purple,
  },
  manualStatsGrid: {
    marginTop: Spacing[2],
    paddingTop: Spacing[2],
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
  sviBox: {
    backgroundColor: Colors.purpleLight,
  },
  sviLabel: {
    color: Colors.purpleDark,
  },
  sviValue: {
    color: Colors.purpleDark,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: Typography.sizes.md,
    color: Colors.gray500,
  },
  loadingIndicator: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[4],
    ...Shadows.xs,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing[3],
  },
  navIcon: {
    fontSize: 24,
    marginBottom: Spacing[1],
  },
  navLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.purple,
    fontWeight: Typography.weights.semibold,
  },
});

export default DevelopmentHistoryScreen;
