/**
 * AnalysisListItem.tsx
 *
 * History-list card for a single past analysis.
 * Props mirror the fields computed in AnalysisHistoryScreen so this component
 * can be adopted there in a future phase without reshaping data.
 */
import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  Image,
  StyleSheet,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';

export interface AnalysisListItemProps {
  analysisName: string;
  date: string;
  time: string;
  germinationPercentage: number;
  /** avgRoot + avgShoot in cm */
  avgLength: number;
  svi: number;
  /** Descending run counter shown as a badge (e.g. analyses.length - index) */
  runNumber: number;
  /** Full image URI – omit to show the plant emoji placeholder */
  thumbnailUri?: string;
  onPress: () => void;
}

const AnalysisListItem: React.FC<AnalysisListItemProps> = ({
  analysisName,
  date,
  time,
  germinationPercentage,
  avgLength,
  svi,
  runNumber,
  thumbnailUri,
  onPress,
}) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
    {/* Thumbnail */}
    {thumbnailUri ? (
      <Image source={{ uri: thumbnailUri }} style={styles.thumb} />
    ) : (
      <View style={styles.thumbPlaceholder}>
        <Text style={styles.thumbIcon}>🌱</Text>
      </View>
    )}

    {/* Content */}
    <View style={styles.content}>
      {/* Header row – name + run badge */}
      <View style={styles.headerRow}>
        <Text style={styles.name} numberOfLines={1}>{analysisName}</Text>
        <View style={styles.runBadge}>
          <Text style={styles.runText}>#{runNumber}</Text>
        </View>
      </View>

      {/* Date / time */}
      <Text style={styles.dateTime}>{date} at {time}</Text>

      {/* Stats pills */}
      <View style={styles.statsRow}>
        <View style={styles.pill}>
          <Text style={styles.pillLabel}>Germ</Text>
          <Text style={styles.pillValue}>{germinationPercentage.toFixed(0)}%</Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.pillLabel}>Avg Len</Text>
          <Text style={styles.pillValue}>{avgLength.toFixed(2)}</Text>
        </View>
        <View style={[styles.pill, styles.sviPill]}>
          <Text style={[styles.pillLabel, styles.sviLabel]}>SVI</Text>
          <Text style={[styles.pillValue, styles.sviValue]}>{svi.toFixed(0)}</Text>
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor:  Colors.surface,
    borderRadius:     BorderRadius.lg,
    padding:          Spacing[8],
    marginVertical:   Spacing[4],
    marginHorizontal: Spacing[2],
    flexDirection:    'row',
    borderLeftWidth:  5,
    borderLeftColor:  Colors.primary,
    ...Shadows.sm,
  },
  thumb: {
    width:        80,
    height:       80,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray100,
    marginRight:  Spacing[8],
  },
  thumbPlaceholder: {
    width:          80,
    height:         80,
    borderRadius:   BorderRadius.md,
    backgroundColor: Colors.primaryLight,
    marginRight:    Spacing[8],
    justifyContent: 'center',
    alignItems:     'center',
  },
  thumbIcon: {
    fontSize: 32,
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    justifyContent: 'space-between',
    marginBottom:   Spacing[2],
  },
  name: {
    fontSize:   Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color:      Colors.gray800,
    flex:       1,
    marginRight: Spacing[4],
  },
  runBadge: {
    backgroundColor:  Colors.purple,
    paddingHorizontal: Spacing[4],
    paddingVertical:  Spacing[1],
    borderRadius:     BorderRadius.sm,
  },
  runText: {
    fontSize:   Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color:      Colors.white,
  },
  dateTime: {
    fontSize:    Typography.sizes.sm,
    color:       Colors.gray500,
    marginBottom: Spacing[5],
  },
  statsRow: {
    flexDirection: 'row',
    gap:           Spacing[4],
  },
  pill: {
    flex:             1,
    backgroundColor:  Colors.gray50,
    borderRadius:     BorderRadius.sm,
    paddingHorizontal: Spacing[4],
    paddingVertical:  Spacing[2],
    alignItems:       'center',
    borderWidth:      1,
    borderColor:      Colors.gray200,
  },
  pillLabel: {
    fontSize:   Typography.sizes.xs,
    color:      Colors.gray500,
    fontWeight: Typography.weights.semibold,
    marginBottom: 2,
  },
  pillValue: {
    fontSize:   Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color:      Colors.gray800,
  },
  sviPill: {
    backgroundColor: Colors.primaryLight,
    borderColor:     Colors.primaryLight,
  },
  sviLabel: {
    color: Colors.primaryDark,
  },
  sviValue: {
    color:      Colors.primary,
    fontWeight: Typography.weights.extrabold,
  },
});

export default AnalysisListItem;
