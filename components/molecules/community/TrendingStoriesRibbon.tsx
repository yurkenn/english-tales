import { FC, memo } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { useTheme, Theme } from '@/theme';

import { Typography } from '@/components/atoms/Typography';
import { OptimizedImage } from '@/components/atoms/OptimizedImage';
import { haptics } from '@/utils/haptics';
import type { Story } from '@/types';

interface TrendingStoriesRibbonProps {
    stories: Story[];
    containerPadding: number;
}

export const TrendingStoriesRibbon: FC<TrendingStoriesRibbonProps> = memo(({
    stories,
    containerPadding,
}) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const router = useRouter();
    const styles = createStyles(theme);

    if (stories.length === 0) return null;

    return (
        <View style={styles.trendingSection}>
            <View style={styles.sectionHeader}>
                <Feather name="trending-up" size={14} color={theme.colors.primary} />
                <Typography variant="label" color={theme.colors.primary} style={{ marginLeft: 6 }}>
                    {t('social.trendingNow', 'Trending Now')}
                </Typography>
            </View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.trendingScroll, { paddingHorizontal: containerPadding }]}
            >
                {stories.map((story) => (
                    <View key={story.id} style={styles.trendingItem}>
                        <Pressable
                            onPress={() => { haptics.selection(); router.push(`/story/${story.id}`); }}
                            style={styles.trendingCoverWrapper}
                        >
                            <OptimizedImage
                                source={{ uri: story.coverImage }}
                                style={styles.trendingCover}
                            />
                            <View style={styles.hotBadge}>
                                <Feather name="zap" size={10} color="#FFF" />
                            </View>
                        </Pressable>
                        <Typography variant="label" numberOfLines={1} style={styles.trendingTitle}>
                            {story.title}
                        </Typography>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
});

TrendingStoriesRibbon.displayName = 'TrendingStoriesRibbon';

function createStyles(theme: Theme) {
    return StyleSheet.create({
        trendingSection: {
            marginBottom: theme.spacing.xl,
        },
        sectionHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: theme.spacing.lg,
            marginBottom: theme.spacing.md,
        },
        trendingScroll: {
            paddingHorizontal: theme.spacing.lg,
            gap: theme.spacing.lg,
        },
        trendingItem: {
            width: 70,
            alignItems: 'center',
        },
        trendingCoverWrapper: {
            width: 70,
            height: 100,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.surfaceElevated,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: theme.colors.borderLight,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 6,
            elevation: 4,
        },
        trendingCover: {
            width: '100%',
            height: '100%',
        },
        hotBadge: {
            position: 'absolute',
            top: theme.spacing.xs,
            right: theme.spacing.xs,
            width: 20,
            height: 20,
            borderRadius: theme.radius.full,
            backgroundColor: theme.colors.error,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: '#FFF',
        },
        trendingTitle: {
            marginTop: theme.spacing.sm,
            width: '100%',
            textAlign: 'center',
        },
    });
}
