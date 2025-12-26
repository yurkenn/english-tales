import React, { useState, useRef, useEffect } from 'react'
import { View, Pressable, Animated } from 'react-native'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'
import { Typography } from '@/components/atoms'
import { Ionicons } from '@expo/vector-icons'
import { haptics } from '@/utils/haptics'

interface FlashCardProps {
    word: string
    definition: string
    example?: string
    partOfSpeech?: string
    onCorrect?: () => void
    onIncorrect?: () => void
    autoFlip?: boolean
}

export const FlashCard: React.FC<FlashCardProps> = ({
    word,
    definition,
    example,
    partOfSpeech,
    onCorrect,
    onIncorrect,
    autoFlip = false,
}) => {
    const { theme } = useUnistyles()
    const [isFlipped, setIsFlipped] = useState(false)
    const flipAnim = useRef(new Animated.Value(0)).current

    useEffect(() => {
        Animated.timing(flipAnim, {
            toValue: isFlipped ? 1 : 0,
            duration: 400,
            useNativeDriver: true,
        }).start()
    }, [isFlipped])

    const handleFlip = () => {
        haptics.light()
        setIsFlipped(!isFlipped)
    }

    const handleCorrect = () => {
        haptics.success()
        onCorrect?.()
    }

    const handleIncorrect = () => {
        haptics.warning()
        onIncorrect?.()
    }

    const frontInterpolate = flipAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: ['0deg', '90deg', '180deg'],
    })

    const backInterpolate = flipAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: ['180deg', '270deg', '360deg'],
    })

    // Scale animation for depth effect
    const scaleInterpolate = flipAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [1, 0.95, 1],
    })

    // Front opacity - hide at midpoint
    const frontOpacity = flipAnim.interpolate({
        inputRange: [0, 0.49, 0.5, 1],
        outputRange: [1, 1, 0, 0],
    })

    // Back opacity - show at midpoint
    const backOpacity = flipAnim.interpolate({
        inputRange: [0, 0.5, 0.51, 1],
        outputRange: [0, 0, 1, 1],
    })

    // Buttons opacity - fade in after midpoint
    const buttonsOpacity = flipAnim.interpolate({
        inputRange: [0, 0.7, 1],
        outputRange: [0, 0, 1],
    })

    const frontAnimatedStyle = {
        transform: [
            { perspective: 1200 },
            { rotateY: frontInterpolate },
            { scale: scaleInterpolate },
        ],
        opacity: frontOpacity,
    }

    const backAnimatedStyle = {
        transform: [
            { perspective: 1200 },
            { rotateY: backInterpolate },
            { scale: scaleInterpolate },
        ],
        opacity: backOpacity,
    }

    return (
        <View style={styles.container}>
            {/* Card */}
            <Pressable onPress={handleFlip} style={styles.cardWrapper}>
                {/* Front - Word */}
                <Animated.View style={[styles.card, styles.cardFront, frontAnimatedStyle]}>
                    <View style={styles.cardContent}>
                        <Typography style={styles.label}>WORD</Typography>
                        <Typography style={styles.word}>{word}</Typography>
                        {partOfSpeech && (
                            <Typography style={styles.partOfSpeech}>{partOfSpeech}</Typography>
                        )}
                        <View style={styles.tapHint}>
                            <Ionicons name="sync-outline" size={16} color={theme.colors.textMuted} />
                            <Typography style={styles.tapHintText}>Tap to flip</Typography>
                        </View>
                    </View>
                </Animated.View>

                {/* Back - Definition */}
                <Animated.View style={[styles.card, styles.cardBack, backAnimatedStyle]}>
                    <View style={styles.cardContent}>
                        <Typography style={styles.labelBack}>DEFINITION</Typography>
                        <Typography style={styles.definition}>{definition}</Typography>
                        {example && (
                            <Typography style={styles.example}>"{example}"</Typography>
                        )}
                    </View>
                </Animated.View>
            </Pressable>

            {/* Action Buttons - shown after flip */}
            <Animated.View
                style={[
                    styles.actions,
                    { opacity: buttonsOpacity }
                ]}
                pointerEvents={isFlipped ? 'auto' : 'none'}
            >
                <Pressable
                    style={[styles.actionButton, styles.incorrectButton]}
                    onPress={handleIncorrect}
                >
                    <Ionicons name="close" size={24} color={theme.colors.error} />
                    <Typography style={[styles.actionText, { color: theme.colors.error }]}>
                        Learning
                    </Typography>
                </Pressable>
                <Pressable
                    style={[styles.actionButton, styles.correctButton]}
                    onPress={handleCorrect}
                >
                    <Ionicons name="checkmark" size={24} color={theme.colors.success} />
                    <Typography style={[styles.actionText, { color: theme.colors.success }]}>
                        Got It!
                    </Typography>
                </Pressable>
            </Animated.View>
        </View>
    )
}

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.xl,
    },
    cardWrapper: {
        width: '100%',
        aspectRatio: 0.75,
        maxHeight: 420,
    },
    card: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: theme.radius.xl,
        backfaceVisibility: 'hidden',
    },
    cardFront: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    cardBack: {
        backgroundColor: theme.colors.primary,
    },
    cardContent: {
        flex: 1,
        padding: theme.spacing.xxxl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontSize: theme.typography.size.xs,
        fontWeight: theme.typography.weight.semibold,
        letterSpacing: 2,
        color: theme.colors.textMuted,
        marginBottom: theme.spacing.xl,
    },
    labelBack: {
        fontSize: theme.typography.size.xs,
        fontWeight: theme.typography.weight.semibold,
        letterSpacing: 2,
        color: 'rgba(255,255,255,0.6)',
        marginBottom: theme.spacing.xl,
    },
    word: {
        fontSize: 32,
        fontWeight: '700',
        color: theme.colors.text,
        textAlign: 'center',
        textTransform: 'capitalize',
    },
    partOfSpeech: {
        fontSize: theme.typography.size.sm + 1, // 14
        color: theme.colors.primary,
        fontStyle: 'italic',
        marginTop: theme.spacing.sm,
    },
    tapHint: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: theme.spacing.xxxxl * 0.8, // roughly 40
        gap: theme.spacing.xs + 2, // 6
        opacity: 0.6,
    },
    tapHintText: {
        fontSize: 13,
        color: theme.colors.textMuted,
    },
    definition: {
        fontSize: theme.typography.size.lg + 1, // 18
        fontWeight: theme.typography.weight.medium,
        color: '#FFFFFF',
        textAlign: 'center',
        lineHeight: 26,
    },
    example: {
        fontSize: theme.typography.size.sm + 1, // 14
        color: 'rgba(255,255,255,0.7)',
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: theme.spacing.xxl,
        paddingHorizontal: theme.spacing.md,
    },
    actions: {
        flexDirection: 'row',
        gap: theme.spacing.md,
        marginTop: theme.spacing.xl,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.lg - 2, // 14
        borderRadius: theme.radius.md + 2, // 14
        gap: theme.spacing.sm,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
    },
    incorrectButton: {
        borderColor: theme.colors.error + '40',
    },
    correctButton: {
        borderColor: theme.colors.success + '40',
    },
    actionText: {
        fontSize: 14,
        fontWeight: '600',
    },
}))
