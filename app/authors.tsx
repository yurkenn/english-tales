import React, { useMemo, useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, Image, TextInput } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { NetworkError, EmptyState, SectionHeader, AuthorSpotlight } from '@/components';
import { useAuthors, useFeaturedAuthor } from '@/hooks/useQueries';
import { haptics } from '@/utils/haptics';
import { urlFor } from '@/services/sanity';
import { useTranslation } from 'react-i18next';

interface Author {
    _id: string;
    name: string;
    slug: { current: string };
    image?: any;
    bio?: string;
    nationality?: string;
    birthYear?: number;
    deathYear?: number;
    storyCount?: number;
}

export default function AuthorsScreen() {
    const { t } = useTranslation();
    const { theme } = useUnistyles();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [searchQuery, setSearchQuery] = useState('');

    const { data: authorsData, isLoading, isError, refetch } = useAuthors();
    const { data: featuredAuthorData } = useFeaturedAuthor();

    const authors = useMemo(() => {
        const list = [...(authorsData || [])];

        // Sort by story count descending, then by name ascending
        list.sort((a, b) => {
            const countA = a.storyCount || 0;
            const countB = b.storyCount || 0;
            if (countB !== countA) return countB - countA;
            return a.name.localeCompare(b.name);
        });

        if (!searchQuery.trim()) return list;
        return list.filter((a: Author) =>
            a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.nationality?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [authorsData, searchQuery]);

    const featuredAuthor = useMemo(() => {
        if (!featuredAuthorData) return null;
        return {
            id: featuredAuthorData._id,
            name: featuredAuthorData.name,
            bio: featuredAuthorData.bio || '',
            imageUrl: featuredAuthorData.image ? urlFor(featuredAuthorData.image).width(200).url() : '',
        };
    }, [featuredAuthorData]);

    const handleAuthorPress = useCallback((authorId: string) => {
        haptics.light();
        router.push(`/author/${authorId}`);
    }, [router]);

    const renderItem = useCallback(({ item, index }: { item: Author; index: number }) => {
        const imageUrl = item.image ? urlFor(item.image).width(120).height(120).url() : null;
        const lifespan = item.birthYear
            ? `${item.birthYear}${item.deathYear ? ` - ${item.deathYear}` : ''}`
            : null;

        return (
            <Animated.View entering={FadeInDown.delay(index * 50).duration(400).springify()}>
                <Pressable
                    style={({ pressed }) => [
                        styles.authorCard,
                        pressed && styles.authorCardPressed,
                    ]}
                    onPress={() => handleAuthorPress(item._id)}
                >
                    {imageUrl ? (
                        <Image source={{ uri: imageUrl }} style={styles.authorImage} />
                    ) : (
                        <View style={[styles.authorImage, styles.authorImagePlaceholder]}>
                            <Ionicons name="person" size={28} color={theme.colors.textMuted} />
                        </View>
                    )}
                    <View style={styles.authorInfo}>
                        <Text style={styles.authorName}>{item.name}</Text>
                        {lifespan && (
                            <Text style={styles.authorLifespan}>{lifespan}</Text>
                        )}
                        {item.nationality && (
                            <Text style={styles.authorNationality}>{item.nationality}</Text>
                        )}
                        <View style={styles.storyCountBadge}>
                            <Ionicons name="book-outline" size={12} color={theme.colors.primary} />
                            <Text style={styles.storyCountText}>
                                {item.storyCount || 0} {(item.storyCount || 0) === 1 ? 'story' : 'stories'}
                            </Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
                </Pressable>
            </Animated.View>
        );
    }, [theme, handleAuthorPress]);

    const ListHeader = useMemo(() => (
        <View style={styles.listHeader}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputWrapper}>
                    <Ionicons name="search" size={18} color={theme.colors.textMuted} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={t('authors.searchPlaceholder', 'Search authors...')}
                        placeholderTextColor={theme.colors.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <Pressable onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={18} color={theme.colors.textMuted} />
                        </Pressable>
                    )}
                </View>
            </View>

            {/* Featured Author */}
            {featuredAuthor && !searchQuery && (
                <View style={styles.section}>
                    <SectionHeader title={t('discover.authorSpotlight', 'Featured Author')} />
                    <View style={styles.sectionContent}>
                        <AuthorSpotlight
                            id={featuredAuthor.id}
                            name={featuredAuthor.name}
                            bio={featuredAuthor.bio}
                            imageUrl={featuredAuthor.imageUrl}
                            onPress={() => handleAuthorPress(featuredAuthor.id)}
                        />
                    </View>
                </View>
            )}

            {/* Section Title */}
            <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>{t('authors.title', 'All Authors')}</Text>
                <Text style={styles.authorCount}>{authors.length}</Text>
            </View>
        </View>
    ), [featuredAuthor, searchQuery, authors.length, handleAuthorPress, t, theme]);

    if (isError) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <NetworkError
                    message={t('authors.notFound')}
                    onRetry={refetch}
                />
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
                <Text style={styles.title}>{t('authors.title')}</Text>
                <View style={styles.placeholder} />
            </View>

            {/* Authors List */}
            <FlatList
                data={authors}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                ListHeaderComponent={ListHeader}
                ListEmptyComponent={
                    isLoading ? null : (
                        <EmptyState
                            icon="person-outline"
                            title={t('authors.emptyTitle')}
                            message={searchQuery ? t('authors.noSearchResults', 'No authors match your search') : t('authors.emptyMessage')}
                        />
                    )
                }
            />
        </View>
    );
}

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
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
    title: {
        fontSize: theme.typography.size.xl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    placeholder: {
        width: 40,
    },
    listHeader: {
        gap: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
    },
    searchContainer: {
        paddingHorizontal: theme.spacing.lg,
    },
    searchInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xl,
        paddingHorizontal: theme.spacing.md,
        height: 44,
        gap: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    searchInput: {
        flex: 1,
        fontSize: theme.typography.size.md,
        color: theme.colors.text,
    },
    section: {
        gap: theme.spacing.md,
    },
    sectionContent: {
        paddingHorizontal: theme.spacing.lg,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
    },
    sectionTitle: {
        fontSize: theme.typography.size.lg,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    authorCount: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textSecondary,
        backgroundColor: theme.colors.backgroundSecondary,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
        borderRadius: theme.radius.full,
    },
    listContent: {
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.xxxl,
    },
    authorCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xl,
        padding: theme.spacing.md,
        gap: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.sm,
    },
    authorCardPressed: {
        backgroundColor: theme.colors.surfaceElevated,
        transform: [{ scale: 0.99 }],
    },
    authorImage: {
        width: 56,
        height: 56,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.backgroundSecondary,
    },
    authorImagePlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    authorInfo: {
        flex: 1,
        gap: 2,
    },
    authorName: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    authorLifespan: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textSecondary,
    },
    authorNationality: {
        fontSize: theme.typography.size.xs,
        color: theme.colors.textMuted,
    },
    storyCountBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    storyCountText: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.primary,
        fontWeight: theme.typography.weight.medium,
    },
}));
