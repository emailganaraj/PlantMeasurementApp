/**
 * Plant Measurement App - AppContent Component
 * V26: Core analysis functionality for image capture, processing, and measurements
 * Extracted from AppWithLogin.tsx
 * Last Updated: March 15, 2026
 */

import React, { useState, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import ImageCropperModal from './components/ImageCropperModal';
import { AnalysisMetadataModal } from './components/AnalysisMetadataModal';
import ZoomableImageModal from './ZoomableImageModal';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from './theme';

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

interface AppContentProps {
  userId: string;
  apiUrl: string;
}

interface AnalysisMetadata {
  name: string;
  totalSeedsKept: number;
  totalSeedsGerminated: number;
  germinationPercentage: number;
}

function AppContent({ userId, apiUrl }: AppContentProps): React.JSX.Element {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<PlantAnalysis | null>(
    null,
  );
  const [zoomModalVisible, setZoomModalVisible] = useState(false);
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [showTips, setShowTips] = useState(true);
  const [imageRotation, setImageRotation] = useState(0);
  const [bgRemovalState, setBgRemovalState] = useState<BackgroundRemovalState>({
    isRemoving: false,
    showColorPalette: false,
    backgroundColor: '#ffffff',
    processedImageData: null,
  });
  const [bgRemovalOriginalImage, setBgRemovalOriginalImage] = useState<
    string | null
  >(null);

  const { height, width } = useWindowDimensions();
  const zoomScrollRef = useRef<ScrollView>(null);
  const [showMetadataModal, setShowMetadataModal] = useState(false);
  const [analysisMetadata, setAnalysisMetadata] =
    useState<AnalysisMetadata | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImagePath, setCropImagePath] = useState<string | null>(null);

  // Use apiUrl from props
  const API_URL = apiUrl;

  // Color palette for background selection
  const colorPalette = [
    { name: 'White', hex: '#ffffff' },
    { name: 'Black', hex: '#000000' },
    { name: 'Light Gray', hex: '#e5e5e5' },
    { name: 'Dark Gray', hex: '#333333' },
    { name: 'Light Blue', hex: '#cce5ff' },
    { name: 'Light Green', hex: '#ccffcc' },
    { name: 'Light Yellow', hex: '#ffffcc' },
    { name: 'Light Brown', hex: '#e6d7c3' },
    { name: 'Beige', hex: '#f5f5dc' },
    { name: 'Cream', hex: '#fffdd0' },
  ];

  const resetImageState = () => {
    setBgRemovalState({
      isRemoving: false,
      showColorPalette: false,
      backgroundColor: '#ffffff',
      processedImageData: null,
    });
    setBgRemovalOriginalImage(null);
    setAnalysisResult(null);
  };

  const handleImageSelected = (imagePath: string) => {
    resetImageState();
    setSelectedImage(imagePath);
    
    // Auto-scroll to background removal section after image selection (skip How to Use section)
    setTimeout(() => {
      zoomScrollRef.current?.scrollTo({ y: 1200, animated: true });
    }, 500);
  };

  const captureImage = () => {
    launchCamera(
      {
        mediaType: 'photo',
        cameraType: 'back',
        quality: 1,
      },
      response => {
        if (response.didCancel) {
          console.log('Camera cancelled');
        } else if (response.errorMessage) {
          Alert.alert('Error', response.errorMessage);
        } else if (response.assets && response.assets[0]) {
          const imagePath = response.assets[0].uri || '';
          setCropImagePath(imagePath);
          setShowCropModal(true);
        }
      },
    );
  };

  const uploadImage = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 1,
      },
      response => {
        if (response.didCancel) {
          console.log('Image picker cancelled');
        } else if (response.errorMessage) {
          Alert.alert('Error', response.errorMessage);
        } else if (response.assets && response.assets[0]) {
          const imagePath = response.assets[0].uri || '';
          setCropImagePath(imagePath);
          setShowCropModal(true);
        }
      },
    );
  };

  const handleCropComplete = (croppedPath: string) => {
    setShowCropModal(false);
    handleImageSelected(croppedPath);
    
    // Auto-scroll to background removal section after cropping completes
    setTimeout(() => {
      zoomScrollRef.current?.scrollTo({ y: 800, animated: true });
    }, 500);
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setCropImagePath(null);
  };

  const reprocessWithColor = async (newColor: string) => {
    // Apply color immediately in UI (no backend call)
    setBgRemovalState(prev => ({
      ...prev,
      backgroundColor: newColor,
    }));

    // Store the color for later analysis when backend processes
    console.log(`Color selected: ${newColor} (applied instantly in UI)`);
  };

  const removeBackground = async () => {
    if (!selectedImage && !bgRemovalState.processedImageData) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }

    setBgRemovalState(prev => ({ ...prev, isRemoving: true }));
    try {
      console.log('Starting background removal...');
      const formData = new FormData();
      formData.append('file', {
        uri: selectedImage,
        type: 'image/jpeg',
        name: 'plant_image.jpg',
      } as any);

      // Send rotation and background color
      if (imageRotation !== 0) {
        formData.append('rotation', imageRotation.toString());
      }

      // Keep # prefix for valid hex format
      formData.append('background_color', bgRemovalState.backgroundColor);

      // Add user_id to request
      formData.append('user_id', userId);

      console.log(`Fetching ${API_URL}/remove-background`);
      const response = await fetch(`${API_URL}/remove-background`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Remove background response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`,
        );
      }

      const result = await response.json();
      console.log(
        'Remove background result received, image_data length:',
        result.image_data?.length,
      );

      // Store original image for re-processing with different colors
      setBgRemovalOriginalImage(selectedImage);

      setBgRemovalState(prev => ({
        ...prev,
        processedImageData: result.image_data,
        showColorPalette: true, // Show color palette automatically
        backgroundColor: '#ffffff',
      }));

      // Auto-scroll to background preview after background removal completes
      setTimeout(() => {
        zoomScrollRef.current?.scrollTo({ y: 800, animated: true });
      }, 500);

      Alert.alert(
        'Success',
        'Background removed! Select a color or click Analyze.',
      );
    } catch (error: any) {
      const errorMessage = error?.message || String(error) || 'Unknown error';
      console.error('Background removal error:', errorMessage);
      console.error('Full error:', error);
      Alert.alert('Error', `Failed to remove background: ${errorMessage}`);
    } finally {
      setBgRemovalState(prev => ({ ...prev, isRemoving: false }));
    }
  };

  const handleAnalyzeButtonPress = () => {
    if (!selectedImage && !bgRemovalState.processedImageData) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }
    // Show metadata modal first
    setShowMetadataModal(true);
  };

  const handleMetadataSubmit = async (metadata: AnalysisMetadata) => {
    setShowMetadataModal(false);
    setAnalysisMetadata(metadata);
    // Now perform the analysis with metadata
    await analyzeImage(metadata);
  };

  const analyzeImage = async (metadata: AnalysisMetadata) => {
    if (!selectedImage && !bgRemovalState.processedImageData) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();

      // Always send original image (React Native doesn't support Blob API)
      formData.append('file', {
        uri: selectedImage,
        type: 'image/jpeg',
        name: 'plant_image.jpg',
      } as any);

      // If background was removed, send color + rotation for processing
      if (bgRemovalState.processedImageData) {
        // Send selected background color (keep # prefix for valid hex format)
        formData.append('background_color', bgRemovalState.backgroundColor);

        // Also send rotation angle (in case user rotated before background removal)
        if (imageRotation !== 0) {
          formData.append('rotation', imageRotation.toString());
        }

        console.log(
          `Analyzing: ORIGINAL + ROTATION(${imageRotation}°) + COLOR (${bgRemovalState.backgroundColor} background)`,
        );
      } else {
        console.log('Analyzing: ORIGINAL image only (background NOT removed)');

        // Send rotation angle only for original images
        if (imageRotation !== 0) {
          formData.append('rotation', imageRotation.toString());
        }
      }

      // Add source and client metadata
      formData.append('source', 'mobile');
      formData.append('client', 'react-native');

      // Enable debug image generation
      formData.append('save_debug', 'true');

      // Add user_id to request
      formData.append('user_id', userId);

      // Add analysis metadata
      formData.append('analysis_name', metadata.name);
      formData.append('total_seeds_kept', metadata.totalSeedsKept.toString());
      formData.append(
        'total_seeds_germinated',
        metadata.totalSeedsGerminated.toString(),
      );
      formData.append(
        'germination_percentage',
        metadata.germinationPercentage.toString(),
      );

      const response = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`,
        );
      }

      const result = await response.json();

      // Extract plants from per_plant array (use biggest paths, fallback to collective/old format)
      const plantsArray = (result.per_plant || []).map((plant: any) => ({
        id: plant.plant_id,
        root_length_cm:
          plant.biggest_root_length_cm ?? plant.root_length_cm ?? 0,
        shoot_length_cm:
          plant.biggest_shoot_length_cm ?? plant.shoot_length_cm ?? 0,
        total_length_cm:
          plant.biggest_total_length_cm ?? plant.total_length_cm ?? 0,
        // Also store collective for comparison
        collective_root_length_cm: plant.collective_root_length_cm,
        collective_shoot_length_cm: plant.collective_shoot_length_cm,
      }));

      const processedResult = {
        ...result,
        plants: plantsArray,
        comprehensive_annotation: result.debug_images?.comprehensive_annotation,
        background_removed: bgRemovalState.processedImageData ? true : false,
        // Add metadata
        analysis_name: metadata.name,
        total_seeds_kept: metadata.totalSeedsKept,
        total_seeds_germinated: metadata.totalSeedsGerminated,
        germination_percentage: metadata.germinationPercentage,
      };

      setAnalysisResult(processedResult);
      Alert.alert('Success', 'Image analysis completed!');
    } catch (error: any) {
      const errorMessage = error?.message || String(error) || 'Unknown error';
      console.log('Analysis error:', errorMessage);
      Alert.alert('Error', `Failed to analyze image: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      console.log(`Testing connection to ${API_URL}/health`);
      const response = await fetch(`${API_URL}/health`, {
        method: 'GET',
        timeout: 10000, // 10 second timeout
      });
      console.log('Health response:', response.status, response.ok);

      if (response.ok) {
        const data = await response.json();
        Alert.alert(
          '✅ Connected!',
          `Backend is reachable!\n\nService: ${data.service}\nVersion: ${data.version}`,
        );
      } else {
        Alert.alert('⚠️ Response Error', `Status: ${response.status}`);
      }
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      console.log('Connection test error:', errorMsg);
      console.log('API_URL being tested:', API_URL);
      Alert.alert(
        '❌ Connection Failed',
        `Cannot reach ${API_URL}\n\nError: ${errorMsg}\n\nMake sure:\n1. Backend is running\n2. IP address is correct\n3. Both devices on same network`,
      );
    }
  };

  const clearResults = () => {
    Alert.alert('Clear Analysis', 'Remove all results and images?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Clear',
        onPress: () => {
          setSelectedImage(null);
          setAnalysisResult(null);
          setZoomModalVisible(false);
          setZoomScale(1);
          setImageRotation(0);
          // Reset background removal state
          setBgRemovalState({
            isRemoving: false,
            showColorPalette: false,
            backgroundColor: '#ffffff',
            processedImageData: null,
          });
          setBgRemovalOriginalImage(null);
        },
        style: 'destructive',
      },
    ]);
  };

  const calculateSVI = () => {
    if (!analysisResult?.statistics || !analysisResult?.plants) return null;

    // Use germination percentage from metadata if available, otherwise use old calculation
    const germinationPercentage = analysisResult.germination_percentage || 0;

    // V8: Use biggest path lengths (main vertical path only, ignoring lateral branches)
    const avgBiggestRoot =
      analysisResult.statistics.avg_biggest_root_length_cm ||
      analysisResult.statistics.average_root_length_cm ||
      0;
    const avgBiggestShoot =
      analysisResult.statistics.avg_biggest_shoot_length_cm ||
      analysisResult.statistics.average_shoot_length_cm ||
      0;
    const avgLength = avgBiggestRoot + avgBiggestShoot;

    // SVI = (avg_biggest_root_length_cm + avg_biggest_shoot_length_cm) × germination_percentage
    const svi = avgLength * germinationPercentage;

    return {
      totalSeedsKept: analysisResult.total_seeds_kept || 0,
      totalSeedsGerminated: analysisResult.total_seeds_germinated || 0,
      germinationPercentage: germinationPercentage.toFixed(2),
      avgLength: avgLength.toFixed(2),
      svi: svi.toFixed(2),
      avgBiggestRoot: avgBiggestRoot.toFixed(2),
      avgBiggestShoot: avgBiggestShoot.toFixed(2),
    };
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.scrollView}
        showsVerticalScrollIndicator={true}
        ref={zoomScrollRef}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🌱 Plant Measurement Pro</Text>
          <Text style={styles.subtitle}>AI-Powered Seedling Analysis</Text>
          <TouchableOpacity style={styles.testButton} onPress={testConnection}>
            <Text style={styles.testButtonText}>🔌 Test Connection</Text>
          </TouchableOpacity>
        </View>

        {/* Image Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📷 Select Image</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              onPress={captureImage}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>📷 Capture</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={uploadImage}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>📁 Upload</Text>
            </TouchableOpacity>
          </View>

          {/* How to Use Tips */}
          {showTips && (
            <View style={styles.tipsBox}>
              <View style={styles.tipsHeader}>
                <Text style={styles.tipsTitle}>📋 How to Use</Text>
                <TouchableOpacity
                  style={styles.hideTipsButton}
                  onPress={() => setShowTips(false)}
                >
                  <Text style={styles.hideTipsText}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.tipText}>1. Place up to 10 seedlings — closely packed but not touching each other</Text>
              <Text style={styles.tipText}>2. Use a plain, non-shiny, non-textured black cloth as background (no folds)</Text>
              <Text style={styles.tipText}>3. Place a ₹2 coin (2.4 cm) near the roots / between middle plants for calibration</Text>
              <Text style={styles.tipText}>4. ☀️ Use natural sunlight - avoid flash light/bulb for better image quality</Text>
              <Text style={styles.tipText}>5. Capture image → Crop just outside the seedling boundary (don't cut the plant)</Text>
              <Text style={styles.tipText}>6. Remove background → Reapply black background colour</Text>
              <Text style={styles.tipText}>7. Fill metadata (name, seeds kept, germinated) → Analyse</Text>
              <Text style={styles.tipText}>8. After analysis, go to History → Add manual measurements for comparison - this is for developmental help to improve accuracy in future versions</Text>
            </View>
          )}

          {!showTips && (
            <TouchableOpacity
              style={styles.showTipsButton}
              onPress={() => setShowTips(true)}
            >
              <Text style={styles.showTipsText}>📋 View Instructions</Text>
            </TouchableOpacity>
          )}

          {selectedImage && (
            <>
              {/* Image Container with Side Rotation Controls */}
              <View style={styles.imageWrapperContainer}>
                {/* Left Rotation Button */}
                <TouchableOpacity
                  style={styles.rotateButtonLeft}
                  onPress={() =>
                    setImageRotation((imageRotation - 90 + 360) % 360)
                  }
                >
                  <Text style={styles.rotateButtonIconText}>⟲</Text>
                </TouchableOpacity>

                {/* Main Image Container */}
                <View style={styles.imageContainer}>
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => {
                      setZoomImageUrl(selectedImage);
                      setZoomModalVisible(true);
                    }}
                    style={styles.imageTouchable}
                  >
                    <Image
                      source={{ uri: selectedImage }}
                      style={[
                        styles.image,
                        { transform: [{ rotate: `${imageRotation}deg` }] },
                      ]}
                    />
                    {/* Zoom Indicator Overlay */}
                    <View style={styles.zoomIndicatorOverlay}>
                      <Text style={styles.zoomIndicatorIcon}>🔍</Text>
                      <Text style={styles.zoomIndicatorText}>Tap to zoom</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Remove Button - Top Right Corner */}
                  <TouchableOpacity
                    style={styles.removeButtonCorner}
                    onPress={() => {
                      // Reset all state when removing image
                      setSelectedImage(null);
                      setAnalysisResult(null);
                      setImageRotation(0);
                      setBgRemovalState({
                        isRemoving: false,
                        showColorPalette: false,
                        backgroundColor: '#ffffff',
                        processedImageData: null,
                      });
                      setBgRemovalOriginalImage(null);
                    }}
                  >
                    <Text style={styles.removeTextCorner}>✕</Text>
                  </TouchableOpacity>

                  {/* Rotation Display - Center Bottom */}
                  <View style={styles.rotationDisplay}>
                    <Text style={styles.rotationText}>{imageRotation}°</Text>
                  </View>
                </View>

                {/* Right Rotation Button */}
                <TouchableOpacity
                  style={styles.rotateButtonRight}
                  onPress={() => setImageRotation((imageRotation + 90) % 360)}
                >
                  <Text style={styles.rotateButtonIconText}>⟳</Text>
                </TouchableOpacity>
              </View>

              {/* Background Removal Section */}
              <View style={styles.bgRemovalSection}>
                <Text style={styles.bgRemovalTitle}>
                  🎨 Background Processing
                </Text>

                {/* Background Removal Button */}
                <TouchableOpacity
                  style={[
                    styles.bgButton,
                    bgRemovalState.isRemoving && styles.disabledButton,
                  ]}
                  onPress={removeBackground}
                  disabled={bgRemovalState.isRemoving}
                  activeOpacity={0.85}
                >
                  {bgRemovalState.isRemoving ? (
                    <ActivityIndicator size="large" color="#fff" />
                  ) : (
                    <Text style={styles.bgButtonText}>
                      🗑️ Remove Background
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Color Palette Toggle */}
                {bgRemovalState.processedImageData && (
                  <>
                    <TouchableOpacity
                      style={styles.colorPaletteToggle}
                      onPress={() =>
                        setBgRemovalState(prev => ({
                          ...prev,
                          showColorPalette: !prev.showColorPalette,
                        }))
                      }
                      activeOpacity={0.8}
                    >
                      <Text style={styles.colorPaletteToggleText}>
                        {bgRemovalState.showColorPalette
                          ? '✕ Hide Colors'
                          : '🎨 Select Background Color'}
                      </Text>
                    </TouchableOpacity>

                    {/* Color Palette */}
                    {bgRemovalState.showColorPalette && (
                      <View style={styles.colorPaletteGrid}>
                        {colorPalette.map(color => (
                          <TouchableOpacity
                            key={color.hex}
                            style={[
                              styles.colorItem,
                              { backgroundColor: color.hex },
                              bgRemovalState.backgroundColor === color.hex &&
                                styles.colorItemSelected,
                            ]}
                            onPress={() => reprocessWithColor(color.hex)}
                            activeOpacity={0.7}
                          >
                            {bgRemovalState.backgroundColor === color.hex && (
                              <Text style={styles.colorItemCheckmark}>✓</Text>
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {/* Processed Image Preview with Background Color */}
                    {bgRemovalState.processedImageData && (
                      <View
                        style={[
                          styles.processedImagePreview,
                          { backgroundColor: bgRemovalState.backgroundColor },
                        ]}
                      >
                        <TouchableOpacity
                          activeOpacity={0.9}
                          onPress={() => {
                            setZoomImageUrl(
                              `data:image/png;base64,${bgRemovalState.processedImageData}`,
                            );
                            setZoomModalVisible(true);
                          }}
                        >
                          <Image
                            source={{
                              uri: `data:image/png;base64,${bgRemovalState.processedImageData}`,
                            }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="contain"
                          />
                          {/* Zoom Indicator Overlay */}
                          <View style={styles.zoomIndicatorOverlay}>
                            <Text style={styles.zoomIndicatorIcon}>🔍</Text>
                            <Text style={styles.zoomIndicatorText}>
                              Tap to zoom
                            </Text>
                          </View>
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                )}
              </View>
            </>
          )}
        </View>

        {/* Analyze Button */}
        <View style={styles.analyzeSection}>
          <TouchableOpacity
            style={[styles.analyzeButton, loading && styles.disabledButton]}
            onPress={handleAnalyzeButtonPress}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : (
              <Text style={styles.analyzeButtonText}>🔍 Analyze Image</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Results Section */}
        {analysisResult && (
          <>
            {/* Annotation Image with Zoom */}
            {analysisResult.comprehensive_annotation && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🖼️ Annotated Results</Text>
                <TouchableOpacity
                  style={styles.zoomButton}
                  onPress={() => {
                    setZoomImageUrl(
                      `${API_URL}${analysisResult.comprehensive_annotation}`,
                    );
                    setZoomModalVisible(true);
                  }}
                >
                  <Text style={styles.zoomButtonText}>
                    🔍 Zoom & Explore Image
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setZoomImageUrl(
                      `${API_URL}${analysisResult.comprehensive_annotation}`,
                    );
                    setZoomModalVisible(true);
                  }}
                >
                  <Image
                    source={{
                      uri: `${API_URL}${analysisResult.comprehensive_annotation}`,
                    }}
                    style={styles.annotationImageSmall}
                  />
                  {/* Zoom Indicator Overlay */}
                  <View style={styles.zoomIndicatorOverlay}>
                    <Text style={styles.zoomIndicatorIcon}>🔍</Text>
                    <Text style={styles.zoomIndicatorText}>Tap to zoom</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* Plants Table */}
            {analysisResult.plants && analysisResult.plants.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📊 Plant Measurements</Text>
                <View style={styles.tableContainer}>
                  {/* Table Header */}
                  <View style={[styles.tableRow, styles.tableHeaderRow]}>
                    <Text
                      style={[
                        styles.tableCell,
                        styles.tableHeader,
                        { flex: 0.8 },
                      ]}
                    >
                      ID
                    </Text>
                    <Text
                      style={[
                        styles.tableCell,
                        styles.tableHeader,
                        { flex: 1.2 },
                      ]}
                    >
                      Root (cm)
                    </Text>
                    <Text
                      style={[
                        styles.tableCell,
                        styles.tableHeader,
                        { flex: 1.2 },
                      ]}
                    >
                      Shoot (cm)
                    </Text>
                    <Text
                      style={[
                        styles.tableCell,
                        styles.tableHeader,
                        { flex: 1.2 },
                      ]}
                    >
                      Total (cm)
                    </Text>
                  </View>

                  {/* Table Rows */}
                  {analysisResult.plants.map((plant, idx) => (
                    <View
                      key={plant.id}
                      style={[
                        styles.tableRow,
                        idx % 2 === 0 && styles.tableRowAlt,
                        idx === analysisResult.plants!.length - 1 &&
                          styles.tableRowLast,
                      ]}
                    >
                      <Text
                        style={[
                          styles.tableCell,
                          styles.tableCellBold,
                          { flex: 0.8 },
                        ]}
                      >
                        P{plant.id}
                      </Text>
                      <Text
                        style={[
                          styles.tableCell,
                          styles.tableCellRoot,
                          { flex: 1.2 },
                        ]}
                      >
                        {(
                          plant.biggest_root_length_cm ??
                          plant.root_length_cm ??
                          0
                        ).toFixed(2)}
                      </Text>
                      <Text
                        style={[
                          styles.tableCell,
                          styles.tableCellShoot,
                          { flex: 1.2 },
                        ]}
                      >
                        {(
                          plant.biggest_shoot_length_cm ??
                          plant.shoot_length_cm ??
                          0
                        ).toFixed(2)}
                      </Text>
                      <Text
                        style={[
                          styles.tableCell,
                          styles.tableCellTotal,
                          { flex: 1.2 },
                        ]}
                      >
                        {(
                          plant.biggest_total_length_cm ??
                          plant.total_length_cm ??
                          0
                        ).toFixed(2)}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Statistics */}
                {analysisResult.statistics && (
                  <>
                    <View style={styles.statsGrid}>
                      <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Avg Root</Text>
                        <Text style={styles.statValue}>
                          {analysisResult.statistics.average_root_length_cm?.toFixed(
                            2,
                          ) || '0'}
                        </Text>
                        <Text style={styles.statUnit}>cm</Text>
                      </View>
                      <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Avg Shoot</Text>
                        <Text style={styles.statValue}>
                          {analysisResult.statistics.average_shoot_length_cm?.toFixed(
                            2,
                          ) || '0'}
                        </Text>
                        <Text style={styles.statUnit}>cm</Text>
                      </View>
                      <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Total Plants</Text>
                        <Text style={styles.statValue}>
                          {analysisResult.plants?.length || 0}
                        </Text>
                        <Text style={styles.statUnit}>Count</Text>
                      </View>
                    </View>

                    {/* Seed Vigour Index Section */}
                    {calculateSVI() && (
                      <View style={styles.sviSection}>
                        <Text style={styles.sviTitle}>
                          🌱 Seed Vigour Index (SVI)
                        </Text>

                        {/* Formula Box */}
                        <View style={styles.formulaBox}>
                          <Text style={styles.formulaTitle}>Formula:</Text>
                          <View style={styles.formulaLine}>
                            <Text style={styles.formulaText}>
                              SVI = (Avg Root + Avg Shoot) × Germination %
                            </Text>
                          </View>
                        </View>

                        {/* Input Values */}
                        <View style={styles.valuesGrid}>
                          <View style={styles.valueCard}>
                            <Text style={styles.valueLabel}>
                              Total Seeds Kept
                            </Text>
                            <Text style={styles.valueNumber}>
                              {calculateSVI()?.totalSeedsKept}
                            </Text>
                          </View>
                          <View style={styles.valueCard}>
                            <Text style={styles.valueLabel}>Germinated</Text>
                            <Text style={styles.valueNumber}>
                              {calculateSVI()?.totalSeedsGerminated}
                            </Text>
                          </View>
                          <View style={styles.valueCard}>
                            <Text style={styles.valueLabel}>Avg Root</Text>
                            <Text style={styles.valueNumber}>
                              {analysisResult.statistics.average_root_length_cm?.toFixed(
                                2,
                              )}{' '}
                              cm
                            </Text>
                          </View>
                          <View style={styles.valueCard}>
                            <Text style={styles.valueLabel}>Avg Shoot</Text>
                            <Text style={styles.valueNumber}>
                              {analysisResult.statistics.average_shoot_length_cm?.toFixed(
                                2,
                              )}{' '}
                              cm
                            </Text>
                          </View>
                        </View>

                        {/* Calculation Steps */}
                        <View style={styles.calculationBox}>
                          <Text style={styles.calcLabel}>Calculation:</Text>
                          <Text style={styles.calcStep}>
                            Germination % = (
                            {calculateSVI()?.totalSeedsGerminated} /{' '}
                            {calculateSVI()?.totalSeedsKept}) × 100 ={' '}
                            <Text style={styles.calcValue}>
                              {calculateSVI()?.germinationPercentage}%
                            </Text>
                          </Text>
                          <Text style={styles.calcStep}>
                            Avg Length ={' '}
                            {analysisResult.statistics.average_root_length_cm?.toFixed(
                              2,
                            )}{' '}
                            +{' '}
                            {analysisResult.statistics.average_shoot_length_cm?.toFixed(
                              2,
                            )}{' '}
                            ={' '}
                            <Text style={styles.calcValue}>
                              {calculateSVI()?.avgLength} cm
                            </Text>
                          </Text>
                          <Text style={styles.calcStep}>
                            SVI = {calculateSVI()?.avgLength} ×{' '}
                            {calculateSVI()?.germinationPercentage} ={' '}
                            <Text style={styles.calcValue}>
                              {calculateSVI()?.svi}
                            </Text>
                          </Text>
                        </View>

                        {/* Final Result */}
                        <View style={styles.sviResultBox}>
                          <Text style={styles.sviResultLabel}>
                            Seed Vigour Index (SVI)
                          </Text>
                          <Text style={styles.sviResultFinal}>
                            {calculateSVI()?.svi}
                          </Text>
                        </View>
                      </View>
                    )}
                  </>
                )}
              </View>
            )}

            {/* Clear Button */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearResults}
                activeOpacity={0.8}
              >
                <Text style={styles.clearButtonText}>🔄 Reset Analysis</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Footer Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Analysis Metadata Modal */}
      <AnalysisMetadataModal
        visible={showMetadataModal}
        onSubmit={handleMetadataSubmit}
        onCancel={() => setShowMetadataModal(false)}
      />

      {/* Zoomable Image Modal */}
      <ZoomableImageModal
        imageUrl={zoomImageUrl}
        visible={zoomModalVisible}
        onClose={() => {
          setZoomModalVisible(false);
          setZoomImageUrl(null);
        }}
      />

      {/* Image Cropper Modal */}
      <ImageCropperModal
        visible={showCropModal}
        imagePath={cropImagePath || ''}
        onCropComplete={handleCropComplete}
        onCancel={handleCropCancel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: Colors.primaryBg,
  },
  header: {
    backgroundColor: Colors.accentBg,
    paddingVertical: Spacing[8],
    paddingHorizontal: Spacing[8],
    alignItems: 'center',
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
    marginBottom: Spacing[6],
    ...Shadows.orange,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  title: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.black,
    color: Colors.primary,
    marginBottom: Spacing[2],
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.accent,
    letterSpacing: 0.6,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing[6],
  },
  testButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing[5],
    paddingHorizontal: Spacing[7],
    borderRadius: BorderRadius.md,
    ...Shadows.green,
  },
  testButtonText: {
    color: Colors.white,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
  section: {
    marginHorizontal: Spacing[6],
    marginVertical: Spacing[6],
    paddingHorizontal: Spacing[8],
    paddingVertical: Spacing[8],
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    ...Shadows.xs,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extrabold,
    color: Colors.primary,
    marginBottom: Spacing[6],
    letterSpacing: 0.2,
  },
  tipsBox: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.md,
    padding: Spacing[5],
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  tipsTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
    marginBottom: Spacing[2],
  },
  tipText: {
    fontSize: Typography.sizes.xs,
    color: Colors.gray700,
    lineHeight: 15,
    marginBottom: Spacing[1],
  },
  tipsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  hideTipsButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hideTipsText: {
    color: Colors.white,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
  showTipsButton: {
    backgroundColor: Colors.purpleLight,
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: Colors.purple,
    ...Shadows.xs,
  },
  showTipsText: {
    color: Colors.purpleDark,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing[5],
    marginBottom: Spacing[6],
  },
  button: {
    flex: 1,
    paddingVertical: Spacing[7],
    paddingHorizontal: Spacing[6],
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    ...Shadows.xs,
  },
  buttonPrimary: {
    backgroundColor: Colors.primary,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primaryDark,
  },
  buttonSecondary: {
    backgroundColor: Colors.info,
    borderBottomWidth: 2,
    borderBottomColor: Colors.infoDark,
  },
  buttonText: {
    color: Colors.white,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
  },
  imageWrapperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing[4],
    marginVertical: Spacing[6],
    width: '100%',
    minHeight: 300,
  },
  rotateButtonLeft: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.accentLight,
    ...Shadows.xs,
  },
  rotateButtonRight: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.accentLight,
    ...Shadows.xs,
  },
  rotateButtonIconText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.black,
    color: Colors.accentDark,
  },
  imageContainer: {
    flex: 1,
    height: 300,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.gray100,
    borderWidth: 2,
    borderColor: Colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    ...Shadows.xs,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  imageTouchable: {
    width: '100%',
    height: '100%',
    flex: 1,
  },
  removeButtonCorner: {
    position: 'absolute',
    top: Spacing[4],
    right: Spacing[4],
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    shadowColor: Colors.error,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  removeTextCorner: {
    color: Colors.white,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.black,
  },
  rotationDisplay: {
    position: 'absolute',
    bottom: Spacing[4],
    alignSelf: 'center',
    backgroundColor: 'rgba(22, 163, 74, 0.9)',
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[6],
    borderRadius: BorderRadius.sm,
    zIndex: 50,
  },
  rotationText: {
    color: Colors.white,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.extrabold,
  },
  analyzeSection: {
    marginHorizontal: Spacing[6],
    marginVertical: Spacing[4],
  },
  analyzeButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing[8],
    paddingHorizontal: Spacing[10],
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    ...Shadows.greenLg,
    borderBottomWidth: 3,
    borderBottomColor: Colors.primaryDark,
  },
  analyzeButtonText: {
    color: Colors.white,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.extrabold,
    letterSpacing: 0.2,
  },
  disabledButton: {
    backgroundColor: Colors.gray400,
    opacity: 0.6,
  },
  zoomButton: {
    backgroundColor: Colors.warning,
    paddingVertical: Spacing[6],
    paddingHorizontal: Spacing[8],
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing[6],
    ...Shadows.sm,
  },
  zoomButtonText: {
    color: Colors.white,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
  },
  annotationImageSmall: {
    width: '100%',
    height: 240,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray100,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  tableContainer: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.gray200,
    marginBottom: Spacing[6],
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[6],
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  tableHeaderRow: {
    backgroundColor: Colors.primaryBg,
  },
  tableCell: {
    fontSize: Typography.sizes.sm,
    color: Colors.gray700,
    textAlign: 'center',
  },
  tableHeader: {
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
    fontSize: Typography.sizes.xs,
  },
  tableCellBold: {
    fontWeight: Typography.weights.bold,
    color: Colors.gray800,
  },
  tableCellRoot: {
    color: Colors.error,
    fontWeight: Typography.weights.semibold,
  },
  tableCellShoot: {
    color: Colors.primary,
    fontWeight: Typography.weights.semibold,
  },
  tableCellTotal: {
    color: Colors.info,
    fontWeight: Typography.weights.semibold,
  },
  tableRowAlt: {
    backgroundColor: Colors.gray50,
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing[5],
    marginVertical: Spacing[6],
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.primaryBg,
    paddingVertical: Spacing[6],
    paddingHorizontal: Spacing[5],
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  statLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.gray500,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing[2],
  },
  statValue: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.extrabold,
    color: Colors.primary,
    marginBottom: Spacing[1],
  },
  statUnit: {
    fontSize: Typography.sizes.xs,
    color: Colors.gray400,
    fontWeight: Typography.weights.medium,
  },
  sviSection: {
    marginVertical: Spacing[8],
    paddingHorizontal: Spacing[8],
    paddingVertical: Spacing[8],
    backgroundColor: Colors.accentLight,
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 5,
    borderLeftColor: Colors.warning,
  },
  sviTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.extrabold,
    color: Colors.accentDark,
    marginBottom: Spacing[6],
    letterSpacing: 0.2,
  },
  formulaBox: {
    backgroundColor: Colors.accentBg,
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[5],
    borderRadius: BorderRadius.md,
    marginBottom: Spacing[6],
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  formulaTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.accentDark,
    marginBottom: Spacing[3],
  },
  formulaLine: {
    flexDirection: 'row',
  },
  formulaText: {
    fontSize: Typography.sizes.sm,
    color: Colors.accentDark,
    fontWeight: Typography.weights.semibold,
    fontStyle: 'italic',
  },
  valuesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[4],
    marginBottom: Spacing[6],
  },
  valueCard: {
    width: '48%',
    backgroundColor: Colors.white,
    paddingVertical: Spacing[5],
    paddingHorizontal: Spacing[5],
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  valueLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.gray500,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing[2],
  },
  valueNumber: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.extrabold,
    color: Colors.accentDark,
  },
  calculationBox: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[5],
    borderRadius: BorderRadius.md,
    marginBottom: Spacing[6],
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  calcLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.accentDark,
    marginBottom: Spacing[4],
  },
  calcStep: {
    fontSize: Typography.sizes.xs,
    color: Colors.accentDark,
    fontWeight: Typography.weights.medium,
    marginBottom: Spacing[3],
    lineHeight: Typography.lineHeights.snug,
  },
  calcValue: {
    fontWeight: Typography.weights.extrabold,
    color: Colors.accent,
  },
  sviResultBox: {
    backgroundColor: Colors.white,
    paddingVertical: Spacing[7],
    paddingHorizontal: Spacing[6],
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.warning,
  },
  sviResultLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.accentDark,
    marginBottom: Spacing[3],
  },
  sviResultFinal: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.black,
    color: Colors.warning,
  },
  clearButton: {
    backgroundColor: Colors.error,
    paddingVertical: Spacing[7],
    paddingHorizontal: Spacing[10],
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    shadowColor: Colors.error,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  clearButtonText: {
    color: Colors.white,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.2,
  },
  instructionsSection: {
    marginHorizontal: Spacing[6],
    marginVertical: Spacing[6],
    paddingHorizontal: Spacing[8],
    paddingVertical: Spacing[8],
    backgroundColor: Colors.accentLight,
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  instructionsTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.extrabold,
    color: Colors.accentDark,
    marginBottom: Spacing[5],
    letterSpacing: 0.2,
  },
  instructionText: {
    fontSize: Typography.sizes.sm,
    color: Colors.accentDark,
    fontWeight: Typography.weights.medium,
    marginBottom: Spacing[3],
    lineHeight: Typography.lineHeights.snug,
  },
  zoomScaleContainer: {
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[4],
    backgroundColor: Colors.primaryBg,
    borderRadius: BorderRadius.sm,
    borderTopWidth: 2,
    borderTopColor: Colors.primary,
    alignItems: 'center',
  },
  zoomScaleText: {
    color: Colors.primary,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
  bgRemovalSection: {
    marginHorizontal: Spacing[6],
    marginVertical: Spacing[8],
    paddingHorizontal: Spacing[8],
    paddingVertical: Spacing[8],
    backgroundColor: Colors.purpleLight,
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 5,
    borderLeftColor: Colors.purpleAccent,
    borderTopWidth: 1,
    borderTopColor: Colors.purpleAccent,
  },
  bgRemovalTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.extrabold,
    color: Colors.purpleDark,
    marginBottom: Spacing[7],
    letterSpacing: 0.2,
  },
  bgButton: {
    backgroundColor: Colors.purple,
    paddingVertical: Spacing[7],
    paddingHorizontal: Spacing[10],
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    ...Shadows.purple,
    borderBottomWidth: 2,
    borderBottomColor: Colors.purpleDark,
    marginBottom: Spacing[6],
  },
  bgButtonText: {
    color: Colors.white,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.2,
  },
  colorPaletteToggle: {
    backgroundColor: Colors.purpleAccent,
    paddingVertical: Spacing[6],
    paddingHorizontal: Spacing[8],
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing[6],
    borderWidth: 1,
    borderColor: Colors.purpleAccent,
  },
  colorPaletteToggleText: {
    color: Colors.purpleDark,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.2,
  },
  colorPaletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[4],
    marginBottom: Spacing[2],
    justifyContent: 'space-between',
  },
  colorItem: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.purpleAccent,
    ...Shadows.xs,
  },
  colorItemSelected: {
    borderWidth: 3,
    borderColor: Colors.gray800,
    shadowOpacity: 0.35,
  },
  colorItemCheckmark: {
    color: Colors.white,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.black,
    textShadowColor: Colors.black,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  processedImagePreview: {
    width: '100%',
    height: 300,
    borderRadius: BorderRadius.md,
    marginTop: Spacing[3],
    overflow: 'hidden',
  },
  zoomIndicatorOverlay: {
    position: 'absolute',
    bottom: Spacing[4],
    right: Spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    borderRadius: BorderRadius.lg,
  },
  zoomIndicatorIcon: {
    fontSize: Typography.sizes.base,
    marginRight: Spacing[2],
  },
  zoomIndicatorText: {
    color: Colors.white,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
  },
});

export default AppContent;
