import React from 'react';
import { View, ScrollView } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Skeleton } from './BaseSkeleton';

export const CommunityScreenSkeleton: React.FC = () => {
    return (
        <View style={styles.container}>
            {/* Header Skeleton */}
            <View style={styles.header}>
                <Skeleton width={180} height={32} />
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <Skeleton width={44} height={44} borderRadius={22} />
                    <Skeleton width={44} height={44} borderRadius={22} />
                </View>
            </View>

            {/* Filter Skeleton */}
            <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
                <Skeleton width="100%" height={40} borderRadius={20} />
            </View>

            {/* Trending Skeleton */}
            <View style={{ marginTop: 24 }}>
                <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
                    <Skeleton width={120} height={16} />
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <View key={i} style={{ width: 70 }}>
                            <Skeleton width={70} height={100} borderRadius={12} />
                            <Skeleton width={50} height={12} style={{ marginTop: 8, alignSelf: 'center' }} />
                        </View>
                    ))}
                </ScrollView>
            </View>

            {/* Posts Skeleton */}
            <View style={{ paddingHorizontal: 20, marginTop: 32, gap: 16 }}>
                {[1, 2].map((i) => (
                    <View key={i} style={styles.postCardSkeleton}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                            <Skeleton width={40} height={40} borderRadius={20} />
                            <View style={{ marginLeft: 12 }}>
                                <Skeleton width={100} height={16} />
                                <Skeleton width={60} height={12} style={{ marginTop: 4 }} />
                            </View>
                        </View>
                        <Skeleton width="100%" height={14} style={{ marginBottom: 8 }} />
                        <Skeleton width="90%" height={14} style={{ marginBottom: 8 }} />
                        <Skeleton width="70%" height={14} style={{ marginBottom: 16 }} />
                        <View style={{ flexDirection: 'row', gap: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f0f0f0' }}>
                            <Skeleton width={50} height={20} borderRadius={10} />
                            <Skeleton width={50} height={20} borderRadius={10} />
                            <Skeleton width={20} height={20} borderRadius={10} />
                        </View>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingTop: 10,
    },
    postCardSkeleton: {
        backgroundColor: theme.colors.surface,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
}));
