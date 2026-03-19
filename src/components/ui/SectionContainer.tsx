/**
 * SectionContainer.tsx
 *
 * A styled card wrapper used to visually group related content.
 * Renders a white surface with a coloured left-border accent and optional title.
 */
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography, Spacing, Shadows, BorderRadius } from '../../theme';

interface SectionContainerProps {
  title?: string;
  children: React.ReactNode;
  /** Override the left-border accent colour (defaults to primary green) */
  accentColor?: string;
  style?: ViewStyle;
}

const SectionContainer: React.FC<SectionContainerProps> = ({
  title,
  children,
  accentColor = Colors.primary,
  style,
}) => (
  <View
    style={[
      styles.container,
      { borderLeftColor: accentColor },
      style,
    ]}
  >
    {title ? (
      <Text style={[styles.title, { color: accentColor }]}>{title}</Text>
    ) : null}
    {children}
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor:  Colors.surface,
    borderRadius:     BorderRadius.lg,
    paddingVertical:  Spacing[8],
    paddingHorizontal: Spacing[10],
    marginHorizontal: Spacing[6],
    marginBottom:     Spacing[9],
    borderLeftWidth:  5,
    borderTopWidth:   1,
    borderTopColor:   Colors.primaryLight,
    borderRightWidth: 1,
    borderRightColor: Colors.gray200,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primaryLight,
    ...Shadows.md,
  },
  title: {
    fontSize:      Typography.sizes.lg,
    fontWeight:    Typography.weights.extrabold,
    letterSpacing: Typography.letterSpacing.wide,
    marginBottom:  Spacing[8],
  },
});

export default SectionContainer;
