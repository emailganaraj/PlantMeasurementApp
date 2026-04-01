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
  Image,
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
    {/* Left – ICAR-NISST Logo */}
    <View style={styles.side}>
      <Image 
        source={require('../../assets/image/icar_nisst_logo_left.png')} 
        style={styles.leftLogo}
        resizeMode="contain"
      />
    </View>

    {/* Centre – title + subtitle */}
    <View style={styles.centre}>
      <Text style={styles.title} numberOfLines={2}>{title}</Text>
      {subtitle ? (
        <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text>
      ) : null}
    </View>

    {/* Right – ICAR-NISST Logo */}
    <View style={styles.side}>
      <Image 
        source={require('../../assets/image/icar_nisst_logo_right.png')} 
        style={styles.rightLogo}
        resizeMode="contain"
      />
    </View>
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  leftLogo: {
    position: 'absolute',
    left: -45,
    width: 140,
    height: 70,
  },
  rightLogo: {
    position: 'absolute',
    right: -45,
    width: 140,
    height: 70,
  },
  centre: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
  },
  title: {
    fontSize: Typography.sizes.xl,
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
