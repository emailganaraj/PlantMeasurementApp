/**
 * Analysis Detail Screen
 * Shows detailed view of a selected analysis with comprehensive annotation and plant results
 */

import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Modal,
  useWindowDimensions,
  PanResponder,
  Animated,
} from 'react-native';

interface PlantDetail {
  plant_id: number;
  biggest_root_length_cm: number;
  biggest_shoot_length_cm: number;
  biggest_total_length_cm: number;
  collective_root_length_cm?: number;
  collective_shoot_length_cm?: number;
  collective_total_length_cm?: number;
}

interface AnalysisResult {
  id: string;
  timestamp: string;
  image_id: string;
  total_seedlings_detected: number;
  per_plant?: PlantDetail[];
  analysis_name?: string;
  total_seeds_kept?: number;
  total_seeds_germinated?: number;
  germination_percentage?: number;
  statistics: {
    avg_biggest_root_length_cm?: number;
    avg_biggest_shoot_length_cm?: number;
    [key: string]: any;
  };
  comprehensive_annotation?: string;
  debug_images?: {
    comprehensive_annotation?: string;
    [key: string]: any;
  };
}

interface DetailScreenProps {
  analysis: AnalysisResult;
  onClose: () => void;
}

export const AnalysisDetailScreen: React.FC<DetailScreenProps> = ({
  analysis,
  onClose,
}) => {
  const { width } = useWindowDimensions();
  const [zoomVisible, setZoomVisible] = useState(false);
  const [zoomScale] = useState(new Animated.Value(1));

  const plants = analysis.per_plant || [];
  const annotationImageUrl =
    analysis.comprehensive_annotation || analysis.debug_images?.comprehensive_annotation || '';

  const calculateSVI = (): number => {
    if (!analysis.statistics) return 0;
    const avgRoot = analysis.statistics.avg_biggest_root_length_cm || 0;
    const avgShoot = analysis.statistics.avg_biggest_shoot_length_cm || 0;
    const germinationPct = analysis.germination_percentage || 0;
    const avgLength = avgRoot + avgShoot;
    return parseFloat((avgLength * germinationPct).toFixed(2));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e293b" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📈 Analysis Details</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Analysis Meta Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📋 Analysis Info</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{analysis.analysis_name || '—'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>
              {new Date(analysis.timestamp).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Time:</Text>
            <Text style={styles.value}>
              {new Date(analysis.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>

        {/* Germination & SVI Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🌱 Germination & Vigour</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Seeds Kept</Text>
              <Text style={styles.statBigValue}>{analysis.total_seeds_kept || 0}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Germinated</Text>
              <Text style={styles.statBigValue}>{analysis.total_seeds_germinated || 0}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Germination %</Text>
              <Text style={styles.statBigValue}>
                {analysis.germination_percentage?.toFixed(1) || 0}%
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>SVI</Text>
              <Text style={styles.sviValue}>{calculateSVI()}</Text>
            </View>
          </View>
        </View>

        {/* Comprehensive Annotation Image with Zoom */}
        {annotationImageUrl && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🖼️ Comprehensive Annotation</Text>
            <TouchableOpacity
              style={styles.imageContainer}
              onPress={() => setZoomVisible(true)}
            >
              <Image
                source={{ uri: annotationImageUrl }}
                style={styles.annotationImage}
                resizeMode="contain"
              />
              <View style={styles.zoomIndicator}>
                <Text style={styles.zoomText}>🔍 Tap to zoom</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Average Statistics */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 Average Measurements</Text>
          <View style={styles.statLine}>
            <Text style={styles.label}>Avg Root Length:</Text>
            <Text style={styles.value}>
              {(analysis.statistics.avg_biggest_root_length_cm || 0).toFixed(2)} cm
            </Text>
          </View>
          <View style={styles.statLine}>
            <Text style={styles.label}>Avg Shoot Length:</Text>
            <Text style={styles.value}>
              {(analysis.statistics.avg_biggest_shoot_length_cm || 0).toFixed(2)} cm
            </Text>
          </View>
          <View style={styles.statLine}>
            <Text style={styles.label}>Total Plants:</Text>
            <Text style={styles.value}>{analysis.total_seedlings_detected}</Text>
          </View>
        </View>

        {/* Per-Plant Details */}
        {plants.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🌿 Plant-wise Measurements</Text>
            {plants.map((plant) => (
              <View key={plant.plant_id} style={styles.plantCard}>
                <View style={styles.plantHeader}>
                  <Text style={styles.plantTitle}>Plant #{plant.plant_id}</Text>
                </View>
                <View style={styles.plantStats}>
                  <View style={styles.plantStatRow}>
                    <Text style={styles.plantLabel}>🌱 Root:</Text>
                    <Text style={styles.plantValue}>
                      {plant.biggest_root_length_cm?.toFixed(2) || 0} cm
                    </Text>
                  </View>
                  <View style={styles.plantStatRow}>
                    <Text style={styles.plantLabel}>🌿 Shoot:</Text>
                    <Text style={styles.plantValue}>
                      {plant.biggest_shoot_length_cm?.toFixed(2) || 0} cm
                    </Text>
                  </View>
                  <View style={styles.plantStatRow}>
                    <Text style={styles.plantLabel}>📏 Total:</Text>
                    <Text style={styles.plantValueTotal}>
                      {plant.biggest_total_length_cm?.toFixed(2) || 0} cm
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Footer spacer */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Zoom Modal */}
      <Modal visible={zoomVisible} transparent animationType="fade">
        <SafeAreaView style={styles.zoomModal}>
          <View style={styles.zoomHeader}>
            <TouchableOpacity
              onPress={() => setZoomVisible(false)}
              style={styles.zoomCloseButton}
            >
              <Text style={styles.closeButtonText}>✕ Close</Text>
            </TouchableOpacity>
            <Text style={styles.zoomTitle}>Full Annotation</Text>
            <View style={{ width: 80 }} />
          </View>
          <ScrollView
            style={styles.zoomContainer}
            scrollEnabled
            showsVerticalScrollIndicator
          >
            {annotationImageUrl && (
              <Image
                source={{ uri: annotationImageUrl }}
                style={styles.zoomImage}
                resizeMode="contain"
              />
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  header: {
    backgroundColor: '#1e293b',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  closeButton: {
    color: '#16a34a',
    fontSize: 16,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#16a34a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#16a34a',
    marginBottom: 14,
    letterSpacing: 0.2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0fdf4',
  },
  label: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  value: {
    fontSize: 13,
    color: '#1f2937',
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statBox: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 6,
  },
  statBigValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#16a34a',
  },
  sviValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#f59e0b',
  },
  imageContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f9fafb',
    position: 'relative',
  },
  annotationImage: {
    width: '100%',
    height: 240,
    backgroundColor: '#f3f4f6',
  },
  zoomIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  zoomText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  statLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0fdf4',
  },
  plantCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#8b5cf6',
  },
  plantHeader: {
    marginBottom: 10,
  },
  plantTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#8b5cf6',
  },
  plantStats: {
    gap: 8,
  },
  plantStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  plantLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  plantValue: {
    fontSize: 12,
    color: '#1f2937',
    fontWeight: '700',
  },
  plantValueTotal: {
    fontSize: 13,
    color: '#8b5cf6',
    fontWeight: '800',
  },
  // Zoom Modal Styles
  zoomModal: {
    flex: 1,
    backgroundColor: '#000',
  },
  zoomHeader: {
    backgroundColor: '#1f2937',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  zoomCloseButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#dc2626',
    borderRadius: 6,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  zoomTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  zoomContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  zoomImage: {
    width: '100%',
    height: undefined,
    aspectRatio: 1,
  },
});

export default AnalysisDetailScreen;
