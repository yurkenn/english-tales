/**
 * PaywallModal
 * Premium subscription purchase screen
 */

import React, { memo, useCallback, useState } from 'react'
import { View, Text, Modal, Pressable, ScrollView, ActivityIndicator, Image } from 'react-native'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'
import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { useSubscriptionStore } from '@/store/subscriptionStore'
import { PurchasesPackage } from 'react-native-purchases'
import { useTranslation } from 'react-i18next'
import { haptics } from '@/utils/haptics'
import { TrialTimeline } from '../molecules'

interface PaywallModalProps {
    visible: boolean
    onClose: () => void
    onSuccess?: () => void
}

const PREMIUM_FEATURES = [
    { title: 'Unlimited translations', sub: 'Translate any story, any time' },
    { title: 'All stories unlocked', sub: 'Access our full library of stories' },
    { title: 'Automatic streak protection', sub: 'Never lose your progress' },
    { title: '100 bonus coins daily', sub: 'Boost your learning every day' },
    { title: 'No advertisements', sub: 'Enjoy an uninterrupted experience' },
    { title: 'Unlimited offline downloads', sub: 'Learn on the go, without internet' },
    { title: 'Audio narration (coming soon)', sub: 'Listen to stories with professional narration' },
    { title: 'Early access to new stories', sub: 'Be the first to read our latest content' },
]

function PaywallModalComponent({ visible, onClose, onSuccess }: PaywallModalProps) {
    const { theme } = useUnistyles()
    const { t } = useTranslation()
    const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null)

    const packages = useSubscriptionStore((s) => s.packages)
    const isLoading = useSubscriptionStore((s) => s.isLoading)
    const error = useSubscriptionStore((s) => s.error)
    const actions = useSubscriptionStore((s) => s.actions)

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

    const getPackageLabel = (pkg: PurchasesPackage) => {
        const id = pkg.identifier.toLowerCase()
        if (id.includes('annual') || id.includes('yearly')) {
            return t('paywall.yearly', 'Yearly')
        }
        if (id.includes('monthly')) {
            return t('paywall.monthly', 'Monthly')
        }
        return pkg.identifier
    }

    const getPackageSavings = (pkg: PurchasesPackage) => {
        const id = pkg.identifier.toLowerCase()
        if (id.includes('annual') || id.includes('yearly')) {
            return t('paywall.save50', 'SAVE 50%')
        }
        return null
    }

    const isMostPopular = (pkg: PurchasesPackage) => {
        const id = pkg.identifier.toLowerCase()
        return id.includes('annual') || id.includes('yearly')
    }

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <BlurView intensity={30} style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Pressable style={styles.closeBtn} onPress={onClose}>
                            <Ionicons name="close" size={24} color={theme.colors.textMuted} />
                        </Pressable>
                    </View>

                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* App Icon with Branded PRO Badge */}
                        <View style={styles.iconContainer}>
                            <View style={styles.appIconWrapper}>
                                <Image
                                    source={require('@/assets/icon.png')}
                                    style={styles.appIcon}
                                />
                                <View style={styles.proBadge}>
                                    <Text style={styles.proBadgeText}>PRO</Text>
                                </View>
                            </View>
                        </View>

                        {/* Title */}
                        <Text style={styles.title}>
                            {t('paywall.title', 'Go Premium')}
                        </Text>
                        <Text style={styles.subtitle}>
                            {t('paywall.subtitle', 'Unlock the full English Tales experience')}
                        </Text>

                        {/* Features */}
                        <View style={styles.featuresContainer}>
                            <View style={styles.featuresList}>
                                {PREMIUM_FEATURES.map((feature, index) => (
                                    <View key={index} style={styles.featureItem}>
                                        <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
                                        <View style={styles.featureText}>
                                            <Text style={styles.featureTitle}>{feature.title}</Text>
                                            <Text style={styles.featureSub}>{feature.sub}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>

                            <TrialTimeline days={3} />
                        </View>

                        {/* Package Selection */}
                        <View style={styles.packagesContainer}>
                            {packages.map((pkg) => {
                                const isSelected = selectedPackage?.identifier === pkg.identifier
                                const savings = getPackageSavings(pkg)

                                return (
                                    <Pressable
                                        key={pkg.identifier}
                                        style={[
                                            styles.packageCard,
                                            isSelected && styles.packageCardSelected,
                                            isMostPopular(pkg) && styles.packageCardPopular,
                                        ]}
                                        onPress={() => {
                                            haptics.selection()
                                            setSelectedPackage(pkg)
                                        }}
                                    >
                                        {savings && (
                                            <View style={styles.savingsBadge}>
                                                <Text style={styles.savingsText}>{savings}</Text>
                                            </View>
                                        )}
                                        {isMostPopular(pkg) && (
                                            <View style={styles.popularBadge}>
                                                <Text style={styles.popularBadgeText}>{t('paywall.mostPopular', 'MOST POPULAR')}</Text>
                                            </View>
                                        )}
                                        <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                                            {isSelected && <View style={styles.radioInner} />}
                                        </View>
                                        <View style={styles.packageInfo}>
                                            <Text style={styles.packageLabel}>
                                                {getPackageLabel(pkg)}
                                            </Text>
                                            <Text style={styles.packagePrice}>
                                                {formatPrice(pkg)}
                                            </Text>
                                        </View>
                                    </Pressable>
                                )
                            })}
                        </View>

                        {/* Error */}
                        {error && (
                            <Text style={styles.errorText}>{error}</Text>
                        )}
                    </ScrollView>

                    {/* Purchase Button */}
                    <View style={styles.footer}>
                        <Pressable
                            style={[
                                styles.purchaseBtn,
                                (!selectedPackage || isLoading) && styles.purchaseBtnDisabled,
                            ]}
                            onPress={handlePurchase}
                            disabled={!selectedPackage || isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.purchaseBtnText}>
                                    {selectedPackage && isMostPopular(selectedPackage)
                                        ? t('paywall.startTrial', 'Start 3-Day Free Trial')
                                        : t('paywall.subscribeNow', 'Subscribe Now')}
                                </Text>
                            )}
                        </Pressable>

                        <Pressable style={styles.restoreBtn} onPress={handleRestore}>
                            <Text style={styles.restoreBtnText}>
                                {t('paywall.restore', 'Restore Purchases')}
                            </Text>
                        </Pressable>

                        <Text style={styles.termsText}>
                            {t('paywall.terms', 'By subscribing you agree to our Terms of Service and Privacy Policy')}
                        </Text>
                    </View>
                </View>
            </BlurView>
        </Modal>
    )
}

