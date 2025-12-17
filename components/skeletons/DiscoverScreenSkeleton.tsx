import React from 'react';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Skeleton, BookCardSkeleton, BookListItemSkeleton } from './BaseSkeleton';

export const DiscoverScreenSkeleton: React.FC = () => {
    const { theme } = useUnistyles();
    return (
        <View style={styles.container}>
            <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
                <Skeleton width={140} height={20} />
                <Skeleton width="100%" height={200} borderRadius={theme.radius.xl} style={{ marginTop: 12 }} />
            </View>

            <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
                <Skeleton width={130} height={20} />
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                    <BookCardSkeleton />
                    <BookCardSkeleton />
                    <BookCardSkeleton />
                </View>
            </View>

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

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
}));
