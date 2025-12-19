import React from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/store/settingsStore';
import { haptics } from '@/utils/haptics';
import { READING_THEMES, type ReadingTheme } from './types';

interface ReadingSettingsModalProps {
    visible: boolean;
    fontSize: number;
    lineHeight: number;
    readingTheme: ReadingTheme;
    onClose: () => void;
    onFontSizeChange: (size: number) => void;
    onLineHeightChange: (height: number) => void;
    onThemeChange: (theme: ReadingTheme) => void;
}

export const ReadingSettingsModal: React.FC<ReadingSettingsModalProps> = ({
    visible,
    fontSize,
    lineHeight,
    readingTheme,
    onClose,
    onFontSizeChange,
    onLineHeightChange,
    onThemeChange,
}) => {
    const { t } = useTranslation();
    const { theme } = useUnistyles();
    const { settings, actions: settingsActions } = useSettingsStore();

    const LANGUAGES = [
        { code: 'en', label: 'English' },
        { code: 'tr', label: 'Türkçe' },
        { code: 'es', label: 'Español' },
        { code: 'de', label: 'Deutsch' },
        { code: 'fr', label: 'Français' },
    ];

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{t('settings.sections.preferences')}</Text>
                        <Pressable onPress={onClose}>
                            <Ionicons name="close" size={24} color={theme.colors.text} />
                        </Pressable>
                    </View>

                    {/* Language Selection */}
                    <View style={styles.section}>
                        <Text style={styles.label}>{t('settings.preferences.language')}</Text>
                        <View style={styles.languageControls}>
                            {LANGUAGES.map((lang) => (
                                <Pressable
                                    key={lang.code}
                                    style={[
                                        styles.langButton,
                                        settings.language === lang.code && styles.langButtonActive,
                                    ]}
                                    onPress={() => {
                                        haptics.selection();
                                        settingsActions.updateSettings({ language: lang.code as any });
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.langButtonText,
                                            settings.language === lang.code && styles.langButtonTextActive,
                                        ]}
                                    >
                                        {lang.label}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    {/* Font Size */}
                    <View style={styles.section}>
                        <Text style={styles.label}>{t('settings.preferences.fontSize')}</Text>
                        <View style={styles.fontControls}>
                            <Pressable
                                style={styles.fontButton}
                                onPress={() => { haptics.light(); onFontSizeChange(Math.max(14, fontSize - 2)); }}
                            >
                                <Text style={styles.fontButtonText}>A-</Text>
                            </Pressable>
                            <Text style={styles.fontValue}>{fontSize}pt</Text>
                            <Pressable
                                style={styles.fontButton}
                                onPress={() => { haptics.light(); onFontSizeChange(Math.min(28, fontSize + 2)); }}
                            >
                                <Text style={styles.fontButtonText}>A+</Text>
                            </Pressable>
                        </View>
                    </View>

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
        paddingBottom: theme.spacing.xxxl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
    },
    title: {
        fontSize: theme.typography.size.xl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    section: {
        marginBottom: theme.spacing.xl,
    },
    label: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },
    fontControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.xl,
    },
    fontButton: {
        width: 48,
        height: 48,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.backgroundSecondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fontButtonText: {
        fontSize: theme.typography.size.lg,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    fontValue: {
        fontSize: theme.typography.size.xl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.primary,
        minWidth: 60,
        textAlign: 'center',
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
