/**
 * AnalysisHistoryScreen.tsx
 *
 * Fetches and displays a list of past analyses for the logged-in user.
 * Fixes:
 * - Correctly calculates and displays SVI, germination %, and analysis name.
 * - Passes all required data to the detail screen.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

interface AnalysisHistoryProps {
    userId: string;
    apiUrl: string;
}

const AnalysisHistoryScreen: React.FC<AnalysisHistoryProps> = ({ userId, apiUrl }) => {
    const [analyses, setAnalyses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation<any>();

    const fetchAnalyses = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${apiUrl}/user-analyses/${userId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch analyses');
            }
            const data = await response.json();
            setAnalyses(data.analyses || []);
        } catch (error) {
            console.error('Fetch analyses error:', error);
        } finally {
            setLoading(false);
        }
    };

    // useFocusEffect will re-fetch data every time the screen comes into view
    useFocusEffect(
        useCallback(() => {
            fetchAnalyses();
        }, [userId, apiUrl])
    );

    const renderItem = ({ item, index }: { item: any, index: number }) => {
        const analysisName = item.analysis_name || 'Untitled Analysis';
        const germinationPercentage = item.germination_percentage || 0;

        const stats = item.statistics;
        const avgRoot = stats?.avg_biggest_root_length_cm ?? stats?.average_root_length_cm ?? 0;
        const avgShoot = stats?.avg_biggest_shoot_length_cm ?? stats?.average_shoot_length_cm ?? 0;
        const avgLength = avgRoot + avgShoot;

        // SVI = (Avg Length in cm) * (Germination Percentage as a whole number)
        const svi = avgLength * germinationPercentage;

        // Manual measurements (if available)
        const manualMeasurements = item.manual_measurements?.measurements || [];
        let manualAvgLength = 0;
        let manualSvi = 0;
        if (manualMeasurements.length > 0) {
          const totalManualLength = manualMeasurements.reduce((acc: number, m: any) => 
            acc + (m.root_length_cm + m.shoot_length_cm), 0);
          manualAvgLength = totalManualLength / manualMeasurements.length;
          manualSvi = manualAvgLength * germinationPercentage;
        }

        const runNumber = analyses.length - index;
        const date = new Date(item.timestamp).toLocaleDateString();
        const time = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const thumbnailUrl = item.comprehensive_annotation || item.debug_images?.comprehensive_annotation;

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('AnalysisDetail', { analysis: item, apiUrl: apiUrl })}
            >
                {thumbnailUrl && (
                    <Image
                        source={{ uri: `${apiUrl}${thumbnailUrl}` }}
                        style={styles.thumbnail}
                    />
                )}
                <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.analysisName} numberOfLines={1}>{analysisName}</Text>
                        <Text style={styles.runNumber}>#{runNumber}</Text>
                    </View>
                    <Text style={styles.dateTime}>{date} at {time}</Text>

                    <View style={styles.statsGrid}>
                         <View style={styles.statBox}>
                             <Text style={styles.statLabel}>Germ %</Text>
                             <Text style={styles.statValue}>{germinationPercentage.toFixed(0)}%</Text>
                         </View>
                         <View style={styles.statBox}>
                             <Text style={styles.statLabel}>Avg Len</Text>
                             <Text style={styles.statValue}>{avgLength.toFixed(2)}</Text>
                         </View>
                         <View style={[styles.statBox, styles.sviStatBox, { minWidth: 55 }]}>
                             <Text style={[styles.statLabel, styles.sviLabel]}>SVI</Text>
                             <Text style={[styles.statValue, styles.sviValue, { fontSize: 12 }]}>{svi.toFixed(0)}</Text>
                         </View>
                     </View>

                     {/* Manual Measurements Row */}
                     {manualAvgLength > 0 && (
                       <View style={[styles.statsGrid, styles.manualStatsGrid]}>
                         <View style={styles.statBox}>
                             <Text style={styles.statLabel}>Avg. Length (Manual)</Text>
                             <Text style={styles.statValue}>{manualAvgLength.toFixed(2)} cm</Text>
                         </View>
                         <View style={[styles.statBox, styles.sviStatBoxManual]}>
                             <Text style={[styles.statLabel, styles.sviLabelManual]}>SVI (Manual)</Text>
                             <Text style={[styles.statValue, styles.sviValueManual]}>{manualSvi.toFixed(0)}</Text>
                         </View>
                       </View>
                     )}
                </View>
            </TouchableOpacity>
        );
    };

    if (loading && analyses.length === 0) {
        return <ActivityIndicator size="large" color="#16a34a" style={{ flex: 1 }} />;
    }

    return (
        <FlatList
            data={analyses}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            style={styles.container}
            contentContainerStyle={{ padding: 10 }}
            ListEmptyComponent={<Text style={styles.emptyText}>No analyses found.</Text>}
            refreshControl={
                <RefreshControl refreshing={loading} onRefresh={fetchAnalyses} colors={["#16a34a"]} />
            }
        />
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0fdf4',
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        marginVertical: 8,
        marginHorizontal: 4,
        flexDirection: 'row',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderLeftWidth: 5,
        borderLeftColor: '#16a34a',
    },
    thumbnail: {
        width: 80,
        height: 80,
        borderRadius: 12,
        backgroundColor: '#f0f0f0',
        marginRight: 16,
    },
    cardContent: {
        flex: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    analysisName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        flex: 1,
    },
    runNumber: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#fff',
        backgroundColor: '#8b5cf6',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        overflow: 'hidden',
    },
    dateTime: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 12,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statBox: {
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 10,
        minWidth: 70,
    },
    sviStatBox: {
        backgroundColor: '#fffbeb',
    },
    statLabel: {
        fontSize: 11,
        color: '#4b5563',
        fontWeight: '600',
    },
    sviLabel: {
        color: '#d97706',
    },
    statValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#16a34a',
    },
    sviValue: {
        color: '#f59e0b',
    },
    manualStatsGrid: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    sviStatBoxManual: {
        backgroundColor: '#f3e8ff',
    },
    sviLabelManual: {
        color: '#7c3aed',
    },
    sviValueManual: {
        color: '#7c3aed',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
        color: '#6b7280',
    },
});

export default AnalysisHistoryScreen;