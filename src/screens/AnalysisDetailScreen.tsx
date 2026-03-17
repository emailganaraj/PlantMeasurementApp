/**
 * AnalysisDetailScreen.tsx
 *
 * Displays the full details of a single analysis.
 * Fixes:
 * - Correctly constructs the full URL for the annotation image.
 * - Replaces the plant-wise measurement list with a data table.
 * - Displays all metadata correctly.
 * - Includes manual measurement submission and side-by-side comparison.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import ZoomableImageModal from './ZoomableImageModal';
import ManualMeasurementModal from '../components/ManualMeasurementModal';

const AnalysisDetailScreen = ({ route, navigation }: { route: any; navigation: any }) => {
  const { analysis, apiUrl } = route.params;
  const [zoomModalVisible, setZoomModalVisible] = React.useState(false);
  const [manualModalVisible, setManualModalVisible] = React.useState(false);
  const [manualMeasurements, setManualMeasurements] = React.useState<any>(null);
  const [loadingManual, setLoadingManual] = React.useState(false);

  // Safely get metadata
  const analysisName = analysis.analysis_name || 'Untitled Analysis';
  const analysisId = analysis?.id || 'Unknown';
  const runNumber = analysisId.match(/\d+$/) ? analysisId.match(/\d+$/)?.[0] : analysisId;
  const date = new Date(analysis.timestamp).toLocaleDateString();
  const time = new Date(analysis.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const germinationPercentage = analysis.germination_percentage || 0;

  // Set header options with analysis info
  useEffect(() => {
    navigation.setOptions({
      title: `#${runNumber} ${analysisName}`,
      headerRight: () => (
        <View style={styles.headerRight}>
          <Text style={styles.headerDateTime}>{date}</Text>
          <Text style={styles.headerDateTime}>{time}</Text>
        </View>
      ),
    });
  }, [navigation, analysisName, runNumber, date, time]);
  const seedsKept = analysis.total_seeds_kept || 0;
  const seedsGerminated = analysis.total_seeds_germinated || 0;

  // Calculate SVI
  const stats = analysis.statistics;
  const avgRoot =
    stats?.avg_biggest_root_length_cm ?? stats?.average_root_length_cm ?? 0;
  const avgShoot =
    stats?.avg_biggest_shoot_length_cm ?? stats?.average_shoot_length_cm ?? 0;
  const svi = (avgRoot + avgShoot) * germinationPercentage;

  // Fix: Construct full image URL
  const annotationUrl =
    analysis.comprehensive_annotation ||
    analysis.debug_images?.comprehensive_annotation;
  const fullImageUrl = annotationUrl ? `${apiUrl}${annotationUrl}` : null;

  // Load manual measurements for this analysis
  useEffect(() => {
    console.log('useEffect triggered - loading manual measurements');
    loadManualMeasurements();
  }, [analysis?.id, apiUrl]);

  const loadManualMeasurements = async () => {
    try {
      setLoadingManual(true);
      const userId = analysis?.user_id || 'user';
      const analysisId = analysis?.id || '';
      console.log('Loading manual measurements for:', { analysisId, userId });
      const response = await fetch(`${apiUrl}/manual-measurements/${analysisId}?user_id=${userId}`);
      console.log('Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Manual measurement data:', data);
        setManualMeasurements(data.measurement || null);
      } else {
        console.warn('Failed to load, status:', response.status);
        setManualMeasurements(null);
      }
    } catch (error) {
      console.error('Failed to load manual measurements:', error);
      setManualMeasurements(null);
    } finally {
      setLoadingManual(false);
    }
  };

  const handleManualMeasurementSubmitted = () => {
    loadManualMeasurements();
  };

  const deleteManualMeasurements = async () => {
    try {
      const userId = analysis?.user_id || 'user';
      const analysisId = analysis?.id || '';
      const response = await fetch(`${apiUrl}/manual-measurements/${analysisId}?user_id=${userId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setManualMeasurements(null);
        Alert.alert('Success', 'Manual measurements deleted');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      Alert.alert('Error', 'Failed to delete measurements');
    }
  };

  // Fix: Create a plants array for the table, similar to App.tsx
  const plants = (analysis.per_plant || []).map((plant: any) => ({
    id: plant.plant_id,
    root_length_cm: plant.biggest_root_length_cm ?? plant.root_length_cm ?? 0,
    shoot_length_cm:
      plant.biggest_shoot_length_cm ?? plant.shoot_length_cm ?? 0,
    total_length_cm:
      (plant.biggest_root_length_cm ?? plant.root_length_cm ?? 0) +
      (plant.biggest_shoot_length_cm ?? plant.shoot_length_cm ?? 0),
  }));

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
    <ScrollView style={styles.container}>
      {/* Analysis Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Analysis Info</Text>
        <Text style={styles.infoText}>
          <Text style={styles.infoLabel}>Name:</Text> {analysisName}
        </Text>
        <Text style={styles.infoText}>
          <Text style={styles.infoLabel}>Date:</Text> {date} at {time}
        </Text>
      </View>

      {/* Germination & Vigour */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Germination & Vigour</Text>
        <View style={styles.vigourGrid}>
          <View style={styles.vigourCard}>
            <Text style={styles.vigourLabel}>Seeds Kept</Text>
            <Text style={styles.vigourValue}>{seedsKept}</Text>
          </View>
          <View style={styles.vigourCard}>
            <Text style={styles.vigourLabel}>Germinated</Text>
            <Text style={styles.vigourValue}>{seedsGerminated}</Text>
          </View>
          <View style={styles.vigourCard}>
            <Text style={styles.vigourLabel}>Germ. %</Text>
            <Text style={styles.vigourValue}>
              {germinationPercentage.toFixed(0)}%
            </Text>
          </View>
          <View style={[styles.vigourCard, styles.sviCard]}>
            <Text style={[styles.vigourLabel, styles.sviLabel]}>SVI</Text>
            <Text style={[styles.vigourValue, styles.sviValue]}>
              {svi.toFixed(0)}
            </Text>
          </View>
        </View>
      </View>

      {/* Comprehensive Annotation */}
      {fullImageUrl && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Annotated Image</Text>
          <TouchableOpacity onPress={() => setZoomModalVisible(true)}>
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

      {/* Plant-wise Measurements Table - AI & Manual Combined */}
      {plants.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plant-wise Measurements</Text>
          <Text style={styles.comparisonNote}>AI vs Manual Comparison</Text>
          
          <View style={tableStyles.tableContainer}>
            {/* Headers: AI */}
            <View style={[tableStyles.tableRow, tableStyles.tableHeaderRow]}>
              <Text style={[tableStyles.tableCell, tableStyles.tableHeader, { flex: 0.6, fontWeight: '700' }]}>Plant</Text>
              <Text style={[tableStyles.tableCell, tableStyles.tableHeader, { flex: 1.1 }]}>Root</Text>
              <Text style={[tableStyles.tableCell, tableStyles.tableHeader, { flex: 1.1 }]}>Shoot</Text>
              <Text style={[tableStyles.tableCell, tableStyles.tableHeader, { flex: 1.1 }]}>Total</Text>
            </View>
            
            {/* AI Data Rows */}
            {plants.map((plant, idx) => (
              <View key={`ai-${plant.id}`} style={[tableStyles.tableRow, tableStyles.aiRow]}>
                <Text style={[tableStyles.tableCell, tableStyles.tableCellBold, { flex: 0.6 }]}>P{plant.id}</Text>
                <Text style={[tableStyles.tableCell, tableStyles.tableCellRoot, { flex: 1.1 }]}>{plant.root_length_cm.toFixed(2)}</Text>
                <Text style={[tableStyles.tableCell, tableStyles.tableCellShoot, { flex: 1.1 }]}>{plant.shoot_length_cm.toFixed(2)}</Text>
                <Text style={[tableStyles.tableCell, tableStyles.tableCellTotal, { flex: 1.1 }]}>{plant.total_length_cm.toFixed(2)}</Text>
              </View>
            ))}
            
            {/* Manual Data Rows (if available) */}
            {manualPlants.length > 0 && (
              <>
                <View style={tableStyles.manualDividerRow}>
                  <Text style={tableStyles.manualDividerText}>MANUAL</Text>
                </View>
                {manualPlants.map((plant) => (
                  <View key={`manual-${plant.id}`} style={[tableStyles.tableRow, tableStyles.manualRow]}>
                    <Text style={[tableStyles.tableCell, tableStyles.tableCellBold, { flex: 0.6 }]}>P{plant.id}</Text>
                    <Text style={[tableStyles.tableCell, tableStyles.tableCellRootManual, { flex: 1.1 }]}>{plant.root_length_cm.toFixed(2)}</Text>
                    <Text style={[tableStyles.tableCell, tableStyles.tableCellShootManual, { flex: 1.1 }]}>{plant.shoot_length_cm.toFixed(2)}</Text>
                    <Text style={[tableStyles.tableCell, tableStyles.tableCellTotalManual, { flex: 1.1 }]}>{plant.total_length_cm.toFixed(2)}</Text>
                  </View>
                ))}
              </>
            )}
          </View>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.manualButton}
              onPress={() => setManualModalVisible(true)}
            >
              <Text style={styles.manualButtonText}>
                {manualPlants.length > 0 ? '✎ Update Manual Measurements' : '+ Submit Manual Measurement'}
              </Text>
            </TouchableOpacity>
            
            {manualPlants.length > 0 && (
              <TouchableOpacity
                style={[styles.manualButton, styles.deleteButton]}
                onPress={() => {
                  Alert.alert('Delete Manual Measurements', 'Are you sure?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: deleteManualMeasurements },
                  ]);
                }}
              >
                <Text style={styles.deleteButtonText}>🗑 Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Manual Measurement Modal */}
      <ManualMeasurementModal
        visible={manualModalVisible}
        onClose={() => setManualModalVisible(false)}
        analysis={analysis}
        apiUrl={apiUrl}
        onMeasurementSubmitted={handleManualMeasurementSubmitted}
      />

      {/* Zoomable Image Modal */}
      <ZoomableImageModal
        imageUrl={fullImageUrl}
        visible={zoomModalVisible}
        onClose={() => setZoomModalVisible(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
    padding: 10,
  },
  headerRight: {
    paddingRight: 16,
    alignItems: 'flex-end',
  },
  headerDateTime: {
    fontSize: 11,
    color: '#666',
    lineHeight: 14,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#16a34a',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  manualButton: {
    flex: 1,
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  manualButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  comparisonNote: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  infoText: {
    fontSize: 15,
    color: '#374151',
    marginBottom: 4,
  },
  infoLabel: {
    fontWeight: '600',
    color: '#1f2937',
  },
  vigourGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  vigourCard: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    flex: 1,
    marginHorizontal: 4,
  },
  sviCard: {
    backgroundColor: '#fffbeb',
  },
  vigourLabel: {
    fontSize: 12,
    color: '#4b5563',
    fontWeight: '600',
  },
  sviLabel: {
    color: '#d97706',
  },
  vigourValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16a34a',
    marginTop: 4,
  },
  sviValue: {
    color: '#f59e0b',
  },
  annotationImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    position: 'relative',
  },
  zoomText: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600',
  },
  zoomOverlay: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomImage: {
    width: '100%',
    height: '90%',
  },
  zoomCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  zoomCloseText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  zoomIndicatorOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  zoomIndicatorIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  zoomIndicatorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

