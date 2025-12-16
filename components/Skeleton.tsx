import React, { useEffect, useRef } from 'react';
import { Animated, View, ViewStyle } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

interface SkeletonProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    width = '100%',
    height = 20,
    borderRadius = 8,
    style,
}) => {
    const { theme } = useUnistyles();
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, [opacity]);

    return (
        <Animated.View
            style={[
                {
                    width: width as any,
                    height,
                    borderRadius,
                    backgroundColor: theme.colors.borderLight,
                    opacity,
                },
                style,
            ]}
        />
    );
};

// Pre-built skeleton variants
export const BookCardSkeleton: React.FC = () => {
    const { theme } = useUnistyles();
    return (
        <View style={skeletonStyles.bookCard}>
            <Skeleton width={120} height={168} borderRadius={12} />
            <View style={skeletonStyles.bookCardContent}>
                <Skeleton width="80%" height={16} />
                <Skeleton width="50%" height={14} style={{ marginTop: 8 }} />
            </View>
        </View>
    );
};

export const BookListItemSkeleton: React.FC = () => {
    return (
        <View style={skeletonStyles.listItem}>
            <Skeleton width={80} height={112} borderRadius={12} />
            <View style={skeletonStyles.listItemContent}>
                <Skeleton width="70%" height={18} />
                <Skeleton width="40%" height={14} style={{ marginTop: 8 }} />
                <Skeleton width="90%" height={8} style={{ marginTop: 16 }} />
            </View>
        </View>
    );
};

export const StorySectionSkeleton: React.FC = () => {
    return (
        <View style={skeletonStyles.section}>
            <View style={skeletonStyles.sectionHeader}>
                <Skeleton width={150} height={24} />
                <Skeleton width={60} height={16} />
            </View>
            <View style={skeletonStyles.sectionCards}>
                <BookCardSkeleton />
                <BookCardSkeleton />
                <BookCardSkeleton />
            </View>
        </View>
    );
};

const skeletonStyles = StyleSheet.create((theme) => ({
    bookCard: {
        width: 120,
        marginRight: theme.spacing.md,
    },
    bookCardContent: {
        marginTop: theme.spacing.sm,
    },
    listItem: {
        flexDirection: 'row',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xl,
        gap: theme.spacing.md,
    },
    listItemContent: {
        flex: 1,
        justifyContent: 'center',
    },
    section: {
        paddingHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.md,
    },
    sectionCards: {
        flexDirection: 'row',
    },
    homeScreen: {
        flex: 1,
        backgroundColor: theme.colors.background,
        paddingTop: theme.spacing.md,
    },
    homeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
    },
    libraryScreen: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: theme.spacing.xl,
        paddingHorizontal: theme.spacing.lg,
    },
    statItem: {
        alignItems: 'center',
        gap: theme.spacing.xs,
    },
    libraryList: {
        paddingHorizontal: theme.spacing.lg,
        gap: theme.spacing.md,
    },
    discoverScreen: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    featuredCard: {
        marginTop: theme.spacing.md,
    },
    categoryScreen: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    categoryList: {
        padding: theme.spacing.lg,
        gap: theme.spacing.md,
    },
    authorScreen: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    authorHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
    },
    authorInfo: {
        alignItems: 'center',
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.xxl,
    },
    authorStories: {
        paddingHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.xxl,
    },
    storyDetailScreen: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    reviewsScreen: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    reviewsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    reviewsList: {
        paddingHorizontal: theme.spacing.lg,
        gap: theme.spacing.md,
    },
    reviewCard: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.lg,
        borderRadius: theme.radius.xl,
    },
    profileScreen: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.lg,
    },
    profileCard: {
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.xl,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: theme.spacing.lg,
        gap: theme.spacing.md,
        marginBottom: theme.spacing.lg,
    },
    menuCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xl,
        marginHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        gap: theme.spacing.md,
    },
    readingScreen: {
        flex: 1,
        backgroundColor: theme.colors.background,
        paddingTop: 60,
    },
}));

// Featured Card Skeleton
export const FeaturedCardSkeleton: React.FC = () => {
    const { theme } = useUnistyles();
    return (
        <View style={skeletonStyles.featuredCard}>
            <Skeleton width="100%" height={200} borderRadius={theme.radius.xl} />
        </View>
    );
};

