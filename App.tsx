import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

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

function App(): React.JSX.Element {
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
    
    // Store original image when background is removed, for re-processing with different colors
    const [bgRemovalOriginalImage, setBgRemovalOriginalImage] = useState<string | null>(null);
    const { height, width } = useWindowDimensions();
    const zoomScrollRef = useRef<ScrollView>(null);

    // Physical device IP address
    const API_URL = 'http://10.196.98.32:8002';

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

    const captureImage = () => {
        launchCamera(
            {
                mediaType: 'photo',
                cameraType: 'back',
                quality: 0.9,
            },
            (response) => {
                if (response.didCancel) {
                    console.log('Camera cancelled');
                } else if (response.errorMessage) {
                    Alert.alert('Error', response.errorMessage);
                } else if (response.assets && response.assets[0]) {
                    // Reset background removal state when new image selected
                    setBgRemovalState({
                        isRemoving: false,
                        showColorPalette: false,
                        backgroundColor: '#ffffff',
                        processedImageData: null,
                    });
                    setBgRemovalOriginalImage(null);
                    setAnalysisResult(null);
                    setSelectedImage(response.assets[0].uri || null);
                }
            },
        );
    };

    const uploadImage = () => {
        launchImageLibrary(
            {
                mediaType: 'photo',
                quality: 0.9,
            },
            (response) => {
                if (response.didCancel) {
                    console.log('Image picker cancelled');
                } else if (response.errorMessage) {
                    Alert.alert('Error', response.errorMessage);
                } else if (response.assets && response.assets[0]) {
                    // Reset background removal state when new image selected
                    setBgRemovalState({
                        isRemoving: false,
                        showColorPalette: false,
                        backgroundColor: '#ffffff',
                        processedImageData: null,
                    });
                    setBgRemovalOriginalImage(null);
                    setAnalysisResult(null);
                    setSelectedImage(response.assets[0].uri || null);
                }
            },
        );
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
            const formData = new FormData();
            formData.append('file', {
                uri: bgRemovalState.processedImageData ? selectedImage : selectedImage,
                type: 'image/jpeg',
                name: 'plant_image.jpg',
            } as any);

            // Send rotation and background color
            if (imageRotation !== 0) {
                formData.append('rotation', imageRotation.toString());
            }

            const bgColorHex = bgRemovalState.backgroundColor.replace('#', '');
            formData.append('background_color', bgColorHex);

            const response = await fetch(`${API_URL}/remove-background`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const result = await response.json();
            
            // Store original image for re-processing with different colors
            setBgRemovalOriginalImage(selectedImage);
            
            setBgRemovalState(prev => ({
              ...prev,
              processedImageData: result.image_data,
              showColorPalette: true,  // Show color palette automatically
              backgroundColor: '#ffffff',
            }));
            
            Alert.alert('Success', 'Background removed! Select a color or click Analyze.');
        } catch (error: any) {
            const errorMessage = error?.message || String(error) || 'Unknown error';
            console.log('Background removal error:', errorMessage);
            Alert.alert('Error', `Failed to remove background: ${errorMessage}`);
        } finally {
            setBgRemovalState(prev => ({ ...prev, isRemoving: false }));
        }
    };

    const analyzeImage = async () => {
        if (!selectedImage && !bgRemovalState.processedImageData) {
            Alert.alert('Error', 'Please select an image first');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            
            // Always send original image
            formData.append('file', {
                uri: selectedImage,
                type: 'image/jpeg',
                name: 'plant_image.jpg',
            } as any);
            
            // If background was removed, send color + rotation for processing
            if (bgRemovalState.processedImageData) {
                // Send selected background color (hex without #)
                const bgColorHex = bgRemovalState.backgroundColor.replace('#', '');
                formData.append('background_color', bgColorHex);
                
                // Also send rotation angle (in case user rotated before background removal)
                if (imageRotation !== 0) {
                    formData.append('rotation', imageRotation.toString());
                }
                
                console.log(`Analyzing: ORIGINAL + ROTATION(${imageRotation}°) + COLOR (${bgRemovalState.backgroundColor} background)`);
            } else {
                console.log('Analyzing: ORIGINAL image only (background NOT removed)');
                
                // Send rotation angle only for original images
                if (imageRotation !== 0) {
                    formData.append('rotation', imageRotation.toString());
                }
            }

            const response = await fetch(`${API_URL}/analyze`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const result = await response.json();

            // Extract plants from per_plant array
            const plantsArray = (result.per_plant || []).map((plant: any) => ({
                id: plant.plant_id,
                root_length_cm: plant.root_length_cm,
                shoot_length_cm: plant.shoot_length_cm,
                total_length_cm: plant.total_length_cm
            }));

            const processedResult = {
                ...result,
                plants: plantsArray,
                comprehensive_annotation: result.debug_images?.comprehensive_annotation,
                background_removed: bgRemovalState.processedImageData ? true : false,
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
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            console.log('Health response:', response.status, response.ok);

            if (response.ok) {
                const data = await response.json();
                Alert.alert('✅ Connected!', `Backend is reachable!\n\nResponse: ${JSON.stringify(data)}`);
            } else {
                Alert.alert('⚠️ Response Error', `Status: ${response.status}`);
            }
        } catch (error: any) {
            const errorMsg = error?.message || String(error);
            console.log('Connection test error:', errorMsg);
            Alert.alert('❌ Connection Failed', `Cannot reach ${API_URL}\n\nError: ${errorMsg}`);
        }
    };

    const clearResults = () => {
        Alert.alert('Clear Analysis', 'Remove all results and images?', [
            { text: 'Cancel', onPress: () => { } },
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
                style: 'destructive'
            }
        ]);
    };



    const calculateSVI = () => {
        if (!analysisResult?.statistics || !analysisResult?.plants) return null;

        const totalSeeds = analysisResult.plants.length;
        const germinatedSeeds = analysisResult.plants.length; // All detected are germinated

        if (totalSeeds === 0) return null;

        const germinationPercentage = (germinatedSeeds / totalSeeds) * 100;
        const avgRoot = analysisResult.statistics.average_root_length_cm || 0;
        const avgShoot = analysisResult.statistics.average_shoot_length_cm || 0;
        const avgLength = avgRoot + avgShoot;
        const svi = avgLength * germinationPercentage;

        return {
            totalSeeds,
            germinatedSeeds,
            germinationPercentage: germinationPercentage.toFixed(2),
            avgLength: avgLength.toFixed(2),
            svi: svi.toFixed(2)
        };
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#1e293b" />
            <ScrollView
                contentInsetAdjustmentBehavior="automatic"
                style={styles.scrollView}
                showsVerticalScrollIndicator={true}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>🌱 Plant Measurement Pro</Text>
                    <Text style={styles.subtitle}>AI-Powered Seedling Analysis</Text>
                    <TouchableOpacity
                        style={styles.testButton}
                        onPress={testConnection}
                    >
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

                    {selectedImage && (
                        <>
                            {/* Image Container with Side Rotation Controls */}
                            <View style={styles.imageWrapperContainer}>
                                {/* Left Rotation Button */}
                                <TouchableOpacity
                                    style={styles.rotateButtonLeft}
                                    onPress={() => setImageRotation((imageRotation - 90 + 360) % 360)}
                                >
                                    <Text style={styles.rotateButtonIconText}>⟲</Text>
                                </TouchableOpacity>

                                {/* Main Image Container */}
                                <View style={styles.imageContainer}>
                                    <Image
                                        source={{ uri: selectedImage }}
                                        style={[styles.image, { transform: [{ rotate: `${imageRotation}deg` }] }]}
                                    />

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
                                <Text style={styles.bgRemovalTitle}>🎨 Background Processing</Text>

                                {/* Background Removal Button */}
                                <TouchableOpacity
                                    style={[styles.bgButton, bgRemovalState.isRemoving && styles.disabledButton]}
                                    onPress={removeBackground}
                                    disabled={bgRemovalState.isRemoving}
                                    activeOpacity={0.85}
                                >
                                    {bgRemovalState.isRemoving ? (
                                        <ActivityIndicator size="large" color="#fff" />
                                    ) : (
                                        <Text style={styles.bgButtonText}>🗑️ Remove Background</Text>
                                    )}
                                </TouchableOpacity>

                                {/* Color Palette Toggle */}
                                {bgRemovalState.processedImageData && (
                                    <>
                                        <TouchableOpacity
                                            style={styles.colorPaletteToggle}
                                            onPress={() => setBgRemovalState(prev => ({ ...prev, showColorPalette: !prev.showColorPalette }))}
                                            activeOpacity={0.8}
                                        >
                                            <Text style={styles.colorPaletteToggleText}>
                                                {bgRemovalState.showColorPalette ? '✕ Hide Colors' : '🎨 Select Background Color'}
                                            </Text>
                                        </TouchableOpacity>

                                        {/* Color Palette */}
                                        {bgRemovalState.showColorPalette && (
                                             <View style={styles.colorPaletteGrid}>
                                                 {colorPalette.map((color) => (
                                                     <TouchableOpacity
                                                         key={color.hex}
                                                         style={[
                                                             styles.colorItem,
                                                             { backgroundColor: color.hex },
                                                             bgRemovalState.backgroundColor === color.hex && styles.colorItemSelected,
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
                                             <View style={[
                                                 styles.processedImagePreview,
                                                 { backgroundColor: bgRemovalState.backgroundColor }
                                             ]}>
                                                 <Image
                                                     source={{ uri: bgRemovalState.processedImageData }}
                                                     style={{ width: '100%', height: '100%' }}
                                                     resizeMode="contain"
                                                 />
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
                        onPress={analyzeImage}
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
                                    onPress={() => setZoomModalVisible(true)}
                                >
                                    <Text style={styles.zoomButtonText}>🔍 Zoom & Explore Image</Text>
                                </TouchableOpacity>
                                <Image
                                    source={{ uri: `${API_URL}${analysisResult.comprehensive_annotation}` }}
                                    style={styles.annotationImageSmall}
                                />
                            </View>
                        )}

                        {/* Plants Table */}
                        {analysisResult.plants && analysisResult.plants.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>📊 Plant Measurements</Text>
                                <View style={styles.tableContainer}>
                                    {/* Table Header */}
                                    <View style={[styles.tableRow, styles.tableHeaderRow]}>
                                        <Text style={[styles.tableCell, styles.tableHeader, { flex: 0.8 }]}>ID</Text>
                                        <Text style={[styles.tableCell, styles.tableHeader, { flex: 1.2 }]}>Root (cm)</Text>
                                        <Text style={[styles.tableCell, styles.tableHeader, { flex: 1.2 }]}>Shoot (cm)</Text>
                                        <Text style={[styles.tableCell, styles.tableHeader, { flex: 1.2 }]}>Total (cm)</Text>
                                    </View>

                                    {/* Table Rows */}
                                    {analysisResult.plants.map((plant, idx) => (
                                        <View
                                            key={plant.id}
                                            style={[
                                                styles.tableRow,
                                                idx % 2 === 0 && styles.tableRowAlt,
                                                idx === analysisResult.plants!.length - 1 && styles.tableRowLast
                                            ]}
                                        >
                                            <Text style={[styles.tableCell, styles.tableCellBold, { flex: 0.8 }]}>P{plant.id}</Text>
                                            <Text style={[styles.tableCell, styles.tableCellRoot, { flex: 1.2 }]}>
                                                {plant.root_length_cm.toFixed(2)}
                                            </Text>
                                            <Text style={[styles.tableCell, styles.tableCellShoot, { flex: 1.2 }]}>
                                                {plant.shoot_length_cm.toFixed(2)}
                                            </Text>
                                            <Text style={[styles.tableCell, styles.tableCellTotal, { flex: 1.2 }]}>
                                                {plant.total_length_cm.toFixed(2)}
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
                                                    {analysisResult.statistics.average_root_length_cm?.toFixed(2) || '0'}
                                                </Text>
                                                <Text style={styles.statUnit}>cm</Text>
                                            </View>
                                            <View style={styles.statCard}>
                                                <Text style={styles.statLabel}>Avg Shoot</Text>
                                                <Text style={styles.statValue}>
                                                    {analysisResult.statistics.average_shoot_length_cm?.toFixed(2) || '0'}
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
                                                <Text style={styles.sviTitle}>🌱 Seed Vigour Index (SVI)</Text>

                                                {/* Formula Box */}
                                                <View style={styles.formulaBox}>
                                                    <Text style={styles.formulaTitle}>Formula:</Text>
                                                    <View style={styles.formulaLine}>
                                                        <Text style={styles.formulaText}>SVI = (Avg Root + Avg Shoot) × Germination %</Text>
                                                    </View>
                                                </View>

                                                {/* Input Values */}
                                                <View style={styles.valuesGrid}>
                                                    <View style={styles.valueCard}>
                                                        <Text style={styles.valueLabel}>Total Seeds</Text>
                                                        <Text style={styles.valueNumber}>{calculateSVI()?.totalSeeds}</Text>
                                                    </View>
                                                    <View style={styles.valueCard}>
                                                        <Text style={styles.valueLabel}>Germinated</Text>
                                                        <Text style={styles.valueNumber}>{calculateSVI()?.germinatedSeeds}</Text>
                                                    </View>
                                                    <View style={styles.valueCard}>
                                                        <Text style={styles.valueLabel}>Avg Root</Text>
                                                        <Text style={styles.valueNumber}>{analysisResult.statistics.average_root_length_cm?.toFixed(2)} cm</Text>
                                                    </View>
                                                    <View style={styles.valueCard}>
                                                        <Text style={styles.valueLabel}>Avg Shoot</Text>
                                                        <Text style={styles.valueNumber}>{analysisResult.statistics.average_shoot_length_cm?.toFixed(2)} cm</Text>
                                                    </View>
                                                </View>

                                                {/* Calculation Steps */}
                                                <View style={styles.calculationBox}>
                                                    <Text style={styles.calcLabel}>Calculation:</Text>
                                                    <Text style={styles.calcStep}>Germination % = ({calculateSVI()?.germinatedSeeds} / {calculateSVI()?.totalSeeds}) × 100 = <Text style={styles.calcValue}>{calculateSVI()?.germinationPercentage}%</Text></Text>
                                                    <Text style={styles.calcStep}>Avg Length = {analysisResult.statistics.average_root_length_cm?.toFixed(2)} + {analysisResult.statistics.average_shoot_length_cm?.toFixed(2)} = <Text style={styles.calcValue}>{calculateSVI()?.avgLength} cm</Text></Text>
                                                    <Text style={styles.calcStep}>SVI = {calculateSVI()?.avgLength} × {calculateSVI()?.germinationPercentage} = <Text style={styles.calcValue}>{calculateSVI()?.svi}</Text></Text>
                                                </View>

                                                {/* Final Result */}
                                                <View style={styles.sviResultBox}>
                                                    <Text style={styles.sviResultLabel}>Seed Vigour Index (SVI)</Text>
                                                    <Text style={styles.sviResultFinal}>{calculateSVI()?.svi}</Text>
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

                {/* Instructions */}
                <View style={styles.instructionsSection}>
                    <Text style={styles.instructionsTitle}>📋 How to Use</Text>
                    <Text style={styles.instructionText}>1. Capture or upload a seedling image</Text>
                    <Text style={styles.instructionText}>2. Ensure plants are clearly visible</Text>
                    <Text style={styles.instructionText}>3. Include a 2.4cm coin for calibration</Text>
                    <Text style={styles.instructionText}>4. Tap "Analyze Image" to process</Text>
                    <Text style={styles.instructionText}>5. View measurements in the results table</Text>
                    <Text style={styles.instructionText}>6. Tap "Zoom & Explore" button to open full image</Text>
                </View>

                {/* Footer Spacing */}
                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Zoom Modal with Pinch-to-Zoom */}
            <Modal
                visible={zoomModalVisible}
                transparent={false}
                animationType="fade"
                onRequestClose={() => setZoomModalVisible(false)}
            >
                <SafeAreaView style={styles.zoomOverlay}>
                    <View style={styles.zoomHeader}>
                        <Text style={styles.zoomHelpText}>🔍 Pinch to zoom • Scroll to pan</Text>
                        <TouchableOpacity
                            onPress={() => {
                                setZoomScale(1);
                                setZoomModalVisible(false);
                            }}
                            style={styles.zoomCloseButton}
                        >
                            <Text style={styles.zoomCloseText}>✕ Close</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        ref={zoomScrollRef}
                        style={styles.zoomContainer}
                        scrollEnabled={true}
                        contentContainerStyle={styles.zoomContentContainer}
                        maximumZoomScale={5}
                        minimumZoomScale={1}
                        onScroll={(event) => {
                            const scale = event.nativeEvent.zoomScale || 1;
                            setZoomScale(scale);
                        }}
                        scrollEventThrottle={16}
                        bouncesZoom={true}
                        directionalLockEnabled={false}
                    >
                        {analysisResult?.comprehensive_annotation && (
                            <Image
                                source={{ uri: `${API_URL}${analysisResult.comprehensive_annotation}` }}
                                style={styles.zoomImage}
                                resizeMode="contain"
                            />
                        )}
                    </ScrollView>

                    <View style={styles.zoomFooter}>
                        <Text style={styles.zoomScaleText}>Zoom: {zoomScale.toFixed(1)}x</Text>
                    </View>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0fdf4',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        backgroundColor: '#fff5e6',
        paddingVertical: 28,
        paddingHorizontal: 24,
        alignItems: 'center',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        marginBottom: 20,
        shadowColor: '#fb923c',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 12,
        borderBottomWidth: 3,
        borderBottomColor: '#16a34a',
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#16a34a',
        marginBottom: 6,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 14,
        color: '#fb923c',
        letterSpacing: 0.8,
        fontWeight: '700',
        marginBottom: 12,
    },
    testButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#3b82f6',
        borderRadius: 8,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    testButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    section: {
        marginHorizontal: 12,
        marginBottom: 18,
        paddingTop: 12,
        paddingHorizontal: 20,
        paddingBottom: 24,
        backgroundColor: '#ffffff',
        borderRadius: 18,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 6,
        borderLeftWidth: 5,
        borderLeftColor: '#16a34a',
        borderTopWidth: 1,
        borderTopColor: '#dcfce7',
        borderRightWidth: 1,
        borderRightColor: '#e8e8e8',
        borderBottomWidth: 2,
        borderBottomColor: '#dcfce7',
    },
    sectionTitle: {
        fontSize: 19,
        fontWeight: '800',
        color: '#16a34a',
        marginBottom: 16,
        letterSpacing: 0.3,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 10,
    },
    button: {
        flex: 1,
        paddingVertical: 15,
        paddingHorizontal: 12,
        borderRadius: 14,
        alignItems: 'center',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 5,
    },
    buttonPrimary: {
        backgroundColor: '#16a34a',
    },
    buttonSecondary: {
        backgroundColor: '#fb923c',
    },
    buttonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    imageContainer: {
        flex: 1,
        position: 'relative',
        alignItems: 'center',
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#f5f5f5',
        borderWidth: 2,
        borderColor: '#e0e0e0',
        paddingBottom: 12,
        maxHeight: 350,
    },
    image: {
        width: '100%',
        height: 300,
        resizeMode: 'contain',
        backgroundColor: '#f9fafb',
    },
    imageWrapperContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginHorizontal: 8,
        marginBottom: 16,
        paddingVertical: 12,
    },
    rotateButtonLeft: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#8b5cf6',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    rotateButtonRight: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#8b5cf6',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    rotateButtonIconText: {
        fontSize: 24,
        color: '#fff',
        fontWeight: '700',
    },
    removeButtonCorner: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#dc2626',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 5,
    },
    removeTextCorner: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
    },
    rotationControls: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginTop: 24,
        marginBottom: 14,
        width: '100%',
    },
    rotateButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#fb923c',
        borderRadius: 8,
        shadowColor: '#fb923c',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    rotateButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    rotationDisplay: {
        backgroundColor: '#1f2937',
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 8,
        marginTop: 8,
        borderWidth: 2,
        borderColor: '#8b5cf6',
    },
    rotationText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#8b5cf6',
    },
    analyzeSection: {
        marginHorizontal: 12,
        marginBottom: 18,
    },
    analyzeButton: {
        backgroundColor: '#16a34a',
        paddingVertical: 18,
        paddingHorizontal: 24,
        borderRadius: 18,
        alignItems: 'center',
        shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 8,
        borderBottomWidth: 3,
        borderBottomColor: '#15803d',
    },
    disabledButton: {
        backgroundColor: '#9ca3af',
        opacity: 0.6,
    },
    analyzeButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    zoomButton: {
        backgroundColor: '#16a34a',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 14,
        shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 4,
    },
    zoomButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    annotationImageSmall: {
        width: '90%',
        height: 220,
        borderRadius: 14,
        borderWidth: 3,
        borderColor: '#16a34a',
        alignSelf: 'center',
        marginTop: 12,
    },
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
        paddingVertical: 14,
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
    tableRowLast: {
        borderBottomWidth: 0,
    },
    tableCell: {
        fontSize: 13,
        color: '#374151',
        fontWeight: '500',
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
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 4,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff5e6',
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderRadius: 14,
        alignItems: 'center',
        borderLeftWidth: 4,
        borderLeftColor: '#fb923c',
        borderTopWidth: 1,
        borderTopColor: '#fed7aa',
        shadowColor: '#fb923c',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statLabel: {
        fontSize: 12,
        color: '#92400e',
        marginBottom: 6,
        fontWeight: '600',
        letterSpacing: 0.2,
    },
    statValue: {
        fontSize: 22,
        fontWeight: '800',
        color: '#16a34a',
    },
    statUnit: {
        fontSize: 11,
        color: '#b45309',
        marginTop: 4,
        fontWeight: '600',
    },
    sviSection: {
        marginTop: 20,
        padding: 16,
        backgroundColor: '#f0fdf4',
        borderRadius: 14,
        borderLeftWidth: 5,
        borderLeftColor: '#16a34a',
        borderTopWidth: 1,
        borderTopColor: '#dcfce7',
    },
    sviTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#16a34a',
        marginBottom: 16,
        textAlign: 'center',
    },
    formulaBox: {
        backgroundColor: '#ffffff',
        padding: 12,
        borderRadius: 10,
        borderLeftWidth: 4,
        borderLeftColor: '#fb923c',
        marginBottom: 14,
    },
    formulaTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#b45309',
        marginBottom: 6,
    },
    formulaLine: {
        backgroundColor: '#fff5e6',
        padding: 10,
        borderRadius: 8,
    },
    formulaText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#7c2d12',
        fontStyle: 'italic',
    },
    valuesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 14,
    },
    valueCard: {
        width: '48%',
        backgroundColor: '#ffffff',
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#dcfce7',
    },
    valueLabel: {
        fontSize: 11,
        color: '#6b7280',
        fontWeight: '600',
        marginBottom: 4,
    },
    valueNumber: {
        fontSize: 16,
        fontWeight: '800',
        color: '#16a34a',
    },
    calculationBox: {
        backgroundColor: '#ffffff',
        padding: 12,
        borderRadius: 10,
        marginBottom: 14,
        borderLeftWidth: 4,
        borderLeftColor: '#3b82f6',
    },
    calcLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1e40af',
        marginBottom: 8,
    },
    calcStep: {
        fontSize: 12,
        color: '#374151',
        fontWeight: '500',
        marginBottom: 6,
        lineHeight: 18,
    },
    calcValue: {
        fontWeight: '800',
        color: '#16a34a',
    },
    sviResultBox: {
        backgroundColor: '#dcfce7',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#16a34a',
    },
    sviResultLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#15803d',
        marginBottom: 8,
    },
    sviResultFinal: {
        fontSize: 36,
        fontWeight: '900',
        color: '#16a34a',
    },
    clearButton: {
        backgroundColor: '#dc2626',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 14,
        alignItems: 'center',
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 4,
        borderBottomWidth: 2,
        borderBottomColor: '#b91c1c',
    },
    clearButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    instructionsSection: {
        marginHorizontal: 12,
        marginBottom: 20,
        paddingVertical: 18,
        paddingHorizontal: 16,
        backgroundColor: '#fff5e6',
        borderRadius: 16,
        borderLeftWidth: 5,
        borderLeftColor: '#fb923c',
        borderTopWidth: 1,
        borderTopColor: '#fed7aa',
        borderRightWidth: 1,
        borderRightColor: '#f5deb3',
    },
    instructionsTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#b45309',
        marginBottom: 12,
        letterSpacing: 0.2,
    },
    instructionText: {
        fontSize: 13,
        color: '#7c2d12',
        marginBottom: 8,
        lineHeight: 20,
        fontWeight: '500',
    },
    zoomOverlay: {
        flex: 1,
        backgroundColor: '#000000',
    },
    zoomHeader: {
        backgroundColor: '#1f2937',
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: '#16a34a',
    },
    zoomHelpText: {
        color: '#16a34a',
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 0.2,
        flex: 1,
    },
    zoomCloseButton: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        backgroundColor: '#dc2626',
        borderRadius: 8,
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 3,
    },
    zoomCloseText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 13,
        letterSpacing: 0.2,
    },
    zoomContainer: {
        flex: 1,
        backgroundColor: '#000000',
    },
    zoomContentContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100%',
    },
    zoomImage: {
        width: '90%',
        height: 1000,
    },
    zoomFooter: {
        backgroundColor: '#1f2937',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderTopWidth: 2,
        borderTopColor: '#16a34a',
        alignItems: 'center',
    },
    zoomScaleText: {
        color: '#16a34a',
        fontSize: 13,
        fontWeight: '700',
    },
    bgRemovalSection: {
        marginHorizontal: 12,
        marginVertical: 16,
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#f3e8ff',
        borderRadius: 16,
        borderLeftWidth: 5,
        borderLeftColor: '#a78bfa',
        borderTopWidth: 1,
        borderTopColor: '#e9d5ff',
    },
    bgRemovalTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#6d28d9',
        marginBottom: 14,
        letterSpacing: 0.2,
    },
    bgButton: {
        backgroundColor: '#8b5cf6',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 4,
        borderBottomWidth: 2,
        borderBottomColor: '#6d28d9',
        marginBottom: 12,
    },
    bgButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    colorPaletteToggle: {
        backgroundColor: '#c4b5fd',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#a78bfa',
    },
    colorPaletteToggleText: {
        color: '#5b21b6',
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    colorPaletteGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
        justifyContent: 'space-between',
    },
    colorItem: {
        width: '22%',
        aspectRatio: 1,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#e9d5ff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 2,
    },
    colorItemSelected: {
        borderWidth: 3,
        borderColor: '#1f2937',
        shadowOpacity: 0.35,
    },
    colorItemCheckmark: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '900',
        textShadowColor: '#000',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    processedImagePreview: {
        width: '100%',
        height: 260,
        borderRadius: 12,
        marginTop: 12,
        overflow: 'hidden',
    },

});

export default App;
