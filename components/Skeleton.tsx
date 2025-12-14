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
}));
