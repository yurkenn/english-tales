import React from 'react';
import { View, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { Typography, OptimizedImage } from '../atoms';
import { SocialNotification } from '@/types';
import { haptics } from '@/utils/haptics';

interface NotificationListProps {
    notifications: SocialNotification[];
    onNotificationPress: (notification: SocialNotification) => void;
    isLoading?: boolean;
}

export const NotificationList: React.FC<NotificationListProps> = ({
    notifications,
    onNotificationPress,
    isLoading
}) => {
    const { theme } = useUnistyles();

    const renderItem = ({ item }: { item: SocialNotification }) => {
        const getIcon = () => {
            switch (item.type) {
                case 'like': return { name: 'heart', color: theme.colors.error };
                case 'reply': return { name: 'chatbubble', color: theme.colors.primary };
                case 'follow': return { name: 'person-add', color: theme.colors.success };
                case 'achievement': return { name: 'trophy', color: theme.colors.warning };
                default: return { name: 'notifications', color: theme.colors.textMuted };
            }
        };

        const icon = getIcon();
        const date = item.timestamp?.toDate ? item.timestamp.toDate() : new Date();

        return (
            <Pressable
                style={[styles.item, !item.isRead && styles.unreadItem]}
                onPress={() => {
                    haptics.selection();
                    onNotificationPress(item);
                }}
            >
                <View style={styles.avatarContainer}>
                    <OptimizedImage
                        source={{ uri: item.senderPhoto || '' }}
                        style={styles.avatar}
                        placeholder="person-circle"
                    />
                    <View style={[styles.typeIcon, { backgroundColor: icon.color }]}>
                        <Ionicons name={icon.name as any} size={10} color="#FFFFFF" />
                    </View>
                </View>

                <View style={styles.content}>
                    <Typography variant="body" style={item.isRead ? null : styles.unreadText}>
                        <Typography variant="bodyBold">{item.senderName}</Typography>
                        {item.type === 'like' && ' liked your post'}
                        {item.type === 'reply' && ' replied to your post'}
                        {item.type === 'follow' && ' started following you'}
                        {item.type === 'achievement' && ' earned an achievement'}
                    </Typography>
                    {item.content && (
                        <Typography variant="caption" color={theme.colors.textMuted} numberOfLines={1}>
                            "{item.content}"
                        </Typography>
                    )}
                    <Typography variant="caption" color={theme.colors.textMuted} style={styles.time}>
                        {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                </View>

                {!item.isRead && <View style={styles.unreadDot} />}
            </Pressable>
        );
    };

    if (isLoading && notifications.length === 0) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <FlatList
            data={notifications}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
                <View style={styles.empty}>
                    <Ionicons name="notifications-off-outline" size={48} color={theme.colors.textMuted} />
                    <Typography variant="body" color={theme.colors.textMuted} style={{ marginTop: 12 }}>
                        No notifications yet
                    </Typography>
                </View>
            }
        />
    );
};

const styles = StyleSheet.create((theme) => ({
    list: {
        paddingVertical: theme.spacing.md,
    },
    item: {
        flexDirection: 'row',
        padding: theme.spacing.lg,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    unreadItem: {
        backgroundColor: theme.colors.primary + '05',
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: theme.colors.background,
    },
    typeIcon: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: theme.colors.surface,
    },
    content: {
        flex: 1,
        marginLeft: theme.spacing.lg,
    },
    unreadText: {
        fontWeight: '600',
    },
    time: {
        marginTop: 4,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.primary,
        marginLeft: theme.spacing.md,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    empty: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
}));
