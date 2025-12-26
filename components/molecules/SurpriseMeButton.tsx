import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

interface SurpriseMeButtonProps {
    onPress: () => void;
}

export const SurpriseMeButton: React.FC<SurpriseMeButtonProps> = ({ onPress }) => {
    const { t } = useTranslation();
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
                <View style={styles.content}>
                    <LinearGradient
                        colors={[theme.colors.primary, '#FF6B6B']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.iconWrapper}
                    >
                        <Ionicons name="dice" size={26} color="#FFF" />
                    </LinearGradient>
                    <View style={styles.textContainer}>
                        <Text style={styles.title}>{t('discover.surpriseMe')}</Text>
                        <Text style={styles.subtitle}>{t('discover.surpriseMeDesc', 'Let us pick a story for you')}</Text>
                    </View>
                    <View style={styles.arrowWrapper}>
                        <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
                    </View>
                </View>
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        paddingHorizontal: theme.spacing.xl,
    },
    button: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.sm,
    },
    buttonPressed: {
        backgroundColor: theme.colors.background,
        opacity: 0.9,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.lg,
        gap: theme.spacing.md,
    },
    iconWrapper: {
        width: 52,
        height: 52,
        borderRadius: theme.radius.md + 4, // 16
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.md,
    },
    textContainer: {
        flex: 1,
        gap: theme.spacing.xxs,
    },
    title: {
        fontSize: theme.typography.size.md,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    subtitle: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textSecondary,
    },
    arrowWrapper: {
        width: 32,
        height: 32,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
}));
