import React, { forwardRef } from 'react';
import { Text, Pressable, PressableProps, ActivityIndicator, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { haptics } from '@/utils/haptics';

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  title?: string;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children?: React.ReactNode;
}

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
  };

  const textColor = variant === 'primary'
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
    fontWeight: theme.typography.weight.semibold,
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: theme.spacing.xs,
  },
  iconRight: {
    marginLeft: theme.spacing.xs,
  },
}));
