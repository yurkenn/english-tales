import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface SurpriseMeButtonProps {
    onPress: () => void;
}

export const SurpriseMeButton: React.FC<SurpriseMeButtonProps> = ({ onPress }) => {
    const { theme } = useUnistyles();

    return (
        <View style={styles.container}>
            <Pressable
                style={({ pressed }) => [
                    styles.button,
                    pressed && styles.buttonPressed,
                ]}
                onPress={onPress}
            >
                <LinearGradient
                    colors={[theme.colors.primary, '#8B5CF6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradient}
                >
                    <Ionicons name="shuffle" size={22} color="#FFFFFF" />
                    <Text style={styles.text}>Surprise Me!</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </LinearGradient>
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        gap: theme.spacing.md,
    },
    button: {
        marginHorizontal: theme.spacing.lg,
        borderRadius: theme.radius.xl,
        overflow: 'hidden',
        ...theme.shadows.md,
    },
    buttonPressed: {
        opacity: 0.9,
        transform: [{ scale: 0.99 }],
    },
    gradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.xl,
        gap: theme.spacing.sm,
    },
    text: {
        fontSize: theme.typography.size.lg,
        fontWeight: theme.typography.weight.bold,
        color: '#FFFFFF',
    },
}));
