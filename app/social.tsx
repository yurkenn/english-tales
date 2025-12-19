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
import { UserSearchModal, FriendListItem, FriendWithFid } from '@/components/molecules';
import { socialService } from '@/services/socialService';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import { haptics } from '@/utils/haptics';
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
    const [friends, setFriends] = useState<FriendWithFid[]>([]);
    const [pendingIncoming, setPendingIncoming] = useState<FriendWithFid[]>([]);
    const [pendingOutgoing, setPendingOutgoing] = useState<FriendWithFid[]>([]);

    const searchSheetRef = useRef<BottomSheet>(null);

    const loadSocialData = useCallback(async () => {
        if (!user) return;

        const res = await socialService.getFriendships(user.id);
        if (res.success) {
            setFriends(res.data.accepted);
            setPendingIncoming(res.data.pendingIncoming);
            setPendingOutgoing(res.data.pendingOutgoing);
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

    const handleAcceptRequest = async (friendshipId: string) => {
        haptics.success();
        const res = await socialService.acceptFriendRequest(friendshipId);
        if (res.success) {
            toast.success(t('social.requestAccepted', 'Friend request accepted!'));
            loadSocialData();
        }
    };

    const handleRemoveFriendship = async (friendshipId: string, isRemoval: boolean) => {
        haptics.selection();
        const res = await socialService.removeFriendship(friendshipId);
        if (res.success) {
            toast.success(isRemoval ? t('social.friendRemoved', 'Friend removed') : t('social.requestCancelled', 'Request cancelled'));
            loadSocialData();
        }
    };

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={theme.colors.border} />
            <Typography variant="h3" style={{ marginTop: 16 }}>
                {t('social.emptyTitle', 'No Friends Yet')}
            </Typography>
            <Typography color={theme.colors.textMuted} align="center" style={{ marginTop: 8 }}>
                {t('social.emptyDesc', 'Start connecting with other readers to share your progress and see their achievements!')}
            </Typography>
            <Pressable
                style={styles.primaryButton}
                onPress={() => searchSheetRef.current?.expand()}
            >
                <Typography variant="button" color={theme.colors.textInverse}>
                    {t('social.findFriends', 'Find Friends')}
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
                    <Typography variant="h2" style={styles.headerTitle}>{t('social.myFriends', 'My Friends')}</Typography>
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
                    {pendingIncoming.length > 0 && (
                        <View style={styles.section}>
                            <Typography variant="label" color={theme.colors.textMuted} style={styles.sectionHeader}>
                                {t('social.requests', 'FRIEND REQUESTS').toUpperCase()}
                            </Typography>
                            <View style={styles.cardGroup}>
                                {pendingIncoming.map((f, i) => (
                                    <FriendListItem
                                        key={f.friendshipId}
                                        friend={f}
                                        type="incoming"
                                        onAccept={handleAcceptRequest}
                                        onRemove={handleRemoveFriendship}
                                        showDivider={i < pendingIncoming.length - 1}
                                    />
                                ))}
                            </View>
                        </View>
                    )}

                    {friends.length === 0 && pendingIncoming.length === 0 && pendingOutgoing.length === 0 ? (
                        renderEmptyState()
                    ) : (
                        <>
                            <View style={styles.section}>
                                <Typography variant="label" color={theme.colors.textMuted} style={styles.sectionHeader}>
                                    {t('social.myFriends', 'MY FRIENDS').toUpperCase()}
                                </Typography>
                                <View style={styles.cardGroup}>
                                    {friends.map((f, i) => (
                                        <FriendListItem
                                            key={f.friendshipId}
                                            friend={f}
                                            type="friends"
                                            onRemove={handleRemoveFriendship}
                                            showDivider={i < friends.length - 1}
                                        />
                                    ))}
                                </View>
                            </View>

                            {pendingOutgoing.length > 0 && (
                                <View style={styles.section}>
                                    <Typography variant="label" color={theme.colors.textMuted} style={styles.sectionHeader}>
                                        {t('social.sentRequests', 'SENT REQUESTS').toUpperCase()}
                                    </Typography>
                                    <View style={styles.cardGroup}>
                                        {pendingOutgoing.map((f, i) => (
                                            <FriendListItem
                                                key={f.friendshipId}
                                                friend={f}
                                                type="outgoing"
                                                onRemove={handleRemoveFriendship}
                                                showDivider={i < pendingOutgoing.length - 1}
                                            />
                                        ))}
                                    </View>
                                </View>
                            )}
                        </>
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
        fontSize: 28,
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
        fontSize: 11,
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
