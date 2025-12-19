import React from 'react';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Typography } from '../atoms/Typography';
import { LeaderboardEntry } from '@/services/leaderboardService';

interface MyRankSummaryProps {
    entry: LeaderboardEntry;
    rank: number;
}

export const MyRankSummary: React.FC<MyRankSummaryProps> = ({ entry, rank }) => {
    const { theme } = useUnistyles();

    return (
        <View style={styles.myRankBar}>
            <View style={styles.myRankContent}>
                <View style={styles.myRankInfo}>
                    <Typography variant="caption" color={theme.colors.textMuted}>YOUR POSITION</Typography>
                    <Typography variant="bodyBold" style={{ marginTop: 2 }}>
                        #{rank} • {entry.displayName}
                    </Typography>
                </View>
                <View style={styles.myRankScore}>
                    <Typography variant="h3" color={theme.colors.primary}>
                        {entry.totalWordsRead.toLocaleString()}
                    </Typography>
                    <Typography variant="label" color={theme.colors.textMuted} style={{ fontSize: 8 }}>
                        WORDS
                    </Typography>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    myRankBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: theme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
        paddingHorizontal: theme.spacing.xl,
        paddingTop: theme.spacing.md,
        paddingBottom: theme.spacing.xxxl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 10,
    },
    myRankContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    myRankInfo: {
        flex: 1,
    },
    myRankScore: {
        alignItems: 'flex-end',
    },
}));
