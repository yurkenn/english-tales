import React, { memo } from 'react'
import { View, Pressable, useWindowDimensions } from 'react-native'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'
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
    const { theme } = useUnistyles()
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
            <Pressable onPress={onPress} style={styles.pressable}>
                {content}
            </Pressable>
        )
    }

    return content
})

const styles = StyleSheet.create((theme) => ({
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
}))
