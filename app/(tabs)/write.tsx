import * as React from 'react';
import { useState, useMemo, useCallback } from 'react';
import {
    View,
    ScrollView,
    Pressable,
    RefreshControl,
    StyleSheet,
    FlatList,
    Alert,
} from 'react-native';
import { useTheme, Theme } from '@/theme';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { Typography } from '@/components/atoms/Typography';
import { EmptyState } from '@/components/molecules/EmptyState';
import { SegmentedPicker } from '@/components/atoms/SegmentedPicker';
import { StoryDraftCard } from '@/components/molecules/StoryDraftCard';
import { useAuthStore } from '@/store/authStore';
import { useUserStoriesByAuthor } from '@/hooks/useQueries';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { haptics } from '@/utils/haptics';
import { UserStory } from '@/store/userStoryStore';
import { ActionSheet, ConfirmationDialog } from '@/components/molecules';
import { BottomSheetMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import { deleteUserStory } from '@/services/sanity/mutations';

type WriteFilter = 'all' | 'drafts' | 'published';

export default function WriteScreen() {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { containerPadding } = useResponsiveLayout();
    const { user } = useAuthStore();

    // State
    const [filter, setFilter] = useState<WriteFilter>('all');

    // Fetch user stories
    const {
        data: userStories = [],
        isLoading,
        refetch,
        isRefetching,
    } = useUserStoriesByAuthor(user?.id);

    // Filter options
    const filterOptions = useMemo(() => [
        { label: t('write.all', 'All'), value: 'all' as const },
        { label: t('write.drafts', 'Drafts'), value: 'drafts' as const },
        { label: t('write.published', 'Published'), value: 'published' as const },
    ], [t]);

    // Filtered stories
    const filteredStories = useMemo(() => {
        if (!userStories) return [];

        switch (filter) {
            case 'drafts':
                return userStories.filter((s: UserStory) => s.status === 'draft' && !s.isPublished);
            case 'published':
                return userStories.filter((s: UserStory) => s.isPublished);
            default:
                return userStories;
        }
    }, [userStories, filter]);

    // Stats
    const stats = useMemo(() => {
        if (!userStories) return { total: 0, drafts: 0, published: 0, pending: 0 };
        return {
            total: userStories.length,
            drafts: userStories.filter((s: UserStory) => s.status === 'draft').length,
            published: userStories.filter((s: UserStory) => s.isPublished).length,
            pending: userStories.filter((s: UserStory) => s.status === 'pending').length,
        };
    }, [userStories]);

    // Handlers
    const handleNewStory = useCallback(() => {
        haptics.medium();
        router.push('/story/create' as any);
    }, [router]);

    const handleRefresh = useCallback(async () => {
        await refetch();
    }, [refetch]);

    // Action Sheet Ref
    const actionSheetRef = React.useRef<BottomSheetMethods>(null);
    const deleteDialogRef = React.useRef<BottomSheetMethods>(null);
    const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
    const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const handleStoryPress = useCallback((storyId: string) => {
        haptics.selection();
        router.push(`/story/edit/${storyId}` as any);
    }, [router]);

    const handleMorePress = useCallback((storyId: string) => {
        haptics.selection();
        setSelectedStoryId(storyId);
        setIsActionSheetOpen(true);
        setTimeout(() => actionSheetRef.current?.expand(), 50);
    }, []);

    const handleDeletePress = useCallback(() => {
        setIsDeleteDialogOpen(true);
        setTimeout(() => deleteDialogRef.current?.expand(), 50);
    }, []);

    const confirmDelete = useCallback(async () => {
        if (!selectedStoryId) return;
        try {
            await deleteUserStory(selectedStoryId);
            await refetch();
            setIsDeleteDialogOpen(false);
            deleteDialogRef.current?.close();
            Alert.alert(t('common.success', 'Success'), t('write.deletedMessage', 'Story deleted successfully.'));
        } catch (error) {
            Alert.alert(t('common.error', 'Error'), t('write.deleteError', 'Failed to delete story.'));
        }
    }, [selectedStoryId, refetch, t]);

    // Render story card
    const renderStoryCard = useCallback(({ item }: { item: UserStory }) => (
        <StoryDraftCard
            story={item}
            onPress={() => handleStoryPress(item._id)}
            onMorePress={() => handleMorePress(item._id)}
        />
    ), [handleStoryPress, handleMorePress]);

    const keyExtractor = useCallback((item: UserStory) => item._id, []);

    // Empty state for non-authenticated users
    if (!user) {
        return (
            <View style={styles.container}>
                <View style={[styles.header, { paddingTop: insets.top + 8, paddingHorizontal: containerPadding }]}>
                    <Typography variant="h2" style={styles.headerTitle}>
                        {t('write.title', 'Write')}
                    </Typography>
                </View>
                <EmptyState
                    icon="log-in"
                    title={t('write.loginRequired', 'Sign In Required')}
                    message={t('write.loginMessage', 'Sign in to start writing your own stories!')}
                    actionLabel={t('auth.login.title', 'Sign In')}
                    onAction={() => router.push('/login')}
                />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 8, paddingHorizontal: containerPadding }]}>
                <Typography variant="h2" style={styles.headerTitle}>
                    {t('write.title', 'Write')}
                </Typography>
                <Pressable
                    style={styles.settingsButton}
                    onPress={() => router.push('/settings')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Feather name="settings" size={22} color={theme.colors.text} />
                </Pressable>
            </View>

            {/* New Story Button */}
            <Pressable
                style={[styles.newStoryButton, { marginHorizontal: containerPadding }]}
                onPress={handleNewStory}
            >
                <View style={styles.newStoryIconWrapper}>
                    <Feather name="plus" size={24} color={theme.colors.textInverse} />
                </View>
                <View style={styles.newStoryContent}>
                    <Typography variant="body" style={styles.newStoryTitle}>
                        {t('write.newStory', 'New Story')}
                    </Typography>
                    <Typography variant="caption" style={styles.newStorySubtitle}>
                        {t('write.newStorySubtitle', 'Start your next adventure')}
                    </Typography>
                </View>
                <Feather name="chevron-right" size={20} color={theme.colors.textMuted} />
            </Pressable>

            {/* Stats Row */}
            {stats.total > 0 && (
                <View style={[styles.statsRow, { paddingHorizontal: containerPadding }]}>
                    <View style={styles.statItem}>
                        <Typography variant="h3" style={styles.statValue}>{stats.total}</Typography>
                        <Typography variant="caption" style={styles.statLabel}>
                            {t('write.stats.total', 'Total')}
                        </Typography>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Typography variant="h3" style={styles.statValue}>{stats.drafts}</Typography>
                        <Typography variant="caption" style={styles.statLabel}>
                            {t('write.stats.drafts', 'Drafts')}
                        </Typography>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Typography variant="h3" style={styles.statValue}>{stats.pending}</Typography>
                        <Typography variant="caption" style={styles.statLabel}>
                            {t('write.stats.pending', 'Pending')}
                        </Typography>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Typography variant="h3" style={styles.statValue}>{stats.published}</Typography>
                        <Typography variant="caption" style={styles.statLabel}>
                            {t('write.stats.published', 'Published')}
                        </Typography>
                    </View>
                </View>
            )}

            {/* Filter Tabs */}
            <View style={[styles.filterSection, { paddingHorizontal: containerPadding }]}>
                <SegmentedPicker
                    options={filterOptions}
                    selectedValue={filter}
                    onValueChange={setFilter}
                />
            </View>

            {/* Stories List */}
            {filteredStories.length === 0 && !isLoading ? (
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefetching}
                            onRefresh={handleRefresh}
                            tintColor={theme.colors.primary}
                        />
                    }
                >
                    <EmptyState
                        icon="pencil-outline"
                        title={t('write.emptyTitle', 'Start Your First Story')}
                        message={t('write.emptyMessage', 'Share your creativity with readers around the world!')}
                        actionLabel={t('write.startWriting', 'Start Writing')}
                        onAction={handleNewStory}
                    />
                </ScrollView>
            ) : (
                <FlatList
                    data={filteredStories}
                    renderItem={renderStoryCard}
                    keyExtractor={keyExtractor}
                    contentContainerStyle={[
                        styles.listContent,
                        { paddingHorizontal: containerPadding, paddingBottom: insets.bottom + 100 },
                    ]}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefetching}
                            onRefresh={handleRefresh}
                            tintColor={theme.colors.primary}
                        />
                    }
                />
            )}

            {/* FAB */}
            {filteredStories.length > 0 && (
                <Pressable
                    style={[styles.fab, { bottom: insets.bottom + 90 }]}
                    onPress={handleNewStory}
                >
                    <Feather name="plus" size={28} color={theme.colors.textInverse} />
                </Pressable>
            )}

            {/* Action Sheet */}
            {isActionSheetOpen && (
                <ActionSheet
                    ref={actionSheetRef}
                    title={t('common.options', 'Options')}
                    options={[
                        {
                            label: t('common.edit', 'Edit'),
                            icon: 'pencil',
                            onPress: () => handleStoryPress(selectedStoryId!),
                        },
                        {
                            label: t('common.delete', 'Delete'),
                            icon: 'trash-outline',
                            onPress: handleDeletePress,
                            destructive: true,
                        },
                    ]}
                    onClose={() => setIsActionSheetOpen(false)}
                />
            )}

            {/* Delete Confirmation */}
            {isDeleteDialogOpen && (
                <ConfirmationDialog
                    ref={deleteDialogRef}
                    title={t('write.deleteConfirmTitle', 'Delete Story?')}
                    message={t('write.deleteConfirmMessage', 'This action cannot be undone.')}
                    confirmLabel={t('common.delete', 'Delete')}
                    onConfirm={confirmDelete}
                    onCancel={() => setIsDeleteDialogOpen(false)}
                    destructive
                />
            )}
        </View>
    );
}

