import React from 'react';
import { View, ScrollView, Pressable, Image, ImageSourcePropType } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../atoms/Typography';
import { haptics } from '@/utils/haptics';
import { useTranslation } from 'react-i18next';

// Default mascot avatar for users without profile photo
const DEFAULT_AVATAR = require('@/assets/defaultavatar.png');

interface ActivityItem {
    id: string;
    userId: string;
    userName: string;
    userPhoto?: string;
    type: 'story_completed' | 'achievement' | 'started_reading' | 'follow' | 'story_review';
    targetName: string;
    timestamp: Date;
}

interface CommunityBuzzProps {
    activities: ActivityItem[];
    onPressActivity?: (activity: ActivityItem) => void;
}

const CARD_WIDTH = 180;

export const CommunityBuzz: React.FC<CommunityBuzzProps> = ({ activities, onPressActivity }) => {
    const { t } = useTranslation();
    const { theme } = useUnistyles();

    if (activities.length === 0) return null;

    const getActivityConfig = (type: ActivityItem['type']) => {
        switch (type) {
            case 'story_completed':
                return { icon: 'trophy' as const, color: theme.colors.warning, bg: `${theme.colors.warning}20` };
            case 'achievement':
                return { icon: 'star' as const, color: theme.colors.success, bg: `${theme.colors.success}20` };
            case 'started_reading':
                return { icon: 'book' as const, color: theme.colors.primary, bg: `${theme.colors.primary}20` };
            case 'follow':
                return { icon: 'person-add' as const, color: theme.colors.primary, bg: `${theme.colors.primary}20` };
            case 'story_review':
                return { icon: 'chatbox-ellipses' as const, color: theme.colors.primary, bg: `${theme.colors.primary}20` };
            default:
                return { icon: 'flash' as const, color: theme.colors.primary, bg: `${theme.colors.primary}20` };
        }
    };

    const getAvatarSource = (userPhoto?: string): ImageSourcePropType => {
        return userPhoto ? { uri: userPhoto } : DEFAULT_AVATAR;
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Typography variant="label" color={theme.colors.textMuted} style={styles.headerTitle}>
                    {t('social.communityBuzz', 'BEYOND THE BOOKS').toUpperCase()}
                </Typography>
                <Pressable onPress={() => haptics.selection()} style={styles.seeAll}>
                    <Typography variant="label" color={theme.colors.primary} style={styles.seeAllText}>
                        {t('common.seeAll', 'See All')}
                    </Typography>
                    <Ionicons name="chevron-forward" size={10} color={theme.colors.primary} />
                </Pressable>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                decelerationRate="fast"
                snapToInterval={CARD_WIDTH + theme.spacing.md}
            >
                {activities.map((item) => {
                    const config = getActivityConfig(item.type);
                    return (
                        <Pressable
                            key={item.id}
                            style={styles.activityRow}
                            onPress={() => {
                                haptics.selection();
                                onPressActivity?.(item);
                            }}
                        >
                            <View style={styles.avatarWrapper}>
                                <Image
                                    source={getAvatarSource(item.userPhoto)}
                                    style={styles.avatar}
                                />
                                <View style={[styles.typeBadge, { backgroundColor: config.color }]}>
                                    <Ionicons name={config.icon} size={8} color="#FFF" />
                                </View>
                            </View>


                            <View style={styles.textWrapper}>
                                <Typography variant="label" numberOfLines={1} style={styles.userName}>
                                    {item.userName}
                                </Typography>
                                <Typography variant="caption" color={theme.colors.textSecondary} numberOfLines={1} style={styles.activityText}>
                                    {item.type === 'story_completed' && t('social.activityFinished', { title: item.targetName })}
                                    {item.type === 'achievement' && t('social.activityEarned', { title: item.targetName })}
                                    {item.type === 'started_reading' && t('social.activityStarted', { title: item.targetName })}
                                    {item.type === 'follow' && t('social.activityFollowed', { name: item.targetName })}
                                    {item.type === 'story_review' && t('social.activityReviewed', { title: item.targetName })}
                                </Typography>
                            </View>
                        </Pressable>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        marginTop: theme.spacing.xs,
        marginBottom: theme.spacing.sm,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: theme.spacing.xs,
    },
    headerTitle: {
        letterSpacing: 1,
        fontWeight: '700',
        fontSize: theme.typography.size.xs,
    },
    seeAll: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    seeAllText: {
        fontWeight: '700',
        fontSize: theme.typography.size.xs,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingVertical: theme.spacing.xs,
        gap: theme.spacing.md,
    },
    activityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: CARD_WIDTH,
        backgroundColor: theme.colors.surfaceElevated,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: 30, // Pill shaped
        gap: theme.spacing.sm,
    },
    avatarWrapper: {
        position: 'relative',
    },
    avatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: theme.colors.background,
    },
    typeBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 14,
        height: 14,
        borderRadius: 7,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: theme.colors.surfaceElevated,
    },
    textWrapper: {
        flex: 1,
        justifyContent: 'center',
    },
    userName: {
        fontSize: theme.typography.size.xs,
        fontWeight: '700',
        lineHeight: 13,
    },
    activityText: {
        fontSize: theme.typography.size.xs,
        lineHeight: 12,
    },
}));
