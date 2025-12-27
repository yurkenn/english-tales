/**
 * OnboardingPaywall
 * High-conversion sales screen for the end of onboarding
 */

import React, { memo, useCallback, useState } from 'react'
import { View, Text, Pressable, ScrollView, ActivityIndicator, Image, Dimensions } from 'react-native'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'
import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { useSubscriptionStore } from '@/store/subscriptionStore'
import { PurchasesPackage } from 'react-native-purchases'
import { useTranslation } from 'react-i18next'
import { haptics } from '@/utils/haptics'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'
import { TrialTimeline } from '../molecules'

const { width } = Dimensions.get('window')

interface OnboardingPaywallProps {
    onClose: () => void
    onSuccess: () => void
}

const PREMIUM_FEATURES = [
    { icon: 'infinite', title: 'Unlimited Translations', sub: 'Understand every word instantly' },
    { icon: 'book', title: 'All Stories Unlocked', sub: 'Full access to our entire library' },
    { icon: 'cloud-download', title: 'Offline Mode', sub: 'Read and learn anywhere, anytime' },
    { icon: 'headset', title: 'Premium Audio', sub: 'Natural AI narration for all stories' },
]

function OnboardingPaywallComponent({ onClose, onSuccess }: OnboardingPaywallProps) {
    const { theme } = useUnistyles()
    const { t } = useTranslation()
    const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null)

    const packages = useSubscriptionStore((s) => s.packages)
    const isLoading = useSubscriptionStore((s) => s.isLoading)
    const actions = useSubscriptionStore((s) => s.actions)

    // Set annual as default if available
    React.useEffect(() => {
        if (packages.length > 0 && !selectedPackage) {
            const annual = packages.find(p => p.identifier.toLowerCase().includes('annual') || p.identifier.toLowerCase().includes('yearly'))
            setSelectedPackage(annual || packages[0])
        }
    }, [packages, selectedPackage])

    const handlePurchase = useCallback(async () => {
        if (!selectedPackage) return

        haptics.selection()
        const success = await actions.purchase(selectedPackage)
        if (success) {
            haptics.success()
            onSuccess()
        }
    }, [selectedPackage, actions, onSuccess])

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <Animated.View entering={FadeIn.duration(800)} style={styles.header}>
                    <Image
                        source={require('@/assets/icon.png')}
                        style={styles.logo}
                    />
                    <View style={styles.proBadge}>
                        <Text style={styles.proBadgeText}>PRO</Text>
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(200)} style={styles.titleSection}>
                    <Text style={styles.title}>Unlock Your Full Potential</Text>
                    <Text style={styles.subtitle}>Start your 3-day free trial and experience the ultimate way to learn English.</Text>
                </Animated.View>

                <View style={styles.featuresList}>
                    {PREMIUM_FEATURES.map((feature, index) => (
                        <Animated.View
                            key={index}
                            entering={FadeInDown.delay(400 + index * 100)}
                            style={styles.featureItem}
                        >
                            <View style={styles.iconWrapper}>
                                <Ionicons name={feature.icon as any} size={24} color={theme.colors.primary} />
                            </View>
                            <View style={styles.featureText}>
                                <Text style={styles.featureTitle}>{feature.title}</Text>
                                <Text style={styles.featureSub}>{feature.sub}</Text>
                            </View>
                        </Animated.View>
                    ))}
                </View>

                <TrialTimeline days={3} />

                <View style={styles.packagesContainer}>
                    {packages.map((pkg) => {
                        const isAnnual = pkg.identifier.toLowerCase().includes('annual') || pkg.identifier.toLowerCase().includes('yearly')
                        const isSelected = selectedPackage?.identifier === pkg.identifier

                        return (
                            <Pressable
                                key={pkg.identifier}
                                style={[
                                    styles.packageCard,
                                    isSelected && styles.packageCardSelected
                                ]}
                                onPress={() => {
                                    haptics.selection()
                                    setSelectedPackage(pkg)
                                }}
                            >
                                {isAnnual && (
                                    <View style={styles.bestValueBadge}>
                                        <Text style={styles.bestValueText}>MOST POPULAR - SAVE 50%</Text>
                                    </View>
                                )}
                                <View style={styles.packageInfo}>
                                    <Text style={styles.packageLabel}>
                                        {isAnnual ? 'Annual Access' : 'Monthly Access'}
                                    </Text>
                                    <Text style={styles.packageDetail}>
                                        {isAnnual ? '3 Days Free, then ' : ''}{pkg.product.priceString}{isAnnual ? '/year' : '/month'}
                                    </Text>
                                </View>
                                <View style={[styles.radio, isSelected && styles.radioSelected]}>
                                    {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
                                </View>
                            </Pressable>
                        )
                    })}
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <Pressable
                    style={[styles.mainButton, isLoading && styles.buttonDisabled]}
                    onPress={handlePurchase}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.mainButtonText}>Start 3-Day Free Trial</Text>
                    )}
                </Pressable>

                <Pressable onPress={onClose} style={styles.skipButton}>
                    <Text style={styles.skipButtonText}>Not now, I'll stick with Basic</Text>
                </Pressable>

                <Text style={styles.legalText}>
                    Subscription automatically renews. Cancel anytime in App Store settings.
                </Text>
            </View>
        </View>
    )
}

export const OnboardingPaywall = memo(OnboardingPaywallComponent)

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollContent: {
        paddingTop: 60,
        paddingHorizontal: theme.spacing.xl,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
    },
    logo: {
        width: 80,
        height: 80,
        borderRadius: 20,
    },
    proBadge: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        marginTop: -12,
        borderWidth: 3,
        borderColor: theme.colors.background,
    },
    proBadgeText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 10,
    },
    titleSection: {
        marginBottom: theme.spacing.xxl,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: theme.spacing.sm,
    },
    subtitle: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 10,
    },
    featuresList: {
        gap: theme.spacing.lg,
        marginBottom: theme.spacing.xxxxl,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
    },
    iconWrapper: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: theme.colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureText: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: theme.colors.text,
    },
    featureSub: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    packagesContainer: {
        gap: theme.spacing.md,
    },
    packageCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.xl,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        position: 'relative',
    },
    packageCardSelected: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primary + '05',
    },
    bestValueBadge: {
        position: 'absolute',
        top: -12,
        left: 20,
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8,
    },
    bestValueText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '900',
    },
    packageInfo: {
        flex: 1,
    },
    packageLabel: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text,
    },
    packageDetail: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    radio: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: theme.colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioSelected: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    footer: {
        padding: theme.spacing.xl,
        paddingBottom: 40,
        gap: theme.spacing.md,
    },
    mainButton: {
        backgroundColor: theme.colors.primary,
        height: 64,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.md,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    mainButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
    },
    skipButton: {
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
    },
    skipButtonText: {
        color: theme.colors.textSecondary,
        fontSize: 15,
        fontWeight: '600',
    },
    legalText: {
        fontSize: 11,
        color: theme.colors.textMuted,
        textAlign: 'center',
        marginTop: theme.spacing.xs,
        lineHeight: 16,
    },
}))
