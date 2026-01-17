import { FC, memo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useSettingsStore } from '@/store/settingsStore';
import { ActionSheet } from '@/components/molecules/ActionSheet';
import { ConfirmationDialog } from '@/components/molecules/ConfirmationDialog';
import type { DialogName } from '@/hooks/useSettingsDialogs';
import type BottomSheet from '@gorhom/bottom-sheet';

const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'tr', label: 'Türkçe' },
    { code: 'es', label: 'Español' },
    { code: 'de', label: 'Deutsch' },
    { code: 'fr', label: 'Français' },
] as const;

const THEME_MODES = [
    { code: 'system', icon: 'settings-outline' },
    { code: 'light', icon: 'sunny-outline' },
    { code: 'dark', icon: 'moon-outline' },
    { code: 'sepia', icon: 'book-outline' },
] as const;

interface DialogState {
    ref: React.RefObject<BottomSheet | null>;
    isOpen: boolean;
}

interface SettingsDialogsProps {
    dialogs: Record<DialogName, DialogState>;
    closeDialog: (name: DialogName) => void;
    isDeleting: boolean;
    onSignOut: () => void;
    onClearCache: () => void;
    onPasswordReset: () => void;
    onDeleteAccount: () => void;
}

export const SettingsDialogs: FC<SettingsDialogsProps> = memo(({
    dialogs,
    closeDialog,
    isDeleting,
    onSignOut,
    onClearCache,
    onPasswordReset,
    onDeleteAccount,
}) => {
    const { t, i18n } = useTranslation();
    const { user } = useAuthStore();
    const { mode: themeMode, actions: themeActions } = useThemeStore();
    const { actions: settingsActions } = useSettingsStore();

    // Control dialogs via useEffect when isOpen changes
    useEffect(() => {
        if (dialogs.theme.isOpen) {
            dialogs.theme.ref.current?.expand();
        }
    }, [dialogs.theme.isOpen]);

    useEffect(() => {
        if (dialogs.language.isOpen) {
            dialogs.language.ref.current?.expand();
        }
    }, [dialogs.language.isOpen]);

    useEffect(() => {
        if (dialogs.signOut.isOpen) {
            dialogs.signOut.ref.current?.expand();
        }
    }, [dialogs.signOut.isOpen]);

    useEffect(() => {
        if (dialogs.clearCache.isOpen) {
            dialogs.clearCache.ref.current?.expand();
        }
    }, [dialogs.clearCache.isOpen]);

    useEffect(() => {
        if (dialogs.changePassword.isOpen) {
            dialogs.changePassword.ref.current?.expand();
        }
    }, [dialogs.changePassword.isOpen]);

    useEffect(() => {
        if (dialogs.deleteAccount.isOpen) {
            dialogs.deleteAccount.ref.current?.expand();
        }
    }, [dialogs.deleteAccount.isOpen]);

    return (
        <>
            {/* Sign Out Dialog */}
            <ConfirmationDialog
                ref={dialogs.signOut.ref}
                title={t('settings.dialogs.signOut.title')}
                message={t('settings.dialogs.signOut.message')}
                confirmLabel={t('settings.dangerZone.signOut')}
                cancelLabel={t('common.cancel')}
                destructive
                icon="log-out-outline"
                onConfirm={onSignOut}
                onCancel={() => closeDialog('signOut')}
            />

            {/* Clear Cache Dialog */}
            <ConfirmationDialog
                ref={dialogs.clearCache.ref}
                title={t('settings.dialogs.clearCache.title')}
                message={t('settings.dialogs.clearCache.message')}
                confirmLabel={t('common.delete')}
                cancelLabel={t('common.cancel')}
                icon="trash-outline"
                onConfirm={onClearCache}
                onCancel={() => closeDialog('clearCache')}
            />

            {/* Change Password Dialog */}
            <ConfirmationDialog
                ref={dialogs.changePassword.ref}
                title={t('settings.dialogs.changePassword.title')}
                message={t('settings.dialogs.changePassword.message', { email: user?.email })}
                confirmLabel={t('common.save')}
                cancelLabel={t('common.cancel')}
                icon="mail-outline"
                onConfirm={onPasswordReset}
                onCancel={() => closeDialog('changePassword')}
            />

            {/* Theme Action Sheet */}
            <ActionSheet
                ref={dialogs.theme.ref}
                title={t('settings.preferences.theme')}
                options={THEME_MODES.map((mode) => ({
                    label: t(`appearance.${mode.code}`),
                    icon: themeMode === mode.code ? 'checkmark-circle' : mode.icon as any,
                    onPress: () => {
                        themeActions.setMode(mode.code as any);
                    },
                }))}
                onClose={() => closeDialog('theme')}
            />

            {/* Language Action Sheet */}
            <ActionSheet
                ref={dialogs.language.ref}
                title={t('settings.preferences.language')}
                options={LANGUAGES.map((lang) => ({
                    label: lang.label,
                    icon: (i18n.language || 'en').startsWith(lang.code) ? 'checkmark-circle' : 'ellipse-outline',
                    onPress: () => {
                        settingsActions.updateSettings({ language: lang.code as any });
                    },
                }))}
                onClose={() => closeDialog('language')}
            />

            {/* Delete Account Dialog */}
            <ConfirmationDialog
                ref={dialogs.deleteAccount.ref}
                title={t('settings.dialogs.deleteAccount.title')}
                message={t('settings.dialogs.deleteAccount.message')}
                confirmLabel={isDeleting ? t('common.loading') : t('common.delete')}
                cancelLabel={t('common.cancel')}
                destructive
                icon="trash-outline"
                onConfirm={onDeleteAccount}
                onCancel={() => closeDialog('deleteAccount')}
            />
        </>
    );
});

SettingsDialogs.displayName = 'SettingsDialogs';
