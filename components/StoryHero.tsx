import React from 'react';
import { View, Text, ImageBackground, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface StoryHeroProps {
    coverImage: string;
    onBackPress: () => void;
    onBookmarkPress: () => void;
    isBookmarked: boolean;
    topInset: number;
}

export const StoryHero: React.FC<StoryHeroProps> = ({
    coverImage,
    onBackPress,
    onBookmarkPress,
    isBookmarked,
    topInset,
}) => {
    const { theme } = useUnistyles();

    return (
        <ImageBackground source={{ uri: coverImage }} style={styles.container} resizeMode="cover">
            <LinearGradient
                colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.8)']}
                style={styles.gradient}
            />
            <Pressable style={[styles.backButton, { top: topInset + 8 }]} onPress={onBackPress}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </Pressable>
            <Pressable style={[styles.bookmarkButton, { top: topInset + 8 }]} onPress={onBookmarkPress}>
                <Ionicons
                    name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                    size={24}
                    color={isBookmarked ? theme.colors.primary : theme.colors.textInverse}
                />
            </Pressable>
        </ImageBackground>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        height: 350,
        width: '100%',
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
    },
    backButton: {
        position: 'absolute',
        left: theme.spacing.lg,
        width: 40,
        height: 40,
        borderRadius: theme.radius.full,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bookmarkButton: {
        position: 'absolute',
        right: theme.spacing.lg,
        width: 40,
        height: 40,
        borderRadius: theme.radius.full,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
}));
