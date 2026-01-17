import { FC } from 'react';
// Force reload: 1

import { View, Text , StyleSheet } from 'react-native';
import { useTheme, Theme } from '@/theme';
import { useTranslation } from 'react-i18next';

interface StoryMetaProps {
    readTime: number;
    wordCount: number;
    difficulty: string;
}

export const StoryMeta: FC<StoryMetaProps> = ({
    readTime,
    wordCount,
    difficulty,
}) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const { t } = useTranslation();

    const formatReadTime = (minutes: number): string => {
        if (minutes < 60) return `${minutes} ${t('common.min')}`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    };

    const formatDifficulty = (diff: string): string => {
        const key = diff?.toLowerCase() || 'beginner';
        return t(`common.${key}`, diff || 'Beginner');
    };

    return (
        <View style={styles.container}>
            <View style={styles.item}>
                <Text style={styles.value}>{formatReadTime(readTime || 0)}</Text>
                <Text style={styles.label}>{t('profile.time')}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.item}>
                <Text style={styles.value}>{(wordCount || 0).toLocaleString()}</Text>
                <Text style={styles.label}>{t('profile.words')}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.item}>
                <Text style={styles.value}>{formatDifficulty(difficulty)}</Text>
                <Text style={styles.label}>{t('stories.filters.difficulty', 'Level')}</Text>
            </View>
        </View>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        paddingVertical: theme.spacing.lg,
        borderRadius: theme.radius.xl,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.sm,
    },
    item: {
        flex: 1,
        alignItems: 'center',
        gap: 2,
    },
    divider: {
        width: 1,
        height: 24,
        backgroundColor: theme.colors.borderLight,
    },
    value: {
        fontSize: theme.typography.size.lg,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    label: {
        fontSize: theme.typography.size.xs,
        color: theme.colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        fontWeight: theme.typography.weight.semibold,
    },
});
