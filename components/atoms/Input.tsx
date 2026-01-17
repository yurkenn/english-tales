import { FC, useState } from 'react';
import { View, TextInput, TextInputProps, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme, Theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from './Typography';

interface InputProps extends TextInputProps {
    label?: string;
    icon?: keyof typeof Ionicons.glyphMap;
    error?: string;
    onClear?: () => void;
}

export const Input: FC<InputProps> = ({
    label,
    icon,
    error,
    onClear,
    style,
    ...props
}) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const [isFocused, setIsFocused] = useState(false);

    return (
        <View style={styles.container}>
            {label && (
                <Typography variant="label" color={theme.colors.textSecondary} style={styles.label}>
                    {label}
                </Typography>
            )}

            <View style={[
                styles.inputWrapper,
                {
                    borderColor: error
                        ? theme.colors.error
                        : isFocused
                            ? theme.colors.primary
                            : theme.colors.borderLight,
                    backgroundColor: isFocused ? theme.colors.surface : theme.colors.surfaceElevated
                }
            ]}>
                {icon && (
                    <Ionicons
                        name={icon}
                        size={20}
                        color={isFocused ? theme.colors.primary : theme.colors.textMuted}
                        style={styles.icon}
                    />
                )}

                <TextInput
                    style={[
                        styles.input,
                        { color: theme.colors.text },
                        props.multiline && { height: 'auto', paddingTop: 12 },
                        style
                    ]}
                    placeholderTextColor={theme.colors.textMuted}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    {...props}
                />

                {onClear && props.value && props.value.length > 0 && (
                    <TouchableOpacity onPress={onClear} style={styles.clearButton} activeOpacity={0.6}>
                        <Ionicons name="close-circle" size={18} color={theme.colors.textMuted} />
                    </TouchableOpacity>
                )}
            </View>

            {error && (
                <Typography variant="caption" color={theme.colors.error} style={styles.errorText}>
                    {error}
                </Typography>
            )}
        </View>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
    container: {
        width: '100%',
    },
    label: {
        marginBottom: 8,
        marginLeft: 4,
        fontSize: theme.typography.size.sm,
        fontWeight: '600',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderRadius: 16,
        paddingHorizontal: 12,
        height: 52,
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: theme.typography.size.md,
        height: '100%',
    },
    clearButton: {
        padding: 4,
    },
    errorText: {
        marginTop: 4,
        marginLeft: 4,
    },
});
