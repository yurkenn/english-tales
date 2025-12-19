import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Linking } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet from '@gorhom/bottom-sheet';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useReadingPrefsStore } from '@/store/readingPrefsStore';
import { useDownloadStore, formatBytes } from '@/store/downloadStore';
import { useToastStore } from '@/store/toastStore';
import { useTranslation } from 'react-i18next';
import {
    ConfirmationDialog,
    SettingItem,
    SettingToggle,
    SettingsHeader,
    SettingSection,
} from '@/components';
import { haptics } from '@/utils/haptics';
import { sendPasswordResetEmail } from '@/services/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '@/i18n';

import { useSettingsStore } from '@/store/settingsStore';

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
    const { mode: themeMode, highContrastEnabled, actions: themeActions } = useThemeStore();
    const { settings, actions: settingsActions } = useSettingsStore();
    const { fontSize, dyslexicFontEnabled, actions: prefsActions } = useReadingPrefsStore();
    const { downloads, actions: downloadActions } = useDownloadStore();
    const toastActions = useToastStore((state) => state.actions);

    const downloadSize = downloadActions.getTotalDownloadSize();
    const downloadCount = Object.keys(downloads).length;

    const [cacheSize, setCacheSize] = useState(t('common.loading'));
    const [notificationsEnabled, setNotificationsEnabled] = useState(settings.notificationsEnabled);

    // Dialog refs
    const signOutDialogRef = useRef<BottomSheet>(null);
    const deleteAccountDialogRef = useRef<BottomSheet>(null);
    const clearCacheDialogRef = useRef<BottomSheet>(null);
    const clearDownloadsDialogRef = useRef<BottomSheet>(null);
    const changePasswordDialogRef = useRef<BottomSheet>(null);
    const languageDialogRef = useRef<BottomSheet>(null);

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
    }, []);

    const themeModeLabel = t(`appearance.${themeMode}`);
    const currentLanguage = LANGUAGES.find(l => l.code === i18n.language.split('-')[0])?.label || 'English';

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <SettingsHeader title={t('tabs.profile')} onBackPress={() => router.back()} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <SettingSection title={t('settings.sections.account')}>
                    <SettingItem
                        icon="mail-outline"
                        label={t('settings.account.email')}
                        value={user?.email || t('settings.account.notSet')}
                        hasChevron={false}
                    />
                    <SettingItem
                        icon="key-outline"
                        label={t('settings.account.changePassword')}
                        onPress={() => {
                            haptics.selection();
                            if (!user?.email) {
                                toastActions.error('No email associated with this account.');
                                return;
                            }
                            changePasswordDialogRef.current?.expand();
                        }}
                    />
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
                            toastActions.info(t('settings.preferences.fontSizeInstruction'));
                        }}
                    />
                    <SettingToggle
                        icon="notifications-outline"
                        label={t('settings.preferences.notifications')}
                        value={notificationsEnabled}
                        onValueChange={(val) => {
                            setNotificationsEnabled(val);
                            settingsActions.updateSettings({ notificationsEnabled: val });
                        }}
                    />
                    <SettingToggle
                        icon="text-outline"
                        label={t('settings.preferences.dyslexicFont', 'Dyslexic Font')}
                        value={dyslexicFontEnabled}
                        onValueChange={prefsActions.setDyslexicFontEnabled}
                    />
                    <SettingToggle
                        icon="contrast-outline"
                        label={t('settings.preferences.highContrast', 'High Contrast')}
                        value={highContrastEnabled}
                        onValueChange={themeActions.setHighContrastEnabled}
                    />
                </SettingSection>

                <SettingSection title={t('settings.sections.storage')}>
                    <SettingItem
                        icon="cloud-download-outline"
                        label={t('settings.storage.downloads')}
                        value={downloadCount > 0 ? t('settings.storage.storiesCount', { count: downloadCount }) + ` (${formatBytes(downloadSize)})` : t('settings.storage.none')}
                        hasChevron={false}
                    />
                    {downloadCount > 0 && (
                        <SettingItem
                            icon="cloud-offline-outline"
                            label={t('settings.storage.clearDownloads')}
                            onPress={() => {
                                haptics.selection();
                                clearDownloadsDialogRef.current?.expand();
                            }}
                        />
                    )}
                    <SettingItem
                        icon="folder-outline"
                        label={t('settings.storage.cache')}
                        value={cacheSize}
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

                <SettingSection title={t('settings.sections.about')}>
                    <SettingItem
                        icon="star-outline"
                        label={t('settings.about.rateApp')}
                        onPress={() => {
                            haptics.light();
                            toastActions.info(t('settings.about.rateAppMessage'));
                        }}
                    />
                    <SettingItem
                        icon="shield-outline"
                        label={t('settings.about.privacyPolicy')}
                        onPress={() => {
                            haptics.light();
                            Linking.openURL('https://englishtales.app/privacy');
                        }}
                    />
                    <SettingItem
                        icon="document-text-outline"
                        label={t('settings.about.termsOfService')}
                        onPress={() => {
                            haptics.light();
                            Linking.openURL('https://englishtales.app/terms');
                        }}
                    />
                    <SettingItem
                        icon="information-circle-outline"
                        label={t('settings.about.version')}
                        value="1.0.0"
                        hasChevron={false}
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
                    <SettingItem
                        icon="trash-bin-outline"
                        label={t('settings.dangerZone.deleteAccount')}
                        isDestructive
                        onPress={() => {
                            haptics.selection();
                            deleteAccountDialogRef.current?.expand();
                        }}
                    />
                </SettingSection>

                <Text style={styles.footer}>{t('settings.footer')}</Text>
            </ScrollView>

            {/* Confirmation Dialogs */}
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
                ref={deleteAccountDialogRef}
                title={t('settings.dialogs.deleteAccount.title')}
                message={t('settings.dialogs.deleteAccount.message')}
                confirmLabel={t('common.delete')}
                cancelLabel={t('common.cancel')}
                destructive
                icon="trash-bin-outline"
                onConfirm={() => {
                    haptics.error();
                    deleteAccountDialogRef.current?.close();
                    toastActions.info(t('settings.dialogs.deleteAccount.instruction'));
                }}
                onCancel={() => deleteAccountDialogRef.current?.close()}
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
                    toastActions.success(t('settings.dialogs.clearCache.success'));
                }}
                onCancel={() => clearCacheDialogRef.current?.close()}
            />

            <ConfirmationDialog
                ref={clearDownloadsDialogRef}
                title={t('settings.dialogs.clearDownloads.title')}
                message={t('settings.dialogs.clearDownloads.message', { count: downloadCount })}
                confirmLabel={t('common.delete')}
                cancelLabel={t('common.cancel')}
                destructive
                icon="cloud-offline-outline"
                onConfirm={async () => {
                    await downloadActions.clearAllDownloads();
                    haptics.success();
                    clearDownloadsDialogRef.current?.close();
                    toastActions.success(t('settings.dialogs.clearDownloads.success'));
                }}
                onCancel={() => clearDownloadsDialogRef.current?.close()}
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
                        toastActions.success(t('settings.dialogs.changePassword.success'));
                    } catch {
                        haptics.error();
                        changePasswordDialogRef.current?.close();
                        toastActions.error(t('settings.dialogs.changePassword.error'));
                    }
                }}
                onCancel={() => changePasswordDialogRef.current?.close()}
            />

            {/* Language Selection Sheet */}
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
    footer: {
        textAlign: 'center',
        fontSize: theme.typography.size.sm,
        color: theme.colors.textMuted,
        marginTop: theme.spacing.xxl,
        marginBottom: theme.spacing.xl,
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
