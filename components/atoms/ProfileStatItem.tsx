import React, { memo } from 'react'
import { View, Pressable } from 'react-native'
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

    const content = (
        <View style={styles.statItem}>
            <Typography style={styles.statValue}>{value}</Typography>
            <Typography style={styles.statLabel}>{label}</Typography>
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
