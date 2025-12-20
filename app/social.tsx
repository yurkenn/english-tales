import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    ScrollView,
    Pressable,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet from '@gorhom/bottom-sheet';

import { Typography } from '@/components/atoms/Typography';
import { UserSearchModal, FriendListItem } from '@/components/molecules';
import { socialService } from '@/services/socialService';
import { userService } from '@/services/userService';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import { haptics } from '@/utils/haptics';
import { UserProfile } from '@/types';
import { useTranslation } from 'react-i18next';

export default function SocialScreen() {
    const { t } = useTranslation();
    const { theme } = useUnistyles();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuthStore();
    const toast = useToastStore(s => s.actions);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [following, setFollowing] = useState<UserProfile[]>([]);

    const searchSheetRef = useRef<BottomSheet>(null);

    const loadSocialData = useCallback(async () => {
        if (!user) return;

        const res = await socialService.getFollowingIds(user.id);
        if (res.success) {
            const profiles: UserProfile[] = [];
            for (const id of res.data) {
                const profileRes = await userService.getUserProfile(id);
                if (profileRes.success) {
                    profiles.push(profileRes.data);
                }
            }
            setFollowing(profiles);
        }
        setLoading(false);
        setRefreshing(false);
    }, [user]);

    useEffect(() => {
        loadSocialData();
    }, [loadSocialData]);

    const handleRefresh = () => {
        setRefreshing(true);
        loadSocialData();
    };

    const handleUnfollow = async (targetUserId: string) => {
        if (!user) return;
        haptics.selection();
        const res = await socialService.unfollowUser(user.id, targetUserId);
        if (res.success) {
            toast.success(t('social.unfollowed', 'Unfollowed successfully'));
            loadSocialData();
        }
    };

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={theme.colors.border} />
            <Typography variant="h3" style={{ marginTop: 16 }}>
                {t('social.emptyFollowing', 'Not Following Anyone')}
            </Typography>
            <Typography color={theme.colors.textMuted} align="center" style={{ marginTop: 8 }}>
                {t('social.emptyFollowingDesc', 'Follow other readers to see their progress and stay inspired!')}
            </Typography>
            <Pressable
                style={styles.primaryButton}
                onPress={() => searchSheetRef.current?.expand()}
            >
                <Typography variant="button" color={theme.colors.textInverse}>
                    {t('social.explore', 'Explore Community')}
                </Typography>
            </Pressable>
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Pressable onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
                    </Pressable>
                    <Typography variant="h2" style={styles.headerTitle}>{t('social.following', 'Following')}</Typography>
                </View>
                <Pressable
                    style={styles.addButton}
                    onPress={() => searchSheetRef.current?.expand()}
                >
                    <Ionicons name="person-add" size={20} color={theme.colors.primary} />
                </Pressable>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <ScrollView
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />
                    }
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {following.length === 0 ? (
                        renderEmptyState()
                    ) : (
                        <View style={styles.section}>
                            <Typography variant="label" color={theme.colors.textMuted} style={styles.sectionHeader}>
                                {t('social.followingCount', 'FOLLOWING {{count}}', { count: following.length }).toUpperCase()}
                            </Typography>
                            <View style={styles.cardGroup}>
                                {following.map((f, i) => (
                                    <FriendListItem
                                        key={f.id}
                                        friend={{
                                            ...f,
                                            friendshipId: f.id,
                                        } as any}
                                        type="friends"
                                        onRemove={handleUnfollow}
                                        showDivider={i < following.length - 1}
                                    />
                                ))}
                            </View>
                        </View>
                    )}
                </ScrollView>
            )}

            <BottomSheet
                ref={searchSheetRef}
                index={-1}
                snapPoints={['90%']}
                enablePanDownToClose
                backgroundStyle={{ backgroundColor: theme.colors.background }}
                handleIndicatorStyle={{ backgroundColor: theme.colors.border }}
            >
                <UserSearchModal onClose={() => searchSheetRef.current?.close()} />
            </BottomSheet>
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
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: -10,
    },
    headerTitle: {
        fontSize: theme.typography.size.xxxl,
        fontWeight: '800',
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.borderLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: 40,
    },
    section: {
        marginTop: theme.spacing.xl,
    },
    sectionHeader: {
        fontSize: theme.typography.size.xs,
        letterSpacing: 1.2,
        fontWeight: '900',
        marginBottom: theme.spacing.md,
        paddingLeft: 4,
    },
    cardGroup: {
        backgroundColor: theme.colors.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
        paddingHorizontal: theme.spacing.xl,
    },
    primaryButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 100,
        marginTop: 32,
        ...theme.shadows.md,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
}));
