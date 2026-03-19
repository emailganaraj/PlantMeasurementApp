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
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme';
import ZoomableImageModal from './ZoomableImageModal';
import ManualMeasurementModal from '../components/ManualMeasurementModal';

const AnalysisDetailScreen = ({ route, navigation }: { route: any; navigation: any }) => {
  const { analysis, apiUrl } = route.params;
  const [zoomModalVisible, setZoomModalVisible] = React.useState(false);
  const [manualModalVisible, setManualModalVisible] = React.useState(false);
  const [manualMeasurements, setManualMeasurements] = React.useState<any>(null);

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
      const userId = analysis?.user_id || 'user';
      const analysisIdLocal = analysis?.id || '';
      console.log('Loading manual measurements for:', { analysisIdLocal, userId });
      const response = await fetch(`${apiUrl}/manual-measurements/${analysisIdLocal}?user_id=${userId}`);
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
            {plants.map((plant) => (
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
    backgroundColor: Colors.primaryBg,
    padding: Spacing[5],
  },
  headerRight: {
    paddingRight: Spacing[8],
    alignItems: 'flex-end',
  },
  headerDateTime: {
    fontSize: Typography.sizes.xs,
    color: Colors.gray500,
    lineHeight: 14,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing[8],
    marginBottom: Spacing[3],
    ...Shadows.xs,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
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
  deleteButtonText: {
    color: Colors.white,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  comparisonNote: {
    fontSize: Typography.sizes.xs,
    color: Colors.gray500,
    marginBottom: Spacing[2],
    fontStyle: 'italic',
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
  sviCard: {
    backgroundColor: Colors.accentBg,
  },
  vigourLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.gray600,
    fontWeight: Typography.weights.semibold,
  },
  sviLabel: {
    color: Colors.warning,
  },
  vigourValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
    marginTop: Spacing[1],
  },
  sviValue: {
    color: Colors.warning,
  },
  annotationImage: {
    width: '100%',
    height: 250,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray100,
    position: 'relative',
  },
  zoomText: {
    textAlign: 'center',
    marginTop: Spacing[2],
    fontSize: Typography.sizes.xs,
    color: Colors.info,
    fontWeight: Typography.weights.semibold,
  },
  zoomOverlay: {
    flex: 1,
    backgroundColor: Colors.black,
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
    borderRadius: BorderRadius.lg,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  zoomCloseText: {
    color: Colors.black,
    fontSize: 16,
    fontWeight: Typography.weights.bold,
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
});

// Styles copied from App.tsx for the table
const tableStyles = StyleSheet.create({
  tableContainer: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.gray100,
    marginBottom: Spacing[8],
    borderWidth: 2,
    borderColor: Colors.primaryLight,
    ...Shadows.sm,
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing[5],
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  tableHeaderRow: {
    backgroundColor: Colors.primary,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primaryDark,
  },
  tableRowAlt: {
    backgroundColor: Colors.gray50,
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
  tableCellRoot: {
    color: Colors.primary,
    fontWeight: Typography.weights.semibold,
  },
  tableCellShoot: {
    color: Colors.info,
    fontWeight: Typography.weights.semibold,
  },
  tableCellTotal: {
    color: Colors.purple,
    fontWeight: Typography.weights.bold,
  },
  tableHeader: {
    color: Colors.white,
    fontWeight: Typography.weights.extrabold,
    paddingVertical: Spacing[3],
  },
  tableHeaderRowManual: {
    backgroundColor: Colors.purple,
    borderBottomWidth: 2,
    borderBottomColor: Colors.purpleDark,
  },
  tableHeaderManual: {
    color: Colors.white,
    fontWeight: Typography.weights.extrabold,
    paddingVertical: Spacing[3],
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
  aiRow: {
    backgroundColor: Colors.primaryBg,
  },
  manualRow: {
    backgroundColor: Colors.purpleLight,
  },
  manualDividerRow: {
    backgroundColor: Colors.purple,
    paddingVertical: Spacing[2],
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualDividerText: {
    color: Colors.white,
    fontWeight: Typography.weights.bold,
    fontSize: Typography.sizes.xs,
    letterSpacing: 0.5,
  },
});

export default AnalysisDetailScreen;
