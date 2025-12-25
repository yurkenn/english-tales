import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet from '@gorhom/bottom-sheet';

import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useReadingPrefsStore } from '@/store/readingPrefsStore';
import { useDownloadStore, formatBytes } from '@/store/downloadStore';
import { useToastStore } from '@/store/toastStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useTranslation } from 'react-i18next';
import { ConfirmationDialog, SettingItem, SettingToggle, SettingsHeader, SettingSection } from '@/components';
import { Typography } from '@/components/atoms';
import { haptics } from '@/utils/haptics';
import { sendPasswordResetEmail, deleteAccount } from '@/services/auth';
import { userService } from '@/services/userService';
import { notificationService } from '@/services/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '@/i18n';

const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'tr', label: 'Türkçe' },
    { code: 'es', label: 'Español' },
    { code: 'de', label: 'Deutsch' },
    { code: 'fr', label: 'Français' },
] as const;

export default function SettingsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();
    const { theme } = useUnistyles();

    const { user, signOut } = useAuthStore();
    const { mode: themeMode, actions: themeActions } = useThemeStore();
    const { settings, actions: settingsActions } = useSettingsStore();
    const { fontSize } = useReadingPrefsStore();
    const { downloads, actions: downloadActions } = useDownloadStore();
    const toast = useToastStore();

    const [, setCacheSize] = useState(t('common.loading'));
    const [notificationsEnabled, setNotificationsEnabled] = useState(settings.notificationsEnabled);

    // Dialog refs
    const signOutDialogRef = useRef<BottomSheet>(null);
    const clearCacheDialogRef = useRef<BottomSheet>(null);
    const changePasswordDialogRef = useRef<BottomSheet>(null);
    const languageDialogRef = useRef<BottomSheet>(null);
    const deleteAccountDialogRef = useRef<BottomSheet>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const calculateCache = async () => {
            try {
                const keys = await AsyncStorage.getAllKeys();
                setCacheSize(`${keys.length} items`);
            } catch {
                setCacheSize('Unknown');
            }
        };
        calculateCache();
        settingsActions.loadSettings();
    }, []);

    const downloadSize = downloadActions.getTotalDownloadSize();
    const downloadCount = Object.keys(downloads).length;
    const themeModeLabel = t(`appearance.${themeMode}`);
    const currentLanguage = LANGUAGES.find(l => l.code === i18n.language.split('-')[0])?.label || 'English';

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <SettingsHeader
                title={t('settings.title', 'Settings')}
                onBackPress={() => router.back()}
            />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                {/* Guest Sign In Section */}
                {user?.isAnonymous && (
                    <SettingSection title={t('settings.sections.signIn', 'Sign In')}>
                        <SettingItem
                            icon="log-in-outline"
                            label={t('settings.account.signIn', 'Sign In / Sign Up')}
                            value={t('settings.account.unlockFeatures', 'Unlock all features')}
                            onPress={() => {
                                haptics.selection();
                                router.push('/login');
                            }}
                        />
                    </SettingSection>
                )}

                <SettingSection title={t('settings.sections.account')}>
                    <SettingItem
                        icon="mail-outline"
                        label={t('settings.account.email')}
                        value={user?.email || t('settings.account.notSet')}
                        hasChevron={false}
                    />
                    {!user?.isAnonymous && (
                        <SettingItem
                            icon="key-outline"
                            label={t('settings.account.changePassword')}
                            onPress={() => {
                                haptics.selection();
                                if (!user?.email) {
                                    toast.actions.error('No email associated with this account.');
                                    return;
                                }
                                changePasswordDialogRef.current?.expand();
                            }}
                        />
                    )}
                </SettingSection>


                <SettingSection title={t('settings.sections.preferences')}>
                    <SettingItem
                        icon="color-palette-outline"
                        label={t('settings.preferences.theme')}
                        value={themeModeLabel}
                        onPress={() => {
                            haptics.selection();
                            themeActions.toggleTheme();
                        }}
                    />
                    <SettingItem
                        icon="language-outline"
                        label={t('settings.preferences.language')}
                        value={currentLanguage}
                        onPress={() => {
                            haptics.selection();
                            languageDialogRef.current?.expand();
                        }}
                    />
                    <SettingItem
                        icon="text-outline"
                        label={t('settings.preferences.fontSize')}
                        value={`${fontSize}pt`}
                        onPress={() => {
                            haptics.selection();
                            toast.actions.info(t('settings.preferences.fontSizeInstruction'));
                        }}
                    />
                    <SettingToggle
                        icon="notifications-outline"
                        label={t('settings.preferences.notifications')}
                        value={notificationsEnabled}
                        onValueChange={async (val) => {
                            haptics.selection();
                            setNotificationsEnabled(val);
                            settingsActions.updateSettings({ notificationsEnabled: val });
                            if (val) {
                                await notificationService.initialize();
                            } else {
                                await notificationService.cancelAllDailyReminders();
                            }
                        }}
                    />
                </SettingSection>

                <SettingSection title={t('settings.sections.storage')}>
                    <SettingItem
                        icon="cloud-download-outline"
                        label={t('settings.storage.downloads')}
                        value={downloadCount > 0 ? t('settings.storage.storiesCount', { count: downloadCount }) + ` (${formatBytes(downloadSize)})` : t('settings.storage.none')}
                        hasChevron={false}
                    />
                    <SettingItem
                        icon="trash-outline"
                        label={t('settings.storage.clearCache')}
                        onPress={() => {
                            haptics.selection();
                            clearCacheDialogRef.current?.expand();
                        }}
                    />
                </SettingSection>

                <SettingSection title={t('settings.sections.dangerZone')} isDanger>
                    <SettingItem
                        icon="log-out-outline"
                        label={t('settings.dangerZone.signOut')}
                        isDestructive
                        onPress={() => {
                            haptics.warning();
                            signOutDialogRef.current?.expand();
                        }}
                    />
                    {user && !user.isAnonymous && (
                        <SettingItem
                            icon="trash-outline"
                            label={t('settings.dangerZone.deleteAccount')}
                            isDestructive
                            onPress={() => {
                                haptics.warning();
                                deleteAccountDialogRef.current?.expand();
                            }}
                        />
                    )}
                </SettingSection>

                <View style={styles.footerContainer}>
                    <Typography variant="caption" color={theme.colors.textMuted}>
                        English Tales v1.0.0
                    </Typography>
                </View>
            </ScrollView>

            <ConfirmationDialog
                ref={signOutDialogRef}
                title={t('settings.dialogs.signOut.title')}
                message={t('settings.dialogs.signOut.message')}
                confirmLabel={t('settings.dangerZone.signOut')}
                cancelLabel={t('common.cancel')}
                destructive
                icon="log-out-outline"
                onConfirm={signOut}
                onCancel={() => signOutDialogRef.current?.close()}
            />

            <ConfirmationDialog
                ref={clearCacheDialogRef}
                title={t('settings.dialogs.clearCache.title')}
                message={t('settings.dialogs.clearCache.message')}
                confirmLabel={t('common.delete')}
                cancelLabel={t('common.cancel')}
                icon="trash-outline"
                onConfirm={async () => {
                    haptics.success();
                    setCacheSize('Cleared');
                    clearCacheDialogRef.current?.close();
                    toast.actions.success(t('settings.dialogs.clearCache.success'));
                }}
                onCancel={() => clearCacheDialogRef.current?.close()}
            />

            <ConfirmationDialog
                ref={changePasswordDialogRef}
                title={t('settings.dialogs.changePassword.title')}
                message={t('settings.dialogs.changePassword.message', { email: user?.email })}
                confirmLabel={t('common.save')}
                cancelLabel={t('common.cancel')}
                icon="mail-outline"
                onConfirm={async () => {
                    try {
                        await sendPasswordResetEmail(user!.email!);
                        haptics.success();
                        changePasswordDialogRef.current?.close();
                        toast.actions.success(t('settings.dialogs.changePassword.success'));
                    } catch {
                        haptics.error();
                        changePasswordDialogRef.current?.close();
                        toast.actions.error(t('settings.dialogs.changePassword.error'));
                    }
                }}
                onCancel={() => changePasswordDialogRef.current?.close()}
            />

            <BottomSheet
                ref={languageDialogRef}
                index={-1}
                snapPoints={['50%']}
                enablePanDownToClose
                backgroundStyle={{ backgroundColor: theme.colors.background }}
                handleIndicatorStyle={{ backgroundColor: theme.colors.border }}
            >
                <View style={styles.sheetContent}>
                    <Text style={styles.sheetTitle}>{t('settings.preferences.language')}</Text>
                    {LANGUAGES.map((lang) => (
                        <SettingItem
                            key={lang.code}
                            icon={i18n.language.startsWith(lang.code) ? "checkmark-circle" : "ellipse-outline"}
                            label={lang.label}
                            onPress={() => {
                                haptics.selection();
                                settingsActions.updateSettings({ language: lang.code as any });
                                languageDialogRef.current?.close();
                            }}
                        />
                    ))}
                </View>
            </BottomSheet>

            <ConfirmationDialog
                ref={deleteAccountDialogRef}
                title={t('settings.dialogs.deleteAccount.title')}
                message={t('settings.dialogs.deleteAccount.message')}
                confirmLabel={isDeleting ? t('common.loading') : t('common.delete')}
                cancelLabel={t('common.cancel')}
                destructive
                icon="trash-outline"
                onConfirm={async () => {
                    if (!user || isDeleting) return;

                    setIsDeleting(true);
                    try {
                        // First delete all user data from Firestore
                        const deleteResult = await userService.deleteUserData(user.id);
                        if (!deleteResult.success) {
                            throw new Error(deleteResult.error);
                        }

                        // Then delete the Firebase Auth account
                        await deleteAccount();

                        haptics.success();
                        deleteAccountDialogRef.current?.close();
                        toast.actions.success('Account deleted successfully');
                        router.replace('/login');
                    } catch (error: any) {
                        haptics.error();
                        setIsDeleting(false);

                        if (error.message === 'REQUIRES_REAUTHENTICATION') {
                            toast.actions.error('Please sign out and sign in again, then try deleting your account.');
                        } else {
                            toast.actions.error('Failed to delete account. Please try again.');
                        }
                        deleteAccountDialogRef.current?.close();
                    }
                }}
                onCancel={() => deleteAccountDialogRef.current?.close()}
            />
        </View>
    );
}

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        paddingBottom: 40,
    },
    profileCardWrapper: {
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.lg,
        paddingBottom: theme.spacing.sm,
    },
    profileCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: theme.colors.surfaceElevated,
    },
    profileText: {
        flex: 1,
        marginLeft: 14,
    },
    profileName: {
        fontSize: theme.typography.size.xl,
        fontWeight: '600',
    },
    footerContainer: {
        marginTop: theme.spacing.xxl,
        marginBottom: theme.spacing.xl,
        alignItems: 'center',
    },
    sheetContent: {
        flex: 1,
        padding: theme.spacing.lg,
    },
    sheetTitle: {
        fontSize: theme.typography.size.lg,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.lg,
        textAlign: 'center',
    },
}));
