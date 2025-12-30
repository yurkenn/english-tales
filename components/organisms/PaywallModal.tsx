/**
 * PaywallModal
 * Premium subscription purchase screen - Modern redesign
 */

import React, { memo, useCallback, useState, useEffect } from 'react'
import { View, Text, Modal, Pressable, ScrollView, ActivityIndicator, Image, useWindowDimensions } from 'react-native'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useSubscriptionStore } from '@/store/subscriptionStore'
import { PurchasesPackage } from 'react-native-purchases'
import { useTranslation } from 'react-i18next'
import { haptics } from '@/utils/haptics'
import Animated, {
    useAnimatedStyle,
    withSpring,
    useSharedValue,
} from 'react-native-reanimated'

interface PaywallModalProps {
    visible: boolean
    onClose: () => void
    onSuccess?: () => void
}

const HIGHLIGHT_FEATURES = [
    { icon: 'infinite-outline', title: 'Unlimited Translations', color: '#6366F1' },
    { icon: 'book-outline', title: 'All Stories', color: '#EC4899' },
    { icon: 'sparkles-outline', title: 'No Ads', color: '#F59E0B' },
]

const EXTRA_FEATURES = [
    'Automatic streak protection',
    '100 bonus coins daily',
    'Unlimited offline downloads',
    'Audio narration (coming soon)',
    'Early access to new stories',
]

