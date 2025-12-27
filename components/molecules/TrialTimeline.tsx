import React from 'react'
import { View, Text } from 'react-native'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'
import { Ionicons } from '@expo/vector-icons'
import Animated, { FadeInDown } from 'react-native-reanimated'

interface TrialTimelineProps {
    days?: number
}

export function TrialTimeline({ days = 3 }: TrialTimelineProps) {
    const { theme } = useUnistyles()

    return (
        <Animated.View entering={FadeInDown.delay(600)} style={styles.container}>
            <View style={styles.line} />

            <View style={styles.step}>
                <View style={[styles.dot, { backgroundColor: theme.colors.primary }]}>
                    <Ionicons name="lock-open-outline" size={14} color="#fff" />
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.stepTitle}>Today</Text>
                    <Text style={styles.stepSub}>Your {days}-day free trial starts. Full access unlocked.</Text>
                </View>
            </View>

            <View style={styles.step}>
                <View style={[styles.dot, { backgroundColor: theme.colors.warning }]}>
                    <Ionicons name="notifications-outline" size={14} color="#fff" />
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.stepTitle}>Day {days - 1}</Text>
                    <Text style={styles.stepSub}>We'll send you a reminder that your trial is ending.</Text>
                </View>
            </View>

            <View style={styles.step}>
                <View style={[styles.dot, { backgroundColor: theme.colors.success }]}>
                    <Ionicons name="card-outline" size={14} color="#fff" />
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.stepTitle}>Day {days + 1}</Text>
                    <Text style={styles.stepSub}>Your subscription begins. You can cancel anytime before this.</Text>
                </View>
            </View>
        </Animated.View>
    )
}

const styles = StyleSheet.create((theme) => ({
    container: {
        marginVertical: theme.spacing.xl,
        paddingHorizontal: theme.spacing.sm,
        position: 'relative',
    },
    line: {
        position: 'absolute',
        left: 21,
        top: 20,
        bottom: 20,
        width: 2,
        backgroundColor: theme.colors.border,
        opacity: 0.5,
    },
    step: {
        flexDirection: 'row',
        marginBottom: theme.spacing.lg,
        alignItems: 'flex-start',
    },
    dot: {
        width: 26,
        height: 26,
        borderRadius: 13,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
        marginRight: theme.spacing.md,
        marginTop: 2,
    },
    textContainer: {
        flex: 1,
    },
    stepTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.text,
    },
    stepSub: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        marginTop: 2,
        lineHeight: 18,
    },
}))
