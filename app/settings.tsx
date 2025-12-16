import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, Switch, Linking } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useReadingPrefsStore } from '@/store/readingPrefsStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useProgressStore } from '@/store/progressStore';
import { useDownloadStore, formatBytes } from '@/store/downloadStore';
import { useToastStore } from '@/store/toastStore';
import { ConfirmationDialog } from '@/components';
import { haptics } from '@/utils/haptics';
import { sendPasswordResetEmail } from '@/services/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface SettingItemProps {
    icon: IconName;
    label: string;
    value?: string;
    hasChevron?: boolean;
    onPress?: () => void;
    isDestructive?: boolean;
}

interface SettingToggleProps {
    icon: IconName;
    label: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
}

export default function SettingsScreen() {
    const { theme } = useUnistyles();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const { user, signOut } = useAuthStore();
    const { mode: themeMode, actions: themeActions } = useThemeStore();
    const { fontSize, actions: readingActions } = useReadingPrefsStore();
    const { actions: libraryActions } = useLibraryStore();
    const { actions: progressActions } = useProgressStore();
    const { downloads, actions: downloadActions } = useDownloadStore();

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
    
    const toastActions = useToastStore((state) => state.actions);

    // Calculate cache size
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

    const handleClearCache = () => {
        haptics.selection();
        clearCacheDialogRef.current?.expand();
    };

    const handleConfirmClearCache = async () => {
        haptics.success();
        setCacheSize('Cleared');
        clearCacheDialogRef.current?.close();
        toastActions.success('Cache cleared');
    };

    const handleDeleteAccount = () => {
        haptics.selection();
        deleteAccountDialogRef.current?.expand();
    };

    const handleConfirmDeleteAccount = () => {
        haptics.error();
        deleteAccountDialogRef.current?.close();
        toastActions.info('Please contact support@englishtales.app to delete your account.');
    };

    const handleRateApp = () => {
        haptics.light();
        toastActions.info('Thank you for wanting to rate us! App Store link coming soon.');
    };

    const handlePrivacyPolicy = () => {
        haptics.light();
        Linking.openURL('https://englishtales.app/privacy');
    };

    const handleTermsOfService = () => {
        haptics.light();
        Linking.openURL('https://englishtales.app/terms');
    };

    const SettingItem: React.FC<SettingItemProps> = ({
        icon, label, value, hasChevron = true, onPress, isDestructive
    }) => (
        <Pressable style={styles.settingItem} onPress={onPress}>
            <View style={[styles.settingIcon, isDestructive && styles.settingIconDestructive]}>
                <Ionicons
                    name={icon}
                    size={20}
                    color={isDestructive ? theme.colors.error : theme.colors.primary}
                />
            </View>
            <Text style={[styles.settingLabel, isDestructive && styles.settingLabelDestructive]}>
                {label}
            </Text>
            {value && <Text style={styles.settingValue}>{value}</Text>}
            {hasChevron && (
                <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
            )}
        </Pressable>
    );

    const SettingToggle: React.FC<SettingToggleProps> = ({
        icon, label, value, onValueChange
    }) => (
        <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
                <Ionicons name={icon} size={20} color={theme.colors.primary} />
            </View>
            <Text style={styles.settingLabel}>{label}</Text>
            <Switch
                value={value}
                onValueChange={(val) => {
                    haptics.selection();
                    onValueChange(val);
                }}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={theme.colors.surface}
            />
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </Pressable>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

                {/* Account Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ACCOUNT</Text>
                    <View style={styles.sectionContent}>
                        <SettingItem
                            icon="person-outline"
                            label="Edit Profile"
                            onPress={() => {
                                haptics.selection();
                                router.back();
                                // The edit profile modal is on the profile screen
                            }}
                        />
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
                    </View>
                </View>

                {/* Preferences Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>PREFERENCES</Text>
                    <View style={styles.sectionContent}>
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
                    </View>
                </View>

                {/* Storage Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>STORAGE</Text>
                    <View style={styles.sectionContent}>
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
                            onPress={handleClearCache}
                        />
                    </View>
                </View>

                {/* About Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ABOUT</Text>
                    <View style={styles.sectionContent}>
                        <SettingItem
                            icon="star-outline"
                            label="Rate App"
                            onPress={handleRateApp}
                        />
                        <SettingItem
                            icon="shield-outline"
                            label="Privacy Policy"
                            onPress={handlePrivacyPolicy}
                        />
                        <SettingItem
                            icon="document-text-outline"
                            label="Terms of Service"
                            onPress={handleTermsOfService}
                        />
                        <SettingItem
                            icon="information-circle-outline"
                            label="Version"
                            value="1.0.0"
                            hasChevron={false}
                        />
                    </View>
                </View>

                {/* Danger Zone */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, styles.dangerTitle]}>DANGER ZONE</Text>
                    <View style={styles.sectionContent}>
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
                            onPress={handleDeleteAccount}
                        />
                    </View>
                </View>

                <Text style={styles.footer}>
                    Made with ❤️ for English learners
                </Text>
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
                onConfirm={handleConfirmDeleteAccount}
                onCancel={() => deleteAccountDialogRef.current?.close()}
            />

            <ConfirmationDialog
                ref={clearCacheDialogRef}
                title="Clear Cache"
                message="This will clear temporary data. Your library and progress will not be affected."
                confirmLabel="Clear"
                cancelLabel="Cancel"
                icon="trash-outline"
                onConfirm={handleConfirmClearCache}
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
                    } catch (error) {
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: theme.typography.size.xl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    placeholder: {
        width: 40,
    },
    content: {
        paddingBottom: 40,
    },
    section: {
        marginTop: theme.spacing.xl,
        paddingHorizontal: theme.spacing.lg,
    },
    sectionTitle: {
        fontSize: theme.typography.size.sm,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.textMuted,
        marginBottom: theme.spacing.sm,
        marginLeft: theme.spacing.sm,
    },
    sectionContent: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xl,
        ...theme.shadows.sm,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    settingIcon: {
        width: 36,
        height: 36,
        borderRadius: theme.radius.md,
        backgroundColor: `${theme.colors.primary}15`,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.md,
    },
    settingIconDestructive: {
        backgroundColor: `${theme.colors.error}15`,
    },
    settingLabel: {
        flex: 1,
        fontSize: theme.typography.size.md,
        color: theme.colors.text,
    },
    settingLabelDestructive: {
        color: theme.colors.error,
    },
    settingValue: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textMuted,
        marginRight: theme.spacing.sm,
    },
    dangerTitle: {
        color: theme.colors.error,
    },
    footer: {
        textAlign: 'center',
        fontSize: theme.typography.size.sm,
        color: theme.colors.textMuted,
        marginTop: theme.spacing.xxl,
        marginBottom: theme.spacing.xl,
    },
}));
