import React from 'react';
import { View, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
            <OptimizedImage
                source={{ uri: coverImage }}
                placeholder={coverImageLqip}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                sharedTransitionTag={`story-image-${storyId}`}
            />
            <LinearGradient
                colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.8)']}
                style={styles.gradient}
            />
            <Pressable style={[styles.backButton, { top: topInset + 8 }]} onPress={onBackPress}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </Pressable>

            <View style={[styles.rightButtons, { top: topInset + 8 }]}>
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
    rightButtons: {
        position: 'absolute',
        right: theme.spacing.lg,
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    actionButton: {
        width: 40,
        height: 40,
        borderRadius: theme.radius.full,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
}));
