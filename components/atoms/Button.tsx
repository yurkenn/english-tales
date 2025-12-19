import React, { forwardRef } from 'react';
import { Text, Pressable, PressableProps, ActivityIndicator, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { haptics } from '@/utils/haptics';
export interface ButtonProps extends Omit<PressableProps, 'children'> {
  /** Text to display on the button */
  title?: string;
  /** If true, the button will show a loading indicator and be disabled */
  loading?: boolean;
  /** Optional icon name from Ionicons */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Position of the icon relative to the text */
  iconPosition?: 'left' | 'right';
  /** Visual variant of the button */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'error';
  /** Size variant of the button */
  size?: 'sm' | 'md' | 'lg';
  /** If true, the button will take up the full width of its container */
  fullWidth?: boolean;
  /** Children to render inside the button, overrides `title` if provided */
  children?: React.ReactNode;
}

/**
 * Reusable Button component with multiple variants and sizes.
 * Supports loading state, icons, and haptic feedback.
 */
export const Button = forwardRef<View, ButtonProps>(({
  title,
  loading = false,
  icon,
  iconPosition = 'left',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled,
  style,
  onPress,
  children,
  ...props
}, ref) => {
  const { theme } = useUnistyles();

  const handlePress = (e: any) => {
    if (disabled || loading) return;
    haptics.selection();
    onPress?.(e);
  };

  const sizeStyles = {
    sm: { paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.md, minHeight: 36 },
    md: { paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.lg, minHeight: 44 },
    lg: { paddingVertical: theme.spacing.lg, paddingHorizontal: theme.spacing.xl, minHeight: 52 },
  };

  const variantStyles = {
    primary: {
      backgroundColor: theme.colors.primary,
      borderWidth: 0,
      borderColor: 'transparent',
    },
    secondary: {
      backgroundColor: theme.colors.backgroundSecondary,
      borderWidth: 0,
      borderColor: 'transparent',
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderWidth: 0,
      borderColor: 'transparent',
    },
    error: {
      backgroundColor: theme.colors.error,
      borderWidth: 0,
      borderColor: 'transparent',
    },
  };

  const textColor = variant === 'primary' || variant === 'error'
    ? theme.colors.textInverse
    : variant === 'outline' || variant === 'ghost'
      ? theme.colors.primary
      : theme.colors.text;

  const iconSize = size === 'sm' ? 16 : size === 'md' ? 20 : 24;
  const textSize = size === 'sm' ? theme.typography.size.sm : size === 'md' ? theme.typography.size.md : theme.typography.size.lg;

  return (
    <Pressable
      ref={ref}
      style={({ pressed }) => [
        styles.button,
        sizeStyles[size],
        variantStyles[variant],
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && !loading && styles.pressed,
        style as any,
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons name={icon} size={iconSize} color={textColor} style={styles.iconLeft} />
          )}
          {children || <Text style={[styles.buttonText, { color: textColor, fontSize: textSize }]}>{title}</Text>}
          {icon && iconPosition === 'right' && (
            <Ionicons name={icon} size={iconSize} color={textColor} style={styles.iconRight} />
          )}
        </>
      )}
    </Pressable>
  );
});

Button.displayName = 'Button';

const styles = StyleSheet.create((theme) => ({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderRadius: theme.radius.xl,
    ...theme.shadows.md,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.8,
  },
  buttonText: {
    fontFamily: theme.typography.fontFamily.semiBold,
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: theme.spacing.xs,
  },
  iconRight: {
    marginLeft: theme.spacing.xs,
  },
}));
