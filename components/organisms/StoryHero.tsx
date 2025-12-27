import React from 'react';
// Force reload: 2

import { View, Pressable, StyleSheet as RNStyleSheet } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { OptimizedImage } from '../atoms';

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
            {/* Immersive Blurred Backdrop */}
            <View style={RNStyleSheet.absoluteFill}>
                <OptimizedImage
                    source={{ uri: coverImage || '' }}
                    placeholder={coverImageLqip}
                    style={RNStyleSheet.absoluteFill}
                    contentFit="cover"
                />
                <BlurView intensity={60} style={RNStyleSheet.absoluteFill} tint={theme.mode === 'dark' ? 'dark' : 'light'} />
                <LinearGradient
                    colors={['rgba(0,0,0,0.3)', 'transparent', theme.colors.background]}
                    style={styles.gradient}
                />
            </View>

            {/* Main Book Cover */}
            <View style={styles.coverWrapper}>
                <OptimizedImage
                    source={{ uri: coverImage || '' }}
                    placeholder={coverImageLqip}
                    style={styles.bookImage}
                    contentFit="cover"
                    sharedTransitionTag={`story-image-${storyId}`}
                />
                {/* Subtle Spine Decoration Overlay */}
                <View style={styles.spineShadow} />
                <LinearGradient
                    colors={['rgba(0,0,0,0.2)', 'transparent']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 0.05, y: 0.5 }}
                    style={styles.bookImage}
                />
            </View>

            <Pressable style={[styles.backButton, { top: topInset + 8 }]} onPress={onBackPress}>
                <Ionicons name="arrow-back" size={24} color={theme.mode === 'dark' ? '#FFFFFF' : '#000000'} />
            </Pressable>

            <View style={[styles.rightButtons, { top: topInset + 8 }]}>
                <Pressable style={styles.actionButton} onPress={onFavoritePress}>
                    <Ionicons
                        name={isFavorited ? 'heart' : 'heart-outline'}
                        size={24}
                        color={isFavorited ? theme.colors.error : (theme.mode === 'dark' ? '#FFFFFF' : '#000000')}
                    />
                </Pressable>

                <Pressable style={styles.actionButton} onPress={onBookmarkPress}>
                    <Ionicons
                        name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                        size={24}
                        color={isBookmarked ? theme.colors.primary : (theme.mode === 'dark' ? '#FFFFFF' : '#000000')}
                    />
                </Pressable>

                {onSharePress && (
                    <Pressable style={styles.actionButton} onPress={onSharePress}>
                        <Ionicons name="share-social-outline" size={24} color={theme.mode === 'dark' ? '#FFFFFF' : '#000000'} />
                    </Pressable>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        height: 480, // Taller immersive hero
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    gradient: {
        ...RNStyleSheet.absoluteFillObject,
    },
    coverWrapper: {
        width: 180,
        height: 270,
        borderRadius: theme.radius.sm,
        overflow: 'hidden',
        backgroundColor: theme.colors.surface,
        ...theme.shadows.lg,
        shadowColor: '#000',
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 10,
    },
    bookImage: {
        ...RNStyleSheet.absoluteFillObject,
    },
    spineShadow: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        backgroundColor: 'rgba(0,0,0,0.3)',
        zIndex: 1,
    },
    backButton: {
        position: 'absolute',
        left: theme.spacing.lg,
        width: 40,
        height: 40,
        borderRadius: theme.radius.full,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
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
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
}));
