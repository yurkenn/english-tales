import React, { forwardRef, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { useTheme, Theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

export interface ActionSheetOption {
    label: string;
    icon?: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    destructive?: boolean;
}

interface ActionSheetProps {
    title?: string;
    subtitle?: string;
    options: ActionSheetOption[];
    onClose: () => void;
}

export const ActionSheet = forwardRef<BottomSheet, ActionSheetProps>(
    ({ title, subtitle, options, onClose }, ref) => {
        const { theme } = useTheme();
        const styles = createStyles(theme);
        const { t } = useTranslation();
        const insets = useSafeAreaInsets();

        const snapPoints = useMemo(() => ['50%'], []);

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

        const handleOptionPress = (option: ActionSheetOption) => {
            onClose();
            setTimeout(() => option.onPress(), 300);
        };

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
                    if (index === -1) onClose();
                }}
            >
                <BottomSheetView style={[styles.content, { paddingBottom: insets.bottom + 16 }]}>
                    {/* Header */}
                    {(title || subtitle) && (
                        <View style={styles.header}>
                            {title && <Text style={styles.title}>{title}</Text>}
                            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                        </View>
                    )}

                    {/* Options */}
                    <View style={styles.options}>
                        {options.map((option, index) => (
                            <TouchableOpacity
                                key={option.label}
                                style={[
                                    styles.option,
                                    index === options.length - 1 && styles.optionLast,
                                ]}
                                onPress={() => handleOptionPress(option)}
                                activeOpacity={0.7}
                                accessibilityRole="button"
                                accessibilityLabel={option.label}
                                accessibilityHint={option.destructive ? t('common.accessibility.destructiveHint', "This action cannot be undone") : undefined}
                            >
                                {option.icon && (
                                    <View style={[
                                        styles.optionIcon,
                                        option.destructive && styles.optionIconDestructive,
                                    ]}>
                                        <Ionicons
                                            name={option.icon}
                                            size={20}
                                            color={option.destructive ? theme.colors.error : theme.colors.primary}
                                        />
                                    </View>
                                )}
                                <Text style={[
                                    styles.optionLabel,
                                    option.destructive && styles.optionLabelDestructive,
                                ]}>
                                    {option.label}
                                </Text>
                                <Ionicons
                                    name="chevron-forward"
                                    size={18}
                                    color={theme.colors.textMuted}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Cancel Button */}
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={onClose}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={t('common.cancel', 'Cancel')}
                        accessibilityHint={t('common.accessibility.closeMenuHint', 'Close this menu')}
                    >
                        <Text style={styles.cancelText}>{t('common.cancel', 'Cancel')}</Text>
                    </TouchableOpacity>
                </BottomSheetView>
            </BottomSheet>
        );
    }
);

const createStyles = (theme: Theme) => StyleSheet.create({
    content: {
        flex: 1,
        paddingHorizontal: theme.spacing.lg,
    },
    header: {
        alignItems: 'center',
        paddingBottom: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
        marginBottom: theme.spacing.md,
    },
    title: {
        fontSize: theme.typography.size.lg,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    subtitle: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textSecondary,
        marginTop: 4,
    },
    options: {
        backgroundColor: theme.colors.backgroundSecondary,
        borderRadius: theme.radius.xl,
        overflow: 'hidden',
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    optionPressed: {
        backgroundColor: theme.colors.borderLight,
    },
    optionLast: {
        borderBottomWidth: 0,
    },
    optionIcon: {
        width: 36,
        height: 36,
        borderRadius: theme.radius.md,
        backgroundColor: `${theme.colors.primary}15`,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.md,
    },
    optionIconDestructive: {
        backgroundColor: `${theme.colors.error}15`,
    },
    optionLabel: {
        flex: 1,
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.medium,
        color: theme.colors.text,
    },
    optionLabelDestructive: {
        color: theme.colors.error,
    },
    cancelButton: {
        marginTop: theme.spacing.md,
        backgroundColor: theme.colors.backgroundSecondary,
        borderRadius: theme.radius.xl,
        paddingVertical: theme.spacing.lg,
        alignItems: 'center',
    },
    cancelButtonPressed: {
        backgroundColor: theme.colors.borderLight,
    },
    cancelText: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.text,
    },
});
