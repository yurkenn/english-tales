import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, Theme } from '@/theme';
import { Skeleton } from './BaseSkeleton';

export const ReadingScreenSkeleton: React.FC = () => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    return (
        <View style={styles.container}>
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

const createStyles = (theme: Theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        paddingTop: 60,
    },
});
