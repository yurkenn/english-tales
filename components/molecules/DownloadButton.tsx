import React from 'react';
import { Pressable, Text, ActivityIndicator, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { DownloadStatus, formatBytes } from '@/store/downloadStore';

interface DownloadButtonProps {
    status: DownloadStatus;
    sizeBytes?: number;
    onDownload: () => void;
    onDelete: () => void;
    compact?: boolean;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({
    status,
    sizeBytes,
    onDownload,
    onDelete,
    compact = false,
}) => {
    const { theme } = useUnistyles();

    if (status === 'downloading') {
        return (
            <View style={[styles.button, styles.downloading, compact && styles.compact]}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                {!compact && <Text style={styles.downloadingText}>Downloading...</Text>}
            </View>
        );
    }

    if (status === 'downloaded') {
        return (
            <Pressable
                style={[styles.button, styles.downloaded, compact && styles.compact]}
                onPress={onDelete}
            >
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                {!compact && (
                    <Text style={styles.downloadedText}>
                        Downloaded {sizeBytes ? `(${formatBytes(sizeBytes)})` : ''}
                    </Text>
                )}
            </Pressable>
        );
    }

    return (
        <Pressable
            style={[styles.button, styles.idle, compact && styles.compact]}
            onPress={onDownload}
        >
            <Ionicons name="download-outline" size={20} color={theme.colors.primary} />
            {!compact && <Text style={styles.idleText}>Download for Offline</Text>}
        </Pressable>
    );
};

const styles = StyleSheet.create((theme) => ({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.radius.lg,
    },
    compact: {
        width: 44,
        height: 44,
        paddingHorizontal: 0,
        paddingVertical: 0,
        borderRadius: theme.radius.full,
    },
    idle: {
        backgroundColor: `${theme.colors.primary}15`,
    },
    downloading: {
        backgroundColor: theme.colors.backgroundSecondary,
    },
    downloaded: {
        backgroundColor: `${theme.colors.success}15`,
    },
    idleText: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.primary,
    },
    downloadingText: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textSecondary,
    },
    downloadedText: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.medium,
        color: theme.colors.success,
    },
}));
