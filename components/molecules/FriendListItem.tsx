import { FC } from 'react';
import { View, TouchableOpacity, Image, ImageSourcePropType, StyleSheet } from 'react-native';
import { useTheme, Theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Typography } from '../atoms/Typography';
import { UserProfile } from '@/types';
import { haptics } from '@/utils/haptics';

// Default mascot avatar for users without profile photo
const DEFAULT_AVATAR = require('@/assets/defaultavatar.png');

export type FriendWithFid = UserProfile & { friendshipId: string };

interface FriendListItemProps {
    friend: FriendWithFid;
    type: 'friends' | 'incoming' | 'outgoing';
    onAccept?: (friendshipId: string) => void;
    onRemove?: (friendshipId: string, isRemoval: boolean) => void;
    showDivider?: boolean;
}

export const FriendListItem: FC<FriendListItemProps> = ({
    friend,
    type,
    onAccept,
    onRemove,
    showDivider = true,
}) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const router = useRouter();
    const avatarSource: ImageSourcePropType = friend.photoURL ? { uri: friend.photoURL } : DEFAULT_AVATAR;

    const handleProfilePress = () => {
        haptics.selection();
        router.push(`/user/${friend.id}`);
    };

    return (
        <View style={[styles.friendCard, !showDivider && styles.noDivider]}>
            <TouchableOpacity style={styles.friendInfo} onPress={handleProfilePress} activeOpacity={0.7}>
                <View style={styles.avatarWrapper}>
                    <Image
                        source={avatarSource}
                        style={styles.avatar}
                    />
                </View>

                <View style={styles.friendText}>
                    <Typography variant="bodyBold">{friend.displayName || 'Anonymous'}</Typography>
                    <Typography variant="caption" color={theme.colors.textMuted}>
                        {type === 'friends' ? t('social.activeReader', 'Active Reader') :
                            type === 'incoming' ? t('social.sentYouRequest', 'Sent you a request') :
                                t('social.waitingApproval', 'Waiting for approval')}
                    </Typography>
                </View>
            </TouchableOpacity>

            <View style={styles.actions}>
                {type === 'incoming' && (
                    <View style={styles.actionGroup}>
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.acceptBtn]}
                            onPress={() => onAccept?.(friend.friendshipId)}
                            activeOpacity={0.8}
                        >
                            <Typography variant="label" color={theme.colors.textInverse}>
                                {t('common.accept', 'Accept')}
                            </Typography>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.rejectBtn]}
                            onPress={() => onRemove?.(friend.friendshipId, false)}
                            activeOpacity={0.6}
                        >
                            <Ionicons name="close" size={18} color={theme.colors.textMuted} />
                        </TouchableOpacity>
                    </View>
                )}
                {type === 'outgoing' && (
                    <TouchableOpacity
                        style={styles.secondaryActionBtn}
                        onPress={() => onRemove?.(friend.friendshipId, false)}
                        activeOpacity={0.7}
                    >
                        <Typography variant="label" color={theme.colors.textMuted}>
                            {t('common.cancel', 'Cancel')}
                        </Typography>
                    </TouchableOpacity>
                )}
                {type === 'friends' && (
                    <TouchableOpacity
                        style={styles.ghostActionBtn}
                        onPress={() => onRemove?.(friend.friendshipId, true)}
                        activeOpacity={0.6}
                    >
                        <Ionicons name="ellipsis-horizontal" size={20} color={theme.colors.textMuted} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
    friendCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    noDivider: {
        borderBottomWidth: 0,
    },
    friendInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        flex: 1,
    },
    avatarWrapper: {
        width: 52,
        height: 52,
        borderRadius: theme.radius.full,
        padding: 2,
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: theme.radius.full,
    },
    friendText: {
        gap: theme.spacing.xxs,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionGroup: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    actionBtn: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.radius.full,
        justifyContent: 'center',
        alignItems: 'center',
    },
    acceptBtn: {
        backgroundColor: theme.colors.primary,
    },
    rejectBtn: {
        backgroundColor: theme.colors.borderLight,
        width: 36,
        height: 36,
        paddingHorizontal: 0,
        borderRadius: theme.radius.full,
    },
    secondaryActionBtn: {
        backgroundColor: theme.colors.borderLight,
        paddingHorizontal: theme.spacing.lg - 2, // 14
        paddingVertical: theme.spacing.xs + 2, // 6
        borderRadius: theme.radius.sm,
    },
    ghostActionBtn: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.sm,
    },
});
