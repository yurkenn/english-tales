import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme, Theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useResponsiveGrid } from '@/hooks/useResponsiveGrid';

interface OnboardingSlideProps {
    title: string;
    description: string;
    buttonLabel: string;
    currentIndex: number;
    totalSlides: number;
    isLoading?: boolean;
    onNext: () => void;
    onLoginPress?: () => void;
    showLoginLink?: boolean;
    children: React.ReactNode;
}

export const OnboardingSlide = ({
    title,
    description,
    buttonLabel,
    currentIndex,
    totalSlides,
    isLoading = false,
    onNext,
    onLoginPress,
    showLoginLink = false,
    children,
}: OnboardingSlideProps) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const { windowWidth } = useResponsiveGrid();

    return (
        <View style={[styles.slide, { width: windowWidth }]}>
            {/* Visual Area */}
            <View style={styles.visualContainer}>
                {children}
            </View>

            {/* Content Area */}
            <View style={styles.contentContainer}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.description}>{description}</Text>

                {/* Indicators */}
                <View style={styles.indicators}>
                    {Array.from({ length: totalSlides }).map((_, i) => (
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
                <TouchableOpacity
                    style={[styles.button, isLoading && styles.buttonDisabled]}
                    onPress={onNext}
                    disabled={isLoading}
                    activeOpacity={0.8}
                >
                    {isLoading ? (
                        <ActivityIndicator color={theme.colors.textInverse} />
                    ) : (
                        <>
                            <Text style={styles.buttonText}>{buttonLabel}</Text>
                            <Ionicons name="arrow-forward" size={24} color={theme.colors.textInverse} />
                        </>
                    )}
                </TouchableOpacity>

                {showLoginLink && onLoginPress && (
                    <TouchableOpacity style={styles.linkButton} onPress={onLoginPress} activeOpacity={0.7}>
                        <Text style={styles.linkText}>
                            Already have an account? <Text style={styles.linkHighlight}>Log In</Text>
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
    slide: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    visualContainer: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        paddingVertical: 16,
    },
    contentContainer: {
        flex: 1,
        width: '100%',
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 0,
        paddingBottom: 40,
    },
    title: {
        fontSize: theme.typography.size.xxl,
        fontWeight: 'bold',
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: 12,
        lineHeight: 32,
    },
    description: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textMuted,
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
        maxWidth: 280,
    },
    indicators: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 20,
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
    buttonDisabled: {
        opacity: 0.7,
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
});
