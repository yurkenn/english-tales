import { FC, memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme, Theme } from '@/theme';
import { haptics } from '@/utils/haptics';

interface VocabQuizHeaderProps {
    wordCount: number;
}

export const VocabQuizHeader: FC<VocabQuizHeaderProps> = memo(({ wordCount }) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const router = useRouter();
    const styles = createStyles(theme);

    if (wordCount < 3) return null;

    return (
        <Pressable
            onPress={() => { haptics.medium(); router.push('/user/quiz'); }}
            style={styles.quizHeader}
        >
            <View style={styles.quizHeaderContent}>
                <View style={styles.quizHeaderIcon}>
                    <Text style={{ fontSize: 18 }}>🎴</Text>
                </View>
                <View style={styles.quizHeaderText}>
                    <Text style={styles.quizHeaderTitle}>{t('library.quizTitle', 'Practice Quiz')}</Text>
                    <Text style={styles.quizHeaderSubtitle}>
                        {t('library.quizSubtitle', '{{count}} words to practice', { count: wordCount })}
                    </Text>
                </View>
            </View>
            <View style={styles.quizHeaderArrow}>
                <Text style={{ fontSize: 20 }}>→</Text>
            </View>
        </Pressable>
    );
});

VocabQuizHeader.displayName = 'VocabQuizHeader';

function createStyles(theme: Theme) {
    return StyleSheet.create({
        quizHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: theme.colors.surface,
            marginHorizontal: theme.spacing.lg,
            marginTop: theme.spacing.sm,
            marginBottom: theme.spacing.sm,
            padding: theme.spacing.md,
            borderRadius: theme.radius.lg,
            borderWidth: 1,
            borderColor: theme.colors.borderLight,
            ...theme.shadows.sm,
        },
        quizHeaderContent: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.md,
        },
        quizHeaderIcon: {
            width: 40,
            height: 40,
            borderRadius: theme.radius.full,
            backgroundColor: theme.colors.primary + '10',
            alignItems: 'center',
            justifyContent: 'center',
        },
        quizHeaderText: {
            gap: theme.spacing.xxs,
        },
        quizHeaderTitle: {
            fontSize: theme.typography.size.md,
            fontWeight: '700',
            color: theme.colors.text,
        },
        quizHeaderSubtitle: {
            fontSize: theme.typography.size.xs,
            color: theme.colors.textSecondary,
        },
        quizHeaderArrow: {
            opacity: 0.5,
        },
    });
}
