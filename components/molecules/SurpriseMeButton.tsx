import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

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
                    <View style={styles.iconWrapper}>
                        <Ionicons name="shuffle" size={22} color={theme.colors.primary} />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.title}>{t('discover.surpriseMe')}</Text>
                        <Text style={styles.subtitle}>{t('discover.surpriseMeDesc', 'Let us pick a story for you')}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
                </View>
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        marginBottom: theme.spacing.sm,
    },
    button: {
        marginHorizontal: 20,
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
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
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: theme.colors.primary + '10', // 10% opacity primary
        alignItems: 'center',
        justifyContent: 'center',
    },
    textContainer: {
        flex: 1,
        gap: 2,
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
}));
