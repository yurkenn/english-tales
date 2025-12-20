import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    ScrollView,
    Pressable,
    ActivityIndicator,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { Typography, OptimizedImage } from '@/components/atoms';
import { useAuthStore } from '@/store/authStore';
import { userService } from '@/services/userService';
import { haptics } from '@/utils/haptics';
import { useToastStore } from '@/store/toastStore';
import { useTranslation } from 'react-i18next';

export default function EditProfileScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const { theme } = useUnistyles();
    const insets = useSafeAreaInsets();
    const { user, updateProfile: updateAuthProfile } = useAuthStore();
    const toast = useToastStore();

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form fields
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [bio, setBio] = useState('');
    const [location, setLocation] = useState('');
    const [instagram, setInstagram] = useState('');
    const [twitter, setTwitter] = useState('');
    const [website, setWebsite] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;
            setLoading(true);
            const res = await userService.getUserProfile(user.id);
            if (res.success && res.data) {
                const profile = res.data;
                setBio(profile.bio || '');
                setLocation(profile.location || '');
                if (profile.socialLinks) {
                    setInstagram(profile.socialLinks.instagram || '');
                    setTwitter(profile.socialLinks.twitter || '');
                    setWebsite(profile.socialLinks.website || '');
                }
            }
            setLoading(false);
        };
        fetchProfile();
    }, [user]);

    const handleSave = async () => {
        if (!user || saving) return;
        setSaving(true);
        haptics.selection();

        try {
            const updateData = {
                displayName,
                bio,
                location,
                socialLinks: { instagram, twitter, website }
            };

            const res = await userService.updateUserProfile(user.id, updateData);

            if (res.success) {
                await updateAuthProfile(displayName);
                toast.actions.success(t('profile.saveSuccess', 'Profile updated'));
                haptics.success();
                router.back();
            } else {
                toast.actions.error(res.error || t('profile.saveError', 'Failed to update'));
            }
        } catch (error) {
            toast.actions.error(t('profile.saveError', 'Failed to update'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.center, { paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <Pressable
                    onPress={() => { haptics.light(); router.back(); }}
                    style={styles.headerButton}
                >
                    <Ionicons name="close" size={28} color={theme.colors.text} />
                </Pressable>

                <Typography style={styles.headerTitle}>
                    {t('profile.editProfile', 'Edit Profile')}
                </Typography>

                <Pressable
                    onPress={handleSave}
                    disabled={saving}
                    style={styles.headerButton}
                >
                    {saving ? (
                        <ActivityIndicator size="small" color={theme.colors.primary} />
                    ) : (
                        <Ionicons name="checkmark" size={28} color={theme.colors.primary} />
                    )}
                </Pressable>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Avatar Section */}
                    <Animated.View
                        entering={FadeIn.duration(400)}
                        style={styles.avatarSection}
                    >
                        <Pressable style={styles.avatarContainer}>
                            <LinearGradient
                                colors={[theme.colors.primary, '#FF6B6B', theme.colors.primaryLight]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.avatarRing}
                            >
                                <View style={styles.avatarInner}>
                                    <OptimizedImage
                                        source={{ uri: user?.photoURL || '' }}
                                        style={styles.avatar}
                                        placeholder="person-circle"
                                    />
                                </View>
                            </LinearGradient>
                            <View style={styles.cameraButton}>
                                <Ionicons name="camera" size={16} color="#FFF" />
                            </View>
                        </Pressable>
                        <Typography style={styles.changePhotoText}>
                            {t('profile.changePhoto', 'Change photo')}
                        </Typography>
                    </Animated.View>

                    {/* Profile Info */}
                    <Animated.View
                        entering={FadeInDown.delay(100).duration(400)}
                        style={styles.section}
                    >
                        <InputField
                            label={t('profile.name', 'Name')}
                            value={displayName}
                            onChangeText={setDisplayName}
                            placeholder="Your display name"
                            autoCapitalize="words"
                        />

                        <InputField
                            label={t('profile.bio', 'Bio')}
                            value={bio}
                            onChangeText={setBio}
                            placeholder="Tell us about yourself..."
                            multiline
                            maxLength={150}
                        />

                        <InputField
                            label={t('profile.location', 'Location')}
                            value={location}
                            onChangeText={setLocation}
                            placeholder="Where are you from?"
                            icon="location-outline"
                        />
                    </Animated.View>

                    {/* Social Links */}
                    <Animated.View
                        entering={FadeInDown.delay(200).duration(400)}
                        style={styles.section}
                    >
                        <Typography style={styles.sectionTitle}>
                            {t('profile.socialLinks', 'Social Links')}
                        </Typography>

                        <InputField
                            label="Instagram"
                            value={instagram}
                            onChangeText={setInstagram}
                            placeholder="username"
                            icon="logo-instagram"
                            iconColor="#E4405F"
                        />

                        <InputField
                            label="Twitter"
                            value={twitter}
                            onChangeText={setTwitter}
                            placeholder="username"
                            icon="logo-twitter"
                            iconColor="#1DA1F2"
                        />

                        <InputField
                            label={t('profile.website', 'Website')}
                            value={website}
                            onChangeText={setWebsite}
                            placeholder="yoursite.com"
                            icon="globe-outline"
                            keyboardType="url"
                        />
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

// Input Field Component
const InputField = ({
    label,
    value,
    placeholder,
    onChangeText,
    multiline,
    icon,
    iconColor,
    maxLength,
    keyboardType,
    autoCapitalize
}: {
    label: string;
    value: string;
    placeholder?: string;
    onChangeText: (text: string) => void;
    multiline?: boolean;
    icon?: string;
    iconColor?: string;
    maxLength?: number;
    keyboardType?: 'default' | 'url' | 'email-address';
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) => {
    const { theme } = useUnistyles();
    const [isFocused, setIsFocused] = useState(false);

    return (
        <View style={styles.inputContainer}>
            <View style={styles.inputLabelRow}>
                {icon && (
                    <Ionicons
                        name={icon as any}
                        size={18}
                        color={iconColor || theme.colors.textMuted}
                        style={styles.inputIcon}
                    />
                )}
                <Typography style={styles.inputLabel}>{label}</Typography>
                {maxLength && (
                    <Typography style={styles.charCount}>{value.length}/{maxLength}</Typography>
                )}
            </View>
            <TextInput
                style={[
                    styles.input,
                    {
                        color: theme.colors.text,
                        borderBottomColor: isFocused ? theme.colors.primary : theme.colors.borderLight,
                    },
                    multiline && styles.inputMultiline
                ]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={theme.colors.textMuted}
                multiline={multiline}
                numberOfLines={multiline ? 3 : 1}
                maxLength={maxLength}
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
            />
        </View>
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
        paddingHorizontal: 8,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    headerButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: theme.colors.text,
    },
    scrollContent: {
        paddingBottom: 60,
    },
    avatarSection: {
        alignItems: 'center',
        paddingVertical: 28,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 12,
    },
    avatarRing: {
        width: 100,
        height: 100,
        borderRadius: 50,
        padding: 3,
    },
    avatarInner: {
        flex: 1,
        borderRadius: 47,
        overflow: 'hidden',
        backgroundColor: theme.colors.background,
        padding: 2,
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 45,
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: theme.colors.background,
    },
    changePhotoText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.primary,
    },
    section: {
        paddingHorizontal: 20,
        paddingBottom: 24,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 16,
        marginTop: 8,
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    inputIcon: {
        marginRight: 8,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.textMuted,
        flex: 1,
    },
    charCount: {
        fontSize: 12,
        color: theme.colors.textMuted,
    },
    input: {
        fontSize: 16,
        paddingVertical: 10,
        paddingHorizontal: 0,
        borderBottomWidth: 1.5,
    },
    inputMultiline: {
        minHeight: 80,
        textAlignVertical: 'top',
        paddingTop: 8,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background,
    },
}));
