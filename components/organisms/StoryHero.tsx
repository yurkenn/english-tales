import React from 'react';
import { View, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { OptimizedImage, BookCover } from '../atoms';

interface StoryHeroProps {
    coverImage: string;
    coverImageLqip?: string;
    onBackPress: () => void;
    onBookmarkPress: () => void;
    isBookmarked: boolean;
    onFavoritePress: () => void;
    isFavorited: boolean;
    topInset: number;
    onSharePress?: () => void;
}

export const StoryHero: React.FC<StoryHeroProps & { storyId: string }> = ({
    storyId,
    coverImage,
    coverImageLqip,
    onBackPress,
    onBookmarkPress,
    isBookmarked,
    onFavoritePress,
    isFavorited,
    topInset,
    onSharePress,
}) => {
    const { theme } = useUnistyles();

    return (
        <View style={styles.container}>
            <OptimizedImage
                source={{ uri: coverImage }}
                placeholder={coverImageLqip}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                sharedTransitionTag={`story-image-${storyId}`}
            />
            <LinearGradient
                colors={['rgba(0,0,0,0.1)', 'transparent', 'rgba(0,0,0,0.8)']}
                style={styles.gradient}
            />

            {/* Subtle Spine Decoration Overlay */}
            <View style={styles.spineSpine} />
            <LinearGradient
                colors={['rgba(0,0,0,0.3)', 'transparent']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 0.05, y: 0.5 }}
                style={StyleSheet.absoluteFill}
            />

            <Pressable style={[styles.backButton, { top: topInset + 8 }]} onPress={onBackPress}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </Pressable>

            <View style={[styles.rightButtons, { top: topInset + 8 }]}>
                {/* ... (buttons remain the same) */}
                <Pressable style={styles.actionButton} onPress={onFavoritePress}>
                    <Ionicons
                        name={isFavorited ? 'heart' : 'heart-outline'}
                        size={24}
                        color={isFavorited ? theme.colors.error : '#FFFFFF'}
                    />
                </Pressable>

                <Pressable style={styles.actionButton} onPress={onBookmarkPress}>
                    <Ionicons
                        name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                        size={24}
                        color={isBookmarked ? theme.colors.primary : '#FFFFFF'}
                    />
                </Pressable>

                {onSharePress && (
                    <Pressable style={styles.actionButton} onPress={onSharePress}>
                        <Ionicons name="share-social-outline" size={24} color="#FFFFFF" />
                    </Pressable>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        height: 420, // Taller immersive hero
        width: '100%',
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
    },
    spineSpine: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 1.5,
        backgroundColor: 'rgba(255,255,255,0.2)',
        zIndex: 1,
    },
    backButton: {
        position: 'absolute',
        left: theme.spacing.lg,
        width: 40,
        height: 40,
        borderRadius: theme.radius.full,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    rightButtons: {
        position: 'absolute',
        right: theme.spacing.lg,
        flexDirection: 'row',
        gap: theme.spacing.sm,
        zIndex: 10,
    },
    actionButton: {
        width: 40,
        height: 40,
        borderRadius: theme.radius.full,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
}));
