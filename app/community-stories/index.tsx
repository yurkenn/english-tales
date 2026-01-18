import { useCallback, useState, FC, memo } from 'react';
import { View, ScrollView, Pressable, StyleSheet, TextInput } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useTheme, Theme } from '@/theme';
import { Typography } from '@/components/atoms/Typography';
import { DifficultyBadge } from '@/components/atoms/DifficultyBadge';
import { usePublishedUserStories } from '@/hooks/useQueries';
import { haptics } from '@/utils/haptics';

type DifficultyFilter = 'all' | 'beginner' | 'intermediate' | 'advanced';

interface StoryCardProps {
    story: any;
    onPress: () => void;
    onAuthorPress: () => void;
}

const StoryCard: FC<StoryCardProps> = memo(({ story, onPress, onAuthorPress }) => {
    const { theme } = useTheme();
    const styles = createCardStyles(theme);
    const readTime = Math.ceil((story.wordCount || 500) / 200);

    return (
        <Pressable onPress={onPress} style={styles.card}>
            {story.coverImageUrl ? (
                <Image source={{ uri: story.coverImageUrl }} style={styles.coverImage} contentFit="cover" />
            ) : (
                <View style={[styles.coverPlaceholder, { backgroundColor: theme.colors.primary + '20' }]}>
                    <Feather name="book-open" size={32} color={theme.colors.primary} />
                </View>
            )}
            <View style={styles.cardContent}>
                <Typography variant="body" weight="bold" numberOfLines={2}>
                    {story.title}
                </Typography>
                <Pressable onPress={onAuthorPress} style={styles.authorRow}>
                    <Typography variant="caption" color={theme.colors.primary}>
                        by {story.authorName}
                    </Typography>
                </Pressable>
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

const DifficultyChip: FC<{ label: string; active: boolean; onPress: () => void }> = memo(({ label, active, onPress }) => {
    const { theme } = useTheme();
    return (
        <Pressable
            onPress={() => {
                haptics.selection();
                onPress();
            }}
            style={[
                {
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                    marginRight: 8,
                },
            ]}
        >
            <Typography variant="caption" style={{ color: active ? '#FFF' : theme.colors.text }}>
                {label}
            </Typography>
        </Pressable>
    );
});

export default function CommunityStoriesScreen() {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const { data: stories = [], isLoading } = usePublishedUserStories();
    const [searchQuery, setSearchQuery] = useState('');
    const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all');

    const filteredStories = stories.filter((story: any) => {
        const matchesSearch = searchQuery === '' ||
            story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            story.authorName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDifficulty = difficultyFilter === 'all' || story.difficulty === difficultyFilter;
        return matchesSearch && matchesDifficulty;
    });

    const handleBack = useCallback(() => {
        haptics.selection();
        router.back();
    }, [router]);

    const handleStoryPress = useCallback((storyId: string) => {
        haptics.selection();
        router.push(`/user-story/${storyId}` as any);
    }, [router]);

    const handleAuthorPress = useCallback((story: any) => {
        haptics.selection();
        router.push({
            pathname: '/author/[authorId]',
            params: {
                authorId: story.authorId,
                authorName: story.authorName,
                authorAvatar: story.authorAvatar || '',
            },
        } as any);
    }, [router]);

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.container}>
                <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                    <Pressable onPress={handleBack} style={styles.backButton}>
                        <Feather name="arrow-left" size={24} color={theme.colors.text} />
                    </Pressable>
                    <Typography variant="h3">Community Stories</Typography>
                    <View style={{ width: 40 }} />
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Feather name="search" size={18} color={theme.colors.textMuted} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search stories or authors..."
                        placeholderTextColor={theme.colors.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <Pressable onPress={() => setSearchQuery('')}>
                            <Feather name="x" size={18} color={theme.colors.textMuted} />
                        </Pressable>
                    )}
                </View>

                {/* Difficulty Filters */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.filtersContainer}
                    contentContainerStyle={{ paddingHorizontal: 20 }}
                >
                    <DifficultyChip label="All" active={difficultyFilter === 'all'} onPress={() => setDifficultyFilter('all')} />
                    <DifficultyChip label="Beginner" active={difficultyFilter === 'beginner'} onPress={() => setDifficultyFilter('beginner')} />
                    <DifficultyChip label="Intermediate" active={difficultyFilter === 'intermediate'} onPress={() => setDifficultyFilter('intermediate')} />
                    <DifficultyChip label="Advanced" active={difficultyFilter === 'advanced'} onPress={() => setDifficultyFilter('advanced')} />
                </ScrollView>

                {/* Stories List */}
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
                    showsVerticalScrollIndicator={false}
                >
                    {isLoading ? (
                        <View style={styles.centerContainer}>
                            <Typography color={theme.colors.textMuted}>Loading stories...</Typography>
                        </View>
                    ) : filteredStories.length === 0 ? (
                        <View style={styles.centerContainer}>
                            <Feather name="inbox" size={48} color={theme.colors.textMuted} />
                            <Typography variant="body" color={theme.colors.textMuted} style={{ marginTop: 16 }}>
                                {searchQuery ? 'No stories found' : 'No community stories yet'}
                            </Typography>
                        </View>
                    ) : (
                        <View style={styles.storiesGrid}>
                            {filteredStories.map((story: any) => (
                                <StoryCard
                                    key={story._id}
                                    story={story}
                                    onPress={() => handleStoryPress(story._id)}
                                    onAuthorPress={() => handleAuthorPress(story)}
                                />
                            ))}
                        </View>
                    )}
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
        },
        backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
        searchContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginHorizontal: 20,
            marginBottom: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: theme.colors.surface,
            borderRadius: 12,
            gap: 12,
        },
        searchInput: {
            flex: 1,
            fontSize: 16,
            color: theme.colors.text,
        },
        filtersContainer: {
            marginBottom: 16,
        },
        content: { flex: 1 },
        scrollContent: { paddingHorizontal: 20 },
        centerContainer: {
            alignItems: 'center',
            paddingVertical: 60,
        },
        storiesGrid: {
            gap: 16,
        },
    });
}

function createCardStyles(theme: Theme) {
    return StyleSheet.create({
        card: {
            backgroundColor: theme.colors.surface,
            borderRadius: 16,
            overflow: 'hidden',
        },
        coverImage: {
            width: '100%',
            height: 140,
        },
        coverPlaceholder: {
            width: '100%',
            height: 140,
            alignItems: 'center',
            justifyContent: 'center',
        },
        cardContent: {
            padding: 16,
        },
        authorRow: {
            marginTop: 4,
        },
        cardMeta: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            marginTop: 12,
        },
        metaItem: {
            flexDirection: 'row',
            alignItems: 'center',
        },
    });
}
