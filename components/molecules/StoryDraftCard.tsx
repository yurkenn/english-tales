import { FC } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useTheme, Theme } from '@/theme';
import { Typography } from '@/components/atoms/Typography';
import { OptimizedImage } from '@/components/atoms/OptimizedImage';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { haptics } from '@/utils/haptics';
import { formatDistanceToNow } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import i18n from '@/i18n';
import { UserStory, StoryStatus } from '@/store/userStoryStore';
import { StatusBadge } from '@/components/atoms/StatusBadge';

interface StoryDraftCardProps {
    story: UserStory;
    onPress: () => void;
    onMorePress?: () => void;
}


export const StoryDraftCard: FC<StoryDraftCardProps> = ({
    story,
    onPress,
    onMorePress,
}) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const currentLanguage = i18n.language || 'en';

    const statusKey = (story.isPublished ? 'published' : story.status) as StoryStatus;

    const locale = currentLanguage === 'tr' ? tr : enUS;
    const lastUpdated = story.updatedAt
        ? formatDistanceToNow(new Date(story.updatedAt), { addSuffix: true, locale })
        : '';

    const handlePress = () => {
        haptics.selection();
        onPress();
    };

    const handleMorePress = () => {
        haptics.selection();
        onMorePress?.();
    };

    return (
        <Pressable
            style={({ pressed }) => [
                styles.container,
                pressed && styles.containerPressed,
            ]}
            onPress={handlePress}
        >
            {/* Cover Image */}
            <View style={styles.coverContainer}>
                {story.coverImageUrl ? (
                    <OptimizedImage
                        source={{ uri: story.coverImageUrl }}
                        style={styles.cover}
                    />
                ) : (
                    <View style={[styles.cover, styles.coverPlaceholder]}>
                        <Feather name="image" size={24} color={theme.colors.textMuted} />
                    </View>
                )}
            </View>

            {/* Content */}
            <View style={styles.content}>
                <View style={styles.topRow}>
                    <Typography variant="body" numberOfLines={1} style={styles.title}>
                        {story.title || t('write.untitled', 'Untitled Story')}
                    </Typography>
                    {onMorePress && (
                        <Pressable
                            onPress={handleMorePress}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            style={styles.moreButton}
                        >
                            <Feather name="more-horizontal" size={18} color={theme.colors.textMuted} />
                        </Pressable>
                    )}
                </View>

                {story.description && (
                    <Typography variant="caption" numberOfLines={2} style={styles.description}>
                        {story.description}
                    </Typography>
                )}

                <View style={styles.metaRow}>
                    {/* Status Badge */}
                    <StatusBadge status={statusKey} />

                    {/* Word Count */}
                    {story.wordCount !== undefined && story.wordCount > 0 && (
                        <View style={styles.wordCount}>
                            <Feather name="file-text" size={12} color={theme.colors.textMuted} />
                            <Typography variant="caption" style={styles.metaText}>
                                {t('write.wordCount', '{{count}} words', { count: story.wordCount })}
                            </Typography>
                        </View>
                    )}
                </View>

                {/* Last Updated */}
                {lastUpdated && (
                    <Typography variant="caption" style={styles.lastUpdated}>
                        {lastUpdated}
                    </Typography>
                )}
            </View>
        </Pressable>
    );
};

function createStyles(theme: Theme) {
    return StyleSheet.create({
        container: {
            flexDirection: 'row',
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.lg,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.md,
            borderWidth: 1,
            borderColor: theme.colors.borderLight,
            ...theme.shadows.sm,
        },
        containerPressed: {
            opacity: 0.9,
            transform: [{ scale: 0.99 }],
        },
        coverContainer: {
            marginRight: theme.spacing.md,
        },
        cover: {
            width: 72,
            height: 100,
            borderRadius: theme.radius.md,
        },
        coverPlaceholder: {
            backgroundColor: theme.colors.surfaceElevated,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: theme.colors.borderLight,
            borderStyle: 'dashed',
        },
        content: {
            flex: 1,
            justifyContent: 'space-between',
        },
        topRow: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
        },
        title: {
            flex: 1,
            fontWeight: '600',
            color: theme.colors.text,
            marginRight: theme.spacing.sm,
        },
        moreButton: {
            padding: theme.spacing.xs,
            marginTop: -theme.spacing.xs,
            marginRight: -theme.spacing.xs,
        },
        description: {
            color: theme.colors.textMuted,
            marginTop: theme.spacing.xs,
            lineHeight: 18,
        },
        metaRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.sm,
            marginTop: theme.spacing.sm,
        },
        wordCount: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.xxs,
        },
        metaText: {
            color: theme.colors.textMuted,
            fontSize: 11,
        },
        lastUpdated: {
            color: theme.colors.textMuted,
            marginTop: theme.spacing.xs,
            fontSize: 11,
        },
    });
}

export default StoryDraftCard;
