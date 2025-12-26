import React from 'react';
import { View, Text, Pressable, Share } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { haptics } from '@/utils/haptics';
import type { ReadingTheme } from './readingTypes';

interface ReadingControlsProps {
    fontSize: number;
    readingTheme: ReadingTheme;
    isInLibrary: boolean;
    storyTitle: string;
    onFontDecrease: () => void;
    onFontIncrease: () => void;
    onThemeToggle: () => void;
    onBookmarkToggle: () => void;
    onAudioToggle: () => void;
}

export const ReadingControls: React.FC<ReadingControlsProps> = React.memo(({
    fontSize,
    readingTheme,
    isInLibrary,
    storyTitle,
    onFontDecrease,
    onFontIncrease,
    onThemeToggle,
    onBookmarkToggle,
    onAudioToggle,
}) => {
    const { t } = useTranslation();
    const { theme } = useUnistyles();

    const handleShare = async () => {
        haptics.light();
        try {
            await Share.share({
                message: `Check out "${storyTitle}" on English Tales!`,
            });
        } catch (e) { }
    };

    return (
        <View style={styles.controlRow}>
            {/* Reading Settings Toggle */}
            <Pressable
                style={({ pressed }) => [
                    styles.controlItem,
                    pressed && styles.pressed
                ]}
                android_ripple={{ color: theme.colors.primary + '20', borderless: true, radius: 40 }}
                onPress={() => {
                    haptics.selection();
                    onThemeToggle();
                }}
            >
                <View style={styles.button}>
                    <Ionicons
                        name={readingTheme === 'dark' ? 'sunny-outline' : 'moon'}
                        size={22}
                        color={theme.colors.text}
                    />
                </View>
                <Text style={styles.label}>{t('reading.controls.appearance')}</Text>
            </Pressable>

            {/* Bookmark */}
            <Pressable
                style={({ pressed }) => [
                    styles.controlItem,
                    pressed && styles.pressed
                ]}
                android_ripple={{ color: theme.colors.primary + '20', borderless: true, radius: 40 }}
                onPress={() => {
                    haptics.success();
                    onBookmarkToggle();
                }}
            >
                <View style={styles.button}>
                    <Ionicons
                        name={isInLibrary ? 'bookmark' : 'bookmark-outline'}
                        size={22}
                        color={isInLibrary ? theme.colors.primary : theme.colors.text}
                    />
                </View>
                <Text style={styles.label}>
                    {isInLibrary ? t('reading.controls.saved') : t('reading.controls.save')}
                </Text>
            </Pressable>

            {/* Share */}
            <Pressable
                style={({ pressed }) => [
                    styles.controlItem,
                    pressed && styles.pressed
                ]}
                android_ripple={{ color: theme.colors.primary + '20', borderless: true, radius: 40 }}
                onPress={handleShare}
            >
                <View style={styles.button}>
                    <Ionicons name="share-outline" size={22} color={theme.colors.text} />
                </View>
                <Text style={styles.label}>{t('reading.controls.share')}</Text>
            </Pressable>

            {/* Audio Assist */}
            <Pressable
                style={({ pressed }) => [
                    styles.controlItem,
                    pressed && styles.pressed
                ]}
                android_ripple={{ color: theme.colors.primary + '20', borderless: true, radius: 40 }}
                onPress={() => {
                    haptics.light();
                    onAudioToggle();
                }}
            >
                <View
                    style={[
                        styles.button,
                        styles.audioButton,
                        { backgroundColor: theme.colors.primary + '15' }
                    ]}
                >
                    <Ionicons name="volume-medium-outline" size={22} color={theme.colors.primary} />
                </View>
                <Text style={[styles.label, { color: theme.colors.primary }]}>
                    {t('reading.controls.listen')}
                </Text>
            </Pressable>
        </View>
    );
});

const styles = StyleSheet.create((theme) => ({
    controlRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-around',
        paddingVertical: theme.spacing.sm,
    },
    controlItem: {
        alignItems: 'center',
        gap: 4,
        minWidth: 64,
    },
    button: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    audioButton: {
        borderRadius: theme.radius.md,
    },
    pressed: {
        opacity: 0.6,
        transform: [{ scale: 0.95 }],
    },
    label: {
        fontSize: 10,
        fontFamily: theme.typography.fontFamily.semiBold,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        opacity: 0.8,
    },
}));
