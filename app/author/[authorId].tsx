import { useCallback, FC, memo } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useTheme, Theme } from '@/theme';
import { Typography } from '@/components/atoms/Typography';
import { DifficultyBadge } from '@/components/atoms/DifficultyBadge';
import { Button } from '@/components/atoms/Button';
import { useUserStoriesByAuthor } from '@/hooks/useQueries';
import { useAuthorFollow } from '@/hooks/useAuthorFollow';
import { useAuthStore } from '@/store/authStore';
import { haptics } from '@/utils/haptics';

interface StoryCardProps {
    story: any;
    onPress: () => void;
}

const StoryCard: FC<StoryCardProps> = memo(({ story, onPress }) => {
    const { theme } = useTheme();
    const styles = createCardStyles(theme);

    const readTime = Math.ceil((story.wordCount || 500) / 200);

    return (
        <Pressable onPress={onPress} style={styles.card}>
            {story.coverImageUrl ? (
                <Image source={{ uri: story.coverImageUrl }} style={styles.coverImage} contentFit="cover" />
            ) : (
                <View style={[styles.coverPlaceholder, { backgroundColor: theme.colors.primary + '20' }]}>
                    <Feather name="book-open" size={24} color={theme.colors.primary} />
                </View>
            )}
            <View style={styles.cardContent}>
                <Typography variant="body" weight="medium" numberOfLines={2}>
                    {story.title}
                </Typography>
                <Typography variant="caption" color={theme.colors.textMuted} numberOfLines={2} style={{ marginTop: 4 }}>
                    {story.description}
                </Typography>
                <View style={styles.cardMeta}>
                    <DifficultyBadge difficulty={story.difficulty} size="small" />
                    <View style={styles.metaItem}>
                        <Feather name="clock" size={12} color={theme.colors.textMuted} />
                        <Typography variant="caption" color={theme.colors.textMuted} style={{ marginLeft: 4 }}>
                            {readTime} min
                        </Typography>
                    </View>
                </View>
            </View>
        </Pressable>
    );
});

export default function AuthorProfileScreen() {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { authorId, authorName, authorAvatar } = useLocalSearchParams<{
        authorId: string;
        authorName: string;
        authorAvatar?: string;
    }>();

    const { data: stories = [], isLoading } = useUserStoriesByAuthor(authorId);
    const { isFollowing, followerCount, toggleFollow } = useAuthorFollow(authorId);
    const { user } = useAuthStore();

    const handleBack = useCallback(() => {
        haptics.selection();
        router.back();
    }, [router]);

    const handleStoryPress = useCallback((storyId: string) => {
        haptics.selection();
        router.push(`/user-story/${storyId}` as any);
    }, [router]);

    const handleToggleFollow = useCallback(async () => {
        if (!user) {
            Alert.alert('Sign In Required', 'Please sign in to follow authors.');
            return;
        }
        haptics.selection();
        await toggleFollow();
    }, [user, toggleFollow]);

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.container}>
                <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                    <Pressable onPress={handleBack} style={styles.backButton}>
                        <Feather name="arrow-left" size={24} color={theme.colors.text} />
                    </Pressable>
                    <Typography variant="h3">Author Profile</Typography>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView
                    style={styles.content}
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Author Info */}
                    <View style={styles.authorSection}>
                        {authorAvatar ? (
                            <Image source={{ uri: authorAvatar }} style={styles.avatar} contentFit="cover" />
                        ) : (
                            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primary }]}>
                                <Typography variant="h2" style={{ color: '#FFF' }}>
                                    {authorName?.charAt(0).toUpperCase()}
                                </Typography>
                            </View>
                        )}
                        <Typography variant="h2" style={styles.authorName}>{authorName}</Typography>
                        <View style={styles.authorBadge}>
                            <Feather name="edit-3" size={14} color={theme.colors.primary} />
                            <Typography variant="caption" style={{ color: theme.colors.primary, marginLeft: 6 }}>
                                Community Author
                            </Typography>
                        </View>
                        {/* Stats Row */}
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Typography variant="h3">{stories.length}</Typography>
                                <Typography variant="caption" color={theme.colors.textMuted}>
                                    {stories.length === 1 ? 'Story' : 'Stories'}
                                </Typography>
                            </View>
                            <View style={styles.statItem}>
                                <Typography variant="h3">{followerCount}</Typography>
                                <Typography variant="caption" color={theme.colors.textMuted}>
                                    {followerCount === 1 ? 'Follower' : 'Followers'}
                                </Typography>
                            </View>
                        </View>

                        {/* Follow Button */}
                        <Pressable
                            onPress={handleToggleFollow}
                            style={[
                                styles.followButton,
                                { backgroundColor: isFollowing ? theme.colors.surface : theme.colors.primary },
                            ]}
                        >
                            <Feather
                                name={isFollowing ? 'user-check' : 'user-plus'}
                                size={18}
                                color={isFollowing ? theme.colors.text : '#FFF'}
                            />
                            <Typography
                                variant="body"
                                weight="medium"
                                style={{ marginLeft: 8, color: isFollowing ? theme.colors.text : '#FFF' }}
                            >
                                {isFollowing ? 'Following' : 'Follow'}
                            </Typography>
                        </Pressable>
                    </View>

                    {/* Stories */}
                    <View style={styles.storiesSection}>
                        <Typography variant="h3" style={styles.sectionTitle}>Stories</Typography>

                        {isLoading ? (
                            <View style={styles.loadingContainer}>
                                <Typography color={theme.colors.textMuted}>Loading stories...</Typography>
                            </View>
                        ) : stories.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Feather name="book" size={48} color={theme.colors.textMuted} />
                                <Typography variant="body" color={theme.colors.textMuted} style={{ marginTop: 16 }}>
                                    No stories published yet
                                </Typography>
                            </View>
                        ) : (
                            <View style={styles.storiesGrid}>
                                {stories.map((story: any) => (
                                    <StoryCard
                                        key={story._id}
                                        story={story}
                                        onPress={() => handleStoryPress(story._id)}
                                    />
                                ))}
                            </View>
                        )}
                    </View>
                </ScrollView>
            </View>
        </>
    );
}

