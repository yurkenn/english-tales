import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { haptics } from '@/utils/haptics';
import { useTranslation } from 'react-i18next';

interface CheckpointProps {
    question: string;
    options: string[];
    correctIndex: number;
    textColor: string;
    onComplete: () => void;
}

export const CheckpointItem: React.FC<CheckpointProps> = ({
    question,
    options,
    correctIndex,
    textColor,
    onComplete,
}) => {
    const { t } = useTranslation();
    const { theme } = useUnistyles();
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);

    const handleOptionPress = (index: number) => {
        if (isAnswered) return;
        haptics.selection();
        setSelectedOption(index);
        setIsAnswered(true);

        if (index === correctIndex) {
            haptics.success();
            setTimeout(onComplete, 1500);
        } else {
            haptics.error();
        }
    };

    const isLightText = textColor === '#1B0E0E' || textColor === '#5C4B37';

    return (
        <Animated.View entering={FadeInDown} exiting={FadeOutUp} style={[
            styles.container,
            { borderColor: isLightText ? `${theme.colors.primary}40` : `${theme.colors.primary}60` }
        ]}>
            <View style={[styles.accentBar, { backgroundColor: theme.colors.primary }]} />

            <View style={styles.content}>
                <View style={styles.header}>
                    <Ionicons name="bulb" size={18} color={theme.colors.primary} />
                    <Text style={[styles.title, { color: theme.colors.primary }]}>
                        {t('reading.quiz.checkpoint')}
                    </Text>
                </View>

                <Text style={[styles.question, { color: textColor }]}>{question}</Text>

                <View style={styles.options}>
                    {options.map((option, index) => {
                        const isSelected = selectedOption === index;
                        const isCorrect = index === correctIndex;

                        let border = 'transparent';
                        let bg = isLightText ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)';

                        if (isAnswered) {
                            if (isCorrect) {
                                bg = `${theme.colors.success}15`;
                                border = theme.colors.success;
                            } else if (isSelected) {
                                bg = `${theme.colors.error}15`;
                                border = theme.colors.error;
                            }
                        } else if (isSelected) {
                            border = theme.colors.primary;
                        }

                        return (
                            <Pressable
                                key={index}
                                style={[styles.option, { backgroundColor: bg, borderColor: border }]}
                                onPress={() => handleOptionPress(index)}
                                disabled={isAnswered}
                            >
                                <Text style={[
                                    styles.optionText,
                                    { color: textColor },
                                    isAnswered && isCorrect && { color: theme.colors.success, fontWeight: '700' },
                                    isAnswered && isSelected && !isCorrect && { color: theme.colors.error }
                                ]}>
                                    {option}
                                </Text>
                                {isAnswered && isCorrect && (
                                    <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />
                                )}
                            </Pressable>
                        );
                    })}
                </View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        flexDirection: 'row',
        marginVertical: theme.spacing.xl,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        backgroundColor: 'rgba(0,0,0,0.01)',
    },
    accentBar: {
        width: 4,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    title: {
        fontSize: theme.typography.size.sm,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    question: {
        fontSize: theme.typography.size.lg,
        fontWeight: '600',
        lineHeight: 24,
        marginBottom: 16,
    },
    options: {
        gap: 8,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
    },
    optionText: {
        fontSize: theme.typography.size.md,
        flex: 1,
        marginRight: 8,
    },
}));
