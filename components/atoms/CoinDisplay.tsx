/**
 * CoinDisplay
 * Shows user's coin balance with animated counter
 */

import React, { memo, useEffect, useRef } from 'react'
import { View, Text, Pressable, Animated as RNAnimated } from 'react-native'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'
import { Ionicons } from '@expo/vector-icons'
import { useCoinStore } from '@/store/coinStore'
import { haptics } from '@/utils/haptics'

interface CoinDisplayProps {
    onPress?: () => void
    showLabel?: boolean
    size?: 'sm' | 'md' | 'lg'
}

function CoinDisplayComponent({
    onPress,
    showLabel = false,
    size = 'md',
}: CoinDisplayProps) {
    const { theme } = useUnistyles()
    const balance = useCoinStore((state) => state.balance)
    const prevBalance = useRef(balance)
    const scaleAnim = useRef(new RNAnimated.Value(1)).current

    // Animate on balance change
    useEffect(() => {
        if (balance !== prevBalance.current) {
            // Pulse animation
            RNAnimated.sequence([
                RNAnimated.timing(scaleAnim, {
                    toValue: 1.2,
                    duration: 150,
                    useNativeDriver: true,
                }),
                RNAnimated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start()

            prevBalance.current = balance
        }
    }, [balance, scaleAnim])

    const iconSize = size === 'sm' ? 16 : size === 'lg' ? 24 : 20
    const fontSize = size === 'sm' ? theme.typography.size.sm : size === 'lg' ? theme.typography.size.xl : theme.typography.size.md

    const Container = onPress ? Pressable : View

    return (
        <Container
            style={styles.container}
            onPress={() => {
                haptics.selection()
                onPress?.()
            }}
        >
            <RNAnimated.View
                style={[
                    styles.coinIcon,
                    { transform: [{ scale: scaleAnim }] }
                ]}
            >
                <Ionicons
                    name="logo-bitcoin"
                    size={iconSize}
                    color="#FFD700"
                />
            </RNAnimated.View>
            <Text style={[styles.balance, { fontSize }]}>
                {balance.toLocaleString()}
            </Text>
            {showLabel && (
                <Text style={styles.label}>coins</Text>
            )}
        </Container>
    )
}

export const CoinDisplay = memo(CoinDisplayComponent)

const styles = StyleSheet.create((theme) => ({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
        backgroundColor: theme.colors.background,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.radius.full,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    coinIcon: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    balance: {
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    label: {
        fontSize: theme.typography.size.xs,
        color: theme.colors.textMuted,
        marginLeft: theme.spacing.xxs,
    },
}))
