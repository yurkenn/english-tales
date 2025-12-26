import React from 'react';
import { View, Text } from 'react-native';
import { useUnistyles, StyleSheet } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';

export const OnboardingTrackVisual = () => {
    const { theme } = useUnistyles();
    return (
        <View style={styles.visualWrapper}>
            {/* Ambient Background Blob */}
            <View style={[styles.blob, { backgroundColor: theme.colors.accentOrange + '1A' }]} />

            {/* Background Card */}
            <View style={[styles.cardCommon, styles.cardBack]}>
                <LinearGradient
                    colors={[theme.colors.primary + '20', theme.colors.primary + '10']}
                    style={StyleSheet.absoluteFill}
                />
            </View>

            {/* Foreground Card */}
            <View style={[styles.cardCommon, styles.cardFront]}>
                {/* Book Cover with Generated Image */}
                <View style={styles.bookCoverContainer}>
                    <Image
                        source={require('@/assets/images/onboarding_book.png')}
                        style={styles.bookCoverImage}
                        contentFit="cover"
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.3)']}
                        style={styles.bookCoverOverlay}
                    />
                    <View style={styles.playButtonOverlay}>
                        <View style={styles.playButton}>
                            <Ionicons name="play" size={24} color={theme.colors.textInverse} />
                        </View>
                    </View>
                </View>
                {/* Card Body */}
                <View style={styles.cardBody}>
                    <Text style={styles.cardTitle}>The Great Gatsby</Text>
                    <Text style={styles.cardSubtitle}>F. Scott Fitzgerald</Text>
                    {/* Progress */}
                    <View style={styles.progressSection}>
                        <View style={styles.progressRow}>
                            <Text style={styles.progressLabel}>Chapter 4</Text>
                            <Text style={styles.progressPercent}>75%</Text>
                        </View>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: '75%' }]} />
                        </View>
                    </View>
                </View>
            </View>

            {/* Floating Tooltip */}
            <View style={styles.floatingTooltip}>
                <View style={styles.tooltipIcon}>
                    <Ionicons name="bookmarks" size={16} color={theme.colors.primary} />
                </View>
                <View>
                    <Text style={styles.tooltipLabel}>RESUMED</Text>
                    <Text style={styles.tooltipValue}>Page 124</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    visualWrapper: {
        width: '100%',
        maxWidth: 300,
        aspectRatio: 0.75,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    blob: {
        position: 'absolute',
        width: '85%',
        aspectRatio: 1,
        borderRadius: 999,
        opacity: 0.5,
    },
    cardCommon: {
        width: 200,
        height: 280,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xl,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        position: 'absolute',
        ...theme.shadows.lg,
    },
    cardBack: {
        transform: [{ rotate: '8deg' }, { scale: 0.95 }, { translateX: 20 }, { translateY: -20 }],
        zIndex: 1,
    },
    cardFront: {
        transform: [{ rotate: '-2deg' }],
        zIndex: 2,
        overflow: 'hidden',
    },
    bookCoverContainer: {
        flex: 2,
        position: 'relative',
        overflow: 'hidden',
    },
    bookCoverImage: {
        width: '100%',
        height: '100%',
    },
    bookCoverOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
    },
    playButtonOverlay: {
        position: 'absolute',
        inset: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    playButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: theme.colors.overlayLight,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.textInverse + '80',
    },
    cardBody: {
        flex: 1,
        padding: 12,
        justifyContent: 'space-between',
    },
    cardTitle: {
        fontSize: theme.typography.size.md,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    cardSubtitle: {
        fontSize: 10,
        color: theme.colors.textMuted,
    },
    progressSection: {
        gap: 4,
    },
    progressRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    progressLabel: {
        fontSize: 10,
        color: theme.colors.textMuted,
        fontWeight: 'bold',
    },
    progressPercent: {
        fontSize: 10,
        color: theme.colors.primary,
        fontWeight: 'bold',
    },
    progressBarBg: {
        height: 6,
        backgroundColor: theme.colors.borderLight,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: theme.colors.primary,
        borderRadius: 3,
    },
    floatingTooltip: {
        position: 'absolute',
        bottom: 40,
        left: -20,
        backgroundColor: theme.colors.surface,
        padding: 10,
        borderRadius: 12,
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
        ...theme.shadows.lg,
        zIndex: 3,
    },
    tooltipIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: theme.colors.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tooltipLabel: {
        fontSize: 8,
        fontWeight: 'bold',
        color: theme.colors.textMuted,
        textTransform: 'uppercase',
    },
    tooltipValue: {
        fontSize: 10,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
}));
