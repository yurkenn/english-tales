import React from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Skeleton, BookCardSkeleton } from './BaseSkeleton';

export const AuthorScreenSkeleton: React.FC = () => {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Skeleton width={40} height={40} borderRadius={20} />
                <Skeleton width={80} height={24} />
                <Skeleton width={40} height={40} borderRadius={20} />
            </View>

            <View style={styles.authorInfo}>
                <Skeleton width={120} height={120} borderRadius={60} />
                <Skeleton width={150} height={28} style={{ marginTop: 16 }} />
                <Skeleton width={100} height={16} style={{ marginTop: 8 }} />
                <Skeleton width="80%" height={16} style={{ marginTop: 16 }} />
                <Skeleton width="70%" height={16} style={{ marginTop: 8 }} />
            </View>

            <View style={styles.stories}>
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
    authorInfo: {
        alignItems: 'center',
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.xxl,
    },
    stories: {
        paddingHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.xxl,
    },
}));
