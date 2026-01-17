import { FC, memo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, Theme } from '@/theme';
import { Typography } from '@/components/atoms';
import { haptics } from '@/utils/haptics';
import type { IconName } from '@/components/organisms/settingsTypes';

export interface ProfileMenuItemProps {
    icon: IconName;
    label: string;
    value?: string;
    onPress: () => void;
    isLast?: boolean;
}

export const ProfileMenuItem: FC<ProfileMenuItemProps> = memo(({
    icon,
    label,
    value,
    onPress,
    isLast = false,
}) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);

    const handlePress = () => {
        haptics.selection();
        onPress();
    };

    return (
        <Pressable
            style={[styles.menuItem, !isLast && styles.menuItemBorder]}
            onPress={handlePress}
            android_ripple={{ color: theme.colors.primary + '10' }}
        >
            <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconWrapper, { backgroundColor: theme.colors.primary + '15' }]}>
                    <Ionicons name={icon} size={18} color={theme.colors.primary} />
                </View>
                <Typography style={styles.menuItemLabel}>{label}</Typography>
            </View>
            <View style={styles.menuItemRight}>
                {value && (
                    <Typography style={styles.menuItemValue}>{value}</Typography>
                )}
                <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
            </View>
        </Pressable>
    );
});

ProfileMenuItem.displayName = 'ProfileMenuItem';

function createStyles(theme: Theme) {
    return StyleSheet.create({
        menuItem: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: theme.spacing.lg,
        },
        menuItemBorder: {
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.borderLight,
        },
        menuItemLeft: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.lg,
        },
        menuIconWrapper: {
            width: 36,
            height: 36,
            borderRadius: theme.radius.sm,
            alignItems: 'center',
            justifyContent: 'center',
        },
        menuItemRight: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.xs,
        },
        menuItemLabel: {
            fontSize: theme.typography.size.md,
            color: theme.colors.text,
            fontWeight: '500',
        },
        menuItemValue: {
            fontSize: theme.typography.size.sm,
            color: theme.colors.textMuted,
        },
    });
}
