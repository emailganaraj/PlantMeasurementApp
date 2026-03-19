/**
 * AnalysisHistoryScreen.tsx
 *
 * Fetches and displays a list of past analyses for the logged-in user.
 * Fixes:
 * - Correctly calculates and displays SVI, germination %, and analysis name.
 * - Passes all required data to the detail screen.
 */
import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme';

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
        }, [])
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
                         <View style={[styles.statBox, styles.sviStatBox, styles.sviStatBoxMinWidth]}>
                             <Text style={[styles.statLabel, styles.sviLabel]}>SVI</Text>
                             <Text style={[styles.statValue, styles.sviValue, styles.sviValueSmallText]}>{svi.toFixed(0)}</Text>
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
        return <ActivityIndicator size="large" color={Colors.primary} style={styles.loadingIndicator} />;
    }

    return (
        <FlatList
            data={analyses}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            style={styles.container}
            contentContainerStyle={{ padding: Spacing[5] }}
            ListEmptyComponent={<Text style={styles.emptyText}>No analyses found.</Text>}
            refreshControl={
                <RefreshControl refreshing={loading} onRefresh={fetchAnalyses} colors={[Colors.primary]} />
            }
        />
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.primaryBg,
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing[8],
        marginVertical: Spacing[2],
        marginHorizontal: Spacing[1],
        flexDirection: 'row',
        ...Shadows.sm,
        borderLeftWidth: 5,
        borderLeftColor: Colors.primary,
    },
    thumbnail: {
        width: 80,
        height: 80,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.gray100,
        marginRight: Spacing[8],
    },
    cardContent: {
        flex: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing[1],
    },
    analysisName: {
        fontSize: Typography.sizes.lg,
        fontWeight: Typography.weights.bold,
        color: Colors.gray800,
        flex: 1,
    },
    runNumber: {
        fontSize: Typography.sizes.sm,
        fontWeight: Typography.weights.bold,
        color: Colors.white,
        backgroundColor: Colors.purple,
        paddingHorizontal: Spacing[2],
        paddingVertical: Spacing[1],
        borderRadius: BorderRadius.sm,
        overflow: 'hidden',
    },
    dateTime: {
        fontSize: Typography.sizes.sm,
        color: Colors.gray500,
        marginBottom: Spacing[3],
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statBox: {
        alignItems: 'center',
        backgroundColor: Colors.gray100,
        borderRadius: BorderRadius.sm,
        paddingVertical: Spacing[2],
        paddingHorizontal: Spacing[5],
        minWidth: 70,
    },
    sviStatBox: {
        backgroundColor: Colors.accentBg,
    },
    statLabel: {
        fontSize: Typography.sizes.xs,
        color: Colors.gray600,
        fontWeight: Typography.weights.semibold,
    },
    sviLabel: {
        color: Colors.warning,
    },
    statValue: {
        fontSize: 14,
        fontWeight: Typography.weights.bold,
        color: Colors.primary,
    },
    sviValue: {
        color: Colors.warning,
    },
    manualStatsGrid: {
        marginTop: Spacing[2],
        paddingTop: Spacing[2],
        borderTopWidth: 1,
        borderTopColor: Colors.gray200,
    },
    sviStatBoxManual: {
        backgroundColor: Colors.purpleLight,
    },
    sviLabelManual: {
        color: Colors.purpleDark,
    },
    sviValueManual: {
        color: Colors.purpleDark,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: Typography.sizes.md,
        color: Colors.gray500,
    },
    loadingIndicator: {
        flex: 1,
    },
    sviStatBoxMinWidth: {
        minWidth: 55,
    },
    sviValueSmallText: {
        fontSize: Typography.sizes.sm,
    },
});

export default AnalysisHistoryScreen;