// Home Screen Skeleton
export const HomeScreenSkeleton: React.FC = () => {
    return (
        <View style={skeletonStyles.homeScreen}>
            {/* Header */}
            <View style={skeletonStyles.homeHeader}>
                <View>
                    <Skeleton width={150} height={24} />
                    <Skeleton width={200} height={16} style={{ marginTop: 6 }} />
                </View>
                <Skeleton width={44} height={44} borderRadius={22} />
            </View>

            {/* Search Bar */}
            <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
                <Skeleton width="100%" height={50} borderRadius={25} />
            </View>

            {/* Genre Chips */}
            <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 20 }}>
                <Skeleton width={60} height={36} borderRadius={18} />
                <Skeleton width={80} height={36} borderRadius={18} />
                <Skeleton width={70} height={36} borderRadius={18} />
                <Skeleton width={90} height={36} borderRadius={18} />
            </View>

            {/* Featured */}
            <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
                <Skeleton width={150} height={20} />
                <FeaturedCardSkeleton />
            </View>

            {/* Trending */}
            <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
                <Skeleton width={120} height={20} />
                <View style={{ gap: 12, marginTop: 12 }}>
                    <BookListItemSkeleton />
                    <BookListItemSkeleton />
                    <BookListItemSkeleton />
                </View>
            </View>
        </View>
    );
};

// Library Screen Skeleton
export const LibraryScreenSkeleton: React.FC = () => {
    return (
        <View style={skeletonStyles.libraryScreen}>
            {/* Stats */}
            <View style={skeletonStyles.statsRow}>
                <View style={skeletonStyles.statItem}>
                    <Skeleton width={40} height={32} />
                    <Skeleton width={50} height={14} />
                </View>
                <View style={skeletonStyles.statItem}>
                    <Skeleton width={40} height={32} />
                    <Skeleton width={60} height={14} />
                </View>
                <View style={skeletonStyles.statItem}>
                    <Skeleton width={40} height={32} />
                    <Skeleton width={70} height={14} />
                </View>
            </View>

            {/* Library Items */}
            <View style={skeletonStyles.libraryList}>
                <BookListItemSkeleton />
                <BookListItemSkeleton />
                <BookListItemSkeleton />
                <BookListItemSkeleton />
            </View>
        </View>
    );
};

// Discover Screen Skeleton
export const DiscoverScreenSkeleton: React.FC = () => {
    const { theme } = useUnistyles();
    return (
        <View style={skeletonStyles.discoverScreen}>
            {/* Author Spotlight */}
            <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
                <Skeleton width={140} height={20} />
                <Skeleton width="100%" height={200} borderRadius={theme.radius.xl} style={{ marginTop: 12 }} />
            </View>

            {/* Trending */}
            <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
                <Skeleton width={130} height={20} />
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                    <BookCardSkeleton />
                    <BookCardSkeleton />
                    <BookCardSkeleton />
                </View>
            </View>

            {/* Recommended */}
            <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
                <Skeleton width={160} height={20} />
                <View style={{ gap: 12, marginTop: 12 }}>
                    <BookListItemSkeleton />
                    <BookListItemSkeleton />
                </View>
            </View>
        </View>
    );
};

// Category Screen Skeleton
export const CategoryScreenSkeleton: React.FC = () => {
    return (
        <View style={skeletonStyles.categoryScreen}>
            {/* Header */}
            <View style={skeletonStyles.categoryHeader}>
                <Skeleton width={40} height={40} borderRadius={20} />
                <Skeleton width={120} height={24} />
                <Skeleton width={40} height={40} borderRadius={20} />
            </View>

            {/* Stories List */}
            <View style={skeletonStyles.categoryList}>
                <BookListItemSkeleton />
                <BookListItemSkeleton />
                <BookListItemSkeleton />
                <BookListItemSkeleton />
                <BookListItemSkeleton />
            </View>
        </View>
    );
};

// Author Screen Skeleton
export const AuthorScreenSkeleton: React.FC = () => {
    return (
        <View style={skeletonStyles.authorScreen}>
            {/* Header */}
            <View style={skeletonStyles.authorHeader}>
                <Skeleton width={40} height={40} borderRadius={20} />
                <Skeleton width={80} height={24} />
                <Skeleton width={40} height={40} borderRadius={20} />
            </View>

            {/* Author Info */}
            <View style={skeletonStyles.authorInfo}>
                <Skeleton width={120} height={120} borderRadius={60} />
                <Skeleton width={150} height={28} style={{ marginTop: 16 }} />
                <Skeleton width={100} height={16} style={{ marginTop: 8 }} />
                <Skeleton width="80%" height={16} style={{ marginTop: 16 }} />
                <Skeleton width="70%" height={16} style={{ marginTop: 8 }} />
            </View>

            {/* Stories */}
            <View style={skeletonStyles.authorStories}>
                <Skeleton width={100} height={20} />
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                    <BookCardSkeleton />
                    <BookCardSkeleton />
                    <BookCardSkeleton />
                </View>
            </View>
        </View>
    );
};

