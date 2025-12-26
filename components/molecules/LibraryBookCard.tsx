import React, { memo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { ProgressBar, OptimizedImage, BookCover } from '../atoms';
import { useTranslation } from 'react-i18next';
import type { LibraryItemWithProgress } from './moleculeTypes';

interface LibraryBookCardProps {
    item: LibraryItemWithProgress;
    isDownloaded: boolean;
    onPress: () => void;
    onReadPress: () => void;
    onMorePress: () => void;
    moreButtonRef?: (ref: View | null) => void;
}

const LibraryBookCardComponent: React.FC<LibraryBookCardProps> = ({
    item,
    isDownloaded,
    onPress,
    onReadPress,
    onMorePress,
    moreButtonRef,
}) => {
    const { theme } = useUnistyles();
    const { t } = useTranslation();
    const progress = item.progress?.percentage || 0;
    const isCompleted = item.progress?.isCompleted || false;

    return (
        <Pressable style={styles.bookItem} onPress={onPress}>
            <BookCover
                source={{ uri: item.story.coverImage }}
                width={84}
                height={120}
                borderRadius={theme.radius.md}
                sharedTransitionTag={`story-image-${item.story.id}`}
            />
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
                                <Text style={styles.offlineBadgeText}>{t('library.actions.downloaded', 'Offline')}</Text>
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
                            <Text style={styles.completedText}>{t('library.status.done', 'Completed')}</Text>
                        </View>
                    ) : progress > 0 ? (
                        <View style={styles.progressInfo}>
                            <ProgressBar progress={progress} height={6} />
                            <Text style={styles.progressText}>
                                {t('library.readingProgress', { percentage: progress, defaultValue: `${progress}% complete` })}
                            </Text>
                        </View>
                    ) : (
                        <Text style={styles.notStartedText}>{t('library.status.new', 'Not started')}</Text>
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
                        {progress > 0 ? t('reading.continue', 'Continue') : t('reading.startReading', 'Start Reading')}
                    </Text>
                </Pressable>
            </View>
        </Pressable >
    );
};

// Memoize component to prevent unnecessary re-renders in lists
export const LibraryBookCard = memo(LibraryBookCardComponent, (prevProps, nextProps) => {
    return prevProps.item.storyId === nextProps.item.storyId
        && prevProps.item.progress?.percentage === nextProps.item.progress?.percentage
        && prevProps.isDownloaded === nextProps.isDownloaded;
});

const styles = StyleSheet.create((theme) => ({
    bookItem: {
        flexDirection: 'row',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
        gap: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.sm,
    },
    bookCover: {
        width: 84,
        height: 120,
        borderRadius: 12,
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
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
        gap: theme.spacing.xxs,
    },
    bookTitle: {
        fontSize: theme.typography.size.xl,
        fontWeight: 'bold',
        color: theme.colors.text,
        letterSpacing: -0.4,
    },
    bookAuthor: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textMuted,
        fontWeight: '500',
    },
    offlineBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
        marginTop: theme.spacing.xs,
    },
    offlineBadgeText: {
        fontSize: theme.typography.size.xs,
        color: theme.colors.success,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    moreButton: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
    },
    progressSection: {
        paddingVertical: theme.spacing.xs + 2, // 6
    },
    progressInfo: {
        gap: theme.spacing.xs + 2, // 6
    },
    progressText: {
        fontSize: theme.typography.size.sm,
        fontWeight: '600',
        color: theme.colors.textSecondary,
    },
    completedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs + 2, // 6
    },
    completedText: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.success,
        fontWeight: 'bold',
    },
    notStartedText: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textMuted,
        fontWeight: '500',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.xs + 2, // 6
        backgroundColor: theme.colors.primary + '10',
        height: 40,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.primary + '20',
    },
    actionButtonText: {
        fontSize: theme.typography.size.md,
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
}));
