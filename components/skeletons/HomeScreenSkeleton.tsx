import React from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Skeleton, BookListItemSkeleton, FeaturedCardSkeleton } from './BaseSkeleton';

export const HomeScreenSkeleton: React.FC = () => {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Skeleton width={150} height={24} />
                    <Skeleton width={200} height={16} style={{ marginTop: 6 }} />
                </View>
                <Skeleton width={44} height={44} borderRadius={22} />
            </View>

            <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
                <Skeleton width="100%" height={50} borderRadius={25} />
            </View>

            <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 20 }}>
                <Skeleton width={60} height={36} borderRadius={18} />
                <Skeleton width={80} height={36} borderRadius={18} />
                <Skeleton width={70} height={36} borderRadius={18} />
                <Skeleton width={90} height={36} borderRadius={18} />
            </View>

            <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
                <Skeleton width={150} height={20} />
                <FeaturedCardSkeleton />
            </View>

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

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        paddingTop: theme.spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
    },
}));
