import * as Haptics from 'expo-haptics';

const safeHaptic = async (fn: () => Promise<void>) => {
    try {
        await fn();
    } catch {
        // Haptics not available on this device/platform
    }
};

export const haptics = {
    light: () => safeHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
    medium: () => safeHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
    heavy: () => safeHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),
    success: () => safeHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
    warning: () => safeHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
    error: () => safeHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
    selection: () => safeHaptic(() => Haptics.selectionAsync()),
};

