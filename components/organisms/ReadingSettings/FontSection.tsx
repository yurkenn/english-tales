import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import { haptics } from '@/utils/haptics';

interface FontSectionProps {
    fontSize: number;
    fontFamily: 'sans-serif' | 'serif';
    onFontSizeChange: (size: number) => void;
    onFontFamilyChange: (family: 'sans-serif' | 'serif') => void;
}

const FONT_FAMILIES: { key: 'sans-serif' | 'serif'; label: string; preview: string }[] = [
    { key: 'sans-serif', label: 'Sans-Serif', preview: 'Abc' },
    { key: 'serif', label: 'Serif', preview: 'Abc' },
];

export const FontSection: React.FC<FontSectionProps> = ({
    fontSize,
    fontFamily,
    onFontSizeChange,
    onFontFamilyChange,
}) => {
    const { t } = useTranslation();
    const { theme } = useUnistyles();

    return (
        <>
            {/* Font Family */}
            <View style={styles.section}>
                <Text style={styles.label}>{t('reading.fontFamily', 'Font Style')}</Text>
                <View style={styles.fontFamilyControls}>
                    {FONT_FAMILIES.map((ff) => (
                        <Pressable
                            key={ff.key}
                            style={[
                                styles.ffButton,
                                fontFamily === ff.key && styles.ffButtonActive,
                            ]}
                            onPress={() => {
                                haptics.selection();
                                onFontFamilyChange(ff.key);
                            }}
                        >
                            <Text
                                style={[
                                    styles.ffPreview,
                                    { fontFamily: ff.key === 'serif' ? theme.typography.fontFamily.serif : theme.typography.fontFamily.body },
                                    fontFamily === ff.key && styles.ffTextActive,
                                ]}
                            >
                                {ff.preview}
                            </Text>
                            <Text
                                style={[
                                    styles.ffLabel,
                                    fontFamily === ff.key && styles.ffTextActive,
                                ]}
                            >
                                {ff.label}
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
    fontFamilyControls: {
        flexDirection: 'row',
        gap: theme.spacing.md,
    },
    ffButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.backgroundSecondary,
        gap: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    ffButtonActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    ffPreview: {
        fontSize: theme.typography.size.lg,
        color: theme.colors.text,
    },
    ffLabel: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.text,
        fontWeight: theme.typography.weight.medium,
    },
    ffTextActive: {
        color: theme.colors.textInverse,
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
}));
