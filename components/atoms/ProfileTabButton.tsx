import React, { memo } from 'react'
import { View, Pressable } from 'react-native'
import { useTheme, Theme } from '@/theme';
import { StyleSheet } from 'react-native';
import { Typography } from './Typography'

interface ProfileTabButtonProps {
    label: string
    count?: number
    isActive: boolean
    onPress: () => void
}

/**
 * Shared tab button for profile screens
 * Used in: profile.tsx, user/[id].tsx, UserProfileSheet.tsx
 */
export const ProfileTabButton = memo<ProfileTabButtonProps>(({
    label,
    count,
    isActive,
    onPress
}) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);

    return (
        <Pressable
            style={styles.tabButton}
            onPress={onPress}
            android_ripple={{ color: theme.colors.primary + '20' }}
        >
            <View style={styles.tabButtonContent}>
                <Typography
                    style={[
                        styles.tabButtonText,
                        { color: isActive ? theme.colors.text : theme.colors.textMuted },
                        isActive && styles.tabButtonTextActive
                    ]}
                >
                    {label}
                </Typography>
                {count !== undefined && count > 0 && (
                    <View style={[
                        styles.tabBadge,
                        { backgroundColor: isActive ? theme.colors.primary : theme.colors.surfaceElevated }
                    ]}>
                        <Typography
                            style={[
                                styles.tabBadgeText,
                                { color: isActive ? theme.colors.textInverse : theme.colors.textMuted }
                            ]}
                        >
                            {count > 99 ? '99+' : count}
                        </Typography>
                    </View>
                )}
            </View>
            {isActive && (
                <View style={[styles.tabIndicator, { backgroundColor: theme.colors.primary }]} />
            )}
        </Pressable>
    )
})

const createStyles = (theme: Theme) => StyleSheet.create({
    tabButton: {
        flex: 1,
        paddingVertical: theme.spacing.md,
        alignItems: 'center',
    },
    tabButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    tabButtonText: {
        fontSize: theme.typography.size.md,
        fontWeight: '500',
    },
    tabButtonTextActive: {
        fontWeight: '700',
    },
    tabBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        minWidth: 24,
        alignItems: 'center',
    },
    tabBadgeText: {
        fontSize: theme.typography.size.xs,
        fontWeight: '600',
    },
    tabIndicator: {
        height: 3,
        borderRadius: 1.5,
        marginTop: 8,
        width: '60%',
    },
});
