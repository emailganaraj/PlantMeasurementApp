/**
 * PrimaryButton.tsx
 *
 * The main call-to-action button.
 * Uses the brand green with a darker bottom-border for a tactile press feel.
 * Supports a loading spinner and disabled state.
 */
import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  /** Extra style overrides applied to the outer Touchable */
  style?: ViewStyle;
  fullWidth?: boolean;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading  = false,
  style,
  fullWidth = true,
}) => {
  const inactive = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        fullWidth && styles.fullWidth,
        inactive   && styles.inactive,
        style,
      ]}
      onPress={onPress}
      disabled={inactive}
      activeOpacity={0.82}
    >
      {loading ? (
        <ActivityIndicator size="small" color={Colors.white} />
      ) : (
        <Text style={styles.label}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    backgroundColor:  Colors.primary,
    paddingVertical:  Spacing[9],
    paddingHorizontal: Spacing[12],
    borderRadius:     BorderRadius.md,
    alignItems:       'center',
    justifyContent:   'center',
    borderBottomWidth: 3,
    borderBottomColor: Colors.primaryDark,
    ...Shadows.green,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  inactive: {
    backgroundColor:  Colors.gray400,
    borderBottomColor: Colors.gray500,
    opacity:          0.6,
    shadowOpacity:    0,
    elevation:        0,
  },
  label: {
    fontSize:      Typography.sizes.md,
    fontWeight:    Typography.weights.bold,
    color:         Colors.white,
    letterSpacing: Typography.letterSpacing.wide,
  },
});

export default PrimaryButton;
