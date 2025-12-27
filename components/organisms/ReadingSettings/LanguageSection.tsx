import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import { haptics } from '@/utils/haptics';

interface LanguageSectionProps {
    currentLanguage: string;
    onLanguageChange: (lang: any) => void;
}

const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'tr', label: 'Türkçe' },
    { code: 'es', label: 'Español' },
    { code: 'de', label: 'Deutsch' },
    { code: 'fr', label: 'Français' },
];

export const LanguageSection: React.FC<LanguageSectionProps> = ({
    currentLanguage,
    onLanguageChange,
}) => {
    const { t } = useTranslation();

    return (
        <View style={styles.section}>
            <Text style={styles.label}>{t('settings.preferences.language')}</Text>
            <View style={styles.languageControls}>
                {LANGUAGES.map((lang) => (
                    <Pressable
                        key={lang.code}
                        style={[
                            styles.langButton,
                            currentLanguage === lang.code && styles.langButtonActive,
                        ]}
                        onPress={() => {
                            haptics.selection();
                            onLanguageChange(lang.code);
                        }}
                    >
                        <Text
                            style={[
                                styles.langButtonText,
                                currentLanguage === lang.code && styles.langButtonTextActive,
                            ]}
                        >
                            {lang.label}
                        </Text>
                    </Pressable>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    section: {
        marginBottom: theme.spacing.xl,
    },
    label: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },
    languageControls: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
    },
    langButton: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.backgroundSecondary,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    langButtonActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    langButtonText: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.text,
    },
    langButtonTextActive: {
        color: theme.colors.textInverse,
        fontWeight: theme.typography.weight.bold,
    },
}));
