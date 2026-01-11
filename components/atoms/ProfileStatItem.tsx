import React, { memo } from 'react'
import { View, TouchableOpacity, useWindowDimensions } from 'react-native'
import { useTheme, Theme } from '@/theme';
import { StyleSheet } from 'react-native';
import { Typography } from './Typography'

interface ProfileStatItemProps {
    value: string | number
    label: string
    onPress?: () => void
}

/**
 * Shared stat item for profile screens
 * Used in: profile.tsx, user/[id].tsx, UserProfileSheet.tsx
 */
export const ProfileStatItem = memo<ProfileStatItemProps>(({
    value,
    label,
    onPress
}) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const { width: screenWidth } = useWindowDimensions()

    // Responsive sizing for small screens
    const isSmallScreen = screenWidth < 375
    const valueSize = isSmallScreen ? theme.typography.size.lg : theme.typography.size.xl
    const labelSize = isSmallScreen ? theme.typography.size.xs : theme.typography.size.sm

    const content = (
        <View style={styles.statItem}>
            <Typography style={[styles.statValue, { fontSize: valueSize }]}>{value}</Typography>
            <Typography
                style={[styles.statLabel, { fontSize: labelSize }]}
                numberOfLines={1}
                adjustsFontSizeToFit
            >
                {label}
            </Typography>
        </View>
    )

    if (onPress) {
        return (
            <TouchableOpacity onPress={onPress} style={styles.pressable} activeOpacity={0.7}>
                {content}
            </TouchableOpacity>
        )
    }

    return content
})

const createStyles = (theme: Theme) => StyleSheet.create({
    statItem: {
        alignItems: 'center',
        gap: 2,
    },
    statValue: {
        fontSize: theme.typography.size.xl,
        fontWeight: '700',
        color: theme.colors.text,
    },
    statLabel: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textMuted,
        fontWeight: '500',
    },
    pressable: {
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
});
