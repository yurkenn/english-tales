import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { ProgressBar } from '@/components';
import type { LibraryItemWithProgress } from './types';

interface LibraryBookCardProps {
    item: LibraryItemWithProgress;
    isDownloaded: boolean;
    onPress: () => void;
    onReadPress: () => void;
    onMorePress: () => void;
    moreButtonRef?: (ref: View | null) => void;
}

export const LibraryBookCard: React.FC<LibraryBookCardProps> = ({
    item,
    isDownloaded,
    onPress,
    onReadPress,
    onMorePress,
    moreButtonRef,
}) => {
    const { theme } = useUnistyles();
    const progress = item.progress?.percentage || 0;
    const isCompleted = item.progress?.isCompleted || false;

    return (
        <Pressable style={styles.bookItem} onPress={onPress}>
            <Image source={{ uri: item.story.coverImage }} style={styles.bookCover} />
            <View style={styles.bookInfo}>
                <View style={styles.bookHeader}>
                    <View style={styles.bookTitleContainer}>
                        <Text style={styles.bookTitle} numberOfLines={1}>
                            {item.story.title}
                        </Text>
                        <Text style={styles.bookAuthor} numberOfLines={1}>
                            {item.story.author}
                        </Text>
                        {isDownloaded && (
                            <View style={styles.offlineBadge}>
                                <Ionicons name="cloud-done" size={12} color={theme.colors.success} />
                                <Text style={styles.offlineBadgeText}>Offline</Text>
                            </View>
                        )}
                    </View>
                    <View ref={moreButtonRef} collapsable={false}>
                        <Pressable
                            style={styles.moreButton}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            onPress={onMorePress}
                        >
                            <Ionicons
                                name="ellipsis-vertical"
                                size={theme.iconSize.sm}
                                color={theme.colors.textMuted}
                            />
                        </Pressable>
                    </View>
                </View>

                {/* Progress */}
                <View style={styles.progressSection}>
                    {isCompleted ? (
                        <View style={styles.completedBadge}>
                            <Ionicons
                                name="checkmark-circle"
                                size={14}
                                color={theme.colors.success}
                            />
                            <Text style={styles.completedText}>Completed</Text>
                        </View>
                    ) : progress > 0 ? (
                        <View style={styles.progressInfo}>
                            <ProgressBar progress={progress} height={6} />
                            <Text style={styles.progressText}>{progress}% complete</Text>
                        </View>
                    ) : (
                        <Text style={styles.notStartedText}>Not started</Text>
                    )}
                </View>

                {/* Action Button */}
                <Pressable style={styles.actionButton} onPress={onReadPress}>
                    <Ionicons
                        name={progress > 0 ? 'play' : 'book-outline'}
                        size={16}
                        color={theme.colors.primary}
                    />
                    <Text style={styles.actionButtonText}>
                        {progress > 0 ? 'Continue' : 'Start Reading'}
                    </Text>
                </Pressable>
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create((theme) => ({
    bookItem: {
        flexDirection: 'row',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xl,
        padding: theme.spacing.md,
        gap: theme.spacing.lg,
        ...theme.shadows.sm,
    },
    bookCover: {
        width: 80,
        height: 120,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.borderLight,
    },
    bookInfo: {
        flex: 1,
        justifyContent: 'space-between',
    },
    bookHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    bookTitleContainer: {
        flex: 1,
        gap: 2,
    },
    bookTitle: {
        fontSize: theme.typography.size.lg,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    bookAuthor: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textSecondary,
    },
    offlineBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    offlineBadgeText: {
        fontSize: theme.typography.size.xs,
        color: theme.colors.success,
        fontWeight: theme.typography.weight.medium,
    },
    moreButton: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressSection: {
        paddingVertical: theme.spacing.sm,
    },
    progressInfo: {
        gap: theme.spacing.xs,
    },
    progressText: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textSecondary,
    },
    completedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
    },
    completedText: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.success,
        fontWeight: theme.typography.weight.medium,
    },
    notStartedText: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textMuted,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.xs,
        backgroundColor: `${theme.colors.primary}15`,
        height: 36,
        borderRadius: theme.radius.md,
    },
    actionButtonText: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.primary,
    },
}));
