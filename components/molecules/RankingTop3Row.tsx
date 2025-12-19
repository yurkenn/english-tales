import React from 'react';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Typography } from '../atoms/Typography';
import { OptimizedImage } from '../atoms/OptimizedImage';
import { LeaderboardEntry } from '@/services/leaderboardService';

interface RankingTop3RowProps {
    entry: LeaderboardEntry;
    rank: 1 | 2 | 3;
    isMe: boolean;
}

export const RankingTop3Row: React.FC<RankingTop3RowProps> = ({ entry, rank, isMe }) => {
    const { theme } = useUnistyles();
    const rankColors = { 1: '#FFD700', 2: '#94A3B8', 3: '#B45309' };

    return (
        <Animated.View
            entering={FadeInUp.delay(rank * 100)}
            style={[styles.top3Card, isMe && styles.rowMe]}
        >
            <View style={styles.top3RankContainer}>
                <Typography variant="h1" style={[styles.top3RankText, { color: rankColors[rank] }]}>
                    {rank}
                </Typography>
            </View>

            <View style={styles.avatarContainer}>
                {entry.photoURL ? (
                    <OptimizedImage
                        source={{ uri: entry.photoURL }}
                        style={styles.top3Avatar}
                        placeholder="person-circle"
                    />
                ) : (
                    <View style={styles.top3AvatarPlaceholder}>
                        <Typography variant="h3" color={theme.colors.textInverse}>
                            {(entry.displayName || '?').charAt(0).toUpperCase()}
                        </Typography>
                    </View>
                )}
            </View>

            <View style={styles.top3Info}>
                <Typography variant="bodyBold" numberOfLines={1}>
                    {entry.displayName}
                </Typography>
                <View style={styles.statsRow}>
                    <Ionicons name="book-outline" size={12} color={theme.colors.textMuted} />
                    <Typography variant="caption" color={theme.colors.textMuted} style={{ marginLeft: 4 }}>
                        {entry.completedStoriesCount} stories
                    </Typography>
                </View>
            </View>

            <View style={styles.top3Score}>
                <Typography variant="h3" color={theme.colors.primary}>
                    {Math.floor(entry.totalWordsRead / 1000)}k
                </Typography>
                <Typography variant="label" color={theme.colors.textMuted} style={{ fontSize: 8 }}>
                    WORDS
                </Typography>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create((theme) => ({
    top3Card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
        borderRadius: 16,
        marginBottom: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    rowMe: {
        backgroundColor: theme.colors.background,
        borderColor: theme.colors.primary,
        borderWidth: 1.5,
    },
    top3RankContainer: {
        width: 32,
        alignItems: 'center',
    },
    top3RankText: {
        fontSize: 28,
        fontWeight: '900',
    },
    avatarContainer: {
        marginLeft: theme.spacing.xs,
    },
    top3Avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    top3AvatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: theme.colors.borderLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    top3Info: {
        flex: 1,
        marginLeft: theme.spacing.md,
        justifyContent: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    top3Score: {
        alignItems: 'flex-end',
        marginLeft: theme.spacing.sm,
    },
}));
