/**
 * AnalysisDetailScreen.tsx
 *
 * Displays the full details of a single analysis.
 * Fixes:
 * - Correctly constructs the full URL for the annotation image.
 * - Replaces the plant-wise measurement list with a data table.
 * - Displays all metadata correctly.
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Modal, SafeAreaView } from 'react-native';

const AnalysisDetailScreen = ({ route }: { route: any }) => {
    const { analysis, apiUrl } = route.params;
    const [zoomModalVisible, setZoomModalVisible] = React.useState(false);

    // Safely get metadata
    const analysisName = analysis.analysis_name || 'Untitled Analysis';
    const date = new Date(analysis.timestamp).toLocaleDateString();
    const time = new Date(analysis.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const germinationPercentage = analysis.germination_percentage || 0;
    const seedsKept = analysis.total_seeds_kept || 0;
    const seedsGerminated = analysis.total_seeds_germinated || 0;

    // Calculate SVI
    const stats = analysis.statistics;
    const avgRoot = stats?.avg_biggest_root_length_cm ?? stats?.average_root_length_cm ?? 0;
    const avgShoot = stats?.avg_biggest_shoot_length_cm ?? stats?.average_shoot_length_cm ?? 0;
    const svi = (avgRoot + avgShoot) * germinationPercentage;

    // Fix: Construct full image URL
    const annotationUrl = analysis.comprehensive_annotation || analysis.debug_images?.comprehensive_annotation;
    const fullImageUrl = annotationUrl ? `${apiUrl}${annotationUrl}` : null;

    // Fix: Create a plants array for the table, similar to App.tsx
    const plants = (analysis.per_plant || []).map((plant: any) => ({
        id: plant.plant_id,
        root_length_cm: plant.biggest_root_length_cm ?? plant.root_length_cm ?? 0,
        shoot_length_cm: plant.biggest_shoot_length_cm ?? plant.shoot_length_cm ?? 0,
        total_length_cm: (plant.biggest_root_length_cm ?? plant.root_length_cm ?? 0) + (plant.biggest_shoot_length_cm ?? plant.shoot_length_cm ?? 0),
    }));

    return (
        <ScrollView style={styles.container}>
            {/* Analysis Info */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Analysis Info</Text>
                <Text style={styles.infoText}><Text style={styles.infoLabel}>Name:</Text> {analysisName}</Text>
                <Text style={styles.infoText}><Text style={styles.infoLabel}>Date:</Text> {date} at {time}</Text>
            </View>

            {/* Germination & Vigour */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Germination & Vigour</Text>
                <View style={styles.vigourGrid}>
                    <View style={styles.vigourCard}><Text style={styles.vigourLabel}>Seeds Kept</Text><Text style={styles.vigourValue}>{seedsKept}</Text></View>
                    <View style={styles.vigourCard}><Text style={styles.vigourLabel}>Germinated</Text><Text style={styles.vigourValue}>{seedsGerminated}</Text></View>
                    <View style={styles.vigourCard}><Text style={styles.vigourLabel}>Germ. %</Text><Text style={styles.vigourValue}>{germinationPercentage.toFixed(0)}%</Text></View>
                    <View style={[styles.vigourCard, styles.sviCard]}><Text style={[styles.vigourLabel, styles.sviLabel]}>SVI</Text><Text style={[styles.vigourValue, styles.sviValue]}>{svi.toFixed(0)}</Text></View>
                </View>
            </View>

            {/* Comprehensive Annotation */}
            {fullImageUrl && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Annotated Image</Text>
                    <TouchableOpacity onPress={() => setZoomModalVisible(true)}>
                        <Image source={{ uri: fullImageUrl }} style={styles.annotationImage} />
                        <Text style={styles.zoomText}>🔍 Tap to zoom</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Plant-wise Measurements Table */}
            {plants.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Plant-wise Measurements</Text>
                    <View style={tableStyles.tableContainer}>
                        <View style={[tableStyles.tableRow, tableStyles.tableHeaderRow]}>
                            <Text style={[tableStyles.tableCell, tableStyles.tableHeader, { flex: 0.8 }]}>ID</Text>
                            <Text style={[tableStyles.tableCell, tableStyles.tableHeader, { flex: 1.2 }]}>Root (cm)</Text>
                            <Text style={[tableStyles.tableCell, tableStyles.tableHeader, { flex: 1.2 }]}>Shoot (cm)</Text>
                            <Text style={[tableStyles.tableCell, tableStyles.tableHeader, { flex: 1.2 }]}>Total (cm)</Text>
                        </View>
                        {plants.map((plant, idx) => (
                            <View key={plant.id} style={[tableStyles.tableRow, idx % 2 === 0 && tableStyles.tableRowAlt]}>
                                <Text style={[tableStyles.tableCell, tableStyles.tableCellBold, { flex: 0.8 }]}>P{plant.id}</Text>
                                <Text style={[tableStyles.tableCell, tableStyles.tableCellRoot, { flex: 1.2 }]}>{plant.root_length_cm.toFixed(2)}</Text>
                                <Text style={[tableStyles.tableCell, tableStyles.tableCellShoot, { flex: 1.2 }]}>{plant.shoot_length_cm.toFixed(2)}</Text>
                                <Text style={[tableStyles.tableCell, tableStyles.tableCellTotal, { flex: 1.2 }]}>{plant.total_length_cm.toFixed(2)}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            {/* Zoom Modal */}
            <Modal
                visible={zoomModalVisible}
                transparent={false}
                animationType="fade"
                onRequestClose={() => setZoomModalVisible(false)}
            >
                <SafeAreaView style={styles.zoomOverlay}>
                    <TouchableOpacity onPress={() => setZoomModalVisible(false)} style={styles.zoomCloseButton}>
                        <Text style={styles.zoomCloseText}>✕ Close</Text>
                    </TouchableOpacity>
                    <Image source={{ uri: fullImageUrl }} style={styles.zoomImage} resizeMode="contain" />
                </SafeAreaView>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0fdf4',
        padding: 10,
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
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#16a34a',
        marginBottom: 12,
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
});

export default AnalysisDetailScreen;