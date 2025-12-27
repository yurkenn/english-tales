import React from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/store/settingsStore';
import { type ReadingTheme } from './readingTypes';
import { LanguageSection } from './ReadingSettings/LanguageSection';
import { FontSection } from './ReadingSettings/FontSection';
import { AppearanceSection } from './ReadingSettings/AppearanceSection';

interface ReadingSettingsModalProps {
    visible: boolean;
    fontSize: number;
    lineHeight: number;
    fontFamily: 'sans-serif' | 'serif';
    readingTheme: ReadingTheme;
    onClose: () => void;
    onFontSizeChange: (size: number) => void;
    onLineHeightChange: (height: number) => void;
    onFontFamilyChange: (family: 'sans-serif' | 'serif') => void;
    onThemeChange: (theme: ReadingTheme) => void;
}

export const ReadingSettingsModal: React.FC<ReadingSettingsModalProps> = ({
    visible,
    fontSize,
    lineHeight,
    fontFamily,
    readingTheme,
    onClose,
    onFontSizeChange,
    onLineHeightChange,
    onFontFamilyChange,
    onThemeChange,
}) => {
    const { t } = useTranslation();
    const { theme } = useUnistyles();
    const { settings, actions: settingsActions } = useSettingsStore();

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
                    <LanguageSection
                        currentLanguage={settings.language}
                        onLanguageChange={(lang) => settingsActions.updateSettings({ language: lang })}
                    />

                    {/* Font Family & Size */}
                    <FontSection
                        fontSize={fontSize}
                        fontFamily={fontFamily}
                        onFontSizeChange={onFontSizeChange}
                        onFontFamilyChange={onFontFamilyChange}
                    />

                    {/* Line Height & Theme */}
                    <AppearanceSection
                        lineHeight={lineHeight}
                        readingTheme={readingTheme}
                        onLineHeightChange={onLineHeightChange}
                        onThemeChange={onThemeChange}
                    />
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
        paddingBottom: theme.spacing.xxxxl,
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
}));

