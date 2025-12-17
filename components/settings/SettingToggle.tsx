import React from 'react';
import { View, Text, Switch } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { haptics } from '@/utils/haptics';
import type { SettingToggleProps } from './types';

export const SettingToggle: React.FC<SettingToggleProps> = ({
    icon,
    label,
    value,
    onValueChange,
}) => {
    const { theme } = useUnistyles();

    return (
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
    settingLabel: {
        flex: 1,
        fontSize: theme.typography.size.md,
        color: theme.colors.text,
    },
}));
