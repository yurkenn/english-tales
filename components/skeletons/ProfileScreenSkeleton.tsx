import React from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Skeleton } from './BaseSkeleton';

export const ProfileScreenSkeleton: React.FC = () => {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Skeleton width={120} height={28} />
                <Skeleton width={40} height={40} borderRadius={20} />
            </View>

            <View style={styles.profileCard}>
                <Skeleton width={80} height={80} borderRadius={40} />
                <Skeleton width={150} height={24} style={{ marginTop: 16 }} />
                <Skeleton width={200} height={16} style={{ marginTop: 8 }} />
            </View>

            <View style={styles.statsGrid}>
                {[1, 2, 3, 4].map((i) => (
                    <View key={i} style={styles.statItem}>
                        <Skeleton width={40} height={32} />
                        <Skeleton width={60} height={14} style={{ marginTop: 8 }} />
                    </View>
                ))}
            </View>

            <View style={styles.menuCard}>
                {[1, 2].map((i) => (
                    <View key={i} style={styles.menuItem}>
                        <Skeleton width={36} height={36} borderRadius={18} />
                        <Skeleton width="60%" height={18} />
                        <Skeleton width={20} height={20} borderRadius={10} />
                    </View>
                ))}
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
    statItem: {
        alignItems: 'center',
        gap: theme.spacing.xs,
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
}));
