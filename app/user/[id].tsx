import React, { useState } from 'react';
import {
    View,
    ScrollView,
    Pressable,
    RefreshControl,
    ActivityIndicator,
    Dimensions,
    Linking,
} from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
    useSharedValue,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    interpolate,
    Extrapolation,
    FadeInDown
} from 'react-native-reanimated';

import { Typography } from '@/components/atoms/Typography';
import { StoryGridCard } from '@/components/molecules/StoryGridCard';
import { ReviewCard } from '@/components/molecules/ReviewCard';
import { CommunityPostCard } from '@/components/organisms/CommunityPostCard';
import { ProfileHeader } from '@/components/organisms/ProfileHeader';
import { ProfileTabs, ProfileTabType } from '@/components/molecules/ProfileTabs';

import { useUserProfile } from '@/hooks/useUserProfile';
import { useTranslation } from 'react-i18next';
import { haptics } from '@/utils/haptics';
import { useToastStore } from '@/store/toastStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');



export default function UserProfileScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { t } = useTranslation();
    const { theme } = useUnistyles();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const toast = useToastStore();

    const {
        profile,
        posts,
        reviews,
        stats,
        relationship,
        loading,
        actionLoading,
        refresh,
        handleFollow,
        handleUnfollow,
        libraryItems,
    } = useUserProfile(id!);

    const [activeTab, setActiveTab] = useState<ProfileTabType>('posts');

    // Animation Refs
    const scrollY = useSharedValue(0);
    const scrollHandler = useAnimatedScrollHandler((event) => {
        scrollY.value = event.contentOffset.y;
    });

    // Sticky Header Style
    const stickyHeaderStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            scrollY.value,
            [150, 250],
            [0, 1],
            Extrapolation.CLAMP
        );
        return { opacity };
    });

    const backButtonStyle = useAnimatedStyle(() => {
        const backgroundColor = scrollY.value > 150
            ? 'transparent'
            : 'rgba(0,0,0,0.3)';
        return { backgroundColor };
    });

    const handleSocialPress = (type: string, url: string) => {
        haptics.light();
        Linking.openURL(url).catch(() => toast.actions.error('Could not open link'));
    };

    if (loading && !profile) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (!profile) {
        return (
            <View style={styles.center}>
                <Typography>{t('social.userNotFound', 'User not found')}</Typography>
                <Pressable onPress={() => router.back()} style={{ marginTop: 20 }}>
                    <Typography color={theme.colors.primary}>{t('common.goBack', 'Go Back')}</Typography>
                </Pressable>
            </View>
        );
    }

    const renderTabContent = () => {
        switch (activeTab) {
            case 'posts':
                return (
                    <Animated.View entering={FadeInDown.duration(400)} style={styles.tabContent}>
                        {posts.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="chatbubble-ellipses-outline" size={64} color={theme.colors.border} />
                                <Typography color={theme.colors.textMuted} style={styles.emptyText}>
                                    No posts yet.
                                </Typography>
                            </View>
                        ) : (
                            posts.map((post, index) => (
                                <Animated.View key={post.id} entering={FadeInDown.delay(index * 100).duration(400)}>
                                    <CommunityPostCard
                                        post={post}
                                        currentUserId={""}
                                        onLike={() => { }}
                                        onReply={() => { }}
                                    />
                                </Animated.View>
                            ))
                        )}
                    </Animated.View>
                );
            case 'reviews':
                return (
                    <Animated.View entering={FadeInDown.duration(400)} style={styles.tabContent}>
                        {reviews.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="star-outline" size={64} color={theme.colors.border} />
                                <Typography color={theme.colors.textMuted} style={styles.emptyText}>
                                    No reviews yet.
                                </Typography>
                            </View>
                        ) : (
                            reviews.map((review, index) => (
                                <Animated.View key={review.id} entering={FadeInDown.delay(index * 100).duration(400)} style={styles.reviewItem}>
                                    <ReviewCard
                                        userName={review.userName}
                                        userAvatar={review.userPhoto}
                                        rating={review.rating}
                                        text={review.comment}
                                    />
                                    <View style={styles.reviewStoryTag}>
                                        <Ionicons name="book-outline" size={14} color={theme.colors.primary} />
                                        <Typography variant="bodyBold" style={{ fontSize: theme.typography.size.sm, marginLeft: 6 }}>
                                            {review.storyTitle || 'English Tale'}
                                        </Typography>
                                    </View>
                                </Animated.View>
                            ))
                        )}
                    </Animated.View>
                );
            case 'library':
                return (
                    <Animated.View entering={FadeInDown.duration(400)} style={styles.tabContent}>
                        {libraryItems.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="library-outline" size={64} color={theme.colors.border} />
                                <Typography color={theme.colors.textMuted} style={styles.emptyText}>
                                    The library is private or empty.
                                </Typography>
                            </View>
                        ) : (
                            <View style={styles.grid}>
                                {libraryItems.map((item, index) => (
                                    <Animated.View key={item.storyId} entering={FadeInDown.delay(index * 50).duration(400)}>
                                        <StoryGridCard
                                            story={item.story}
                                            isInLibrary={false}
                                            onPress={() => router.push(`/story/${item.storyId}`)}
                                        />
                                    </Animated.View>
                                ))}
                            </View>
                        )}
                    </Animated.View>
                );
            case 'more':
                return (
                    <Animated.View entering={FadeInDown.duration(400)} style={styles.tabContent}>
                        <View style={styles.emptyContainer}>
                            <Ionicons name="information-circle-outline" size={64} color={theme.colors.border} />
                            <Typography color={theme.colors.textMuted} style={styles.emptyText}>
                                More info is currently private.
                            </Typography>
                        </View>
                    </Animated.View>
                );
            default:
                return null;
        }
    };

    return (
        <View style={styles.container}>
            {/* Secondary Sticky Header */}
            <Animated.View style={[
                styles.stickyHeader,
                { paddingTop: Math.max(insets.top, 16) },
                stickyHeaderStyle
            ]}>
                <Typography variant="bodyBold" style={styles.stickyTitle}>
                    {profile.displayName}
                </Typography>
            </Animated.View>

            {/* Top Navigation Bar */}
            <View style={[styles.navBar, { paddingTop: Math.max(insets.top, 16) }]}>
                <Animated.View style={[styles.backButtonWrapper, backButtonStyle]}>
                    <Pressable
                        style={styles.navAction}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
                    </Pressable>
                </Animated.View>
            </View>

            <Animated.ScrollView
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                stickyHeaderIndices={[1]}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={theme.colors.primary} />
                }
            >
                <ProfileHeader
                    profile={{
                        ...profile,
                        followersCount: stats.followers,
                        followingCount: stats.following,
                        streak: stats.streak
                    }}
                    relationship={relationship}
                    onFollowPress={() => { relationship === 'following' ? handleUnfollow() : handleFollow(); }}
                    onSocialPress={handleSocialPress}
                    actionLoading={actionLoading}
                    scrollY={scrollY}
                />

                <View style={{ backgroundColor: theme.colors.background }}>
                    <ProfileTabs
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        counts={{
                            posts: posts.length,
                            library: libraryItems.length
                        }}
                    />
                </View>

                {renderTabContent()}
            </Animated.ScrollView>
        </View>
    );
}

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    navBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        paddingHorizontal: theme.spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        height: 100,
    },
    backButtonWrapper: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    navAction: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stickyHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 15,
        height: 100,
        backgroundColor: theme.colors.background,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.sm,
    },
    stickyTitle: {
        fontSize: theme.typography.size.lg,
    },
    tabContent: {
        paddingTop: theme.spacing.md,
        paddingBottom: 40,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 100,
        paddingHorizontal: 40,
    },
    emptyIllustration: {
        width: 200,
        height: 200,
        resizeMode: 'contain',
        marginBottom: 20,
    },
    emptyText: {
        textAlign: 'center',
        fontSize: theme.typography.size.md,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: theme.spacing.lg,
        gap: 16,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background,
    },
    reviewItem: {
        paddingHorizontal: theme.spacing.lg,
        marginBottom: 20,
        gap: 8,
    },
    reviewStoryTag: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: theme.colors.surfaceElevated,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        marginLeft: 4,
    },
}));
