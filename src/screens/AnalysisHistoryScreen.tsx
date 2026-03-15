/**
 * Analysis History Screen
 * Displays list of previously analyzed plants (from user's debug folder)
 */

import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AnalysisResult {
  id: string;
  timestamp: string;
  image_id: string;
  total_seedlings_detected: number;
  statistics: {
    combined_biggest_root_length_cm?: number;
    combined_biggest_shoot_length_cm?: number;
    combined_biggest_plant_length_cm?: number;
    avg_biggest_root_length_cm?: number;
    avg_biggest_shoot_length_cm?: number;
  };
  comprehensive_annotation?: string;
  analysis_name?: string;
  total_seeds_kept?: number;
  total_seeds_germinated?: number;
  germination_percentage?: number;
  per_plant?: any[];
}

interface HistoryScreenProps {
  apiUrl: string;
  onSelectAnalysis: (result: AnalysisResult) => void;
}

export const AnalysisHistoryScreen: React.FC<HistoryScreenProps> = ({
  apiUrl,
  onSelectAnalysis,
}) => {
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUserId();
  }, []);

  // Load history whenever userId changes
  useEffect(() => {
    if (userId) {
      loadAnalysisHistory();
    }
  }, [userId]);

  const loadUserId = async () => {
    try {
      const id = await AsyncStorage.getItem('user_id');
      if (id) {
        setUserId(id);
        loadAnalysisHistory(id);
      }
    } catch (error) {
      console.error('Error loading user ID:', error);
    }
  };

  const loadAnalysisHistory = async (id?: string) => {
    const uid = id || userId;
    if (!uid) return;

    setLoading(true);
    try {
      // Call backend endpoint to get list of analyses for this user
      const response = await fetch(`${apiUrl}/user-analyses/${uid}`, {
        method: 'GET',
      });

      if (response.ok) {
        const data = await response.json();
        // Backend returns { user_id, analyses, total }
        // No need to sort again - backend already sorts newest first
        const analysisResults = (data.analyses || []).map((item: any) => ({
          id: item.id,
          timestamp: item.timestamp,
          image_id: item.image_id,
          total_seedlings_detected: item.total_seedlings_detected,
          statistics: item.statistics || {},
          comprehensive_annotation: item.comprehensive_annotation,
          analysis_name: item.analysis_name || '',
          total_seeds_kept: item.total_seeds_kept || 0,
          total_seeds_germinated: item.total_seeds_germinated || 0,
          germination_percentage: item.germination_percentage || 0,
          per_plant: item.per_plant || [],
        }));
        setAnalyses(analysisResults);
      } else {
        console.warn('Failed to load analysis history:', response.status);
        setAnalyses([]);
      }
    } catch (error) {
      console.error('Error loading analysis history:', error);
      setAnalyses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAnalysisHistory();
  };

  const calculateSVI = (analysis: AnalysisResult): number => {
    if (!analysis.statistics) return 0;
    const avgRoot = analysis.statistics.avg_biggest_root_length_cm || 0;
    const avgShoot = analysis.statistics.avg_biggest_shoot_length_cm || 0;
    const germinationPct = analysis.germination_percentage || 0;
    const avgLength = avgRoot + avgShoot;
    return parseFloat((avgLength * germinationPct).toFixed(2));
  };

  const getRunNumber = (index: number): number => {
    // Since backend returns newest first, reverse the index
    return analyses.length - index;
  };

  const renderAnalysisItem = ({ item, index }: { item: AnalysisResult; index: number }) => (
    <TouchableOpacity
      style={styles.analysisCard}
      onPress={() => onSelectAnalysis(item)}
    >
      {item.comprehensive_annotation && (
        <Image
          source={{ uri: item.comprehensive_annotation }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
      )}
      <View style={styles.cardContent}>
        <View style={styles.titleRow}>
          <Text style={styles.cardTitle}>
            {item.analysis_name || 'Analysis'}
          </Text>
          <Text style={styles.runNumber}>#{getRunNumber(index)}</Text>
        </View>
        
        <View style={styles.metadataRow}>
          <Text style={styles.dateText}>
            {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Germination</Text>
            <Text style={styles.statValue}>{item.germination_percentage?.toFixed(1)}%</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Avg Length</Text>
            <Text style={styles.statValue}>
              {((item.statistics.avg_biggest_root_length_cm || 0) + (item.statistics.avg_biggest_shoot_length_cm || 0)).toFixed(2)} cm
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>SVI</Text>
            <Text style={styles.statValue}>{calculateSVI(item)}</Text>
          </View>
        </View>

        <Text style={styles.tapText}>Tap for details →</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e293b" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 Analysis History</Text>
        <Text style={styles.headerSubtitle}>View your past measurements</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.loadingText}>Loading analyses...</Text>
        </View>
      ) : analyses.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>No analyses yet</Text>
          <Text style={styles.emptySubtext}>
            Analyze your first plant to see results here
          </Text>
        </View>
      ) : (
        <FlatList
          data={analyses}
          keyExtractor={(item) => item.id}
          renderItem={renderAnalysisItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
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
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  analysisCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    flexDirection: 'row',
  },
  thumbnail: {
    width: 100,
    height: 100,
    backgroundColor: '#f0fdf4',
  },
  cardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#16a34a',
    flex: 1,
  },
  runNumber: {
    fontSize: 12,
    fontWeight: '800',
    color: '#666',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  metadataRow: {
    marginBottom: 6,
  },
  dateText: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 8,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
  },
  statLabel: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#16a34a',
    marginTop: 2,
  },
  tapText: {
    fontSize: 11,
    color: '#16a34a',
    fontWeight: '600',
    fontStyle: 'italic',
  },
});

export default AnalysisHistoryScreen;