function createStyles(theme: Theme) {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: theme.spacing.md,
            backgroundColor: theme.colors.background,
            zIndex: 100,
        },
        headerTitle: {
            fontSize: theme.typography.size.xxxl,
            fontWeight: 'bold',
            color: theme.colors.text,
            letterSpacing: -0.5,
        },
        settingsButton: {
            width: 44,
            height: 44,
            borderRadius: theme.radius.full,
            backgroundColor: theme.colors.surfaceElevated,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: theme.colors.borderLight,
            ...theme.shadows.sm,
        },
        newStoryButton: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.xl,
            padding: theme.spacing.lg,
            marginTop: theme.spacing.sm,
            marginBottom: theme.spacing.md,
            borderWidth: 1,
            borderColor: theme.colors.borderLight,
            ...theme.shadows.md,
        },
        newStoryIconWrapper: {
            width: 48,
            height: 48,
            borderRadius: theme.radius.full,
            backgroundColor: theme.colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: theme.spacing.md,
        },
        newStoryContent: {
            flex: 1,
        },
        newStoryTitle: {
            fontWeight: '700',
            color: theme.colors.text,
            marginBottom: theme.spacing.xxs,
        },
        newStorySubtitle: {
            color: theme.colors.textMuted,
        },
        statsRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-around',
            backgroundColor: theme.colors.surface,
            marginHorizontal: theme.spacing.lg,
            marginBottom: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
            borderRadius: theme.radius.lg,
            borderWidth: 1,
            borderColor: theme.colors.borderLight,
        },
        statItem: {
            alignItems: 'center',
            flex: 1,
        },
        statDivider: {
            width: 1,
            height: 24,
            backgroundColor: theme.colors.borderLight,
        },
        statValue: {
            color: theme.colors.text,
            fontWeight: '700',
        },
        statLabel: {
            color: theme.colors.textMuted,
            marginTop: theme.spacing.xxs,
        },
        filterSection: {
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: theme.spacing.md,
        },
        content: {
            flex: 1,
        },
        scrollContent: {
            paddingHorizontal: theme.spacing.lg,
            flexGrow: 1,
        },
        listContent: {
            paddingHorizontal: theme.spacing.lg,
        },
        fab: {
            position: 'absolute',
            right: theme.spacing.xl,
            width: 64,
            height: 64,
            borderRadius: theme.radius.full,
            backgroundColor: theme.colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: theme.colors.primary,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 8,
        },
    });
}
