import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

/**
 * Props for the ReadingHeader component
 */
interface ReadingHeaderProps {
    /** Title of the story being read */
    title: string;
    /** If the story is available offline */
    isDownloaded: boolean;
    /** Callback to close the reading screen */
    onClose: () => void;
    /** Callback to open the reading settings modal */
    onSettings: () => void;
}

/**
 * Header component for the reading screen.
 * Displays title, download status, and provides actions for closing and settings.
 */
export const ReadingHeader: React.FC<ReadingHeaderProps> = ({
    title,
    isDownloaded,
    onClose,
    onSettings,
}) => {
    const { t } = useTranslation();
    const { theme } = useUnistyles();

    return (
        <View style={styles.header}>
            <Pressable style={styles.button} onPress={onClose}>
                <Ionicons name="chevron-down" size={28} color={theme.colors.text} />
            </Pressable>

            <View style={styles.titleContainer}>
                <Text style={styles.title} numberOfLines={1}>{title}</Text>
                <View style={styles.badgeRow}>
                    <Text style={styles.subtitle}>{t('reading.chapter', { number: 1 }).toUpperCase()}</Text>
                    {isDownloaded && (
                        <View style={styles.offlineBadge}>
                            <Ionicons name="checkmark-circle" size={12} color={theme.colors.success} />
                            <Text style={styles.offlineText}>OFFLINE</Text>
                        </View>
                    )}
                </View>
            </View>

            <Pressable style={styles.button} onPress={onSettings}>
                <Ionicons name="options-outline" size={24} color={theme.colors.text} />
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.sm,
        borderBottomWidth: 0, // Cleaner look
    },
    button: {
        width: 44,
        height: 44,
        borderRadius: theme.radius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleContainer: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: theme.spacing.sm,
    },
    title: {
        fontSize: 15,
        fontFamily: theme.typography.fontFamily.heading,
        color: theme.colors.text,
        letterSpacing: -0.2,
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 2,
    },
    subtitle: {
        fontSize: 10,
        fontFamily: theme.typography.fontFamily.semiBold,
        color: theme.colors.textMuted,
        letterSpacing: 0.8,
    },
    offlineBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.success + '15',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        gap: 3,
    },
    offlineText: {
        fontSize: 9,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.success,
    },
}));
