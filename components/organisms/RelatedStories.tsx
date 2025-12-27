import React from 'react';
// Force reload: 3

import { View, Text, ScrollView, Pressable, StyleSheet as RNStyleSheet } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useStoriesByCategory } from '@/hooks/useQueries';
import { OptimizedImage } from '../atoms';
import { haptics } from '@/utils/haptics';
import { mapSanityStories } from '@/utils/storyMapper';
import { Story } from '@/types';

interface RelatedStoriesProps {
    categoryId: string;
    currentStoryId: string;
}

export const RelatedStories: React.FC<RelatedStoriesProps> = ({ categoryId, currentStoryId }) => {
    const { theme } = useUnistyles();
    const router = useRouter();
    const { t } = useTranslation();
    const { data: stories, isLoading } = useStoriesByCategory(categoryId);
    const relatedStories = React.useMemo(() => {
        if (!stories) return [];
        const mapped = mapSanityStories(stories);
        return mapped.filter((s) => s.id !== currentStoryId).slice(0, 5);
    }, [stories, currentStoryId]);

    if (isLoading || relatedStories.length === 0) return null;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{t('home.popularThisWeek', 'You Might Also Like')}</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {relatedStories.map((story: Story) => (
                    <Pressable
                        key={story.id}
                        style={styles.card}
                        onPress={() => {
                            haptics.selection();
                            router.push(`/story/${story.id}`);
                        }}
                    >
                        <View style={styles.imageContainer}>
                            <OptimizedImage
                                source={{ uri: story.coverImage }}
                                style={styles.image}
                            />
                        </View>
                        <Text style={styles.storyTitle} numberOfLines={2}>
                            {story.title}
                        </Text>
                    </Pressable>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        marginTop: theme.spacing.xl,
        gap: theme.spacing.md,
    },
    title: {
        fontSize: theme.typography.size.xl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
        paddingHorizontal: theme.spacing.xl,
    },
    scrollContent: {
        paddingHorizontal: theme.spacing.xl,
        gap: theme.spacing.md,
    },
    card: {
        width: 140,
        gap: theme.spacing.xs,
    },
    imageContainer: {
        width: 140,
        height: 200,
        borderRadius: theme.radius.md,
        overflow: 'hidden',
        backgroundColor: theme.colors.surface,
        ...theme.shadows.sm,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    storyTitle: {
        fontSize: theme.typography.size.sm,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.text,
        marginTop: 4,
    },
}));
