import React from 'react';
import { View, Text } from 'react-native';
import { useUnistyles, StyleSheet } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

export const OnboardingConnectVisual = () => {
    const { theme } = useUnistyles();
    return (
        <View style={styles.visualWrapper}>
            {/* Ambient Background Blob */}
            <View style={[styles.blob, { backgroundColor: theme.colors.accentBlue + '1A', left: -50 }]} />

            {/* Back Card (Bookshelf) */}
            <View style={[styles.cardCommon, styles.cardBackRotated]}>
                <View style={styles.bookshelfRow} />
                <View style={[styles.bookshelfRow, { width: '60%' }]} />
            </View>

            {/* Front Card (Review) */}
            <View style={[styles.cardCommon, styles.cardFrontRotated]}>
                <View style={styles.reviewImageContainer}>
                    <Image
                        source={require('@/assets/images/onboarding_connect.png')}
                        style={styles.reviewImage}
                        contentFit="cover"
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.2)']}
                        style={styles.reviewImageOverlay}
                    />
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
                <Ionicons name="share-social" size={14} color={theme.colors.textInverse} />
                <Text style={styles.sharedText}>Shared!</Text>
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
    cardBackRotated: {
        transform: [{ rotate: '-6deg' }, { translateX: theme.spacing.xl }, { translateY: theme.spacing.sm }],
        zIndex: 1,
        padding: theme.spacing.lg,
        gap: theme.spacing.md,
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
        padding: theme.spacing.md,
    },
    reviewImageContainer: {
        flex: 1.5,
        borderRadius: theme.radius.lg,
        position: 'relative',
        marginBottom: theme.spacing.md,
        overflow: 'hidden',
    },
    reviewImage: {
        width: '100%',
        height: '100%',
    },
    reviewImageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 40,
    },
    favoriteBadge: {
        position: 'absolute',
        top: theme.spacing.sm,
        right: theme.spacing.sm,
        width: 24,
        height: 24,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.sm,
    },
    reviewContent: {
        flex: 1,
        gap: theme.spacing.sm,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xxs,
    },
    ratingText: {
        fontSize: 10,
        color: theme.colors.textMuted,
        fontWeight: 'bold',
        marginLeft: theme.spacing.xs,
    },
    userInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
        paddingTop: theme.spacing.sm,
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
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.radius.xxl,
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
        zIndex: 3,
        ...theme.shadows.lg,
    },
    sharedText: {
        color: theme.colors.textInverse,
        fontSize: 10,
        fontWeight: 'bold',
    },
}));