function createStyles(theme: Theme) {
    return StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.colors.background },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingBottom: 12,
            backgroundColor: theme.colors.background,
            zIndex: 10,
        },
        backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
        content: { flex: 1 },
        scrollContent: { paddingHorizontal: 20 },
        authorSection: {
            alignItems: 'center',
            paddingVertical: 32,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
        },
        avatar: {
            width: 100,
            height: 100,
            borderRadius: 50,
        },
        avatarPlaceholder: {
            width: 100,
            height: 100,
            borderRadius: 50,
            alignItems: 'center',
            justifyContent: 'center',
        },
        authorName: {
            marginTop: 16,
            textAlign: 'center',
        },
        authorBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 8,
            paddingHorizontal: 12,
            paddingVertical: 6,
            backgroundColor: theme.colors.primary + '15',
            borderRadius: 20,
        },
        storyCount: {
            marginTop: 12,
        },
        storiesSection: {
            paddingTop: 24,
        },
        sectionTitle: {
            marginBottom: 16,
        },
        loadingContainer: {
            alignItems: 'center',
            paddingVertical: 40,
        },
        emptyContainer: {
            alignItems: 'center',
            paddingVertical: 40,
        },
        storiesGrid: {
            gap: 16,
        },
        statsRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 32,
            marginTop: 16,
        },
        statItem: {
            alignItems: 'center',
        },
        followButton: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 24,
            marginTop: 20,
        },
    });
}

function createCardStyles(theme: Theme) {
    return StyleSheet.create({
        card: {
            flexDirection: 'row',
            backgroundColor: theme.colors.surface,
            borderRadius: 16,
            overflow: 'hidden',
        },
        coverImage: {
            width: 100,
            height: 120,
        },
        coverPlaceholder: {
            width: 100,
            height: 120,
            alignItems: 'center',
            justifyContent: 'center',
        },
        cardContent: {
            flex: 1,
            padding: 12,
        },
        cardMeta: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            marginTop: 8,
        },
        metaItem: {
            flexDirection: 'row',
            alignItems: 'center',
        },
    });
}
