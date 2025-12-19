import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, Image, ActivityIndicator } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthor, useStories } from '@/hooks/useQueries';
import { useAuthorSocial } from '@/hooks/useAuthor';
import { BookCard, NetworkError, EmptyState, AuthorScreenSkeleton } from '@/components';
import { urlFor } from '@/services/sanity/client';
import { mapSanityStory } from '@/utils/storyMapper';
import { Typography } from '@/components/atoms/Typography';
import { haptics } from '@/utils/haptics';

import { useTranslation } from 'react-i18next';

export default function AuthorScreen() {
    const { t } = useTranslation();
    const { theme } = useUnistyles();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams<{ id: string }>();

    const { data: authorData, isLoading: loadingAuthor, error: errorAuthor, refetch: refetchAuthor } = useAuthor(id || '');
    const { data: storiesData } = useStories();
    const {
        isFollowing,
        followerCount,
        actionLoading,
        handleFollowToggle
    } = useAuthorSocial(id || '', authorData?.name || '');

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

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Typography variant="bodyBold">{author.storyCount}</Typography>
                            <Typography variant="caption" color={theme.colors.textMuted}>{t('authors.stories')}</Typography>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Typography variant="bodyBold">{followerCount}</Typography>
                            <Typography variant="caption" color={theme.colors.textMuted}>{t('social.followers', 'Followers')}</Typography>
                        </View>
                    </View>

                    <Pressable
                        style={[
                            styles.followButton,
                            isFollowing && styles.followingButton,
                            actionLoading && { opacity: 0.7 }
                        ]}
                        onPress={handleFollowToggle}
                        disabled={actionLoading}
                    >
                        {actionLoading ? (
                            <ActivityIndicator size="small" color={isFollowing ? theme.colors.primary : theme.colors.textInverse} />
                        ) : (
                            <>
                                <Ionicons
                                    name={isFollowing ? "person-remove-outline" : "person-add"}
                                    size={18}
                                    color={isFollowing ? theme.colors.primary : theme.colors.textInverse}
                                />
                                <Typography
                                    variant="bodyBold"
                                    color={isFollowing ? theme.colors.primary : theme.colors.textInverse}
                                    style={{ marginLeft: 8 }}
                                >
                                    {isFollowing ? t('social.following', 'Following') : t('social.follow', 'Follow')}
                                </Typography>
                            </>
                        )}
                    </Pressable>

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
        marginBottom: theme.spacing.md,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        marginBottom: theme.spacing.xl,
    },
    statItem: {
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
    },
    statDivider: {
        width: 1,
        height: 20,
        backgroundColor: theme.colors.borderLight,
    },
    followButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 20,
        marginBottom: theme.spacing.xl,
        minWidth: 150,
        ...theme.shadows.sm,
    },
    followingButton: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.primary,
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
