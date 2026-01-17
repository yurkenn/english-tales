import { FC } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, Theme } from '@/theme';
import { Skeleton } from './BaseSkeleton';

export const ReviewsScreenSkeleton: FC = () => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Skeleton width={40} height={40} borderRadius={20} />
                <Skeleton width={100} height={24} />
                <Skeleton width={40} height={40} borderRadius={20} />
            </View>

            <View style={styles.list}>
                {[1, 2].map((i) => (
                    <View key={i} style={styles.reviewCard}>
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
                ))}
            </View>
        </View>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
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
        borderBottomColor: theme.colors.borderLight,
    },
    list: {
        paddingHorizontal: theme.spacing.lg,
        gap: theme.spacing.md,
    },
    reviewCard: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.lg,
        borderRadius: theme.radius.xl,
    },
});