// Story Detail Screen Skeleton
export const StoryDetailScreenSkeleton: React.FC = () => {
    return (
        <View style={skeletonStyles.storyDetailScreen}>
            <Skeleton width="100%" height={300} />
            <View style={{ padding: 20, gap: 12 }}>
                <Skeleton width="80%" height={32} />
                <Skeleton width="60%" height={20} />
                <Skeleton width="100%" height={16} style={{ marginTop: 16 }} />
                <Skeleton width="90%" height={16} />
                <Skeleton width="100%" height={16} />
            </View>
        </View>
    );
};

// Reviews Screen Skeleton
export const ReviewsScreenSkeleton: React.FC = () => {
    return (
        <View style={skeletonStyles.reviewsScreen}>
            {/* Header */}
            <View style={skeletonStyles.reviewsHeader}>
                <Skeleton width={40} height={40} borderRadius={20} />
                <Skeleton width={100} height={24} />
                <Skeleton width={40} height={40} borderRadius={20} />
            </View>

            {/* Reviews List */}
            <View style={skeletonStyles.reviewsList}>
                <View style={skeletonStyles.reviewCard}>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <Skeleton width={40} height={40} borderRadius={20} />
                        <View style={{ flex: 1, gap: 8 }}>
                            <Skeleton width="60%" height={18} />
                            <Skeleton width="40%" height={14} />
                        </View>
                    </View>
                    <Skeleton width="100%" height={16} style={{ marginTop: 12 }} />
                    <Skeleton width="90%" height={16} style={{ marginTop: 8 }} />
                </View>
                <View style={skeletonStyles.reviewCard}>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <Skeleton width={40} height={40} borderRadius={20} />
                        <View style={{ flex: 1, gap: 8 }}>
                            <Skeleton width="60%" height={18} />
                            <Skeleton width="40%" height={14} />
                        </View>
                    </View>
                    <Skeleton width="100%" height={16} style={{ marginTop: 12 }} />
                    <Skeleton width="90%" height={16} style={{ marginTop: 8 }} />
                </View>
            </View>
        </View>
    );
};

// Profile Screen Skeleton
export const ProfileScreenSkeleton: React.FC = () => {
    return (
        <View style={skeletonStyles.profileScreen}>
            {/* Header */}
            <View style={skeletonStyles.profileHeader}>
                <Skeleton width={120} height={28} />
                <Skeleton width={40} height={40} borderRadius={20} />
            </View>

            {/* Profile Card */}
            <View style={skeletonStyles.profileCard}>
                <Skeleton width={80} height={80} borderRadius={40} />
                <Skeleton width={150} height={24} style={{ marginTop: 16 }} />
                <Skeleton width={200} height={16} style={{ marginTop: 8 }} />
            </View>

            {/* Stats Grid */}
            <View style={skeletonStyles.statsGrid}>
                <View style={skeletonStyles.statItem}>
                    <Skeleton width={40} height={32} />
                    <Skeleton width={60} height={14} style={{ marginTop: 8 }} />
                </View>
                <View style={skeletonStyles.statItem}>
                    <Skeleton width={40} height={32} />
                    <Skeleton width={60} height={14} style={{ marginTop: 8 }} />
                </View>
                <View style={skeletonStyles.statItem}>
                    <Skeleton width={40} height={32} />
                    <Skeleton width={60} height={14} style={{ marginTop: 8 }} />
                </View>
                <View style={skeletonStyles.statItem}>
                    <Skeleton width={40} height={32} />
                    <Skeleton width={60} height={14} style={{ marginTop: 8 }} />
                </View>
            </View>

            {/* Menu */}
            <View style={skeletonStyles.menuCard}>
                <View style={skeletonStyles.menuItem}>
                    <Skeleton width={36} height={36} borderRadius={18} />
                    <Skeleton width="60%" height={18} />
                    <Skeleton width={20} height={20} borderRadius={10} />
                </View>
                <View style={skeletonStyles.menuItem}>
                    <Skeleton width={36} height={36} borderRadius={18} />
                    <Skeleton width="60%" height={18} />
                    <Skeleton width={20} height={20} borderRadius={10} />
                </View>
            </View>
        </View>
    );
};

// Reading Screen Skeleton (simple version)
export const ReadingScreenSkeleton: React.FC = () => {
    return (
        <View style={skeletonStyles.readingScreen}>
            <View style={{ padding: 20, gap: 16 }}>
                <Skeleton width="100%" height={20} />
                <Skeleton width="95%" height={20} />
                <Skeleton width="100%" height={20} />
                <Skeleton width="90%" height={20} />
                <Skeleton width="100%" height={20} style={{ marginTop: 24 }} />
                <Skeleton width="95%" height={20} />
                <Skeleton width="100%" height={20} />
            </View>
        </View>
    );
};
