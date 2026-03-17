import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Modal,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { CropView } from 'react-native-image-crop-tools';

interface ImageCropperModalProps {
  visible: boolean;
  imagePath: string;
  onCropComplete: (croppedPath: string) => void;
  onCancel: () => void;
}

const { width, height } = Dimensions.get('window');

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  visible,
  imagePath,
  onCropComplete,
  onCancel,
}) => {
  const cropViewRef = useRef<any>(null);
  const [saving, setSaving] = useState(false);

  const handleDone = () => {
    if (cropViewRef.current) {
      setSaving(true);
      cropViewRef.current.saveImage(false, 100);
    }
  };

  const handleRotate = () => {
    if (cropViewRef.current) {
      cropViewRef.current.rotateImage(true);
    }
  };

  const onImageCrop = (result: {
    uri: string;
    width: number;
    height: number;
  }) => {
    setSaving(false);
    if (result && result.uri) {
      let uri = result.uri;
      if (!uri.startsWith('file://') && !uri.startsWith('content://')) {
        uri = 'file://' + uri;
      }
      onCropComplete(uri);
    } else {
      onCropComplete(imagePath);
    }
  };

  if (!visible || !imagePath) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancel}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.headerButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Crop Image</Text>
          </View>
          <TouchableOpacity
            onPress={handleDone}
            style={[styles.headerButton, saving && styles.disabledButton]}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#16a34a" />
            ) : (
              <Text style={styles.saveText}>Done</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.cropContainer}>
          <CropView
            sourceUrl={imagePath}
            style={styles.cropView}
            ref={cropViewRef}
            onImageCrop={onImageCrop}
            keepAspectRatio={false}
          />
        </View>

        <View style={styles.bottomControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleRotate}
            disabled={saving}
          >
            <Text style={styles.controlButtonText}>↻ Rotate</Text>
          </TouchableOpacity>
          <Text style={styles.helpText}>Drag to adjust • Tap Done to crop</Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1f2937',
  },
  headerButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cancelText: { color: '#ef4444', fontSize: 16 },
  saveText: { color: '#16a34a', fontSize: 16, fontWeight: 'bold' },
  disabledButton: { opacity: 0.5 },
  cropContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cropView: { width: width, height: height - 250 },
  bottomControls: {
    backgroundColor: '#1f2937',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  controlButton: {
    backgroundColor: '#374151',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 8,
  },
  controlButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  helpText: { color: '#9ca3af', fontSize: 12, textAlign: 'center' },
});

export default ImageCropperModal;
