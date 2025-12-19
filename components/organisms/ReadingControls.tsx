import React from 'react';
import { View, Text, Pressable, Share } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
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

export const ReadingControls: React.FC<ReadingControlsProps> = ({
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
            {/* Reading Settings Toggle (Font Size, etc) */}
            <Pressable style={styles.button} onPress={onThemeToggle}>
                <Ionicons
                    name={readingTheme === 'dark' ? 'sunny-outline' : 'moon'}
                    size={22}
                    color={theme.colors.text}
                />
            </Pressable>

            {/* Bookmark */}
            <Pressable style={styles.button} onPress={onBookmarkToggle}>
                <Ionicons
                    name={isInLibrary ? 'bookmark' : 'bookmark-outline'}
                    size={22}
                    color={isInLibrary ? theme.colors.primary : theme.colors.text}
                />
            </Pressable>

            {/* Share */}
            <Pressable style={styles.button} onPress={handleShare}>
                <Ionicons name="share-outline" size={22} color={theme.colors.text} />
            </Pressable>

            {/* Audio Assist (Flipped prominence) */}
            <Pressable
                style={[
                    styles.button,
                    styles.audioButton,
                    { backgroundColor: theme.colors.primary + '15' }
                ]}
                onPress={onAudioToggle}
            >
                <Ionicons name="volume-medium-outline" size={22} color={theme.colors.primary} />
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    controlRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around', // Changed for more spread
        paddingVertical: theme.spacing.xs,
    },
    button: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    audioButton: {
        borderRadius: theme.radius.md,
    },
}));
