import React from 'react';
// Force reload: 1

import { View, Text, StyleSheet as RNStyleSheet } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface StorySnippetProps {
    text: string;
}

export const StorySnippet: React.FC<StorySnippetProps> = ({ text }) => {
    const { theme } = useUnistyles();
    const { t } = useTranslation();

    return (
        <View style={styles.container}>
            <View style={styles.quoteIcon}>
                <Ionicons name="chatbubble" size={32} color={theme.colors.primary + '33'} />
            </View>
            <Text style={styles.text} numberOfLines={5}>
                {text}
            </Text>
            <View style={styles.footer}>
                <View style={styles.line} />
                <Text style={styles.label}>{t('common.story')}</Text>
                <View style={styles.line} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        padding: theme.spacing.xl,
        backgroundColor: theme.colors.surfaceElevated,
        borderRadius: theme.radius.xl,
        gap: theme.spacing.lg,
        alignItems: 'center',
        overflow: 'hidden',
    },
    quoteIcon: {
        marginBottom: -theme.spacing.lg,
    },
    text: {
        fontSize: theme.typography.size.lg,
        color: theme.colors.text,
        fontStyle: 'italic',
        textAlign: 'center',
        lineHeight: 28,
        fontFamily: 'CrimsonPro_600SemiBold_Italic', // Assuming it's loaded, fallback to default
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        width: '100%',
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: theme.colors.borderLight,
    },
    label: {
        fontSize: theme.typography.size.xs,
        color: theme.colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 2,
        fontWeight: theme.typography.weight.bold,
    },
}));
