import React from 'react';
import { View, Text, Pressable, Share } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { haptics } from '@/utils/haptics';
import type { ReadingTheme } from './types';

interface ReadingControlsProps {
    fontSize: number;
    readingTheme: ReadingTheme;
    isInLibrary: boolean;
    storyTitle: string;
    onFontDecrease: () => void;
    onFontIncrease: () => void;
    onThemeToggle: () => void;
    onBookmarkToggle: () => void;
}

export const ReadingControls: React.FC<ReadingControlsProps> = ({
    fontSize,
    readingTheme,
    isInLibrary,
    storyTitle,
    onFontDecrease,
    onFontIncrease,
    onThemeToggle,
    onBookmarkToggle,
}) => {
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
            {/* Font Size */}
            <View style={styles.fontControls}>
                <Pressable style={styles.button} onPress={onFontDecrease}>
                    <Text style={styles.fontButtonText}>A-</Text>
                </Pressable>
                <Text style={styles.fontSizeText}>{fontSize}pt</Text>
                <Pressable style={styles.button} onPress={onFontIncrease}>
                    <Text style={styles.fontButtonText}>A+</Text>
                </Pressable>
            </View>

            {/* Theme Toggle */}
            <Pressable style={styles.button} onPress={onThemeToggle}>
                <Ionicons
                    name={readingTheme === 'dark' ? 'sunny-outline' : 'moon-outline'}
                    size={20}
                    color={theme.colors.text}
                />
            </Pressable>

            {/* Bookmark */}
            <Pressable style={styles.button} onPress={onBookmarkToggle}>
                <Ionicons
                    name={isInLibrary ? 'bookmark' : 'bookmark-outline'}
                    size={20}
                    color={isInLibrary ? theme.colors.primary : theme.colors.text}
                />
            </Pressable>

            {/* Share */}
            <Pressable style={styles.button} onPress={handleShare}>
                <Ionicons name="share-outline" size={20} color={theme.colors.text} />
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    controlRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    fontControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
    },
    button: {
        width: 40,
        height: 40,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.backgroundSecondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fontButtonText: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    fontSizeText: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textSecondary,
    },
}));
