import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    useWindowDimensions,
    Pressable,
    Image,
    NativeSyntheticEvent,
    NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUnistyles, StyleSheet } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { secureStorage } from '@/services/storage';
import { LinearGradient } from 'expo-linear-gradient';

const ONBOARDING_DATA = [
    {
        id: 'track',
        title: 'Smart Tracking\n& Picks',
        description: 'We save your reading spot automatically and curate new stories just for you.',
        buttonLabel: 'Next',
    },
    {
        id: 'connect',
        title: 'Connect with\nFellow Readers',
        description: 'Curate your bookshelf, share reviews, and discover what your friends are reading right now.',
        buttonLabel: 'Get Started',
    },
];

export default function OnboardingScreen() {
    const { theme } = useUnistyles();
    const router = useRouter();
    const { width, height } = useWindowDimensions();
    const flatListRef = useRef<FlatList>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleNext = async () => {
        if (currentIndex < ONBOARDING_DATA.length - 1) {
            flatListRef.current?.scrollToIndex({
                index: currentIndex + 1,
                animated: true,
            });
        } else {
            await completeOnboarding();
        }
    };

    const completeOnboarding = async () => {
        // Mark onboarding as completed
        await secureStorage.setOnboardingComplete();
        router.replace('/(tabs)');
    };

    const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const slideSize = event.nativeEvent.layoutMeasurement.width;
        const index = event.nativeEvent.contentOffset.x / slideSize;
        const roundIndex = Math.round(index);
        if (roundIndex !== currentIndex) {
            setCurrentIndex(roundIndex);
        }
    }, [currentIndex]);

    const renderSlide = ({ item, index }: { item: typeof ONBOARDING_DATA[0], index: number }) => {
        return (
            <View style={[styles.slide, { width }]}>
                {/* Visual Area */}
                <View style={styles.visualContainer}>
                    {item.id === 'track' ? (
                        <TrackProgressVisual />
                    ) : (
                        <ConnectShareVisual />
                    )}
                </View>

                {/* Content Area */}
                <View style={[styles.contentContainer, { paddingBottom: 40 }]}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.description}>{item.description}</Text>

                    {/* Indicators */}
                    <View style={styles.indicators}>
                        {ONBOARDING_DATA.map((_, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.indicator,
                                    i === currentIndex
                                        ? styles.indicatorActive
                                        : styles.indicatorInactive
                                ]}
                            />
                        ))}
                    </View>

                    {/* Action Button */}
                    <Pressable
                        style={styles.button}
                        onPress={handleNext}
                    >
                        <Text style={styles.buttonText}>{item.buttonLabel}</Text>
                        <Ionicons name="arrow-forward" size={24} color={theme.colors.textInverse} />
                    </Pressable>

                    {index === 1 && (
                        <Pressable style={styles.linkButton} onPress={() => router.replace('/(tabs)')}>
                            <Text style={styles.linkText}>
                                Already have an account? <Text style={styles.linkHighlight}>Log In</Text>
                            </Text>
                        </Pressable>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={ONBOARDING_DATA}
                renderItem={renderSlide}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={onScroll}
                scrollEventThrottle={16}
                keyExtractor={(item) => item.id}
                bounces={false}
            />
            {/* Skip Button - Only on first slide */}
            {currentIndex === 0 && (
                <Pressable
                    style={[styles.skipButton, { top: 60 }]}
                    onPress={() => completeOnboarding()}
                >
                    <Text style={styles.skipText}>Skip</Text>
                </Pressable>
            )}
        </View>
    );
}

