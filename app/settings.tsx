import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useTheme, Theme } from '@/theme';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsiveLayout, useSettingsDialogs, useSettingsHandlers } from '@/hooks';

import { useSettingsStore } from '@/store/settingsStore';
import { useTranslation } from 'react-i18next';
import {
    SettingsHeader,
    AccountSection,
    SubscriptionSection,
    PreferencesSection,
    StorageSection,
    DangerZoneSection,
    SettingsDialogs,
} from '@/components';
import { Typography } from '@/components/atoms';

export default function SettingsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { containerPadding } = useResponsiveLayout();
    const styles = createStyles(theme);

    const { settings, actions: settingsActions } = useSettingsStore();
    const [notificationsEnabled, setNotificationsEnabled] = useState(settings.notificationsEnabled);

    // Centralized dialog management
    const { dialogs, openDialog, closeDialog } = useSettingsDialogs();

    // Centralized action handlers
    const handlers = useSettingsHandlers({
        onDialogClose: closeDialog,
    });

    useEffect(() => {
        handlers.calculateCacheSize();
        settingsActions.loadSettings();
    }, []);

    const handleNotificationToggle = async (value: boolean) => {
        setNotificationsEnabled(value);
        await handlers.handleNotificationToggle(value);
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <SettingsHeader
                title={t('settings.title', 'Settings')}
                onBackPress={() => router.back()}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.content, { paddingHorizontal: containerPadding }]}
            >
                <AccountSection
                    onChangePasswordPress={() => openDialog('changePassword')}
                />

                <SubscriptionSection
                    isRestoring={handlers.isRestoring}
                    onRestorePurchases={handlers.handleRestorePurchases}
                />

                <PreferencesSection
                    notificationsEnabled={notificationsEnabled}
                    onNotificationToggle={handleNotificationToggle}
                    onThemePress={() => openDialog('theme')}
                    onLanguagePress={() => openDialog('language')}
                />

                <StorageSection
                    onClearCachePress={() => openDialog('clearCache')}
                />

                <DangerZoneSection
                    onSignOutPress={() => openDialog('signOut')}
                    onDeleteAccountPress={() => openDialog('deleteAccount')}
                />

                <View style={styles.footerContainer}>
                    <Typography variant="caption" color={theme.colors.textMuted}>
                        English Tales v1.0.0
                    </Typography>
                </View>
            </ScrollView>

            <SettingsDialogs
                dialogs={dialogs}
                closeDialog={closeDialog}
                isDeleting={handlers.isDeleting}
                onSignOut={handlers.handleSignOut}
                onClearCache={handlers.handleClearCache}
                onPasswordReset={handlers.handlePasswordReset}
                onDeleteAccount={handlers.handleDeleteAccount}
            />
        </View>
    );
}

function createStyles(theme: Theme) {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        content: {
            paddingBottom: theme.spacing.xxxxl,
        },
        footerContainer: {
            marginTop: theme.spacing.xxl,
            marginBottom: theme.spacing.xl,
            alignItems: 'center',
        },
    });
}
