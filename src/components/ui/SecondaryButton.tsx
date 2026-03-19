/**
 * SecondaryButton.tsx
 *
 * Supporting action button in the brand orange.
 * Two visual variants:
 *  - 'outline' (default) – transparent fill, orange border + label
 *  - 'filled'            – solid orange fill, white label
 */
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';

interface SecondaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'outline' | 'filled';
  style?: ViewStyle;
  fullWidth?: boolean;
}

const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  title,
  onPress,
  disabled  = false,
  variant   = 'outline',
  style,
  fullWidth = true,
}) => (
  <TouchableOpacity
    style={[
      styles.base,
      variant === 'filled' ? styles.filled : styles.outline,
      fullWidth && styles.fullWidth,
      disabled  && styles.disabled,
      style,
    ]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.75}
  >
    <Text
      style={[
        styles.label,
        variant === 'filled' ? styles.labelFilled : styles.labelOutline,
      ]}
    >
      {title}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  base: {
    paddingVertical:  Spacing[8],
    paddingHorizontal: Spacing[12],
    borderRadius:     BorderRadius.md,
    alignItems:       'center',
    justifyContent:   'center',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth:     2,
    borderColor:     Colors.accent,
  },
  filled: {
    backgroundColor:  Colors.accent,
    borderBottomWidth: 3,
    borderBottomColor: Colors.accentDark,
    ...Shadows.orange,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize:      Typography.sizes.md,
    fontWeight:    Typography.weights.bold,
    letterSpacing: Typography.letterSpacing.wide,
  },
  labelOutline: {
    color: Colors.accent,
  },
  labelFilled: {
    color: Colors.white,
  },
});

export default SecondaryButton;
