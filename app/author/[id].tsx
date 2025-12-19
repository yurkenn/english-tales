import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthor, useStories } from '@/hooks/useQueries';
import { BookCard, NetworkError, EmptyState, AuthorScreenSkeleton } from '@/components';
import { urlFor } from '@/services/sanity/client';
import { mapSanityStory } from '@/utils/storyMapper';

import { useTranslation } from 'react-i18next';

export default function AuthorScreen() {
    const { t } = useTranslation();
    const { theme } = useUnistyles();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams<{ id: string }>();

    const { data: authorData, isLoading: loadingAuthor, error: errorAuthor, refetch: refetchAuthor } = useAuthor(id || '');
    const { data: storiesData } = useStories();

    const author = useMemo(() => {
        if (!authorData) return null;
        return {
            id: authorData._id,
            name: authorData.name,
            bio: authorData.bio,
            avatar: authorData.image ? urlFor(authorData.image).width(200).url() : null,
            storyCount: authorData.storyCount || 0,
        };
    }, [authorData]);

    const authorStories = useMemo(() => {
        if (!storiesData || !author) return [];
        return storiesData
            .filter((story: any) => story.author?._ref === id || story.author?._id === id)
            .map(mapSanityStory)
            .slice(0, 10);
    }, [storiesData, author, id]);

    if (loadingAuthor) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <AuthorScreenSkeleton />
            </View>
        );
    }

    if (!author) {
        if (errorAuthor) {
            return (
                <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
                    <NetworkError
                        message={t('authors.notFound')}
                        onRetry={refetchAuthor}
                    />
                </View>
            );
        }
        return (
            <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
                <Text style={styles.errorText}>{t('authors.notFound')}</Text>
                <Pressable onPress={() => router.back()} style={{ marginTop: 20 }}>
                    <Text style={{ color: theme.colors.primary }}>{t('common.goBack')}</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </Pressable>
                <Text style={styles.headerTitle}>{t('authors.author')}</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Author Info */}
                <View style={styles.authorSection}>
                    <Image
                        source={{ uri: author.avatar || `https://ui-avatars.com/api/?name=${author.name}` }}
                        style={styles.avatar}
                    />
                    <Text style={styles.authorName}>{author.name}</Text>
                    <Text style={styles.storyCount}>{author.storyCount} {author.storyCount === 1 ? t('authors.storyCountSingular') : t('authors.storyCount', { count: author.storyCount })}</Text>
                    {author.bio && (
                        <Text style={styles.bio}>{author.bio}</Text>
                    )}
                </View>

                {/* Stories by Author */}
                <View style={styles.storiesSection}>
                    <Text style={styles.sectionTitle}>{t('authors.stories')}</Text>
                    {authorStories.length > 0 ? (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.storiesRow}
                        >
                            {authorStories.map((story: any) => (
                                <BookCard
                                    key={story.id}
                                    story={story}
                                    onPress={() => router.push(`/story/${story.id}`)}
                                />
                            ))}
                        </ScrollView>
                    ) : (
                        <EmptyState
                            icon="book-outline"
                            title={t('authors.noStoriesTitle')}
                            message={t('authors.noStoriesMessage')}
                        />
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    center: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: theme.typography.size.xl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    placeholder: {
        width: 40,
    },
    authorSection: {
        alignItems: 'center',
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.xxl,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: theme.spacing.lg,
    },
    authorName: {
        fontSize: theme.typography.size.xxxl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    storyCount: {
        fontSize: theme.typography.size.md,
        color: theme.colors.primary,
        marginBottom: theme.spacing.lg,
    },
    bio: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    storiesSection: {
        paddingHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.xxl,
    },
    sectionTitle: {
        fontSize: theme.typography.size.xl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },
    storiesRow: {
        gap: theme.spacing.md,
    },
    errorText: {
        fontSize: theme.typography.size.lg,
        color: theme.colors.textMuted,
    },
}));