// Styles copied from App.tsx for the table
const tableStyles = StyleSheet.create({
  tableContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#dcfce7',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableHeaderRow: {
    backgroundColor: '#16a34a',
    borderBottomWidth: 2,
    borderBottomColor: '#15803d',
  },
  tableRowAlt: {
    backgroundColor: '#f9fafb',
  },
  tableCell: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
    paddingVertical: 14,
  },
  tableCellBold: {
    fontWeight: '700',
    color: '#1f2937',
  },
  tableCellRoot: {
    color: '#16a34a',
    fontWeight: '600',
  },
  tableCellShoot: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  tableCellTotal: {
    color: '#8b5cf6',
    fontWeight: '700',
  },
  tableHeader: {
    color: '#ffffff',
    fontWeight: '800',
    paddingVertical: 12,
  },
  tableHeaderRowManual: {
    backgroundColor: '#7c3aed',
    borderBottomWidth: 2,
    borderBottomColor: '#6d28d9',
  },
  tableHeaderManual: {
    color: '#ffffff',
    fontWeight: '800',
    paddingVertical: 12,
  },
  tableCellRootManual: {
    color: '#7c3aed',
    fontWeight: '600',
  },
  tableCellShootManual: {
    color: '#0891b2',
    fontWeight: '600',
  },
  tableCellTotalManual: {
    color: '#d946ef',
    fontWeight: '700',
  },
  aiRow: {
    backgroundColor: '#f0fdf4',
  },
  manualRow: {
    backgroundColor: '#f3e8ff',
  },
  manualDividerRow: {
    backgroundColor: '#7c3aed',
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualDividerText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.5,
  },
});

export default AnalysisDetailScreen;
