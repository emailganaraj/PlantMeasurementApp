/**
 * DevelopmentCaptureScreen.tsx
 * 
 * Capture/upload screen for development submissions.
 * Mirrors AppContent.tsx pattern with image capture, background removal, and metadata.
 * Uses POST /submit-for-development endpoint instead of /analyze
 * V28.4 - Modern UI/UX with design system
 */

import React, { useState, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import ImageCropperModal from '../components/ImageCropperModal';
import { AnalysisMetadataModal } from '../components/AnalysisMetadataModal';
import ZoomableImageModal from './ZoomableImageModal';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme';
import PrimaryButton from '../components/ui/PrimaryButton';
import SecondaryButton from '../components/ui/SecondaryButton';

interface BackgroundRemovalState {
  isRemoving: boolean;
  showColorPalette: boolean;
  backgroundColor: string;
  processedImageData: string | null;
}

interface DevelopmentCaptureScreenProps {
  userId: string;
  apiUrl: string;
}

interface AnalysisMetadata {
  name: string;
  totalSeedsKept: number;
  totalSeedsGerminated: number;
  germinationPercentage: number;
}

const DevelopmentCaptureScreen: React.FC<DevelopmentCaptureScreenProps> = ({
  userId,
  apiUrl,
}) => {
  const navigation = useNavigation<any>();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [zoomModalVisible, setZoomModalVisible] = useState(false);
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);
  const [bgRemovalState, setBgRemovalState] = useState<BackgroundRemovalState>({
    isRemoving: false,
    showColorPalette: false,
    backgroundColor: '#ffffff',
    processedImageData: null,
  });
  const [showMetadataModal, setShowMetadataModal] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImagePath, setCropImagePath] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const API_URL = apiUrl;

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
    setSubmitSuccess(false);
  };

  const handleImageSelected = (imagePath: string) => {
    resetImageState();
    setSelectedImage(imagePath);
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
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setCropImagePath(null);
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

      formData.append('background_color', bgRemovalState.backgroundColor);
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

      setBgRemovalState(prev => ({
        ...prev,
        processedImageData: result.image_data,
        showColorPalette: true,
        backgroundColor: '#ffffff',
      }));

      // Auto-scroll to preview
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 500);

      Alert.alert(
        'Success',
        'Background removed! Select a color or proceed to submit.',
      );
    } catch (error: any) {
      const errorMessage = error?.message || String(error) || 'Unknown error';
      console.error('Background removal error:', errorMessage);
      setBgRemovalState(prev => ({ ...prev, isRemoving: false }));
      Alert.alert('Error', errorMessage);
    } finally {
      setBgRemovalState(prev => ({ ...prev, isRemoving: false }));
    }
  };

  const handleMetadataSubmit = async (metadata: AnalysisMetadata) => {
    setShowMetadataModal(false);
    setLoading(true);

    try {
      const formData = new FormData();

      // Original image (always required)
      if (!selectedImage) {
        Alert.alert('Error', 'No image selected');
        setLoading(false);
        return;
      }

      // Add original image as 'file' field (cropped image)
      formData.append('file', {
        uri: selectedImage,
        type: 'image/jpeg',
        name: 'original_image.jpg',
      } as any);

      // Add metadata
      formData.append('user_id', userId);
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

      // If background was removed, send background_color for backend to process
      if (bgRemovalState.processedImageData && bgRemovalState.backgroundColor) {
        formData.append('background_color', bgRemovalState.backgroundColor);
        formData.append('background_removed', 'true');
      }

      console.log(`Submitting to ${API_URL}/submit-for-development`);
      const response = await fetch(`${API_URL}/submit-for-development`, {
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
      console.log('Development submission successful:', result);

      Alert.alert(
        'Success',
        'Image submitted for development! You can view it in the History tab.',
      );

      // Reset form
      setSelectedImage(null);
      resetImageState();
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error: any) {
      const errorMessage = error?.message || String(error) || 'Unknown error';
      console.error('Submission error:', errorMessage);
      Alert.alert('Error', `Failed to submit: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMetadataModalCancel = () => {
    setShowMetadataModal(false);
  };

  return (
    <SafeAreaView style={styles.screenContainer} edges={['left', 'right']}>
    <ScrollView
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Image Capture Section */}
      {!selectedImage ? (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderIcon}>📸</Text>
          <Text style={styles.placeholderText}>No image selected</Text>
          <Text style={styles.placeholderSubtext}>
            Capture or upload a plant image to submit for development
          </Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.imageSection}
          onPress={() => {
            setZoomImageUrl(selectedImage);
            setZoomModalVisible(true);
          }}
        >
          <Image
            source={{
              uri: selectedImage,
            }}
            style={styles.selectedImage}
          />
          <View style={styles.zoomIndicatorOverlay}>
            <Text style={styles.zoomIndicatorIcon}>🔍</Text>
            <Text style={styles.zoomIndicatorText}>Tap to zoom</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Buttons */}
      <View style={styles.buttonRow}>
        <SecondaryButton
          title="📷 Capture"
          onPress={captureImage}
          style={{ flex: 1 }}
        />
        <SecondaryButton
          title="📁 Upload"
          onPress={uploadImage}
          style={{ flex: 1 }}
        />
      </View>

      {/* How to Use Tips */}
      {!selectedImage && (
        <View style={styles.tipsBox}>
          <Text style={styles.tipsTitle}>📋 How to Use</Text>
          <Text style={styles.tipText}>1. Place up to 10 seedlings — closely packed but not touching each other</Text>
          <Text style={styles.tipText}>2. Use a plain, non-shiny, non-textured black cloth as background (no folds)</Text>
          <Text style={styles.tipText}>3. Place a ₹2 coin (2.4 cm) near the roots / between middle plants for calibration</Text>
          <Text style={styles.tipText}>4. Capture image → Crop just outside the seedling boundary (don't cut the plant)</Text>
          <Text style={styles.tipText}>5. Remove background → Reapply black background colour</Text>
          <Text style={styles.tipText}>6. Fill metadata (name, seeds kept, germinated) → Submit</Text>
          <Text style={styles.tipText}>7. After submission, go to History → Add manual measurements for each plant</Text>
        </View>
      )}

      {/* Background Removal Section */}
      {selectedImage && (
        <View style={styles.bgRemovalSection}>
          <Text style={styles.sectionTitle}>Background Removal</Text>

          <PrimaryButton
            title={
              bgRemovalState.isRemoving ? '⏳ Processing...' : '✨ Remove Background'
            }
            onPress={removeBackground}
            disabled={bgRemovalState.isRemoving || loading}
          />

          {/* Color Palette */}
          {bgRemovalState.showColorPalette && (
            <View style={styles.colorPaletteSection}>
              <Text style={styles.colorPaletteLabel}>Select Background Color</Text>
              <View style={styles.colorPaletteGrid}>
                {colorPalette.map((color, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.colorItem,
                      { backgroundColor: color.hex },
                      bgRemovalState.backgroundColor === color.hex &&
                        styles.colorItemSelected,
                    ]}
                    onPress={() => {
                      setBgRemovalState(prev => ({
                        ...prev,
                        backgroundColor: color.hex,
                      }));
                    }}
                  >
                    {bgRemovalState.backgroundColor === color.hex && (
                      <Text style={styles.colorItemCheckmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Processed Image Preview with Color Applied */}
          {bgRemovalState.processedImageData && (
            <TouchableOpacity
              style={styles.processedImageContainer}
              onPress={() => {
                setZoomImageUrl(
                  'data:image/png;base64,' + bgRemovalState.processedImageData,
                );
                setZoomModalVisible(true);
              }}
            >
              <Text style={styles.previewLabel}>
                Preview - {bgRemovalState.backgroundColor}
              </Text>
              <View
                style={[
                  styles.previewImageWrapper,
                  { backgroundColor: bgRemovalState.backgroundColor },
                ]}
              >
                <Image
                  source={{
                    uri: 'data:image/png;base64,' + bgRemovalState.processedImageData,
                  }}
                  style={styles.previewImage}
                />
              </View>
              <View style={styles.zoomIndicatorOverlay}>
                <Text style={styles.zoomIndicatorIcon}>🔍</Text>
                <Text style={styles.zoomIndicatorText}>Tap to zoom</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Submit Button */}
      {selectedImage && (
        <View style={styles.submitSection}>
          <PrimaryButton
            title={loading ? 'Submitting...' : '🚀 Submit for Development'}
            onPress={() => setShowMetadataModal(true)}
            disabled={loading}
          />
          <Text style={styles.submitHint}>
            Complete metadata to submit for development
          </Text>
        </View>
      )}

      {/* Success Message */}
      {submitSuccess && (
        <View style={styles.successMessage}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successText}>
            Successfully submitted! Check History tab to view.
          </Text>
        </View>
      )}

      {/* Modals */}
      <ImageCropperModal
        visible={showCropModal}
        imagePath={cropImagePath || ''}
        onCropComplete={handleCropComplete}
        onCancel={handleCropCancel}
      />

      <AnalysisMetadataModal
        visible={showMetadataModal}
        onCancel={handleMetadataModalCancel}
        onSubmit={handleMetadataSubmit}
        buttonLabel="Submit for Development"
      />

      <ZoomableImageModal
        visible={zoomModalVisible}
        imageUrl={zoomImageUrl}
        onClose={() => setZoomModalVisible(false)}
      />
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
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBg,
  },
  contentContainer: {
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[8],
    gap: Spacing[8],
  },
  imagePlaceholder: {
    height: 250,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.primaryLight,
    ...Shadows.xs,
  },
  placeholderIcon: {
    fontSize: 48,
    marginBottom: Spacing[4],
  },
  placeholderText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.gray800,
    marginBottom: Spacing[2],
  },
  placeholderSubtext: {
    fontSize: Typography.sizes.sm,
    color: Colors.gray500,
    textAlign: 'center',
    paddingHorizontal: Spacing[4],
  },
  imageSection: {
    position: 'relative',
  },
  selectedImage: {
    width: '100%',
    height: 300,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.gray100,
    ...Shadows.sm,
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
  tipsBox: {
    backgroundColor: Colors.purpleLight,
    borderRadius: BorderRadius.md,
    padding: Spacing[5],
    borderLeftWidth: 3,
    borderLeftColor: Colors.purple,
  },
  tipsTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.purpleDark,
    marginBottom: Spacing[2],
  },
  tipText: {
    fontSize: Typography.sizes.xs,
    color: Colors.gray700,
    lineHeight: 15,
    marginBottom: Spacing[1],
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing[4],
  },
  bgRemovalSection: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing[6],
    borderLeftWidth: 4,
    borderLeftColor: Colors.purple,
    ...Shadows.sm,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.purple,
    marginBottom: Spacing[5],
  },
  colorPaletteSection: {
    marginTop: Spacing[6],
    paddingTop: Spacing[6],
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
  colorPaletteLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.gray700,
    marginBottom: Spacing[4],
  },
  colorPaletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[4],
    justifyContent: 'space-between',
  },
  colorItem: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.gray300,
    ...Shadows.xs,
  },
  colorItemSelected: {
    borderWidth: 3,
    borderColor: Colors.gray800,
    ...Shadows.md,
  },
  colorItemCheckmark: {
    color: Colors.white,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.black,
    textShadowColor: Colors.black,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  processedImageContainer: {
    marginTop: Spacing[1],
    paddingTop: Spacing[1],
  },
  previewLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.gray700,
    marginBottom: Spacing[2],
  },
  previewImageWrapper: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing[2],
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.md,
  },
  submitSection: {
    alignItems: 'center',
    gap: Spacing[3],
  },
  submitHint: {
    fontSize: Typography.sizes.sm,
    color: Colors.gray500,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  successMessage: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing[6],
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    gap: Spacing[3],
  },
  successIcon: {
    fontSize: 32,
  },
  successText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.primary,
    textAlign: 'center',
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

export default DevelopmentCaptureScreen;
