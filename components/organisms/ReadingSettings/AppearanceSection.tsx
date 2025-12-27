import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import { haptics } from '@/utils/haptics';
import { READING_THEMES, type ReadingTheme } from '../readingTypes';

interface AppearanceSectionProps {
    lineHeight: number;
    readingTheme: ReadingTheme;
    onLineHeightChange: (height: number) => void;
    onThemeChange: (theme: ReadingTheme) => void;
}

export const AppearanceSection: React.FC<AppearanceSectionProps> = ({
    lineHeight,
    readingTheme,
    onLineHeightChange,
    onThemeChange,
}) => {
    const { t } = useTranslation();

    return (
        <>
            {/* Line Height */}
            <View style={styles.section}>
                <Text style={styles.label}>{t('reading.lineSpacing', 'Line Spacing')}</Text>
                <View style={styles.lineControls}>
                    {[1.4, 1.6, 1.8, 2.0].map((lh) => (
                        <Pressable
                            key={lh}
                            style={[styles.lineButton, lineHeight === lh && styles.lineButtonActive]}
                            onPress={() => { haptics.selection(); onLineHeightChange(lh); }}
                        >
                            <Text style={[styles.lineButtonText, lineHeight === lh && styles.lineButtonTextActive]}>
                                {lh}x
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            {/* Theme */}
            <View style={styles.section}>
                <Text style={styles.label}>{t('settings.preferences.theme')}</Text>
                <View style={styles.themeControls}>
                    {(['light', 'dark', 'sepia'] as ReadingTheme[]).map((tValue) => (
                        <Pressable
                            key={tValue}
                            style={[
                                styles.themeButton,
                                { backgroundColor: READING_THEMES[tValue].bg },
                                readingTheme === tValue && styles.themeButtonActive,
                            ]}
                            onPress={() => { haptics.selection(); onThemeChange(tValue); }}
                        >
                            <Text style={[styles.themeButtonText, { color: READING_THEMES[tValue].text }]}>
                                {tValue.charAt(0).toUpperCase() + tValue.slice(1)}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>
        </>
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
    lineControls: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    lineButton: {
        flex: 1,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.backgroundSecondary,
        alignItems: 'center',
    },
    lineButtonActive: {
        backgroundColor: theme.colors.primary,
    },
    lineButtonText: {
        fontSize: theme.typography.size.md,
        color: theme.colors.text,
    },
    lineButtonTextActive: {
        color: theme.colors.textInverse,
        fontWeight: theme.typography.weight.bold,
    },
    themeControls: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    themeButton: {
        flex: 1,
        paddingVertical: theme.spacing.lg,
        borderRadius: theme.radius.lg,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    themeButtonActive: {
        borderColor: theme.colors.primary,
    },
    themeButtonText: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.medium,
    },
}));
