import React from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { ConfettiCelebration } from '@/components';

interface CompletionModalProps {
    visible: boolean;
    onComplete: () => void;
    onContinue: () => void;
}

export const CompletionModal: React.FC<CompletionModalProps> = ({
    visible,
    onComplete,
    onContinue,
}) => {
    const { theme } = useUnistyles();

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onContinue}>
            <ConfettiCelebration visible={visible} />
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <View style={styles.icon}>
                        <Ionicons name="trophy" size={48} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.title}>Congratulations! 🎉</Text>
                    <Text style={styles.message}>You've finished reading this story!</Text>
                    <Pressable style={styles.button} onPress={onComplete}>
                        <Text style={styles.buttonText}>Mark as Complete</Text>
                    </Pressable>
                    <Pressable style={styles.secondary} onPress={onContinue}>
                        <Text style={styles.secondaryText}>Continue Reading</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create((theme) => ({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    content: {
        width: '100%',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xxl,
        padding: 32,
        alignItems: 'center',
        ...theme.shadows.lg,
    },
    icon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: `${theme.colors.primary}15`,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: theme.typography.size.xxl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
        marginBottom: 8,
    },
    message: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
    },
    button: {
        width: '100%',
        backgroundColor: theme.colors.primary,
        paddingVertical: 16,
        borderRadius: theme.radius.full,
        alignItems: 'center',
        marginBottom: 12,
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
        color: theme.colors.textSecondary,
    },
}));
