/**
 * OnboardingPaywall
 * High-conversion sales screen inspired by top-tier apps
 * Features:
 * - Dynamic theming via Unistyles
 * - Clear value proposition
 * - Toggle for trial activation
 * - High contrast CTA
 */

import React, { memo, useCallback, useState, useEffect } from 'react'
import { View, Text, Pressable, ActivityIndicator, Dimensions, Switch, Platform } from 'react-native'
import { useTheme, Theme } from '@/theme';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons'
import { useSubscriptionStore } from '@/store/subscriptionStore'
import { PurchasesPackage } from 'react-native-purchases'
import { useTranslation } from 'react-i18next'
import { haptics } from '@/utils/haptics'
import Animated, { FadeInDown } from 'react-native-reanimated'

const { width } = Dimensions.get('window')

interface OnboardingPaywallProps {
    onClose: () => void
    onSuccess: () => void
}

const PREMIUM_FEATURES = [
    { icon: 'infinite', title: 'Unlimited Translations', sub: 'Understand every word instantly' },
    { icon: 'flame', title: 'Stay disciplined with streaks', sub: 'Build a daily learning habit' },
    { icon: 'shield-checkmark', title: 'Your data stays on your phone', sub: 'Privacy first, always' },
    { icon: 'ban', title: 'No ads, ever', sub: 'Distraction-free reading' },
]

