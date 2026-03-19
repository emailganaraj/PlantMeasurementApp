/**
 * CardTile.tsx
 *
 * Animated dashboard action tile.
 * Features:
 *  - Staggered fade-in + slide-up entry (via entryDelay prop)
 *  - Spring press-scale feedback
 *  - Colour-coded left-border accent and icon bubble
 *  - Optional "Coming Soon" badge overlay
 */
import React, { useRef, useEffect } from 'react';
import {
  Animated,
  Pressable,
  Text,
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';

// ── Colour presets ────────────────────────────────────────────────────────────
type TileColor = 'green' | 'orange' | 'blue' | 'purple';

const PALETTE: Record<TileColor, {
  border: string;
  accent: string;
  iconBg: string;
  badgeBg: string;
}> = {
  green: {
    border:  Colors.primary,
    accent:  Colors.primary,
    iconBg:  Colors.primaryLight,
    badgeBg: Colors.primary,
  },
  orange: {
    border:  Colors.accent,
    accent:  Colors.accent,
    iconBg:  Colors.accentLight,
    badgeBg: Colors.accent,
  },
  blue: {
    border:  Colors.info,
    accent:  Colors.info,
    iconBg:  Colors.infoLight,
    badgeBg: Colors.info,
  },
  purple: {
    border:  Colors.purple,
    accent:  Colors.purple,
    iconBg:  Colors.purpleLight,
    badgeBg: Colors.purple,
  },
};

// ── Props ─────────────────────────────────────────────────────────────────────
export interface CardTileProps {
  /** Emoji or short text icon */
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  color?: TileColor;
  disabled?: boolean;
  /** Short label rendered as a pill in the top-right corner */
  badge?: string;
  /** Delay (ms) before the entry animation starts – used for stagger */
  entryDelay?: number;
  style?: ViewStyle;
}

// ── Component ─────────────────────────────────────────────────────────────────
const CardTile: React.FC<CardTileProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  color = 'green',
  disabled = false,
  badge,
  entryDelay = 0,
  style,
}) => {
  const pal = PALETTE[color];

  // Animated values
  const scaleAnim   = useRef(new Animated.Value(1)).current;
  const entryOpacity = useRef(new Animated.Value(0)).current;
  const entrySlide   = useRef(new Animated.Value(28)).current;

  // Entry animation (runs once on mount, staggered via entryDelay)
  useEffect(() => {
    const id = setTimeout(() => {
      Animated.parallel([
        Animated.timing(entryOpacity, {
          toValue: 1,
          duration: 380,
          useNativeDriver: true,
        }),
        Animated.spring(entrySlide, {
          toValue: 0,
          tension: 65,
          friction: 9,
          useNativeDriver: true,
        }),
      ]).start();
    }, entryDelay);
    return () => clearTimeout(id);
  }, [entryDelay, entryOpacity, entrySlide]);

  // Press animations
  const onPressIn = () =>
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      tension: 250,
      friction: 10,
      useNativeDriver: true,
    }).start();

  const onPressOut = () =>
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 250,
      friction: 10,
      useNativeDriver: true,
    }).start();

  return (
    <Animated.View
      style={[
        {
          opacity: entryOpacity,
          transform: [{ translateY: entrySlide }, { scale: scaleAnim }],
        },
        style,
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        style={[
          styles.tile,
          { borderLeftColor: pal.border, borderTopColor: pal.border + '22' },
          disabled && styles.disabled,
        ]}
      >
        {/* Icon bubble */}
        <View style={[styles.iconBubble, { backgroundColor: pal.iconBg }]}>
          <Text style={styles.iconText}>{icon}</Text>
        </View>

        {/* Text block */}
        <View style={styles.textBlock}>
          <Text style={[styles.tileTitle, { color: pal.accent }]}>{title}</Text>
          {subtitle ? (
            <Text style={styles.tileSubtitle} numberOfLines={2}>{subtitle}</Text>
          ) : null}
        </View>

        {/* Chevron */}
        <Text style={[styles.chevron, { color: pal.accent }]}>›</Text>

        {/* Badge */}
        {badge ? (
          <View style={[styles.badge, { backgroundColor: pal.badgeBg }]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  tile: {
    backgroundColor: Colors.surface,
    borderRadius:    BorderRadius.lg,
    paddingVertical: Spacing[8],
    paddingHorizontal: Spacing[8],
    flexDirection:   'row',
    alignItems:      'center',
    marginBottom:    Spacing[6],
    borderLeftWidth: 5,
    borderTopWidth:  1,
    // Neutral shadow
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius:  8,
    elevation:     5,
    overflow:      'hidden',
  },
  disabled: {
    opacity: 0.5,
  },
  iconBubble: {
    width:          56,
    height:         56,
    borderRadius:   BorderRadius['2xl'],
    justifyContent: 'center',
    alignItems:     'center',
    marginRight:    Spacing[8],
  },
  iconText: {
    fontSize: 26,
  },
  textBlock: {
    flex: 1,
  },
  tileTitle: {
    fontSize:      Typography.sizes.lg,
    fontWeight:    Typography.weights.extrabold,
    letterSpacing: Typography.letterSpacing.wide,
    marginBottom:  Spacing[1],
  },
  tileSubtitle: {
    fontSize:   Typography.sizes.sm,
    color:      Colors.gray500,
    fontWeight: Typography.weights.medium,
    lineHeight: Typography.lineHeights.snug,
  },
  chevron: {
    fontSize:    30,
    fontWeight:  Typography.weights.bold,
    marginLeft:  Spacing[4],
    opacity:     0.55,
  },
  badge: {
    position:       'absolute',
    top:            Spacing[4],
    right:          Spacing[6],
    paddingHorizontal: Spacing[5],
    paddingVertical:   Spacing[1],
    borderRadius:   BorderRadius.full,
  },
  badgeText: {
    fontSize:      Typography.sizes.xs,
    fontWeight:    Typography.weights.bold,
    color:         Colors.white,
    letterSpacing: Typography.letterSpacing.wide,
  },
});

export default CardTile;
