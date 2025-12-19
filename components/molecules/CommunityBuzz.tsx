import { View, ScrollView, Pressable, StyleSheet as RNStyleSheet } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Typography } from '../atoms/Typography';
import { OptimizedImage } from '../atoms/OptimizedImage';
import { haptics } from '@/utils/haptics';
import { useTranslation } from 'react-i18next';

interface ActivityItem {
    id: string;
    userId: string;
    userName: string;
    userPhoto?: string;
    type: 'story_completed' | 'achievement' | 'started_reading';
    targetName: string; // story title or achievement name
    timestamp: Date;
}

interface CommunityBuzzProps {
    activities: ActivityItem[];
    onPressActivity?: (activity: ActivityItem) => void;
}

export const CommunityBuzz: React.FC<CommunityBuzzProps> = ({ activities, onPressActivity }) => {
    const { t } = useTranslation();
    const { theme } = useUnistyles();

    if (activities.length === 0) return null;

    const renderIcon = (type: ActivityItem['type']) => {
        switch (type) {
            case 'story_completed': return '🏆';
            case 'achievement': return '🌟';
            case 'started_reading': return '📖';
            default: return '✨';
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Typography variant="h3">{t('social.communityBuzz', 'Community Buzz')}</Typography>
                <Typography variant="caption" color={theme.colors.primary}>
                    {t('common.seeAll', 'See All')}
                </Typography>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {activities.map((item) => (
                    <Pressable
                        key={item.id}
                        style={styles.card}
                        onPress={() => {
                            haptics.selection();
                            onPressActivity?.(item);
                        }}
                    >
                        <View style={styles.cardHeader}>
                            <OptimizedImage
                                source={{ uri: item.userPhoto || '' }}
                                style={styles.avatar}
                                placeholder="person-circle"
                            />
                            <View style={styles.iconBadge}>
                                <Typography style={{ fontSize: 10 }}>{renderIcon(item.type)}</Typography>
                            </View>
                        </View>

                        <View style={styles.textContainer}>
                            <Typography variant="bodyBold" style={{ fontSize: 12 }} numberOfLines={1}>
                                {item.userName}
                            </Typography>
                            <Typography variant="caption" color={theme.colors.textMuted} numberOfLines={2}>
                                {item.type === 'story_completed' && t('social.activityFinished', { title: item.targetName })}
                                {item.type === 'achievement' && t('social.activityEarned', { title: item.targetName })}
                                {item.type === 'started_reading' && t('social.activityStarted', { title: item.targetName })}
                            </Typography>
                        </View>
                    </Pressable>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        marginVertical: theme.spacing.lg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.md,
    },
    scrollContent: {
        paddingHorizontal: theme.spacing.lg,
        gap: theme.spacing.md,
    },
    card: {
        width: 154,
        backgroundColor: theme.colors.surface,
        borderRadius: 20,
        padding: theme.spacing.md,
        ...theme.shadows.sm,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    cardHeader: {
        position: 'relative',
        marginBottom: theme.spacing.sm,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.colors.background,
    },
    iconBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        backgroundColor: theme.colors.surface,
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: theme.colors.surface,
        ...theme.shadows.sm,
    },
    textContainer: {
        gap: 2,
    },
}));
