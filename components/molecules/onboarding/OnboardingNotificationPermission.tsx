/**
 * OnboardingNotificationPermission - Notification Permission Request
 */
import { FC, memo, useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme, Theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { haptics } from '@/utils/haptics';
import { notificationService } from '@/services/notificationService';

interface OnboardingNotificationPermissionProps {
    readonly onPermissionGranted: () => void;
    readonly onSkip: () => void;
}

const BENEFITS = [
    { icon: 'flame', text: 'Streak reminders to stay consistent', color: '#EF4444' },
    { icon: 'gift', text: 'Daily bonus notifications', color: '#F59E0B' },
    { icon: 'sparkles', text: 'New story alerts', color: '#8B5CF6' },
    { icon: 'trophy', text: 'Achievement celebrations', color: '#22C55E' },
];

export const OnboardingNotificationPermission: FC<OnboardingNotificationPermissionProps> = memo(({
    onPermissionGranted,
    onSkip,
}) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const [isRequesting, setIsRequesting] = useState(false);

    const handleEnable = useCallback(async () => {
        haptics.selection();
        setIsRequesting(true);

        try {
            const token = await notificationService.registerForPushNotificationsAsync();

            if (token) {
                haptics.success();
                onPermissionGranted();
            } else {
                // Permission denied, but still continue
                onSkip();
            }
        } catch (error) {
            console.warn('[Onboarding] Notification permission failed:', error);
            onSkip();
        } finally {
            setIsRequesting(false);
        }
    }, [onPermissionGranted, onSkip]);

    const handleSkip = useCallback(() => {
        haptics.selection();
        onSkip();
    }, [onSkip]);

    return (
        <View style={styles.container}>
            {/* Bell Icon Animation */}
            <View style={styles.iconWrapper}>
                <View style={styles.iconBackground}>
                    <Ionicons name="notifications" size={48} color={theme.colors.primary} />
                </View>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>1</Text>
                </View>
            </View>

            {/* Benefits List */}
            <View style={styles.benefitsContainer}>
                {BENEFITS.map((benefit, index) => (
                    <View key={index} style={styles.benefitRow}>
                        <View style={[styles.benefitIcon, { backgroundColor: benefit.color + '20' }]}>
                            <Ionicons
                                name={benefit.icon as keyof typeof Ionicons.glyphMap}
                                size={20}
                                color={benefit.color}
                            />
                        </View>
                        <Text style={styles.benefitText}>{benefit.text}</Text>
                    </View>
                ))}
            </View>

            {/* Actions */}
            <View style={styles.actionsContainer}>
                <TouchableOpacity
                    style={styles.enableButton}
                    onPress={handleEnable}
                    disabled={isRequesting}
                    activeOpacity={0.8}
                >
                    <Ionicons name="notifications" size={20} color="#FFFFFF" />
                    <Text style={styles.enableButtonText}>
                        {isRequesting ? 'Requesting...' : 'Enable Notifications'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.skipButton}
                    onPress={handleSkip}
                    activeOpacity={0.7}
                >
                    <Text style={styles.skipButtonText}>Maybe Later</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.privacyNote}>
                You can change this anytime in Settings
            </Text>
        </View>
    );
});

OnboardingNotificationPermission.displayName = 'OnboardingNotificationPermission';

function createStyles(theme: Theme) {
    return StyleSheet.create({
        container: {
            width: '100%',
            paddingHorizontal: theme.spacing.xl,
            alignItems: 'center',
        },
        iconWrapper: {
            position: 'relative',
            marginBottom: theme.spacing.xl,
        },
        iconBackground: {
            width: 96,
            height: 96,
            borderRadius: theme.radius.full,
            backgroundColor: theme.colors.primary + '15',
            alignItems: 'center',
            justifyContent: 'center',
        },
        badge: {
            position: 'absolute',
            top: 0,
            right: 0,
            width: 28,
            height: 28,
            borderRadius: theme.radius.full,
            backgroundColor: theme.colors.error,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 3,
            borderColor: theme.colors.background,
        },
        badgeText: {
            color: '#FFFFFF',
            fontSize: theme.typography.size.sm,
            fontWeight: 'bold',
        },
        benefitsContainer: {
            width: '100%',
            gap: theme.spacing.md,
            marginBottom: theme.spacing.xl,
        },
        benefitRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.md,
        },
        benefitIcon: {
            width: 40,
            height: 40,
            borderRadius: theme.radius.md,
            alignItems: 'center',
            justifyContent: 'center',
        },
        benefitText: {
            flex: 1,
            fontSize: theme.typography.size.md,
            color: theme.colors.text,
        },
        actionsContainer: {
            width: '100%',
            gap: theme.spacing.sm,
        },
        enableButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: theme.spacing.sm,
            width: '100%',
            height: 56,
            backgroundColor: theme.colors.primary,
            borderRadius: theme.radius.full,
            ...theme.shadows.md,
        },
        enableButtonText: {
            color: '#FFFFFF',
            fontSize: theme.typography.size.lg,
            fontWeight: 'bold',
        },
        skipButton: {
            width: '100%',
            height: 48,
            alignItems: 'center',
            justifyContent: 'center',
        },
        skipButtonText: {
            color: theme.colors.textMuted,
            fontSize: theme.typography.size.md,
        },
        privacyNote: {
            fontSize: theme.typography.size.xs,
            color: theme.colors.textMuted,
            textAlign: 'center',
            marginTop: theme.spacing.md,
        },
    });
}