export const PaywallModal = memo(PaywallModalComponent)

const styles = StyleSheet.create((theme) => ({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: theme.colors.surface,
        borderTopLeftRadius: theme.radius.xxl,
        borderTopRightRadius: theme.radius.xxl,
        maxHeight: '90%',
        ...theme.shadows.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: theme.spacing.md,
    },
    closeBtn: {
        padding: theme.spacing.sm,
    },
    scrollView: {
        flexGrow: 0,
    },
    scrollContent: {
        paddingHorizontal: theme.spacing.xl,
        paddingBottom: theme.spacing.lg,
    },
    iconContainer: {
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: theme.spacing.xl,
        marginTop: theme.spacing.md,
    },
    appIconWrapper: {
        position: 'relative',
    },
    appIcon: {
        width: 100,
        height: 100,
        borderRadius: 24,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    proBadge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 14,
        borderWidth: 4,
        borderColor: theme.colors.surface,
        flexDirection: 'row',
        alignItems: 'center',
    },
    proBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: theme.typography.weight.bold,
        letterSpacing: 0.5,
    },
    title: {
        fontSize: theme.typography.size.xxxl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: theme.spacing.xs,
    },
    subtitle: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: theme.spacing.xl,
    },
    featuresContainer: {
        gap: theme.spacing.md,
        marginBottom: theme.spacing.xl,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
    },
    featureText: {
        flex: 1,
    },
    featureTitle: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.text,
    },
    featureSub: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    packagesContainer: {
        gap: theme.spacing.md,
    },
    packageCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.lg,
        borderRadius: theme.radius.lg,
        borderWidth: 2,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.background,
        position: 'relative',
        overflow: 'hidden',
    },
    packageCardSelected: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primary + '10',
    },
    savingsBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: theme.colors.success,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 4,
        borderBottomLeftRadius: theme.radius.md,
    },
    popularBadge: {
        position: 'absolute',
        top: -12,
        left: 20,
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8,
        ...theme.shadows.sm,
    },
    popularBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    packageCardPopular: {
        marginTop: 12, // Space for the badge
    },
    savingsText: {
        fontSize: theme.typography.size.xs,
        fontWeight: theme.typography.weight.bold,
        color: '#fff',
    },
    radioOuter: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: theme.colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.md,
    },
    radioOuterSelected: {
        borderColor: theme.colors.primary,
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: theme.colors.primary,
    },
    packageInfo: {
        flex: 1,
    },
    packageLabel: {
        fontSize: theme.typography.size.lg,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.text,
    },
    packagePrice: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textSecondary,
    },
    errorText: {
        color: theme.colors.error,
        fontSize: theme.typography.size.sm,
        textAlign: 'center',
        marginTop: theme.spacing.md,
    },
    footer: {
        padding: theme.spacing.xl,
        paddingTop: theme.spacing.lg,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    purchaseBtn: {
        backgroundColor: theme.colors.primary,
        paddingVertical: theme.spacing.lg,
        borderRadius: theme.radius.lg,
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    purchaseBtnDisabled: {
        opacity: 0.5,
    },
    purchaseBtnText: {
        fontSize: theme.typography.size.lg,
        fontWeight: theme.typography.weight.bold,
        color: '#fff',
    },
    restoreBtn: {
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
    },
    restoreBtnText: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.primary,
    },
    termsText: {
        fontSize: theme.typography.size.xs,
        color: theme.colors.textMuted,
        textAlign: 'center',
        marginTop: theme.spacing.md,
        lineHeight: 16,
    },
}))
