import React from 'react';
import { View, Text, TextInput, TextInputProps, ViewStyle, StyleProp } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';

/**
 * Props for the FormField component
 */
export interface FormFieldProps extends TextInputProps {
    /** Label text displayed above the input */
    label?: string;
    /** Optional icon name from Ionicons displayed on the left */
    icon?: keyof typeof Ionicons.glyphMap;
    /** Error message displayed below the input */
    error?: string;
    /** Helper text displayed below the input when there is no error */
    helperText?: string;
    /** Optional container style override */
    containerStyle?: StyleProp<ViewStyle>;
}

/**
 * Reusable form field component that includes a label, icon, and error handling.
 */
export const FormField: React.FC<FormFieldProps> = ({
    label,
    icon,
    error,
    helperText,
    containerStyle,
    style,
    ...textInputProps
}) => {
    const { theme } = useUnistyles();
    const hasError = !!error;

    return (
        <View style={[styles.container, containerStyle]}>
            {label && (
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                    {label}
                </Text>
            )}
            <View
                style={[
                    styles.inputContainer,
                    {
                        backgroundColor: theme.colors.surface,
                        borderColor: hasError ? theme.colors.error : theme.colors.borderLight,
                    },
                    hasError && styles.inputContainerError,
                ]}
            >
                {icon && (
                    <Ionicons
                        name={icon}
                        size={20}
                        color={hasError ? theme.colors.error : theme.colors.textSecondary}
                        style={styles.inputIcon}
                    />
                )}
                <TextInput
                    style={[styles.input, { color: theme.colors.text }, style]}
                    placeholderTextColor={theme.colors.textMuted}
                    accessibilityLabel={label || textInputProps.placeholder}
                    accessibilityHint={error || helperText}
                    accessibilityState={{ disabled: !!textInputProps.editable === false }}
                    {...textInputProps}
                />
            </View>
            {error && (
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={14} color={theme.colors.error} />
                    <Text style={[styles.errorText, { color: theme.colors.error }]}>
                        {error}
                    </Text>
                </View>
            )}
            {helperText && !error && (
                <Text style={[styles.helperText, { color: theme.colors.textMuted }]}>
                    {helperText}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    label: {
        fontSize: theme.typography.size.sm,
        fontWeight: theme.typography.weight.semibold,
        marginBottom: theme.spacing.xs,
        marginLeft: theme.spacing.xs,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: theme.radius.xl,
        borderWidth: 1,
        height: 56,
        paddingHorizontal: theme.spacing.lg,
    },
    inputContainerError: {
        borderWidth: 1.5,
    },
    inputIcon: {
        marginRight: theme.spacing.md,
    },
    input: {
        flex: 1,
        fontSize: theme.typography.size.md,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: theme.spacing.xs,
        marginLeft: theme.spacing.xs,
        gap: theme.spacing.xs,
    },
    errorText: {
        fontSize: theme.typography.size.sm,
        fontWeight: theme.typography.weight.medium,
    },
    helperText: {
        fontSize: theme.typography.size.xs,
        marginTop: theme.spacing.xs,
        marginLeft: theme.spacing.xs,
    },
    container: {
        width: '100%',
        marginBottom: theme.spacing.md,
    },
}));