// Visual Components matching the design
const TrackProgressVisual = () => {
    const { theme } = useUnistyles();
    // Using placeholders or colored views to simulate the complex design
    return (
        <View style={styles.visualWrapper}>
            {/* Ambient Background Blob */}
            <View style={[styles.blob, { backgroundColor: 'rgba(238, 157, 43, 0.1)' }]} />

            {/* Background Card */}
            <View style={[styles.cardCommon, styles.cardBack]}>
                <LinearGradient
                    colors={[theme.colors.primary + '20', theme.colors.primary + '10']}
                    style={StyleSheet.absoluteFill}
                />
            </View>

            {/* Foreground Card */}
            <View style={[styles.cardCommon, styles.cardFront]}>
                {/* Book Cover Placeholder */}
                <View style={styles.bookCoverPlaceholder}>
                    <Ionicons name="book" size={64} color={theme.colors.textMuted} />
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

const ConnectShareVisual = () => {
    const { theme } = useUnistyles();
    return (
        <View style={styles.visualWrapper}>
            {/* Ambient Background Blob */}
            <View style={[styles.blob, { backgroundColor: 'rgba(66, 135, 245, 0.1)', left: -50 }]} />

            {/* Back Card (Bookshelf) */}
            <View style={[styles.cardCommon, styles.cardBackRotated]}>
                <View style={styles.bookshelfRow} />
                <View style={[styles.bookshelfRow, { width: '60%' }]} />
            </View>

            {/* Front Card (Review) */}
            <View style={[styles.cardCommon, styles.cardFrontRotated]}>
                <View style={styles.reviewImagePlaceholder}>
                    <Ionicons name="image" size={48} color={theme.colors.textMuted} />
                    <View style={styles.favoriteBadge}>
                        <Ionicons name="heart" size={16} color={theme.colors.primary} />
                    </View>
                </View>
                <View style={styles.reviewContent}>
                    <View style={styles.ratingRow}>
                        {[1, 2, 3, 4, 5].map((s) => (
                            <Ionicons key={s} name="star" size={12} color={theme.colors.primary} />
                        ))}
                        <Text style={styles.ratingText}>4.9</Text>
                    </View>
                    <View style={styles.userInfoRow}>
                        <View style={styles.userAvatarPlaceholder} >
                            <Text style={styles.avatarText}>JD</Text>
                        </View>
                        <Text style={styles.userComment} numberOfLines={1}>"A masterpiece!"</Text>
                    </View>
                </View>
            </View>

            {/* Floating Shared Bubble */}
            <View style={styles.sharedBubble}>
                <Ionicons name="share-social" size={14} color={theme.colors.text} />
                <Text style={styles.sharedText}>Shared!</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    slide: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    visualContainer: {
        flex: 1.2,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    visualWrapper: {
        width: 300,
        height: 400,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    contentContainer: {
        flex: 1,
        width: '100%',
        paddingHorizontal: 32,
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 32,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 40,
    },
    description: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textMuted,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
        maxWidth: 280,
    },
    indicators: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 32,
    },
    indicator: {
        height: 8,
        borderRadius: 4,
    },
    indicatorActive: {
        width: 32,
        backgroundColor: theme.colors.primary,
    },
    indicatorInactive: {
        width: 8,
        backgroundColor: theme.colors.border,
    },
    button: {
        width: '100%',
        height: 56,
        backgroundColor: theme.colors.primary,
        borderRadius: theme.radius.full,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        ...theme.shadows.md,
    },
    buttonText: {
        color: theme.colors.textInverse,
        fontSize: theme.typography.size.lg,
        fontWeight: 'bold',
    },
    linkButton: {
        marginTop: 16,
        padding: 8,
    },
    linkText: {
        color: theme.colors.textMuted,
        fontSize: theme.typography.size.sm,
    },
    linkHighlight: {
        color: theme.colors.primary,
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
    skipButton: {
        position: 'absolute',
        right: 24,
        top: 60,
        padding: 8,
        zIndex: 10,
    },
    skipText: {
        color: theme.colors.textMuted,
        fontSize: theme.typography.size.sm,
        fontWeight: 'bold',
    },
    // Visual Styles
    blob: {
        position: 'absolute',
        width: 250,
        height: 250,
        borderRadius: 999,
        filter: 'blur(40px)', // Note: blur might need platform specific handling or image
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
    bookCoverPlaceholder: {
        flex: 2,
        backgroundColor: theme.colors.borderLight,
        alignItems: 'center',
        justifyContent: 'center',
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
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
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
    // Connect Visuals
    cardBackRotated: {
        transform: [{ rotate: '-6deg' }, { translateX: 20 }, { translateY: 10 }],
        zIndex: 1,
        padding: 16,
        gap: 12,
    },
    bookshelfRow: {
        height: 12,
        width: '100%',
        backgroundColor: theme.colors.borderLight,
        borderRadius: 6,
    },
    cardFrontRotated: {
        transform: [{ rotate: '2deg' }],
        zIndex: 2,
        padding: 12,
    },
    reviewImagePlaceholder: {
        flex: 1.5,
        backgroundColor: theme.colors.borderLight,
        borderRadius: theme.radius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        marginBottom: 12,
    },
    favoriteBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: theme.colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.sm,
    },
    reviewContent: {
        flex: 1,
        gap: 8,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    ratingText: {
        fontSize: 10,
        color: theme.colors.textMuted,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    userInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
        paddingTop: 8,
    },
    userAvatarPlaceholder: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: theme.colors.primary + '20',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 8,
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    userComment: {
        fontSize: 10,
        color: theme.colors.textMuted,
        fontStyle: 'italic',
    },
    sharedBubble: {
        position: 'absolute',
        right: 0,
        bottom: 80,
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        zIndex: 3,
        ...theme.shadows.lg,
    },
    sharedText: {
        color: theme.colors.text,
        fontSize: 10,
        fontWeight: 'bold',
    },
}));
