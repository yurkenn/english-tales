import React, { useState } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { ConfettiCelebration } from './ConfettiCelebration';
import { haptics } from '@/utils/haptics';

interface CompletionModalProps {
    visible: boolean;
    storyTitle: string;
    readingTimeMinutes: number;
    wordCount: number;
    onComplete: (rating?: number) => void;
    onContinue: () => void;
}

export const CompletionModal: React.FC<CompletionModalProps> = ({
    visible,
    storyTitle,
    readingTimeMinutes,
    wordCount,
    onComplete,
    onContinue,
}) => {
    const { theme } = useUnistyles();
    const [rating, setRating] = useState(0);

    const handleRatingPress = (value: number) => {
        haptics.selection();
        setRating(value);
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onContinue}>
            <ConfettiCelebration visible={visible} />
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="trophy" size={40} color={theme.colors.primary} />
                        </View>
                        <Text style={styles.congratsText}>Way to go!</Text>
                        <Text style={styles.title}>Story Completed</Text>
                    </View>

                    <Text style={styles.storyTitle}>{storyTitle}</Text>

                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{readingTimeMinutes}</Text>
                            <Text style={styles.statLabel}>min read</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{wordCount}</Text>
                            <Text style={styles.statLabel}>words</Text>
                        </View>
                    </View>

                    <View style={styles.ratingSection}>
                        <Text style={styles.ratingLabel}>Support the author with a rating</Text>
                        <View style={styles.stars}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Pressable key={star} onPress={() => handleRatingPress(star)}>
                                    <Ionicons
                                        name={star <= rating ? 'star' : 'star-outline'}
                                        size={32}
                                        color={star <= rating ? theme.colors.warning : theme.colors.textMuted}
                                    />
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    <Pressable style={styles.button} onPress={() => onComplete(rating > 0 ? rating : undefined)}>
                        <Text style={styles.buttonText}>Finish & Share</Text>
                    </Pressable>

                    <Pressable style={styles.secondary} onPress={onContinue}>
                        <Text style={styles.secondaryText}>Back to Library</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create((theme) => ({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    content: {
        width: '100%',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xxl,
        padding: 32,
        alignItems: 'center',
        ...theme.shadows.lg,
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
    },
    iconContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: `${theme.colors.primary}15`,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    congratsText: {
        fontSize: theme.typography.size.lg,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    title: {
        fontSize: theme.typography.size.xxl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
        marginTop: 4,
    },
    storyTitle: {
        fontSize: theme.typography.size.lg,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        fontStyle: 'italic',
        marginBottom: 24,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.backgroundSecondary,
        borderRadius: theme.radius.xl,
        paddingVertical: 16,
        paddingHorizontal: 24,
        marginBottom: 32,
        width: '100%',
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: theme.typography.size.xl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    statLabel: {
        fontSize: theme.typography.size.xs,
        color: theme.colors.textMuted,
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: theme.colors.borderLight,
    },
    ratingSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    ratingLabel: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textSecondary,
        marginBottom: 12,
    },
    stars: {
        flexDirection: 'row',
        gap: 8,
    },
    button: {
        width: '100%',
        backgroundColor: theme.colors.primary,
        paddingVertical: 16,
        borderRadius: theme.radius.full,
        alignItems: 'center',
        marginBottom: 12,
        ...theme.shadows.md,
    },
    buttonText: {
        fontSize: theme.typography.size.lg,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.textInverse,
    },
    secondary: {
        padding: 12,
    },
    secondaryText: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textMuted,
    },
}));
