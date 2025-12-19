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
                <Ionicons name="close" size={24} color={theme.colors.text} />
            </Pressable>
            <View style={styles.titleContainer}>
                <View style={styles.titleRow}>
                    <Text style={styles.title} numberOfLines={1}>{title}</Text>
                    {isDownloaded && (
                        <Ionicons name="cloud-done" size={16} color={theme.colors.success} />
                    )}
                </View>
                <Text style={styles.subtitle}>{t('reading.chapter', { number: 1 })}</Text>
            </View>
            <Pressable style={styles.button} onPress={onSettings}>
                <Ionicons name="settings-outline" size={24} color={theme.colors.text} />
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
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    button: {
        width: 40,
        height: 40,
        borderRadius: theme.radius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleContainer: {
        flex: 1,
        alignItems: 'center',
        gap: 2,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    title: {
        fontSize: theme.typography.size.lg,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.text,
    },
    subtitle: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textSecondary,
    },
}));
