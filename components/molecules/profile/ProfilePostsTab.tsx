import { FC, memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme, Theme } from '@/theme';

import { CommunityPostCard } from '@/components/organisms/CommunityPostCard';
import { EmptyState } from '@/components/molecules/EmptyState';
import type { CommunityPost } from '@/types';

interface ProfilePostsTabProps {
    posts: CommunityPost[];
    currentUserId?: string;
}

export const ProfilePostsTab: FC<ProfilePostsTabProps> = memo(({
    posts,
    currentUserId,
}) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const router = useRouter();
    const styles = createStyles(theme);

    if (posts.length === 0) {
        return (
            <EmptyState
                icon="chatbubble-ellipses-outline"
                title={t('profile.noPosts', 'No posts yet')}
                message={t('profile.noPostsMessage', 'Share your reading journey with the community!')}
                actionLabel={t('profile.shareFirst', 'Create Post')}
                onAction={() => router.push('/(tabs)/community')}
            />
        );
    }

    return (
        <View style={styles.feedContainer}>
            {posts.map((post) => (
                <CommunityPostCard
                    key={post.id}
                    post={post}
                    currentUserId={currentUserId}
                    onLike={() => { }}
                    onReply={() => { }}
                />
            ))}
        </View>
    );
});

ProfilePostsTab.displayName = 'ProfilePostsTab';

function createStyles(theme: Theme) {
    return StyleSheet.create({
        feedContainer: {
            padding: theme.spacing.lg,
            gap: theme.spacing.lg,
        },
    });
}
