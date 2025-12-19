import React, { useMemo, useCallback } from 'react';
import { View, Text, FlatList, Pressable, Image } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NetworkError, EmptyState } from '@/components';
import { useAuthors } from '@/hooks/useQueries';
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

    const { data: authorsData, isLoading, isError, refetch } = useAuthors();

    const authors = useMemo(() => {
        return authorsData || [];
    }, [authorsData]);

    const handleAuthorPress = useCallback((authorId: string) => {
        haptics.light();
        router.push(`/author/${authorId}`);
    }, [router]);

    const renderItem = useCallback(({ item }: { item: Author }) => {
        const imageUrl = item.image ? urlFor(item.image).width(120).height(120).url() : null;
        const lifespan = item.birthYear
            ? `${item.birthYear}${item.deathYear ? ` - ${item.deathYear}` : ''}`
            : null;

        return (
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
                        <Ionicons name="person" size={32} color={theme.colors.textMuted} />
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
                            {item.storyCount || 0} {(item.storyCount || 0) === 1 ? t('authors.storyCountSingular') : t('authors.storyCount', { count: item.storyCount || 0 })}
                        </Text>
                    </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
            </Pressable>
        );
    }, [theme, handleAuthorPress]);

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
                ListEmptyComponent={
                    isLoading ? null : (
                        <EmptyState
                            icon="person-outline"
                            title={t('authors.emptyTitle')}
                            message={t('authors.emptyMessage')}
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
        ...theme.shadows.sm,
    },
    authorCardPressed: {
        opacity: 0.9,
        transform: [{ scale: 0.98 }],
    },
    authorImage: {
        width: 64,
        height: 64,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.borderLight,
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
        fontSize: theme.typography.size.lg,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    authorLifespan: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textSecondary,
    },
    authorNationality: {
        fontSize: theme.typography.size.sm,
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
