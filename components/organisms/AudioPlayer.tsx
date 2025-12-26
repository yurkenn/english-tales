import React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

interface AudioPlayerProps {
    isPlaying: boolean;
    isBuffering: boolean;
    onPlayPause: () => void;
    onStop: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
    isPlaying,
    isBuffering,
    onPlayPause,
    onStop,
}) => {
    const { theme } = useUnistyles();

    return (
        <Animated.View
            entering={FadeInDown}
            exiting={FadeOutDown}
            style={styles.container}
        >
            <View style={styles.content}>
                <View style={styles.info}>
                    <Ionicons
                        name="volume-medium-outline"
                        size={20}
                        color={theme.colors.primary}
                    />
                    <Text style={styles.text}>
                        {isPlaying ? 'Reading aloud...' : 'Audio Assist Ready'}
                    </Text>
                </View>

                <View style={styles.controls}>
                    <Pressable
                        style={styles.controlButton}
                        onPress={onPlayPause}
                        disabled={isBuffering}
                    >
                        {isBuffering ? (
                            <ActivityIndicator size="small" color={theme.colors.primary} />
                        ) : (
                            <Ionicons
                                name={isPlaying ? "pause" : "play"}
                                size={24}
                                color={theme.colors.primary}
                            />
                        )}
                    </Pressable>

                    <Pressable
                        style={[styles.controlButton, styles.stopButton]}
                        onPress={onStop}
                    >
                        <Ionicons name="stop" size={20} color={theme.colors.textSecondary} />
                    </Pressable>
                </View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        position: 'absolute',
        bottom: 100, // Above ReadingControls
        left: theme.spacing.lg,
        right: theme.spacing.lg,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xl,
        padding: theme.spacing.md,
        ...theme.shadows.md,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        zIndex: 100,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    info: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    text: {
        fontSize: theme.typography.size.sm,
        fontWeight: '600',
        color: theme.colors.text,
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    controlButton: {
        width: 44,
        height: 44,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.primary + '10',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stopButton: {
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
}));
