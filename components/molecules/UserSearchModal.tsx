import React, { useState, useCallback } from 'react';
import {
    View,
    TextInput,
    FlatList,
    Pressable,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Image,
    ImageSourcePropType,
} from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../atoms/Typography';
import { userService } from '@/services/userService';
import { UserProfile } from '@/types';
import { socialService } from '@/services/socialService';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import { haptics } from '@/utils/haptics';
import { useTranslation } from 'react-i18next';

// Default mascot avatar for users without profile photo
const DEFAULT_AVATAR = require('@/assets/defaultavatar.png');

interface UserSearchModalProps {
    onClose: () => void;
}

export const UserSearchModal: React.FC<UserSearchModalProps> = ({ onClose }) => {
    const { t } = useTranslation();
    const { theme } = useUnistyles();
    const { user: currentUser } = useAuthStore();
    const toast = useToastStore(s => s.actions);

    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(false);
    const [sendingRequestId, setSendingRequestId] = useState<string | null>(null);

    const handleSearch = async (text: string) => {
        setSearchTerm(text);
        if (text.length < 2) {
            setResults([]);
            return;
        }

        setLoading(true);
        const res = await userService.searchUsers(text);
        if (res.success) {
            // Filter out current user
            setResults(res.data.filter(u => u.id !== currentUser?.id));
        }
        setLoading(false);
    };

    const handleAddFriend = async (targetUser: UserProfile) => {
        if (!currentUser) return;

        haptics.selection();
        setSendingRequestId(targetUser.id);

        const res = await socialService.sendFriendRequest(currentUser.id, targetUser.id);

        if (res.success) {
            toast.success(t('social.requestSent', 'Friend request sent!'));
        } else {
            toast.error(res.error || t('common.error'));
        }

        setSendingRequestId(null);
    };

    const getAvatarSource = (photoURL?: string | null): ImageSourcePropType => {
        return photoURL ? { uri: photoURL } : DEFAULT_AVATAR;
    };

    const renderUserItem = ({ item }: { item: UserProfile }) => (
        <View style={styles.userCard}>
            <View style={styles.userInfo}>
                <View style={styles.avatarWrapper}>
                    <Image
                        source={getAvatarSource(item.photoURL)}
                        style={styles.avatar}
                    />
                </View>

                <View style={styles.userData}>
                    <Typography variant="bodyBold">{item.displayName || 'Anonymous'}</Typography>
                    <Typography variant="caption" color={theme.colors.textMuted}>
                        {item.isAnonymous ? t('profile.guest') : t('social.readyToRead', 'Ready to read')}
                    </Typography>
                </View>
            </View>

            <Pressable
                style={[styles.addButton, sendingRequestId === item.id && styles.disabledButton]}
                onPress={() => handleAddFriend(item)}
                disabled={sendingRequestId === item.id}
            >
                {sendingRequestId === item.id ? (
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                    <Typography variant="label" color={theme.colors.textInverse} style={{ fontWeight: '700' }}>
                        {t('social.add', 'Add')}
                    </Typography>
                )}
            </Pressable>
        </View>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
        >
            <View style={styles.header}>
                <Typography variant="h3" style={{ fontWeight: '800' }}>{t('social.findFriends', 'Find Friends')}</Typography>
                <Pressable onPress={onClose} hitSlop={15} style={styles.closeBtn}>
                    <Ionicons name="close" size={24} color={theme.colors.textMuted} />
                </Pressable>
            </View>

            <View style={styles.searchBarContainer}>
                <View style={styles.searchBar}>
                    <Ionicons name="search-outline" size={18} color={theme.colors.textMuted} />
                    <TextInput
                        style={styles.input}
                        placeholder={t('social.searchPlaceholder', 'Name or email...')}
                        placeholderTextColor={theme.colors.textMuted}
                        value={searchTerm}
                        onChangeText={handleSearch}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    {loading && <ActivityIndicator size="small" color={theme.colors.primary} />}
                </View>
            </View>

            <FlatList
                data={results}
                keyExtractor={item => item.id}
                renderItem={renderUserItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    searchTerm.length >= 2 && !loading ? (
                        <View style={styles.emptyState}>
                            <Typography color={theme.colors.textMuted}>
                                {t('social.noUsersFound', 'No users found')}
                            </Typography>
                        </View>
                    ) : null
                }
            />
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.borderLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchBarContainer: {
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.sm,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.md,
        height: 44,
        backgroundColor: theme.colors.borderLight,
        borderRadius: 12,
        gap: theme.spacing.sm,
    },
    input: {
        flex: 1,
        color: theme.colors.text,
        fontSize: theme.typography.size.md,
    },
    listContent: {
        padding: theme.spacing.lg,
        paddingBottom: theme.spacing.xl,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        marginBottom: theme.spacing.sm,
        ...theme.shadows.sm,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        flex: 1,
    },
    avatarWrapper: {
        width: 48,
        height: 48,
        borderRadius: 24,
        padding: 2,
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 22,
    },
    userData: {
        gap: 2,
    },
    addButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 100,
        minWidth: 70,
        alignItems: 'center',
    },
    disabledButton: {
        opacity: 0.5,
    },
    emptyState: {
        padding: theme.spacing.xl,
        alignItems: 'center',
    },
}));