function PaywallModalComponent({ visible, onClose, onSuccess }: PaywallModalProps) {
    const { theme } = useUnistyles()
    const { t } = useTranslation()
    const { width: screenWidth, height: screenHeight } = useWindowDimensions()
    const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null)

    // Responsive calculations
    const isSmallScreen = screenWidth < 375
    const isVerySmallScreen = screenHeight < 700

    const packages = useSubscriptionStore((s) => s.packages)
    const isLoading = useSubscriptionStore((s) => s.isLoading)
    const error = useSubscriptionStore((s) => s.error)
    const actions = useSubscriptionStore((s) => s.actions)

    // Auto-select yearly package when packages load
    useEffect(() => {
        if (packages.length > 0 && !selectedPackage) {
            const yearlyPkg = packages.find(p =>
                p.identifier.toLowerCase().includes('annual') ||
                p.identifier.toLowerCase().includes('yearly')
            )
            if (yearlyPkg) {
                setSelectedPackage(yearlyPkg)
            } else {
                setSelectedPackage(packages[0])
            }
        }
    }, [packages, selectedPackage])

    const handlePurchase = useCallback(async () => {
        if (!selectedPackage) return

        haptics.selection()
        const success = await actions.purchase(selectedPackage)
        if (success) {
            haptics.success()
            onSuccess?.()
            onClose()
        }
    }, [selectedPackage, actions, onSuccess, onClose])

    const handleRestore = useCallback(async () => {
        haptics.selection()
        const restored = await actions.restore()
        if (restored) {
            haptics.success()
            onSuccess?.()
            onClose()
        }
    }, [actions, onSuccess, onClose])

    const formatPrice = (pkg: PurchasesPackage) => {
        return pkg.product.priceString
    }

    const getPackageInfo = (pkg: PurchasesPackage) => {
        const id = pkg.identifier.toLowerCase()
        if (id.includes('annual') || id.includes('yearly')) {
            return {
                label: t('paywall.yearly', 'Yearly'),
                period: t('paywall.perYear', '/ year'),
                badge: t('paywall.bestValue', 'Best Value'),
                isBest: true
            }
        }
        if (id.includes('monthly')) {
            return {
                label: t('paywall.monthly', 'Monthly'),
                period: t('paywall.perMonth', '/ month'),
                badge: null,
                isBest: false
            }
        }
        if (id.includes('lifetime')) {
            return {
                label: t('paywall.lifetime', 'Lifetime'),
                period: t('paywall.oneTime', 'One-time'),
                badge: t('paywall.forever', 'Forever'),
                isBest: false
            }
        }
        return {
            label: pkg.identifier,
            period: '',
            badge: null,
            isBest: false
        }
    }

    const AnimatedPackageCard = ({ pkg, isSelected, onSelect, compact }: {
        pkg: PurchasesPackage
        isSelected: boolean
        onSelect: () => void
        compact?: boolean
    }) => {
        const scale = useSharedValue(1)
        const info = getPackageInfo(pkg)

        useEffect(() => {
            scale.value = withSpring(isSelected ? 1.02 : 1, { damping: 15 })
        }, [isSelected])

        const animatedStyle = useAnimatedStyle(() => ({
            transform: [{ scale: scale.value }],
        }))

        return (
            <Animated.View style={animatedStyle}>
                <Pressable
                    style={[
                        styles.packageCard,
                        isSelected && styles.packageCardSelected,
                        info.isBest && styles.packageCardBest,
                        compact && { minHeight: 110, padding: theme.spacing.sm },
                    ]}
                    onPress={() => {
                        haptics.selection()
                        onSelect()
                    }}
                >
                    {info.badge && (
                        <View style={[
                            styles.packageBadge,
                            info.isBest && styles.packageBadgeBest
                        ]}>
                            <Text style={[styles.packageBadgeText, compact && { fontSize: 8 }]}>{info.badge}</Text>
                        </View>
                    )}

                    <Text style={[styles.packageLabel, compact && { fontSize: 12 }]}>{info.label}</Text>
                    <Text style={[styles.packagePrice, compact && { fontSize: 16 }]}>{formatPrice(pkg)}</Text>
                    <Text style={[styles.packagePeriod, compact && { fontSize: 10 }]}>{info.period}</Text>

                    {isSelected && (
                        <View style={styles.selectedIndicator}>
                            <Ionicons name="checkmark-circle" size={compact ? 20 : 24} color={theme.colors.primary} />
                        </View>
                    )}
                </Pressable>
            </Animated.View>
        )
    }

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Close Button */}
                    <Pressable style={styles.closeBtn} onPress={onClose}>
                        <Ionicons name="close" size={28} color={theme.colors.textMuted} />
                    </Pressable>

                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Hero Section */}
                        <LinearGradient
                            colors={[theme.colors.primary + '20', 'transparent']}
                            style={[styles.heroGradient, isVerySmallScreen && { paddingTop: theme.spacing.lg, paddingBottom: theme.spacing.md }]}
                        >
                            <View style={styles.iconContainer}>
                                <Image
                                    source={require('@/assets/icon.png')}
                                    style={[styles.appIcon, isSmallScreen && { width: 64, height: 64, borderRadius: 16 }]}
                                />
                                <View style={styles.proBadge}>
                                    <Ionicons name="star" size={isSmallScreen ? 10 : 12} color="#fff" />
                                    <Text style={styles.proBadgeText}>PRO</Text>
                                </View>
                            </View>

                            <Text style={[styles.title, isSmallScreen && { fontSize: 24 }]}>
                                {t('paywall.title', 'Go Premium')}
                            </Text>
                            <Text style={[styles.subtitle, isSmallScreen && { fontSize: 14 }]}>
                                {t('paywall.subtitle', 'Unlock the full English Tales experience')}
                            </Text>
                        </LinearGradient>

                        {/* Feature Highlights */}
                        <View style={styles.highlightsContainer}>
                            {HIGHLIGHT_FEATURES.map((feature, index) => (
                                <View key={index} style={styles.highlightCard}>
                                    <View style={[
                                        styles.highlightIcon,
                                        { backgroundColor: feature.color + '20' },
                                        isSmallScreen && { width: 40, height: 40 }
                                    ]}>
                                        <Ionicons
                                            name={feature.icon as any}
                                            size={isSmallScreen ? 20 : 24}
                                            color={feature.color}
                                        />
                                    </View>
                                    <Text style={[
                                        styles.highlightText,
                                        isSmallScreen && { fontSize: 10 }
                                    ]}>{feature.title}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Package Selection */}
                        <Text style={[
                            styles.sectionTitle,
                            isSmallScreen && { fontSize: 16 }
                        ]}>
                            {t('paywall.choosePlan', 'Choose Your Plan')}
                        </Text>

                        <View style={styles.packagesContainer}>
                            {packages.map((pkg) => (
                                <AnimatedPackageCard
                                    key={pkg.identifier}
                                    pkg={pkg}
                                    isSelected={selectedPackage?.identifier === pkg.identifier}
                                    onSelect={() => setSelectedPackage(pkg)}
                                    compact={isSmallScreen}
                                />
                            ))}
                        </View>

                        {/* Extra Features */}
                        <View style={styles.extraFeatures}>
                            {EXTRA_FEATURES.map((feature, index) => (
                                <View key={index} style={styles.extraFeatureItem}>
                                    <Ionicons name="checkmark" size={16} color={theme.colors.success} />
                                    <Text style={styles.extraFeatureText}>{feature}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Error */}
                        {error && (
                            <Text style={styles.errorText}>{error}</Text>
                        )}
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Pressable
                            style={[
                                styles.purchaseBtn,
                                (!selectedPackage || isLoading) && styles.purchaseBtnDisabled,
                            ]}
                            onPress={handlePurchase}
                            disabled={!selectedPackage || isLoading}
                        >
                            <LinearGradient
                                colors={[theme.colors.primary, theme.colors.primaryDark || theme.colors.primary]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.purchaseBtnGradient}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.purchaseBtnText}>
                                        {t('paywall.continue', 'Continue')}
                                    </Text>
                                )}
                            </LinearGradient>
                        </Pressable>

                        <Text style={styles.trialInfo}>
                            {t('paywall.trialInfo', 'Cancel anytime. No commitment.')}
                        </Text>

                        <View style={styles.footerLinks}>
                            <Pressable onPress={handleRestore}>
                                <Text style={styles.footerLink}>
                                    {t('paywall.restore', 'Restore')}
                                </Text>
                            </Pressable>
                            <Text style={styles.footerDivider}>•</Text>
                            <Pressable>
                                <Text style={styles.footerLink}>
                                    {t('paywall.terms', 'Terms')}
                                </Text>
                            </Pressable>
                            <Text style={styles.footerDivider}>•</Text>
                            <Pressable>
                                <Text style={styles.footerLink}>
                                    {t('paywall.privacy', 'Privacy')}
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    )
}

