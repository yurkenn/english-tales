import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, Theme } from '@/theme';
import { Skeleton, BookListItemSkeleton } from './BaseSkeleton';

export const LibraryScreenSkeleton: React.FC = () => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    return (
        <View style={styles.container}>
            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Skeleton width={40} height={32} />
                    <Skeleton width={50} height={14} />
                </View>
                <View style={styles.statItem}>
                    <Skeleton width={40} height={32} />
                    <Skeleton width={60} height={14} />
                </View>
                <View style={styles.statItem}>
                    <Skeleton width={40} height={32} />
                    <Skeleton width={70} height={14} />
                </View>
            </View>

            <View style={styles.list}>
                <BookListItemSkeleton />
                <BookListItemSkeleton />
                <BookListItemSkeleton />
                <BookListItemSkeleton />
            </View>
        </View>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
    container: {
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
    list: {
        paddingHorizontal: theme.spacing.lg,
        gap: theme.spacing.md,
    },
});