function OnboardingPaywallComponent({ onClose, onSuccess }: OnboardingPaywallProps) {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const { t } = useTranslation()
    const [isTrialEnabled, setIsTrialEnabled] = useState(true)

    // RevenueCat Data
    const packages = useSubscriptionStore((s) => s.packages)
    const isLoading = useSubscriptionStore((s) => s.isLoading)
    const actions = useSubscriptionStore((s) => s.actions)

    // Derived State
    const annualPackage = packages.find(p => p.identifier.toLowerCase().includes('annual') || p.identifier.toLowerCase().includes('yearly'))
    const monthlyPackage = packages.find(p => p.identifier.toLowerCase().includes('monthly'))
    const weeklyPackage = packages.find(p => p.identifier.toLowerCase().includes('weekly')) || packages[0]

    const [selectedPkg, setSelectedPkg] = useState<PurchasesPackage | null>(null)

    // Effect: Select weekly by default if available, otherwise annual
    useEffect(() => {
        if (packages.length > 0 && !selectedPkg) {
            if (weeklyPackage) {
                setSelectedPkg(weeklyPackage)
            } else if (annualPackage) {
                setSelectedPkg(annualPackage)
            }
        }
    }, [packages, selectedPkg, weeklyPackage, annualPackage])

    // Toggle logic
    const toggleTrial = (value: boolean) => {
        haptics.selection()
        setIsTrialEnabled(value)

        if (value) {
            if (weeklyPackage) setSelectedPkg(weeklyPackage)
        } else {
            // Recommendation: Switch to annual if trial disabled, as it's best value 
            if (annualPackage) setSelectedPkg(annualPackage)
        }
    }

    const handlePurchase = useCallback(async () => {
        if (!selectedPkg) return

        haptics.selection()
        const success = await actions.purchase(selectedPkg)
        if (success) {
            haptics.success()
            onSuccess()
        }
    }, [selectedPkg, actions, onSuccess])

    const handleRestore = async () => {
        haptics.selection()
        await actions.restore()
    }

    // Calculations for UI
    const annualPrice = annualPackage?.product.price || 0
    const weeklyPrice = weeklyPackage?.product.price || 0
    const monthlyPrice = monthlyPackage?.product.price || 0

    // Savings calculations (anchor against monthly if available, else weekly)
    const yearlyFullPrice = monthlyPrice > 0 ? monthlyPrice * 12 : weeklyPrice * 52
    const savingsPercent = yearlyFullPrice > 0 ? Math.round(((yearlyFullPrice - annualPrice) / yearlyFullPrice) * 100) : 88

    // Theme Colors
    const goldColor = theme.colors.warning
    const activeBorderColor = theme.colors.text
    const ctaColor = theme.colors.primary

    return (
        <View style={styles.container}>
            <View style={styles.contentContainer}>
                {/* Header Section */}
                <View style={styles.header}>
                    <Pressable onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
                    </Pressable>

                    <Animated.Image
                        entering={FadeInDown.delay(100).springify()}
                        source={require('@/assets/icon.png')}
                        style={styles.mascot}
                    />

                    <Animated.Text entering={FadeInDown.delay(200)} style={styles.title}>
                        Unlimited Access
                    </Animated.Text>
                </View>

                {/* Features List */}
                <View style={styles.features}>
                    {PREMIUM_FEATURES.map((feature, idx) => (
                        <Animated.View
                            key={idx}
                            entering={FadeInDown.delay(300 + (idx * 100))}
                            style={styles.featureRow}
                        >
                            <Ionicons name={feature.icon as any} size={22} color={goldColor} />
                            <View style={styles.featureTextContainer}>
                                <Text style={styles.featureTitle}>{feature.title}</Text>
                            </View>
                        </Animated.View>
                    ))}
                </View>

                <View style={{ flex: 1 }} />

                {/* Plans Section */}
                <Animated.View entering={FadeInDown.delay(700)} style={styles.plansContainer}>

                    {/* Yearly Plan (Best Value) */}
                    {annualPackage && (
                        <Pressable
                            style={[
                                styles.planCard,
                                selectedPkg?.identifier === annualPackage.identifier && { borderColor: activeBorderColor }
                            ]}
                            onPress={() => {
                                haptics.selection()
                                setSelectedPkg(annualPackage)
                                setIsTrialEnabled(false)
                            }}
                        >
                            <View style={styles.planContent}>
                                <View style={styles.planHeader}>
                                    <Text style={styles.planTitle}>Yearly Plan</Text>
                                    <View style={[styles.saveBadge, { backgroundColor: theme.colors.error }]}>
                                        <Text style={styles.saveText}>SAVE {savingsPercent}%</Text>
                                    </View>
                                </View>
                                <View style={styles.priceRow}>
                                    {yearlyFullPrice > 0 && <Text style={styles.oldPrice}>{(yearlyFullPrice).toFixed(2)}</Text>}
                                    <Text style={styles.newPrice}>{annualPackage.product.priceString}</Text>
                                    <Text style={styles.perYear}>/year</Text>
                                </View>
                            </View>
                            <View style={[
                                styles.radio,
                                selectedPkg?.identifier === annualPackage.identifier && { borderColor: activeBorderColor, backgroundColor: activeBorderColor }
                            ]} />
                        </Pressable>
                    )}

                    {/* Monthly Plan (Flexible) - Only show if trial is disabled or as secondary option */}
                    {monthlyPackage && !isTrialEnabled && (
                        <Pressable
                            style={[
                                styles.planCard,
                                selectedPkg?.identifier === monthlyPackage.identifier && { borderColor: activeBorderColor }
                            ]}
                            onPress={() => {
                                haptics.selection()
                                setSelectedPkg(monthlyPackage)
                                setIsTrialEnabled(false)
                            }}
                        >
                            <View style={styles.planContent}>
                                <View style={styles.planHeader}>
                                    <Text style={styles.planTitle}>Monthly Plan</Text>
                                </View>
                                <View style={styles.priceRow}>
                                    <Text style={styles.newPrice}>{monthlyPackage.product.priceString}</Text>
                                    <Text style={styles.perYear}>/month</Text>
                                </View>
                            </View>
                            <View style={[
                                styles.radio,
                                selectedPkg?.identifier === monthlyPackage.identifier && { borderColor: activeBorderColor, backgroundColor: activeBorderColor }
                            ]} />
                        </Pressable>
                    )}

                    {/* Trial / Weekly Plan */}
                    {weeklyPackage && (
                        <Pressable
                            style={[
                                styles.planCard,
                                styles.trialCard,
                                selectedPkg?.identifier === weeklyPackage.identifier && { borderColor: goldColor, borderWidth: 2 }
                            ]}
                            onPress={() => {
                                haptics.selection()
                                setSelectedPkg(weeklyPackage)
                                setIsTrialEnabled(true)
                            }}
                        >
                            <View style={styles.planContent}>
                                <View style={styles.planHeader}>
                                    <Text style={styles.planTitle}>3-Day Trial</Text>
                                    <View style={[styles.freeBadge, { backgroundColor: goldColor }]}>
                                        <Text style={styles.freeText}>FREE</Text>
                                    </View>
                                </View>
                                <Text style={styles.trialSub}>
                                    then {weeklyPackage.product.priceString} per week
                                </Text>
                            </View>
                            <Ionicons
                                name="checkmark-circle"
                                size={24}
                                color={selectedPkg?.identifier === weeklyPackage.identifier ? goldColor : theme.colors.textSecondary}
                            />
                        </Pressable>
                    )}

                    {/* Trial Toggle */}
                    <View style={styles.toggleRow}>
                        <Text style={styles.toggleText}>Free Trial Enabled</Text>
                        <Switch
                            value={isTrialEnabled}
                            onValueChange={toggleTrial}
                            trackColor={{ false: theme.colors.border, true: theme.colors.success }}
                            thumbColor={'#FFF'}
                            ios_backgroundColor={theme.colors.border}
                        />
                    </View>

                    {/* CTA Button */}
                    <Pressable
                        style={[
                            styles.ctaButton,
                            styles.shadow,
                            { backgroundColor: ctaColor, shadowColor: ctaColor }
                        ]}
                        onPress={handlePurchase}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.ctaText}>
                                {isTrialEnabled ? 'Try for Free' : 'Subscribe'} {'>'}
                            </Text>
                        )}
                    </Pressable>

                    {/* Footer Links */}
                    <View style={styles.footerLinks}>
                        <Pressable onPress={handleRestore}>
                            <Text style={styles.linkText}>Restore</Text>
                        </Pressable>
                        <Text style={styles.linkText}>•</Text>
                        <Pressable>
                            <Text style={styles.linkText}>Terms</Text>
                        </Pressable>
                        <Text style={styles.linkText}>•</Text>
                        <Pressable>
                            <Text style={styles.linkText}>Privacy</Text>
                        </Pressable>
                    </View>

                </Animated.View>
            </View>
        </View>
    )
}

