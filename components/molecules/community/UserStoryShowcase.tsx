import { memo, useCallback, FC } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useTheme, Theme } from '@/theme';
import { Typography } from '@/components/atoms/Typography';
import { DifficultyBadge, getDifficultyColor } from '@/components/atoms/DifficultyBadge';
import { haptics } from '@/utils/haptics';

// Types
interface UserStoryData {
    _id: string;
    title: string;
    description?: string;
    authorName: string;
    authorAvatar?: string;
    coverImageUrl?: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    categories?: { title: string; color: string }[];
    wordCount?: number;
}

interface UserStoryShowcaseProps {
    readonly stories: UserStoryData[];
    readonly onStoryPress: (storyId: string) => void;
    readonly onSeeAllPress?: () => void;
    readonly containerPadding?: number;
}

interface UserStoryCardProps {
    readonly story: UserStoryData;
    readonly onPress: () => void;
}

// Community Badge Component
const CommunityBadge: FC = memo(() => {
    const { theme } = useTheme();

    return (
        <View style={[styles.communityBadge, { backgroundColor: theme.colors.primary + '20' }]}>
            <Feather name="users" size={10} color={theme.colors.primary} />
            <Typography variant="caption" style={{ color: theme.colors.primary, fontSize: 9, marginLeft: 3 }}>
                Community
            </Typography>
        </View>
    );
});

// User Story Card Component
const UserStoryCard: FC<UserStoryCardProps> = memo(({ story, onPress }) => {
    const { theme } = useTheme();
    const cardStyles = createCardStyles(theme);

    const handlePress = useCallback(() => {
        haptics.selection();
        onPress();
    }, [onPress]);

    const difficultyColor = getDifficultyColor(story.difficulty);

    return (
        <Pressable
            style={({ pressed }) => [
                cardStyles.card,
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            ]}
            onPress={handlePress}
        >
            {/* Cover Image */}
            <View style={cardStyles.coverContainer}>
                {story.coverImageUrl ? (
                    <Image
                        source={{ uri: story.coverImageUrl }}
                        style={cardStyles.coverImage}
                        contentFit="cover"
                        transition={200}
                    />
                ) : (
                    <View style={[cardStyles.coverPlaceholder, { backgroundColor: difficultyColor + '30' }]}>
                        <Feather name="book-open" size={28} color={difficultyColor} />
                    </View>
                )}
                <CommunityBadge />
            </View>

            {/* Content */}
            <View style={cardStyles.content}>
                <Typography variant="body" weight="semibold" numberOfLines={2} style={cardStyles.title}>
                    {story.title}
                </Typography>

                {/* Author Row */}
                <View style={cardStyles.authorRow}>
                    {story.authorAvatar ? (
                        <Image
                            source={{ uri: story.authorAvatar }}
                            style={cardStyles.avatar}
                            contentFit="cover"
                        />
                    ) : (
                        <View style={[cardStyles.avatarPlaceholder, { backgroundColor: theme.colors.border }]}>
                            <Feather name="user" size={10} color={theme.colors.textMuted} />
                        </View>
                    )}
                    <Typography variant="caption" color={theme.colors.textMuted} numberOfLines={1} style={cardStyles.authorName}>
                        {story.authorName}
                    </Typography>
                </View>

                {/* Footer */}
                <View style={cardStyles.footer}>
                    <DifficultyBadge difficulty={story.difficulty} size="small" />
                    {story.wordCount && (
                        <Typography variant="caption" color={theme.colors.textMuted}>
                            {Math.ceil(story.wordCount / 200)} min
                        </Typography>
                    )}
                </View>
            </View>
        </Pressable>
    );
});

// Main Showcase Component
export const UserStoryShowcase: FC<UserStoryShowcaseProps> = memo(({
    stories,
    onStoryPress,
    containerPadding = 20,
}) => {
    const { theme } = useTheme();

    if (!stories || stories.length === 0) {
        return null;
    }

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
                styles.scrollContent,
                { paddingHorizontal: containerPadding },
            ]}
            decelerationRate="fast"
            snapToInterval={160 + 12} // card width + gap
        >
            {stories.map((story) => (
                <UserStoryCard
                    key={story._id}
                    story={story}
                    onPress={() => onStoryPress(story._id)}
                />
            ))}
        </ScrollView>
    );
});

// Styles
const styles = StyleSheet.create({
    scrollContent: {
        gap: 12,
        paddingVertical: 4,
    },
    communityBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 6,
    },
});

function createCardStyles(theme: Theme) {
    return StyleSheet.create({
        card: {
            width: 160,
            backgroundColor: theme.colors.surface,
            borderRadius: 12,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        coverContainer: {
            width: '100%',
            height: 100,
            position: 'relative',
        },
        coverImage: {
            width: '100%',
            height: '100%',
        },
        coverPlaceholder: {
            width: '100%',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
        },
        content: {
            padding: 10,
            gap: 6,
        },
        title: {
            fontSize: 13,
            lineHeight: 18,
        },
        authorRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
        },
        avatar: {
            width: 18,
            height: 18,
            borderRadius: 9,
        },
        avatarPlaceholder: {
            width: 18,
            height: 18,
            borderRadius: 9,
            alignItems: 'center',
            justifyContent: 'center',
        },
        authorName: {
            flex: 1,
            fontSize: 11,
        },
        footer: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 4,
        },
    });
}
