import React, { forwardRef, useCallback, useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptics } from '@/utils/haptics';
import { useTranslation } from 'react-i18next';

export interface ConfirmationDialogProps {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel?: () => void;
    destructive?: boolean;
    icon?: keyof typeof Ionicons.glyphMap;
}

export const ConfirmationDialog = forwardRef<BottomSheet, ConfirmationDialogProps>(
    ({
        title,
        message,
        confirmLabel = 'Confirm',
        cancelLabel = 'Cancel',
        onConfirm,
        onCancel,
        destructive = false,
        icon,
    }, ref) => {
        const { theme } = useUnistyles();
        const { t } = useTranslation();
        const insets = useSafeAreaInsets();

        const confirmLabelText = confirmLabel || t('common.confirm', 'Confirm');
        const cancelLabelText = cancelLabel || t('common.cancel', 'Cancel');

        const snapPoints = useMemo(() => ['40%'], []);

        const renderBackdrop = useCallback(
            (props: any) => (
                <BottomSheetBackdrop
                    {...props}
                    disappearsOnIndex={-1}
                    appearsOnIndex={0}
                    opacity={0.5}
                />
            ),
            []
        );

        const handleConfirm = () => {
            haptics.selection();
            onConfirm();
        };

        const handleCancel = () => {
            haptics.light();
            if (onCancel) {
                onCancel();
            }
        };

        const iconName = icon || (destructive ? 'warning-outline' : 'help-circle-outline');
        const iconColor = destructive ? theme.colors.error : theme.colors.primary;

        return (
            <BottomSheet
                ref={ref}
                index={-1}
                snapPoints={snapPoints}
                enablePanDownToClose
                backdropComponent={renderBackdrop}
                backgroundStyle={{ backgroundColor: theme.colors.surface }}
                handleIndicatorStyle={{ backgroundColor: theme.colors.textMuted, width: 40 }}
                onChange={(index) => {
                    if (index === -1 && onCancel) {
                        onCancel();
                    }
                }}
            >
                <BottomSheetView style={[styles.content, { paddingBottom: insets.bottom + 16 }]}>
                    {/* Icon */}
                    {iconName && (
                        <View style={[styles.iconContainer, destructive && styles.iconContainerDestructive]}>
                            <Ionicons
                                name={iconName}
                                size={32}
                                color={iconColor}
                            />
                        </View>
                    )}

                    {/* Title */}
                    <Text style={styles.title}>{title}</Text>

                    {/* Message */}
                    <Text style={styles.message}>{message}</Text>

                    {/* Buttons */}
                    <View style={styles.buttons}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.button,
                                styles.cancelButton,
                                pressed && styles.buttonPressed,
                            ]}
                            onPress={handleCancel}
                            accessibilityRole="button"
                            accessibilityLabel={cancelLabelText}
                            accessibilityHint={t('common.accessibility.cancelHint', 'Cancel this action')}
                        >
                            <Text style={styles.cancelButtonText}>{cancelLabelText}</Text>
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => [
                                styles.button,
                                destructive ? styles.destructiveButton : styles.confirmButton,
                                pressed && styles.buttonPressed,
                            ]}
                            onPress={handleConfirm}
                            accessibilityRole="button"
                            accessibilityLabel={confirmLabelText}
                            accessibilityHint={destructive ? t('common.accessibility.destructiveHint', "This action cannot be undone") : t('common.accessibility.confirmHint', "Confirm this action")}
                        >
                            <Text
                                style={[
                                    styles.confirmButtonText,
                                    destructive && styles.destructiveButtonText,
                                ]}
                            >
                                {confirmLabelText}
                            </Text>
                        </Pressable>
                    </View>
                </BottomSheetView>
            </BottomSheet>
        );
    }
);

ConfirmationDialog.displayName = 'ConfirmationDialog';

const styles = StyleSheet.create((theme) => ({
    content: {
        paddingHorizontal: theme.spacing.xl,
        paddingTop: theme.spacing.xl,
        alignItems: 'center',
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: theme.radius.full,
        backgroundColor: `${theme.colors.primary}15`,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.lg,
    },
    iconContainerDestructive: {
        backgroundColor: `${theme.colors.error}15`,
    },
    title: {
        fontSize: theme.typography.size.xl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: theme.spacing.md,
    },
    message: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: theme.typography.size.md * 1.5,
        marginBottom: theme.spacing.xl,
    },
    buttons: {
        flexDirection: 'row',
        gap: theme.spacing.md,
        width: '100%',
    },
    button: {
        flex: 1,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.radius.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: theme.colors.backgroundSecondary,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    confirmButton: {
        backgroundColor: theme.colors.primary,
    },
    destructiveButton: {
        backgroundColor: theme.colors.error,
    },
    buttonPressed: {
        opacity: 0.8,
    },
    cancelButtonText: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.text,
    },
    confirmButtonText: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.textInverse,
    },
    destructiveButtonText: {
        color: theme.colors.textInverse,
    },
}));
