import React from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Skeleton, BookListItemSkeleton } from './BaseSkeleton';

export const CategoryScreenSkeleton: React.FC = () => {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Skeleton width={40} height={40} borderRadius={20} />
                <Skeleton width={120} height={24} />
                <Skeleton width={40} height={40} borderRadius={20} />
            </View>

            <View style={styles.list}>
                <BookListItemSkeleton />
                <BookListItemSkeleton />
                <BookListItemSkeleton />
                <BookListItemSkeleton />
                <BookListItemSkeleton />
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
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    list: {
        padding: theme.spacing.lg,
        gap: theme.spacing.md,
    },
}));
