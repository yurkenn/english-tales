import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useToastStore } from '@/store/toastStore';
import { haptics } from '@/utils/haptics';
import { sendPasswordResetEmail, deleteAccount } from '@/services/auth';
import { userService } from '@/services/userService';
import { notificationService } from '@/services/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DialogName } from './useSettingsDialogs';

interface UseSettingsHandlersProps {
    onDialogClose: (name: DialogName) => void;
}

/**
 * Custom hook for all settings action handlers.
 * Separates business logic from UI components.
 */
export function useSettingsHandlers({ onDialogClose }: UseSettingsHandlersProps) {
    const router = useRouter();
    const { t } = useTranslation();
    const toast = useToastStore();

    const { user, signOut } = useAuthStore();
    const { actions: settingsActions } = useSettingsStore();
    const { actions: subscriptionActions } = useSubscriptionStore();

    const [isRestoring, setIsRestoring] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [cacheSize, setCacheSize] = useState(t('common.loading'));

    // Calculate cache size on mount
    const calculateCacheSize = useCallback(async () => {
        try {
            const keys = await AsyncStorage.getAllKeys();
            setCacheSize(`${keys.length} items`);
        } catch {
            setCacheSize('Unknown');
        }
    }, []);

    const handleRestorePurchases = useCallback(async () => {
        if (isRestoring) return;

        haptics.selection();
        setIsRestoring(true);

        try {
            const restored = await subscriptionActions.restore();
            if (restored) {
                haptics.success();
                toast.actions.success(t('settings.subscription.restoreSuccess', 'Purchases restored successfully!'));
            } else {
                toast.actions.info(t('settings.subscription.noSubscription', 'No active subscription found.'));
            }
        } catch {
            haptics.error();
            toast.actions.error(t('settings.subscription.restoreError', 'Failed to restore purchases.'));
        } finally {
            setIsRestoring(false);
        }
    }, [isRestoring, subscriptionActions, toast, t]);

    const handleNotificationToggle = useCallback(async (enabled: boolean) => {
        haptics.selection();
        settingsActions.updateSettings({ notificationsEnabled: enabled });

        if (enabled) {
            await notificationService.initialize();
        } else {
            await notificationService.cancelAllDailyReminders();
        }
    }, [settingsActions]);

    const handleClearCache = useCallback(async () => {
        haptics.success();
        setCacheSize('Cleared');
        onDialogClose('clearCache');
        toast.actions.success(t('settings.dialogs.clearCache.success'));
    }, [onDialogClose, toast, t]);

    const handlePasswordReset = useCallback(async () => {
        if (!user?.email) {
            toast.actions.error('No email associated with this account.');
            return;
        }

        try {
            await sendPasswordResetEmail(user.email);
            haptics.success();
            onDialogClose('changePassword');
            toast.actions.success(t('settings.dialogs.changePassword.success'));
        } catch {
            haptics.error();
            onDialogClose('changePassword');
            toast.actions.error(t('settings.dialogs.changePassword.error'));
        }
    }, [user, onDialogClose, toast, t]);

    const handleSignOut = useCallback(() => {
        signOut();
        onDialogClose('signOut');
    }, [signOut, onDialogClose]);

    const handleDeleteAccount = useCallback(async () => {
        if (!user || isDeleting) return;

        setIsDeleting(true);
        try {
            const deleteResult = await userService.deleteUserData(user.id);
            if (!deleteResult.success) {
                throw new Error(deleteResult.error);
            }
            await deleteAccount();
            haptics.success();
            onDialogClose('deleteAccount');
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
            onDialogClose('deleteAccount');
        }
    }, [user, isDeleting, onDialogClose, toast, router]);

    return {
        // States
        isRestoring,
        isDeleting,
        cacheSize,

        // Handlers
        calculateCacheSize,
        handleRestorePurchases,
        handleNotificationToggle,
        handleClearCache,
        handlePasswordReset,
        handleSignOut,
        handleDeleteAccount,
    };
}
