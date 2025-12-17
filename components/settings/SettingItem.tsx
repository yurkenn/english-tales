import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import type { SettingItemProps } from './types';

export const SettingItem: React.FC<SettingItemProps> = ({
    icon,
    label,
    value,
    hasChevron = true,
    onPress,
    isDestructive,
}) => {
    const { theme } = useUnistyles();

    return (
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
};

const styles = StyleSheet.create((theme) => ({
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
}));
