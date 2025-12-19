import React, { forwardRef, useCallback, useMemo, useState, useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { OptimizedImage, Typography } from '../atoms';
import { UserProfile } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { socialService } from '@/services/socialService';
import { useToastStore } from '@/store/toastStore';
import { haptics } from '@/utils/haptics';

interface ProfileQuickViewProps {
    profile: UserProfile;
    onClose: () => void;
}

export const ProfileQuickView = forwardRef<BottomSheet, ProfileQuickViewProps>(
    ({ profile, onClose }, ref) => {
        const { theme } = useUnistyles();
        const router = useRouter();
        const { user: currentUser } = useAuthStore();
        const toast = useToastStore(s => s.actions);

        const [isFollowing, setIsFollowing] = useState(false);
        const [loading, setLoading] = useState(false);
        const [checking, setChecking] = useState(true);

        const snapPoints = useMemo(() => ['40%'], []);

        const renderBackdrop = useCallback(
            (props: any) => (
                <BottomSheetBackdrop
                    {...props}
                    disappearsOnIndex={-1}
                    appearsOnIndex={0}
                    opacity={0.5}
                    pressBehavior="close"
                />
            ),
            []
        );

        useEffect(() => {
            const checkStatus = async () => {
                if (!currentUser || !profile) return;
                setChecking(true);
                const result = await socialService.isFollowing(currentUser.id, profile.id);
                if (result.success) {
                    setIsFollowing(result.data);
                }
                setChecking(false);
            };
            checkStatus();
        }, [currentUser, profile]);

        const handleFollowPress = async () => {
            if (!currentUser) {
                toast.show('Please sign in to follow users');
                return;
            }
            if (currentUser.id === profile.id) return;

            setLoading(true);
            haptics.selection();

            if (isFollowing) {
                const result = await socialService.unfollowUser(currentUser.id, profile.id);
                if (result.success) {
                    setIsFollowing(false);
                    toast.success('Unfollowed');
                }
            } else {
                const result = await socialService.followUser(
                    currentUser.id,
                    currentUser.displayName || 'Anonymous',
                    currentUser.photoURL,
                    profile.id
                );
                if (result.success) {
                    setIsFollowing(true);
                    haptics.success();
                    toast.success('Following');
                }
            }
            setLoading(false);
        };

        const handleFullProfilePress = () => {
            onClose();
            router.push(`/user/${profile.id}`);
        };

        return (
            <BottomSheet
                ref={ref}
                index={-1}
                snapPoints={snapPoints}
                enablePanDownToClose
                backdropComponent={renderBackdrop}
                backgroundStyle={{ backgroundColor: theme.colors.surface }}
                handleIndicatorStyle={{ backgroundColor: theme.colors.textMuted, width: 40 }}
                onChange={(index) => {
                    if (index === -1) onClose();
                }}
            >
                <BottomSheetView style={styles.content}>
                    <View style={styles.header}>
                        <OptimizedImage
                            source={{ uri: profile.photoURL || '' }}
                            style={styles.avatar}
                            placeholder="person-circle"
                        />
                        <View style={styles.userInfo}>
                            <Typography variant="h3" style={styles.name}>
                                {profile.displayName || 'Anonymous'}
                            </Typography>
                            <Typography variant="caption" color={theme.colors.textMuted}>
                                {profile.bio || 'No bio yet'}
                            </Typography>
                        </View>
                        <Pressable onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={theme.colors.textMuted} />
                        </Pressable>
                    </View>

                    <View style={styles.actions}>
                        <Pressable
                            style={[
                                styles.followButton,
                                isFollowing && styles.followingButton,
                                currentUser?.id === profile.id && styles.disabledButton
                            ]}
                            onPress={handleFollowPress}
                            disabled={loading || checking || currentUser?.id === profile.id}
                        >
                            {loading || checking ? (
                                <ActivityIndicator color={isFollowing ? theme.colors.primary : '#FFFFFF'} />
                            ) : (
                                <Typography
                                    variant="bodyBold"
                                    color={isFollowing ? theme.colors.primary : '#FFFFFF'}
                                >
                                    {isFollowing ? 'Following' : 'Follow'}
                                </Typography>
                            )}
                        </Pressable>

                        <Pressable style={styles.profileButton} onPress={handleFullProfilePress}>
                            <Typography variant="bodyBold" color={theme.colors.text}>
                                View Full Profile
                            </Typography>
                        </Pressable>
                    </View>
                </BottomSheetView>
            </BottomSheet>
        );
    }
);

const styles = StyleSheet.create((theme) => ({
    content: {
        flex: 1,
        padding: theme.spacing.xl,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: theme.colors.borderLight,
    },
    userInfo: {
        flex: 1,
        marginLeft: theme.spacing.lg,
    },
    name: {
        fontWeight: '900',
    },
    closeButton: {
        alignSelf: 'flex-start',
    },
    actions: {
        gap: theme.spacing.md,
    },
    followButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 14,
        borderRadius: theme.radius.xl,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.sm,
    },
    followingButton: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.primary,
    },
    profileButton: {
        paddingVertical: 14,
        borderRadius: theme.radius.xl,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.borderLight,
    },
    disabledButton: {
        opacity: 0.5,
    },
}));
