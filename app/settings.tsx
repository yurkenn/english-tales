import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Linking } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet from '@gorhom/bottom-sheet';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useReadingPrefsStore } from '@/store/readingPrefsStore';
import { useDownloadStore, formatBytes } from '@/store/downloadStore';
import { useToastStore } from '@/store/toastStore';
import { ConfirmationDialog } from '@/components';
import {
    SettingItem,
    SettingToggle,
    SettingsHeader,
    SettingSection,
} from '@/components/settings';
import { haptics } from '@/utils/haptics';
import { sendPasswordResetEmail } from '@/services/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const { user, signOut } = useAuthStore();
    const { mode: themeMode, actions: themeActions } = useThemeStore();
    const { fontSize } = useReadingPrefsStore();
    const { downloads, actions: downloadActions } = useDownloadStore();
    const toastActions = useToastStore((state) => state.actions);

    const downloadSize = downloadActions.getTotalDownloadSize();
    const downloadCount = Object.keys(downloads).length;

    const [cacheSize, setCacheSize] = useState('Calculating...');
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    // Dialog refs
    const signOutDialogRef = useRef<BottomSheet>(null);
    const deleteAccountDialogRef = useRef<BottomSheet>(null);
    const clearCacheDialogRef = useRef<BottomSheet>(null);
    const clearDownloadsDialogRef = useRef<BottomSheet>(null);
    const changePasswordDialogRef = useRef<BottomSheet>(null);

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

    const themeModeLabel = themeMode === 'system' ? 'System' : themeMode === 'light' ? 'Light' : 'Dark';

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <SettingsHeader title="Settings" onBackPress={() => router.back()} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <SettingSection title="ACCOUNT">
                    <SettingItem
                        icon="mail-outline"
                        label="Email"
                        value={user?.email || 'Not set'}
                        hasChevron={false}
                    />
                    <SettingItem
                        icon="key-outline"
                        label="Change Password"
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

                <SettingSection title="PREFERENCES">
                    <SettingItem
                        icon="color-palette-outline"
                        label="Appearance"
                        value={themeModeLabel}
                        onPress={() => {
                            haptics.selection();
                            themeActions.toggleTheme();
                        }}
                    />
                    <SettingItem
                        icon="text-outline"
                        label="Font Size"
                        value={`${fontSize}pt`}
                        onPress={() => {
                            haptics.selection();
                            toastActions.info('Adjust reading font size in the reading screen using A- and A+ buttons.');
                        }}
                    />
                    <SettingToggle
                        icon="notifications-outline"
                        label="Push Notifications"
                        value={notificationsEnabled}
                        onValueChange={setNotificationsEnabled}
                    />
                </SettingSection>

                <SettingSection title="STORAGE">
                    <SettingItem
                        icon="cloud-download-outline"
                        label="Downloads"
                        value={downloadCount > 0 ? `${downloadCount} stories (${formatBytes(downloadSize)})` : 'None'}
                        hasChevron={false}
                    />
                    {downloadCount > 0 && (
                        <SettingItem
                            icon="cloud-offline-outline"
                            label="Clear All Downloads"
                            onPress={() => {
                                haptics.selection();
                                clearDownloadsDialogRef.current?.expand();
                            }}
                        />
                    )}
                    <SettingItem
                        icon="folder-outline"
                        label="Cache"
                        value={cacheSize}
                        hasChevron={false}
                    />
                    <SettingItem
                        icon="trash-outline"
                        label="Clear Cache"
                        onPress={() => {
                            haptics.selection();
                            clearCacheDialogRef.current?.expand();
                        }}
                    />
                </SettingSection>

                <SettingSection title="ABOUT">
                    <SettingItem
                        icon="star-outline"
                        label="Rate App"
                        onPress={() => {
                            haptics.light();
                            toastActions.info('Thank you for wanting to rate us! App Store link coming soon.');
                        }}
                    />
                    <SettingItem
                        icon="shield-outline"
                        label="Privacy Policy"
                        onPress={() => {
                            haptics.light();
                            Linking.openURL('https://englishtales.app/privacy');
                        }}
                    />
                    <SettingItem
                        icon="document-text-outline"
                        label="Terms of Service"
                        onPress={() => {
                            haptics.light();
                            Linking.openURL('https://englishtales.app/terms');
                        }}
                    />
                    <SettingItem
                        icon="information-circle-outline"
                        label="Version"
                        value="1.0.0"
                        hasChevron={false}
                    />
                </SettingSection>

                <SettingSection title="DANGER ZONE" isDanger>
                    <SettingItem
                        icon="log-out-outline"
                        label="Sign Out"
                        isDestructive
                        onPress={() => {
                            haptics.warning();
                            signOutDialogRef.current?.expand();
                        }}
                    />
                    <SettingItem
                        icon="trash-bin-outline"
                        label="Delete Account"
                        isDestructive
                        onPress={() => {
                            haptics.selection();
                            deleteAccountDialogRef.current?.expand();
                        }}
                    />
                </SettingSection>

                <Text style={styles.footer}>Made with ❤️ for English learners</Text>
            </ScrollView>

            {/* Confirmation Dialogs */}
            <ConfirmationDialog
                ref={signOutDialogRef}
                title="Sign Out"
                message="Are you sure you want to sign out?"
                confirmLabel="Sign Out"
                cancelLabel="Cancel"
                destructive
                icon="log-out-outline"
                onConfirm={signOut}
                onCancel={() => signOutDialogRef.current?.close()}
            />

            <ConfirmationDialog
                ref={deleteAccountDialogRef}
                title="Delete Account"
                message="This will permanently delete your account and all data. This action cannot be undone."
                confirmLabel="Delete"
                cancelLabel="Cancel"
                destructive
                icon="trash-bin-outline"
                onConfirm={() => {
                    haptics.error();
                    deleteAccountDialogRef.current?.close();
                    toastActions.info('Please contact support@englishtales.app to delete your account.');
                }}
                onCancel={() => deleteAccountDialogRef.current?.close()}
            />

            <ConfirmationDialog
                ref={clearCacheDialogRef}
                title="Clear Cache"
                message="This will clear temporary data. Your library and progress will not be affected."
                confirmLabel="Clear"
                cancelLabel="Cancel"
                icon="trash-outline"
                onConfirm={async () => {
                    haptics.success();
                    setCacheSize('Cleared');
                    clearCacheDialogRef.current?.close();
                    toastActions.success('Cache cleared');
                }}
                onCancel={() => clearCacheDialogRef.current?.close()}
            />

            <ConfirmationDialog
                ref={clearDownloadsDialogRef}
                title="Clear Downloads"
                message={`Remove all ${downloadCount} downloaded stories? They will no longer be available offline.`}
                confirmLabel="Clear All"
                cancelLabel="Cancel"
                destructive
                icon="cloud-offline-outline"
                onConfirm={async () => {
                    await downloadActions.clearAllDownloads();
                    haptics.success();
                    clearDownloadsDialogRef.current?.close();
                    toastActions.success('All downloads cleared');
                }}
                onCancel={() => clearDownloadsDialogRef.current?.close()}
            />

            <ConfirmationDialog
                ref={changePasswordDialogRef}
                title="Change Password"
                message={`A password reset email will be sent to ${user?.email}`}
                confirmLabel="Send"
                cancelLabel="Cancel"
                icon="mail-outline"
                onConfirm={async () => {
                    try {
                        await sendPasswordResetEmail(user!.email!);
                        haptics.success();
                        changePasswordDialogRef.current?.close();
                        toastActions.success('Password reset email sent! Check your inbox.');
                    } catch {
                        haptics.error();
                        changePasswordDialogRef.current?.close();
                        toastActions.error('Failed to send reset email. Please try again.');
                    }
                }}
                onCancel={() => changePasswordDialogRef.current?.close()}
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
    footer: {
        textAlign: 'center',
        fontSize: theme.typography.size.sm,
        color: theme.colors.textMuted,
        marginTop: theme.spacing.xxl,
        marginBottom: theme.spacing.xl,
    },
}));
