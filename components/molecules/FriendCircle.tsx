import React from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Typography } from '../atoms/Typography';
import { OptimizedImage } from '../atoms/OptimizedImage';
import { Ionicons } from '@expo/vector-icons';
import { haptics } from '@/utils/haptics';
import { useTranslation } from 'react-i18next';
import { UserProfile } from '@/types';

interface FriendCircleProps {
    friends: UserProfile[];
    onPressAll?: () => void;
    onPressFriend?: (friend: UserProfile) => void;
}

export const FriendCircle: React.FC<FriendCircleProps> = ({ friends, onPressAll, onPressFriend }) => {
    const { t } = useTranslation();
    const { theme } = useUnistyles();

    const hasFriends = friends.length > 0;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Typography variant="h3">{t('social.myFriends', 'My Friends')}</Typography>
                <Pressable onPress={() => { haptics.selection(); onPressAll?.(); }}>
                    <Typography variant="caption" color={theme.colors.primary}>
                        {hasFriends ? t('common.seeAll', 'See All') : t('social.findFriends', 'Find Friends')}
                    </Typography>
                </Pressable>
            </View>

            {hasFriends ? (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {friends.slice(0, 10).map((friend) => (
                        <Pressable
                            key={friend.id}
                            style={styles.friendItem}
                            onPress={() => {
                                haptics.selection();
                                onPressFriend?.(friend);
                            }}
                        >
                            <OptimizedImage
                                source={{ uri: friend.photoURL || '' }}
                                style={styles.avatar}
                                placeholder="person-circle"
                            />
                            <Typography variant="label" numberOfLines={1} style={styles.name}>
                                {friend.displayName?.split(' ')[0]}
                            </Typography>
                        </Pressable>
                    ))}
                    <Pressable
                        style={styles.addButton}
                        onPress={() => { haptics.selection(); onPressAll?.(); }}
                    >
                        <View style={styles.addIconContainer}>
                            <Ionicons name="add" size={24} color={theme.colors.primary} />
                        </View>
                        <Typography variant="label" color={theme.colors.primary}>{t('social.add', 'Add')}</Typography>
                    </Pressable>
                </ScrollView>
            ) : (
                <Pressable
                    style={styles.emptyContainer}
                    onPress={() => { haptics.selection(); onPressAll?.(); }}
                >
                    <View style={styles.emptyIcon}>
                        <Ionicons name="people-outline" size={32} color={theme.colors.textMuted} />
                    </View>
                    <View style={styles.emptyTextContainer}>
                        <Typography variant="bodyBold">{t('social.emptyTitle', 'No Friends Yet')}</Typography>
                        <Typography variant="caption" color={theme.colors.textMuted}>
                            {t('social.emptyDesc', 'Connect with readers now')}
                        </Typography>
                    </View>
                </Pressable>
            )}
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        marginVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.md,
    },
    scrollContent: {
        gap: theme.spacing.lg,
        paddingRight: theme.spacing.lg,
    },
    friendItem: {
        alignItems: 'center',
        gap: theme.spacing.xs + 2, // 6
        width: 64,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: theme.radius.full,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        backgroundColor: theme.colors.surface,
    },
    name: {
        textAlign: 'center',
        fontSize: theme.typography.size.xs,
        fontWeight: '600',
    },
    addButton: {
        alignItems: 'center',
        gap: theme.spacing.xs + 2, // 6
        width: 64,
    },
    addIconContainer: {
        width: 64,
        height: 64,
        borderRadius: theme.radius.full,
        borderWidth: 1.5,
        borderColor: theme.colors.primary,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primary + '05',
    },
    emptyContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xl,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.sm,
    },
    emptyIcon: {
        width: 52,
        height: 52,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    emptyTextContainer: {
        flex: 1,
        flexShrink: 1,
    },
}));
