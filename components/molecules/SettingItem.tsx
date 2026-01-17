import { FC } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme, Theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import type { SettingItemProps } from '../organisms/settingsTypes';

export const SettingItem: FC<SettingItemProps> = ({
    icon,
    label,
    value,
    hasChevron = true,
    onPress,
    isDestructive,
}) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);

    return (
        <TouchableOpacity style={styles.settingItem} onPress={onPress} activeOpacity={0.7}>
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
        </TouchableOpacity>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
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
});
