import React from 'react';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import { Typography } from '../atoms/Typography';
import { OptimizedImage } from '../atoms/OptimizedImage';
import { LeaderboardEntry } from '@/services/leaderboardService';

interface RankingRowProps {
    entry: LeaderboardEntry;
    rank: number;
    isMe: boolean;
}

export const RankingRow: React.FC<RankingRowProps> = ({ entry, rank, isMe }) => {
    const { theme } = useUnistyles();
    const { t: translate } = useTranslation();

    return (
        <View style={[styles.rowContainer, isMe && styles.rowMeSmall]}>
            <View style={styles.rowRank}>
                <Typography variant="body" color={theme.colors.textMuted}>{rank}</Typography>
            </View>

            <View style={styles.rowAvatarContainer}>
                {entry.photoURL ? (
                    <OptimizedImage
                        source={{ uri: entry.photoURL }}
                        style={styles.rowAvatar}
                        placeholder="person-circle"
                    />
                ) : (
                    <View style={styles.rowAvatarPlaceholder}>
                        <Typography variant="label" color={theme.colors.textInverse}>
                            {(entry.displayName || '?').charAt(0).toUpperCase()}
                        </Typography>
                    </View>
                )}
            </View>

            <View style={styles.rowInfo}>
                <Typography variant="body" numberOfLines={1} color={isMe ? theme.colors.primary : theme.colors.text}>
                    {entry.displayName} {isMe && ` (${translate('common.you', { defaultValue: 'You' })})`}
                </Typography>
            </View>

            <View style={styles.rowScore}>
                <Typography variant="bodyBold">
                    {entry.totalWordsRead.toLocaleString()}
                </Typography>
            </View>
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    rowContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    rowMeSmall: {
        backgroundColor: theme.colors.primary + '08',
    },
    rowRank: {
        width: 30,
        alignItems: 'center',
    },
    rowAvatarContainer: {
        marginLeft: theme.spacing.md,
    },
    rowAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    rowAvatarPlaceholder: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.borderLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rowInfo: {
        flex: 1,
        marginLeft: theme.spacing.md,
    },
    rowScore: {
        alignItems: 'flex-end',
    },
}));
