import React, { useState, useEffect } from 'react';
import {
    View,
    ScrollView,
    Pressable,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography, Button } from '@/components/atoms';
import { FormField } from '@/components/molecules';
import { useAuthStore } from '@/store/authStore';
import { userService } from '@/services/userService';
import { useToastStore } from '@/store/toastStore';
import { haptics } from '@/utils/haptics';
import { useTranslation } from 'react-i18next';

export default function EditProfileScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { theme } = useUnistyles();
    const { user, updateProfile } = useAuthStore();
    const toast = useToastStore();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [bio, setBio] = useState('');
    const [instagram, setInstagram] = useState('');
    const [twitter, setTwitter] = useState('');
    const [website, setWebsite] = useState('');
    const [github, setGithub] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;
            const result = await userService.getUserProfile(user.id);
            if (result.success) {
                const profile = result.data;
                setBio(profile.bio || '');
                if (profile.socialLinks) {
                    setInstagram(profile.socialLinks.instagram || '');
                    setTwitter(profile.socialLinks.twitter || '');
                    setWebsite(profile.socialLinks.website || '');
                    setGithub(profile.socialLinks.github || '');
                }
            }
            setLoading(false);
        };
        fetchProfile();
    }, [user]);

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        haptics.selection();

        try {
            // Update Auth Display Name
            if (displayName !== user.displayName) {
                await updateProfile(displayName);
            }

            // Update Firestore Profile
            const result = await userService.updateUserProfile(user.id, {
                displayName,
                bio,
                socialLinks: {
                    instagram,
                    twitter,
                    website,
                    github,
                }
            });

            if (result.success) {
                toast.actions.success(t('common.saved', 'Changes saved!'));
                router.back();
            } else {
                toast.actions.error(result.error || 'Failed to update profile');
            }
        } catch (error) {
            toast.actions.error('An error occurred while saving');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color={theme.colors.text} />
                </Pressable>
                <Typography variant="h3">{t('profile.editProfile', 'Edit Profile')}</Typography>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <SettingSection title={t('settings.sections.general', 'General Info')}>
                    <FormField
                        label={t('auth.displayName', 'Display Name')}
                        value={displayName}
                        onChangeText={setDisplayName}
                        placeholder="Your name"
                        icon="person-outline"
                    />
                    <FormField
                        label={t('profile.bio', 'Bio')}
                        value={bio}
                        onChangeText={setBio}
                        placeholder="Tell others about yourself..."
                        multiline
                        numberOfLines={3}
                        style={styles.bioInput}
                        containerStyle={{ height: 100 }}
                    />
                </SettingSection>

                <SettingSection title={t('profile.socialLinks', 'Social Links')}>
                    <FormField
                        label="Instagram"
                        value={instagram}
                        onChangeText={setInstagram}
                        placeholder="@username"
                        icon="logo-instagram"
                        autoCapitalize="none"
                    />
                    <FormField
                        label="Twitter"
                        value={twitter}
                        onChangeText={setTwitter}
                        placeholder="@username"
                        icon="logo-twitter"
                        autoCapitalize="none"
                    />
                    <FormField
                        label="Website"
                        value={website}
                        onChangeText={setWebsite}
                        placeholder="https://..."
                        icon="globe-outline"
                        autoCapitalize="none"
                        keyboardType="url"
                    />
                    <FormField
                        label="GitHub"
                        value={github}
                        onChangeText={setGithub}
                        placeholder="username"
                        icon="logo-github"
                        autoCapitalize="none"
                    />
                </SettingSection>

                <Button
                    title={t('common.save', 'Save Changes')}
                    onPress={handleSave}
                    loading={saving}
                    style={styles.saveButton}
                />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

// Internal SettingSection similar to others but focused for this screen
const SettingSection = ({ title, children }: { title: string, children: React.ReactNode }) => {
    const { theme } = useUnistyles();
    return (
        <View style={styles.section}>
            <Typography variant="caption" color={theme.colors.textMuted} style={styles.sectionTitle}>
                {title.toUpperCase()}
            </Typography>
            {children}
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
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        padding: theme.spacing.lg,
        paddingBottom: 40,
    },
    section: {
        marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
        marginBottom: theme.spacing.sm,
        marginLeft: theme.spacing.xs,
        letterSpacing: 1,
        fontWeight: '700',
    },
    bioInput: {
        height: 80,
        textAlignVertical: 'top',
        paddingTop: theme.spacing.md,
    },
    saveButton: {
        marginTop: theme.spacing.lg,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background,
    },
}));
