import React, { useEffect, useState, useMemo } from 'react';
import { View, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { leaderboardService, LeaderboardEntry } from '@/services/leaderboardService';
import { useAuthStore } from '@/store/authStore';
import { Typography, SegmentedPicker } from '@/components/atoms';
import { RankingTop3Row, RankingRow, MyRankSummary } from '@/components/molecules';
import { socialService } from '@/services/socialService';
import { haptics } from '@/utils/haptics';
import { useTranslation } from 'react-i18next';

export default function RankingsScreen() {
    const { t: translate } = useTranslation();
    const { theme } = useUnistyles();
    const currentUser = useAuthStore((s) => s.user);
    const [rankings, setRankings] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [viewMode, setViewMode] = useState<'global' | 'friends'>('global');
    const [friendIds, setFriendIds] = useState<string[]>([]);

    const fetchRankings = async () => {
        const result = await leaderboardService.getTopReaders(50);
        if (result.success && result.data) {
            setRankings(result.data);
        }

        if (currentUser) {
            const socialRes = await socialService.getFriendships(currentUser.id);
            if (socialRes.success) {
                const ids = socialRes.data.accepted.map(f => f.id);
                setFriendIds([...ids, currentUser.id]);
            }
        }

        setIsLoading(false);
        setIsRefreshing(false);
    };

    useEffect(() => {
        fetchRankings();
    }, []);

    const onRefresh = () => {
        setIsRefreshing(true);
        fetchRankings();
        haptics.selection();
    };

    const filteredRankings = useMemo(() =>
        viewMode === 'global' ? rankings : rankings.filter(r => friendIds.includes(r.userId))
        , [rankings, viewMode, friendIds]);

    const top3 = filteredRankings.slice(0, 3);
    const others = filteredRankings.slice(3);

    const myEntry = rankings.find(r => r.userId === currentUser?.id);
    const myRank = rankings.findIndex(r => r.userId === currentUser?.id) + 1;

    if (isLoading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: translate('rankings.headerTitle', { defaultValue: 'Rankings' }),
                    headerLargeTitle: true,
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: theme.colors.background },
                }}
            />

            <View style={styles.segmentedContainer}>
                <SegmentedPicker
                    options={[
                        { label: translate('rankings.global'), value: 'global' },
                        { label: translate('rankings.friends'), value: 'friends' },
                    ]}
                    selectedValue={viewMode}
                    onValueChange={setViewMode}
                />
            </View>

            <FlatList
                data={others}
                keyExtractor={(item) => item.userId}
                ListHeaderComponent={
                    <View style={styles.headerArea}>
                        {top3.map((entry, index) => (
                            <RankingTop3Row
                                key={entry.userId}
                                entry={entry}
                                rank={(index + 1) as 1 | 2 | 3}
                                isMe={entry.userId === currentUser?.id}
                            />
                        ))}
                        {others.length > 0 && (
                            <Typography variant="label" color={theme.colors.textMuted} style={styles.othersLabel}>
                                {translate('rankings.othersLabel', { defaultValue: 'ALL READERS' }).toUpperCase()}
                            </Typography>
                        )}
                    </View>
                }
                renderItem={({ item, index }) => (
                    <RankingRow
                        entry={item}
                        rank={index + 4}
                        isMe={item.userId === currentUser?.id}
                    />
                )}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="people-outline" size={48} color={theme.colors.textMuted} />
                        <Typography align="center" color={theme.colors.textSecondary}>
                            {translate('rankings.emptyFriends')}
                        </Typography>
                    </View>
                }
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
                }
            />

            {myEntry && (
                <MyRankSummary entry={myEntry} rank={myRank} />
            )}
        </View>
    );
}

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    loading: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background,
    },
    segmentedContainer: {
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.md,
    },
    headerArea: {
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.md,
        paddingBottom: theme.spacing.sm,
    },
    othersLabel: {
        marginTop: theme.spacing.xl,
        marginBottom: theme.spacing.sm,
        letterSpacing: 1.5,
        fontSize: 10,
        fontWeight: '900',
        paddingHorizontal: 4,
    },
    list: {
        paddingBottom: 140,
    },
    emptyContainer: {
        padding: 80,
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.md,
    },
}));