export const PaywallModal = memo(PaywallModalComponent)

const styles = StyleSheet.create((theme) => ({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: theme.colors.surface,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        maxHeight: '92%',
        ...theme.shadows.lg,
    },
    closeBtn: {
        position: 'absolute',
        top: theme.spacing.md,
        right: theme.spacing.md,
        zIndex: 10,
        padding: theme.spacing.sm,
    },
    scrollView: {
        flexGrow: 0,
    },
    scrollContent: {
        paddingBottom: theme.spacing.lg,
    },
    // Hero
    heroGradient: {
        alignItems: 'center',
        paddingTop: theme.spacing.xxl,
        paddingBottom: theme.spacing.xl,
        paddingHorizontal: theme.spacing.xl,
    },
    iconContainer: {
        position: 'relative',
        marginBottom: theme.spacing.lg,
    },
    appIcon: {
        width: 80,
        height: 80,
        borderRadius: 20,
    },
    proBadge: {
        position: 'absolute',
        bottom: -8,
        right: -8,
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderWidth: 3,
        borderColor: theme.colors.surface,
    },
    proBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '800',
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: theme.spacing.xs,
    },
    subtitle: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
    // Highlights
    highlightsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.xl,
    },
    highlightCard: {
        flex: 1,
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background,
        borderRadius: theme.radius.lg,
        gap: theme.spacing.sm,
    },
    highlightIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    highlightText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.text,
        textAlign: 'center',
    },
    // Packages
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: theme.spacing.md,
    },
    packagesContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        paddingHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.xl,
    },
    packageCard: {
        flex: 1,
        backgroundColor: theme.colors.background,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: theme.colors.border,
        minHeight: 130,
        justifyContent: 'center',
    },
    packageCardSelected: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primary + '08',
    },
    packageCardBest: {
        borderColor: theme.colors.primary,
    },
    packageBadge: {
        position: 'absolute',
        top: -10,
        backgroundColor: theme.colors.success,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    packageBadgeBest: {
        backgroundColor: theme.colors.primary,
    },
    packageBadgeText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#fff',
        textTransform: 'uppercase',
    },
    packageLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.textSecondary,
        marginBottom: 4,
    },
    packagePrice: {
        fontSize: 20,
        fontWeight: '800',
        color: theme.colors.text,
    },
    packagePeriod: {
        fontSize: 11,
        color: theme.colors.textMuted,
        marginTop: 2,
    },
    selectedIndicator: {
        position: 'absolute',
        top: 8,
        right: 8,
    },
    // Extra Features
    extraFeatures: {
        paddingHorizontal: theme.spacing.xl,
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.lg,
    },
    extraFeatureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    extraFeatureText: {
        fontSize: 14,
        color: theme.colors.textSecondary,
    },
    // Footer
    footer: {
        padding: theme.spacing.lg,
        paddingBottom: theme.spacing.xl,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
    },
    purchaseBtn: {
        borderRadius: theme.radius.lg,
        overflow: 'hidden',
        marginBottom: theme.spacing.sm,
    },
    purchaseBtnDisabled: {
        opacity: 0.5,
    },
    purchaseBtnGradient: {
        paddingVertical: theme.spacing.lg,
        alignItems: 'center',
    },
    purchaseBtnText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    trialInfo: {
        fontSize: 13,
        color: theme.colors.textMuted,
        textAlign: 'center',
        marginBottom: theme.spacing.md,
    },
    footerLinks: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    footerLink: {
        fontSize: 13,
        color: theme.colors.primary,
    },
    footerDivider: {
        color: theme.colors.textMuted,
    },
    errorText: {
        color: theme.colors.error,
        fontSize: 14,
        textAlign: 'center',
        marginHorizontal: theme.spacing.xl,
    },
}))
