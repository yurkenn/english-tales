import React, { useState } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { haptics } from '@/utils/haptics';
import { useTranslation } from 'react-i18next';

export interface QuizQuestion {
    question: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
}

interface QuizModalProps {
    visible: boolean;
    questions: QuizQuestion[];
    onClose: (accuracy: number) => void;
}

export const QuizModal: React.FC<QuizModalProps> = ({ visible, questions, onClose }) => {
    const { t } = useTranslation();
    const { theme } = useUnistyles();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [score, setScore] = useState(0);

    const handleOptionPress = (index: number) => {
        if (isAnswered) return;
        haptics.selection();
        setSelectedOption(index);
    };

    const handleCheckAnswer = () => {
        if (selectedOption === null || isAnswered) return;

        const isCorrect = selectedOption === questions[currentIndex].correctIndex;
        if (isCorrect) {
            haptics.success();
            setScore(s => s + 1);
        } else {
            haptics.error();
        }
        setIsAnswered(true);
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            haptics.light();
            setCurrentIndex(c => c + 1);
            setSelectedOption(null);
            setIsAnswered(false);
        } else {
            const accuracy = Math.round((score / questions.length) * 100);
            onClose(accuracy);
        }
    };

    if (!questions || questions.length === 0) return null;

    const currentQuestion = questions[currentIndex];
    const progress = (currentIndex + 1) / questions.length;

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <Animated.View
                    entering={FadeIn.duration(300)}
                    exiting={FadeOut.duration(200)}
                    style={styles.content}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerTop}>
                            <Text style={styles.quizTitle}>{t('reading.quiz.title')}</Text>
                            <Text style={styles.progressText}>
                                {currentIndex + 1} / {questions.length}
                            </Text>
                        </View>
                        <View style={styles.progressBarBg}>
                            <Animated.View
                                style={[styles.progressBarFill, { width: `${progress * 100}%` }]}
                            />
                        </View>
                    </View>

                    {/* Question */}
                    <View style={styles.questionContainer}>
                        <Text style={styles.questionText}>{currentQuestion.question}</Text>
                    </View>

                    {/* Options */}
                    <View style={styles.optionsContainer}>
                        {currentQuestion.options.map((option, index) => {
                            const isSelected = selectedOption === index;
                            const isCorrect = index === currentQuestion.correctIndex;
                            const showResult = isAnswered && (isSelected || isCorrect);

                            let optionStyle: any[] = [styles.option];
                            if (isSelected) optionStyle.push(styles.optionSelected);
                            if (isAnswered) {
                                if (isCorrect) optionStyle.push(styles.optionCorrect);
                                else if (isSelected) optionStyle.push(styles.optionWrong);
                            }

                            return (
                                <Pressable
                                    key={index}
                                    style={optionStyle}
                                    onPress={() => handleOptionPress(index)}
                                    disabled={isAnswered}
                                >
                                    <Text style={[
                                        styles.optionText,
                                        isSelected && styles.optionTextSelected,
                                        isAnswered && isCorrect && styles.optionTextCorrect,
                                        isAnswered && isSelected && !isCorrect && styles.optionTextWrong
                                    ]}>
                                        {option}
                                    </Text>
                                    {isAnswered && isCorrect && (
                                        <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                                    )}
                                    {isAnswered && isSelected && !isCorrect && (
                                        <Ionicons name="close-circle" size={20} color={theme.colors.error} />
                                    )}
                                </Pressable>
                            );
                        })}
                    </View>

                    {/* Explanation */}
                    {isAnswered && currentQuestion.explanation && (
                        <Animated.View entering={FadeIn} style={styles.explanationContainer}>
                            <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
                        </Animated.View>
                    )}

                    {/* Footer Actions */}
                    <View style={styles.footer}>
                        {!isAnswered ? (
                            <Pressable
                                style={[styles.button, selectedOption === null && styles.buttonDisabled]}
                                onPress={handleCheckAnswer}
                                disabled={selectedOption === null}
                            >
                                <Text style={styles.buttonText}>{t('common.check')}</Text>
                            </Pressable>
                        ) : (
                            <Pressable style={styles.button} onPress={handleNext}>
                                <Text style={styles.buttonText}>
                                    {currentIndex === questions.length - 1 ? t('reading.quiz.finish') : t('reading.quiz.next')}
                                </Text>
                            </Pressable>
                        )}
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create((theme) => ({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xl,
    },
    content: {
        width: '100%',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xxl,
        padding: theme.spacing.xxl,
        maxHeight: '80%',
        ...theme.shadows.lg,
    },
    header: {
        marginBottom: theme.spacing.xxl,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    quizTitle: {
        fontSize: theme.typography.size.lg,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    progressText: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textSecondary,
    },
    progressBarBg: {
        height: 6,
        backgroundColor: `${theme.colors.primary}15`,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: theme.colors.primary,
    },
    questionContainer: {
        marginBottom: theme.spacing.xxl,
    },
    questionText: {
        fontSize: theme.typography.size.xl,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.text,
        lineHeight: 28,
    },
    optionsContainer: {
        gap: theme.spacing.md,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.lg,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
    },
    optionSelected: {
        borderColor: theme.colors.primary,
        backgroundColor: `${theme.colors.primary}05`,
    },
    optionCorrect: {
        borderColor: theme.colors.success,
        backgroundColor: `${theme.colors.success}10`,
    },
    optionWrong: {
        borderColor: theme.colors.error,
        backgroundColor: `${theme.colors.error}10`,
    },
    optionText: {
        fontSize: theme.typography.size.md,
        color: theme.colors.text,
        flex: 1,
        marginRight: theme.spacing.sm,
    },
    optionTextSelected: {
        color: theme.colors.primary,
        fontWeight: theme.typography.weight.semibold,
    },
    optionTextCorrect: {
        color: theme.colors.success,
        fontWeight: theme.typography.weight.semibold,
    },
    optionTextWrong: {
        color: theme.colors.error,
        fontWeight: theme.typography.weight.semibold,
    },
    explanationContainer: {
        marginTop: theme.spacing.lg,
        padding: theme.spacing.md,
        backgroundColor: `${theme.colors.textSecondary}10`,
        borderRadius: theme.radius.md,
    },
    explanationText: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textSecondary,
        fontStyle: 'italic',
    },
    footer: {
        marginTop: theme.spacing.xxxl,
    },
    button: {
        backgroundColor: theme.colors.primary,
        paddingVertical: theme.spacing.lg,
        borderRadius: theme.radius.lg,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        color: theme.colors.textInverse,
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.bold,
    },
}));
