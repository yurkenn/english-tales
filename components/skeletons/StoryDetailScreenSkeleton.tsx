import React from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Skeleton } from './BaseSkeleton';

export const StoryDetailScreenSkeleton: React.FC = () => {
    return (
        <View style={styles.container}>
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

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
}));