export const OnboardingPaywall = memo(OnboardingPaywallComponent)

const createStyles = (theme: Theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        paddingTop: Platform.OS === 'android' ? 40 : 0,
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 24,
        paddingBottom: 40,
        paddingTop: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
        position: 'relative',
    },
    closeButton: {
        position: 'absolute',
        right: 0,
        top: 0,
        padding: 5,
        zIndex: 10,
    },
    mascot: {
        width: 100,
        height: 100,
        marginBottom: 20,
        marginTop: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: theme.colors.text,
        textAlign: 'center',
    },
    features: {
        gap: 16,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    featureTextContainer: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: theme.colors.text,
    },
    plansContainer: {
        gap: 12,
    },
    planCard: {
        backgroundColor: theme.colors.surfaceElevated,
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    trialCard: {
        // Default style for trial card
    },
    planContent: {
        flex: 1,
    },
    planHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    planTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text,
    },
    saveBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    saveText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '800',
    },
    freeBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    freeText: {
        color: '#000',
        fontSize: 10,
        fontWeight: '800',
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    oldPrice: {
        color: theme.colors.textSecondary,
        textDecorationLine: 'line-through',
        fontSize: 14,
    },
    newPrice: {
        color: theme.colors.text,
        fontWeight: '600',
        fontSize: 14,
    },
    perYear: {
        color: theme.colors.textSecondary,
        fontSize: 14,
    },
    trialSub: {
        color: theme.colors.textSecondary,
        fontSize: 13,
    },
    radio: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: theme.colors.textSecondary,
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceElevated,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 16,
        marginTop: 4,
        marginBottom: 12,
    },
    toggleText: {
        color: theme.colors.text,
        fontSize: 13,
        fontWeight: '600',
    },
    ctaButton: {
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    shadow: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    ctaText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
    },
    footerLinks: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
    },
    linkText: {
        color: theme.colors.textSecondary,
        fontSize: 12,
        fontWeight: '500',
    },
});
