import React from 'react';
import { View, TextInput, Pressable, Text } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';

interface SearchBarProps {
    placeholder?: string;
    value?: string;
    onChangeText?: (text: string) => void;
    onSubmit?: () => void;
    onMicPress?: () => void;
    onClear?: () => void;
    onPress?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
    placeholder = 'Search English stories...',
    value,
    onChangeText,
    onSubmit,
    onMicPress,
    onClear,
    onPress,
}) => {
    const { theme } = useUnistyles();

    // If onPress is provided, render as a button (for navigation to search screen)
    if (onPress) {
        return (
            <Pressable style={styles.container} onPress={onPress}>
                <View style={styles.iconContainer}>
                    <Ionicons
                        name="search"
                        size={theme.iconSize.md}
                        color={theme.colors.textMuted}
                    />
                </View>
                <View style={styles.inputContainer}>
                    <Text style={styles.placeholderText}>{placeholder}</Text>
                </View>
            </Pressable>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <Ionicons
                    name="search"
                    size={theme.iconSize.md}
                    color={theme.colors.textMuted}
                />
            </View>
            <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor={theme.colors.textMuted}
                value={value}
                onChangeText={onChangeText}
                onSubmitEditing={onSubmit}
                returnKeyType="search"
                autoCapitalize="none"
                autoCorrect={false}
            />
            {value && onClear && (
                <Pressable
                    style={styles.rightButton}
                    onPress={onClear}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons
                        name="close-circle"
                        size={theme.iconSize.md}
                        color={theme.colors.textMuted}
                    />
                </Pressable>
            )}
            {onMicPress && (
                <Pressable
                    style={styles.rightButton}
                    onPress={onMicPress}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons
                        name="mic-outline"
                        size={theme.iconSize.md}
                        color={theme.colors.textMuted}
                    />
                </Pressable>
            )}
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xl,
        height: 48,
        paddingHorizontal: theme.spacing.md,
        ...theme.shadows.sm,
    },
    iconContainer: {
        marginRight: theme.spacing.sm,
    },
    input: {
        flex: 1,
        fontSize: theme.typography.size.lg,
        color: theme.colors.text,
        height: '100%',
    },
    rightButton: {
        marginLeft: theme.spacing.sm,
        padding: theme.spacing.xs,
    },
    inputContainer: {
        flex: 1,
        height: '100%',
        justifyContent: 'center',
    },
    placeholderText: {
        fontSize: theme.typography.size.lg,
        color: theme.colors.textMuted,
    },
}));
