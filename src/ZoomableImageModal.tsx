import React from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Text,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';

interface ZoomableImageModalProps {
  imageUrl: string | null;
  visible: boolean;
  onClose: () => void;
}

export const ZoomableImageModal: React.FC<ZoomableImageModalProps> = ({
  imageUrl,
  visible,
  onClose,
}) => {
  const zoomableViewRef = React.useRef<any>(null);

  const handleClose = () => {
    try {
      if (zoomableViewRef.current?.resetZoom) {
        zoomableViewRef.current.resetZoom();
      }
    } catch (e) {
      // Ignore errors
    }
    onClose();
  };

  if (!imageUrl) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.zoomIndicator}>Zoom Image</Text>
              <Text style={styles.helpText}>Pinch to zoom • Drag to pan</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.zoomContainer}>
            <ReactNativeZoomableView
              ref={zoomableViewRef}
              style={styles.zoomView}
              maxZoom={5}
              minZoom={1}
              contentWidth={Dimensions.get('window').width - 32}
              contentHeight={Dimensions.get('window').height - 200}
              initialZoom={1}
              zoomEnabled={true}
              panEnabled={true}
              doubleTapZoomToCenter={true}
            >
              <Image
                source={{ uri: imageUrl }}
                style={styles.image}
                resizeMode="contain"
              />
            </ReactNativeZoomableView>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 1)',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1f2937',
  },
  headerLeft: {
    flex: 1,
  },
  zoomIndicator: {
    color: '#10b981',
    fontSize: 18,
    fontWeight: 'bold',
  },
  helpText: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  zoomContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomView: {
    flex: 1,
    width: Dimensions.get('window').width,
  },
  image: {
    width: Dimensions.get('window').width - 32,
    height: Dimensions.get('window').height - 200,
  },
});

export default ZoomableImageModal;
