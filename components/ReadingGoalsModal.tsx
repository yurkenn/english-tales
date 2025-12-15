import React from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { haptics } from '@/utils/haptics';

interface ReadingGoalsModalProps {
    visible: boolean;
    onClose: () => void;
    currentGoal: number;
    onSelectGoal: (minutes: number) => void;
}

const GOAL_OPTIONS = [5, 10, 15, 20, 30];

export const ReadingGoalsModal: React.FC<ReadingGoalsModalProps> = ({
    visible,
    onClose,
    currentGoal,
    onSelectGoal,
}) => {
    const { theme } = useUnistyles();

    const handleSelect = (minutes: number) => {
        haptics.selection();
        onSelectGoal(minutes);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Daily Reading Goal</Text>
                        <Pressable onPress={onClose}>
                            <Ionicons name="close" size={24} color={theme.colors.text} />
                        </Pressable>
                    </View>

                    <Text style={styles.subtitle}>
                        How many minutes do you want to read each day?
                    </Text>

                    <View style={styles.grid}>
                        {GOAL_OPTIONS.map((minutes) => (
                            <Pressable
                                key={minutes}
                                style={[
                                    styles.option,
                                    currentGoal === minutes && styles.optionSelected,
                                ]}
                                onPress={() => handleSelect(minutes)}
                            >
                                <Text
                                    style={[
                                        styles.minutes,
                                        currentGoal === minutes && styles.textSelected,
                                    ]}
                                >
                                    {minutes}
                                </Text>
                                <Text
                                    style={[
                                        styles.label,
                                        currentGoal === minutes && styles.textSelected,
                                    ]}
                                >
                                    min
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create((theme) => ({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    content: {
        backgroundColor: theme.colors.surface,
        borderTopLeftRadius: theme.radius.xxl,
        borderTopRightRadius: theme.radius.xxl,
        padding: theme.spacing.xl,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
    },
    title: {
        fontSize: theme.typography.size.xxl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    subtitle: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xl,
        textAlign: 'center',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: theme.spacing.md,
    },
    option: {
        width: 70,
        height: 70,
        borderRadius: theme.radius.xl,
        backgroundColor: theme.colors.backgroundSecondary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    optionSelected: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    minutes: {
        fontSize: theme.typography.size.xxl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    label: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textSecondary,
    },
    textSelected: {
        color: theme.colors.textInverse,
    },
}));
