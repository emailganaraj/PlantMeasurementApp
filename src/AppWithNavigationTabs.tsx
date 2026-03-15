/**
 * App with Bottom Tab Navigation
 * Integrates "New Analysis" (AppContent) and "History" (Dashboard) tabs
 */

import React, { useState, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  Modal,
  useWindowDimensions,
  PanResponder,
  Animated,
  TextInput,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { AnalysisHistoryScreen } from './screens/AnalysisHistoryScreen';
import { AnalysisDetailScreen } from './screens/AnalysisDetailScreen';
import AppContent from './AppContent';

interface PlantAnalysis {
  plants?: Array<{
    id: number;
    root_length_cm: number;
    shoot_length_cm: number;
    total_length_cm: number;
  }>;
  image_id?: string;
  timestamp?: string;
  comprehensive_annotation?: string;
  per_plant?: any[];
  statistics?: any;
  [key: string]: any;
}

interface BackgroundRemovalState {
  isRemoving: boolean;
  showColorPalette: boolean;
  backgroundColor: string;
  processedImageData: string | null;
}

interface AppWithNavigationTabsProps {
  userId: string;
  apiUrl: string;
}

type TabName = 'analysis' | 'history';

export const AppWithNavigationTabs: React.FC<AppWithNavigationTabsProps> = ({
  userId,
  apiUrl,
}) => {
  const [activeTab, setActiveTab] = useState<TabName>('analysis');
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);
  const [showDetailView, setShowDetailView] = useState(false);

  // === PERSISTED STATE (shared across tab switches) ===
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<PlantAnalysis | null>(null);
  const [zoomModalVisible, setZoomModalVisible] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);
  const [bgRemovalState, setBgRemovalState] = useState<BackgroundRemovalState>({
    isRemoving: false,
    showColorPalette: false,
    backgroundColor: '#ffffff',
    processedImageData: null,
  });
  const [bgRemovalOriginalImage, setBgRemovalOriginalImage] = useState<string | null>(null);

  const handleSelectAnalysis = (analysis: any) => {
    setSelectedAnalysis(analysis);
    setShowDetailView(true);
  };

  const handleCloseDetail = () => {
    setShowDetailView(false);
    setSelectedAnalysis(null);
  };

  return (
    <View style={styles.container}>
      {/* Tab Content */}
      <View style={styles.tabContent}>
        {activeTab === 'analysis' && !showDetailView && (
          <AppContent 
            userId={userId}
            selectedImage={selectedImage}
            setSelectedImage={setSelectedImage}
            loading={loading}
            setLoading={setLoading}
            analysisResult={analysisResult}
            setAnalysisResult={setAnalysisResult}
            zoomModalVisible={zoomModalVisible}
            setZoomModalVisible={setZoomModalVisible}
            zoomScale={zoomScale}
            setZoomScale={setZoomScale}
            imageRotation={imageRotation}
            setImageRotation={setImageRotation}
            bgRemovalState={bgRemovalState}
            setBgRemovalState={setBgRemovalState}
            bgRemovalOriginalImage={bgRemovalOriginalImage}
            setBgRemovalOriginalImage={setBgRemovalOriginalImage}
          />
        )}

        {activeTab === 'history' && !showDetailView && (
          <AnalysisHistoryScreen
            apiUrl={apiUrl}
            onSelectAnalysis={handleSelectAnalysis}
          />
        )}

        {showDetailView && selectedAnalysis && (
          <AnalysisDetailScreen
            analysis={selectedAnalysis}
            onClose={handleCloseDetail}
          />
        )}
      </View>

      {/* Bottom Tab Navigation */}
      {!showDetailView && (
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'analysis' && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab('analysis')}
          >
            <Text style={styles.tabIcon}>➕</Text>
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'analysis' && styles.tabLabelActive,
              ]}
            >
              New Analysis
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'history' && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={styles.tabIcon}>📊</Text>
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'history' && styles.tabLabelActive,
              ]}
            >
              History
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  tabContent: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 3,
    borderTopColor: 'transparent',
  },
  tabButtonActive: {
    borderTopColor: '#16a34a',
    backgroundColor: '#f0fdf4',
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#666',
  },
  tabLabelActive: {
    color: '#16a34a',
  },
});

export default AppWithNavigationTabs;
