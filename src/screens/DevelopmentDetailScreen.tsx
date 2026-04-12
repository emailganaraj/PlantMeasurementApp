/**
 * DevelopmentDetailScreen.tsx
 * 
 * Detail view for a development submission.
 * Displays metadata and manual measurements (no AI plant results).
 * Uses /development-measurements endpoints for manual measurements.
 * Mirrors AnalysisDetailScreen pattern
 * V28.4 - Modern UI/UX with design system
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme';
import ZoomableImageModal from './ZoomableImageModal';
import ManualMeasurementModal from '../components/ManualMeasurementModal';
import ChatComponent from '../components/ChatComponent';
import { formatISTDate, formatISTTime } from '../utils/timeUtils';

const DevelopmentDetailScreen = ({
  route,
  navigation,
}: {
  route: any;
  navigation: any;
}) => {
  const { submission, apiUrl } = route.params;
  const [zoomModalVisible, setZoomModalVisible] = React.useState(false);
  const [manualModalVisible, setManualModalVisible] = React.useState(false);
  const [manualMeasurements, setManualMeasurements] = React.useState<any>(null);
  const [username, setUsername] = useState<string>('');
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load username from AsyncStorage
  useEffect(() => {
    loadUsername();
  }, []);

  const loadUsername = async () => {
    try {
      const storedUsername = await AsyncStorage.getItem('username');
      if (storedUsername) {
        setUsername(storedUsername);
      }
    } catch (error) {
      console.error('Error loading username:', error);
    }
  };

  // Safely get metadata
  const submissionName = submission.analysis_name || 'Untitled Submission';
  const runNumber = submission?.id || 'Unknown';
  const date = formatISTDate(submission.timestamp);
  const time = formatISTTime(submission.timestamp);

  // Set header options with submission info
  useEffect(() => {
    navigation.setOptions({
      title: `#${runNumber} ${submissionName}`,
      headerRight: () => (
        <View style={styles.headerRight}>
          <Text style={styles.headerDateTime}>{date}</Text>
          <Text style={styles.headerDateTime}>{time}</Text>
        </View>
      ),
    });
  }, [navigation, submissionName, runNumber, date, time]);

  // Check unread admin messages for this development submission
  const checkUnreadAdminMessages = async () => {
    try {
      const response = await fetch(`${apiUrl}/chat/${runNumber}?user_id=${submission?.user_id || 'user'}&flow=development`);
      if (response.ok) {
        const data = await response.json();
        if (data.messages && data.messages.length > 0) {
          // Count unread messages from admin (sender_type === 'admin' and status !== 'read')
          const unreadAdminMessages = data.messages.filter((msg: any) => 
            msg.sender_type === 'admin' && msg.status !== 'read'
          );
          setUnreadCount(unreadAdminMessages.length);
        }
      }
    } catch (error) {
      console.error('Error checking unread messages:', error);
    }
  };

  // Auto-refresh unread count every 4 seconds
  useEffect(() => {
    if (!runNumber) return;
    
    // Initial check
    checkUnreadAdminMessages();
    
    // Set up polling every 4 seconds
    const pollInterval = setInterval(checkUnreadAdminMessages, 4000);
    
    return () => {
      clearInterval(pollInterval);
    };
  }, [runNumber, apiUrl, submission?.user_id]);

  const seedsKept = submission.total_seeds_kept || 0;
  const seedsGerminated = submission.total_seeds_germinated || 0;
  const germinationPercentage = submission.germination_percentage || 0;

  // For development submissions, show only original_image
  const imageUrl = submission.original_image;
  const fullImageUrl = imageUrl ? `${apiUrl}${imageUrl}` : null;

  // Load manual measurements for this development submission
  useEffect(() => {
    console.log('useEffect triggered - loading development measurements');
    loadManualMeasurements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submission?.id, apiUrl]);

  const loadManualMeasurements = async () => {
    try {
      const userId = submission?.user_id || 'user';
      const submissionIdLocal = submission?.id || '';
      console.log('Loading development measurements for:', {
        submissionIdLocal,
        userId,
      });
      const response = await fetch(
        `${apiUrl}/development-measurements/${submissionIdLocal}?user_id=${userId}`,
      );
      console.log('Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Development measurement data:', data);
        setManualMeasurements(data.measurement || null);
      } else {
        console.warn('Failed to load, status:', response.status);
        setManualMeasurements(null);
      }
    } catch (error) {
      console.error('Failed to load development measurements:', error);
      setManualMeasurements(null);
    }
  };

  const handleManualMeasurementSubmitted = () => {
    loadManualMeasurements();
  };

  const deleteManualMeasurements = async () => {
    try {
      const userIdLocal = submission?.user_id || 'user';
      const submissionIdLocal = submission?.id || '';
      const response = await fetch(
        `${apiUrl}/development-measurements/${submissionIdLocal}?user_id=${userIdLocal}`,
        {
          method: 'DELETE',
        },
      );
      if (response.ok) {
        setManualMeasurements(null);
        Alert.alert('Success', 'Manual measurements deleted');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      Alert.alert('Error', 'Failed to delete measurements');
    }
  };

  // Get manual plants if available
  const manualPlants = manualMeasurements?.measurements?.map((m: any) => ({
    id: m.plant_id,
    root_length_cm: m.root_length_cm,
    shoot_length_cm: m.shoot_length_cm,
    total_length_cm: m.total_length_cm,
  })) || [];

  console.log('DEBUG - manualMeasurements:', manualMeasurements);
  console.log('DEBUG - manualPlants:', manualPlants);

  return (
    <SafeAreaView style={styles.screenContainer} edges={['left', 'right']}>
      {/* Chat with Admin Button at Top */}
      {username && (
        <View style={styles.topButtonContainer}>
          <TouchableOpacity
            style={[
              styles.chatButton,
              unreadCount > 0 && styles.chatButtonUnread
            ]}
            onPress={() => setChatModalVisible(true)}
          >
            <Text style={styles.chatButtonText}>
              💬 Chat with Admin {unreadCount > 0 && `(${unreadCount} unread)`}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: Spacing[6] }}>
      {/* Submission Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Submission Info</Text>
        <Text style={styles.infoText}>
          <Text style={styles.infoLabel}>Name:</Text> {submissionName}
        </Text>
        <Text style={styles.infoText}>
          <Text style={styles.infoLabel}>Date:</Text> {date} at {time}
        </Text>
      </View>

      {/* Seeds & Germination */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Seeds & Germination</Text>
        <View style={styles.vigourGrid}>
          <View style={styles.vigourCard}>
            <Text style={styles.vigourLabel}>Seeds Kept</Text>
            <Text style={styles.vigourValue}>{seedsKept}</Text>
          </View>
          <View style={styles.vigourCard}>
            <Text style={styles.vigourLabel}>Germinated</Text>
            <Text style={styles.vigourValue}>{seedsGerminated}</Text>
          </View>
          <View style={[styles.vigourCard, styles.germinationCard]}>
            <Text style={[styles.vigourLabel, styles.germinationLabel]}>
              Germ. %
            </Text>
            <Text style={[styles.vigourValue, styles.germinationValue]}>
              {germinationPercentage.toFixed(0)}%
            </Text>
          </View>
        </View>
      </View>

      {/* Annotated Image */}
      {fullImageUrl && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Submission Image</Text>
          <TouchableOpacity
            onPress={() => setZoomModalVisible(true)}
            style={styles.imageContainer}
          >
            <Image
              source={{ uri: fullImageUrl }}
              style={styles.annotationImage}
            />
            <View style={styles.zoomIndicatorOverlay}>
              <Text style={styles.zoomIndicatorIcon}>🔍</Text>
              <Text style={styles.zoomIndicatorText}>Tap to zoom</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Manual Measurements Section */}
      {manualPlants.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Manual Measurements</Text>

          <View style={tableStyles.tableContainer}>
            {/* Headers */}
            <View style={[tableStyles.tableRow, tableStyles.tableHeaderRow]}>
              <Text
                style={[
                  tableStyles.tableCell,
                  tableStyles.tableHeader,
                  { flex: 0.6, fontWeight: '700' },
                ]}
              >
                Plant
              </Text>
              <Text
                style={[
                  tableStyles.tableCell,
                  tableStyles.tableHeader,
                  { flex: 1.1 },
                ]}
              >
                Root
              </Text>
              <Text
                style={[
                  tableStyles.tableCell,
                  tableStyles.tableHeader,
                  { flex: 1.1 },
                ]}
              >
                Shoot
              </Text>
              <Text
                style={[
                  tableStyles.tableCell,
                  tableStyles.tableHeader,
                  { flex: 1.1 },
                ]}
              >
                Total
              </Text>
            </View>

            {/* Data Rows */}
            {manualPlants.map((plant: any) => (
              <View
                key={`manual-${plant.id}`}
                style={[tableStyles.tableRow, tableStyles.manualRow]}
              >
                <Text
                  style={[
                    tableStyles.tableCell,
                    tableStyles.tableCellBold,
                    { flex: 0.6 },
                  ]}
                >
                  P{plant.id}
                </Text>
                <Text
                  style={[
                    tableStyles.tableCell,
                    tableStyles.tableCellRootManual,
                    { flex: 1.1 },
                  ]}
                >
                  {plant.root_length_cm.toFixed(2)}
                </Text>
                <Text
                  style={[
                    tableStyles.tableCell,
                    tableStyles.tableCellShootManual,
                    { flex: 1.1 },
                  ]}
                >
                  {plant.shoot_length_cm.toFixed(2)}
                </Text>
                <Text
                  style={[
                    tableStyles.tableCell,
                    tableStyles.tableCellTotalManual,
                    { flex: 1.1 },
                  ]}
                >
                  {plant.total_length_cm.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.manualButton}
              onPress={() => setManualModalVisible(true)}
            >
              <Text style={styles.manualButtonText}>
                {manualPlants.length > 0
                  ? '✎ Update Manual Measurements'
                  : '+ Submit Manual Measurement'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.manualButton, styles.deleteButton]}
              onPress={deleteManualMeasurements}
            >
              <Text style={styles.manualButtonText}>🗑️ Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.section}>
          <View style={styles.noMeasurementsBox}>
            <Text style={styles.noMeasurementsIcon}>📋</Text>
            <Text style={styles.noMeasurementsText}>
              No manual measurements yet
            </Text>
            <TouchableOpacity
              style={styles.addMeasurementButton}
              onPress={() => setManualModalVisible(true)}
            >
              <Text style={styles.addMeasurementButtonText}>
                + Add Manual Measurements
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Modals */}
      <ManualMeasurementModal
        visible={manualModalVisible}
        analysis={submission}
        apiUrl={apiUrl}
        endpoint="/development-measurements"
        onClose={() => setManualModalVisible(false)}
        onMeasurementSubmitted={handleManualMeasurementSubmitted}
      />

      <ZoomableImageModal
        visible={zoomModalVisible}
        imageUrl={fullImageUrl}
        onClose={() => setZoomModalVisible(false)}
      />

      {/* Chat Component Modal */}
      {username && (
        <ChatComponent
          analysisId={runNumber}
          userId={submission?.user_id || 'user'}
          username={username}
          apiUrl={apiUrl}
          flow="development"
          visible={chatModalVisible}
          onClose={() => setChatModalVisible(false)}
        />
      )}
      </ScrollView>

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
  topButtonContainer: {
    padding: Spacing[4],
    paddingBottom: Spacing[2],
    backgroundColor: Colors.primaryBg,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBg,
    padding: Spacing[4],
  },
  chatButton: {
    backgroundColor: Colors.primary,
    padding: Spacing[3],
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginBottom: Spacing[10],
    ...Shadows.md,
  },
  chatButtonUnread: {
    backgroundColor: '#FF6B35',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
    transform: [{ scale: 1.02 }],
  },
  chatButtonText: {
    color: Colors.white,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing[8],
    marginBottom: Spacing[3],
    marginHorizontal: Spacing[6],
    marginTop: Spacing[6],
    ...Shadows.xs,
    borderLeftWidth: 4,
    borderLeftColor: Colors.purple,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.purple,
    marginBottom: Spacing[3],
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing[2],
    marginTop: Spacing[3],
  },
  manualButton: {
    flex: 1,
    backgroundColor: Colors.warning,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing[5],
    paddingHorizontal: Spacing[3],
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: Colors.error,
  },
  manualButtonText: {
    color: Colors.white,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  infoText: {
    fontSize: Typography.sizes.base,
    color: Colors.gray700,
    marginBottom: Spacing[1],
  },
  infoLabel: {
    fontWeight: Typography.weights.semibold,
    color: Colors.gray800,
  },
  vigourGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  vigourCard: {
    alignItems: 'center',
    padding: Spacing[5],
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.gray100,
    flex: 1,
    marginHorizontal: Spacing[2],
  },
  germinationCard: {
    backgroundColor: Colors.accentBg,
  },
  vigourLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.gray600,
    fontWeight: Typography.weights.semibold,
  },
  germinationLabel: {
    color: Colors.warning,
  },
  vigourValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.purple,
    marginTop: Spacing[1],
  },
  germinationValue: {
    color: Colors.warning,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
  },
  annotationImage: {
    width: '100%',
    height: 250,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray100,
  },
  zoomIndicatorOverlay: {
    position: 'absolute',
    bottom: Spacing[2],
    right: Spacing[2],
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[1],
    borderRadius: BorderRadius.lg,
  },
  zoomIndicatorIcon: {
    fontSize: 14,
    marginRight: Spacing[1],
  },
  zoomIndicatorText: {
    color: Colors.white,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
  },
  headerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    marginRight: Spacing[6],
  },
  headerDateTime: {
    fontSize: Typography.sizes.xs,
    color: Colors.gray700,
    fontWeight: Typography.weights.medium,
  },
  noMeasurementsBox: {
    alignItems: 'center',
    paddingVertical: Spacing[12],
    paddingHorizontal: Spacing[6],
    backgroundColor: Colors.purpleLight,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.purpleAccent,
  },
  noMeasurementsIcon: {
    fontSize: 48,
    marginBottom: Spacing[4],
  },
  noMeasurementsText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.purpleDark,
    marginBottom: Spacing[6],
  },
  addMeasurementButton: {
    backgroundColor: Colors.purple,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing[5],
    paddingHorizontal: Spacing[8],
  },
  addMeasurementButtonText: {
    color: Colors.white,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
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

// Styles for the table
const tableStyles = StyleSheet.create({
  tableContainer: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.gray100,
    marginBottom: Spacing[8],
    borderWidth: 2,
    borderColor: Colors.purpleLight,
    ...Shadows.sm,
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing[5],
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  tableHeaderRow: {
    backgroundColor: Colors.purple,
    borderBottomWidth: 2,
    borderBottomColor: Colors.purpleDark,
  },
  tableCell: {
    fontSize: Typography.sizes.sm,
    color: Colors.gray700,
    fontWeight: Typography.weights.medium,
    paddingVertical: Spacing[7],
  },
  tableCellBold: {
    fontWeight: Typography.weights.bold,
    color: Colors.gray800,
  },
  tableCellRootManual: {
    color: Colors.purple,
    fontWeight: Typography.weights.semibold,
  },
  tableCellShootManual: {
    color: Colors.info,
    fontWeight: Typography.weights.semibold,
  },
  tableCellTotalManual: {
    color: Colors.purple,
    fontWeight: Typography.weights.bold,
  },
  tableHeader: {
    color: Colors.white,
    fontWeight: Typography.weights.extrabold,
    paddingVertical: Spacing[3],
  },
  manualRow: {
    backgroundColor: Colors.purpleLight,
  },
});

export default DevelopmentDetailScreen;
