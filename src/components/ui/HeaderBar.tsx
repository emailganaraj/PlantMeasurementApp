/**
 * HeaderBar.tsx
 *
 * Reusable top bar: app title + optional subtitle, back button, and right-action slot.
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Colors, Typography, Spacing, Shadows, BorderRadius } from '../../theme';

interface HeaderBarProps {
  title: string;
  subtitle?: string;
  /** Arbitrary JSX placed in the right slot (e.g. logout button) */
  rightAction?: React.ReactNode;
  showBackButton?: boolean;
  onBackPress?: () => void;
  style?: ViewStyle;
}

const HeaderBar: React.FC<HeaderBarProps> = ({
  title,
  subtitle,
  rightAction,
  showBackButton = false,
  onBackPress,
  style,
}) => (
  <View style={[styles.container, style]}>
    {/* Left – optional back button */}
    <View style={styles.side}>
      {showBackButton && (
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBackPress}
          activeOpacity={0.7}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
      )}
    </View>

    {/* Centre – title + subtitle */}
    <View style={styles.centre}>
      <Text style={styles.title} numberOfLines={2}>{title}</Text>
      {subtitle ? (
        <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text>
      ) : null}
    </View>

    {/* Right – action slot */}
    <View style={styles.side}>{rightAction ?? null}</View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceWarm,
    paddingTop: Spacing[10],
    paddingBottom: Spacing[8],
    paddingHorizontal: Spacing[8],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 3,
    borderBottomColor: Colors.primary,
    ...Shadows.orange,
  },
  side: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centre: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
  },
  title: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.black,
    color: Colors.primary,
    letterSpacing: Typography.letterSpacing.wide,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.accent,
    letterSpacing: Typography.letterSpacing.widest,
    textAlign: 'center',
    marginTop: Spacing[1],
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
  },
});

export default HeaderBar;
