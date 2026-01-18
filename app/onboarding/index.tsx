import { useState, useRef, useCallback } from 'react';
import {
    View,
    FlatList,
    NativeSyntheticEvent,
    NativeScrollEvent,
    TouchableOpacity,
    Text,
    StyleSheet
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme, Theme } from '@/theme';
import { secureStorage } from '@/services/storage';
import { signInAnonymously } from '@/services/auth';
import { useSettingsStore } from '@/store/settingsStore';
import { haptics } from '@/utils/haptics';
import { analyticsService } from '@/services/firebase/analytics';
import {
    OnboardingSlide,
    OnboardingLevelSelection,
    OnboardingTrackVisual,
    OnboardingConnectVisual,
    OnboardingPaywall,
    OnboardingInterestsSelection,
    OnboardingGoalSetting,
    OnboardingNotificationPermission,
    OnboardingWelcomeVisual,
} from '@/components';

type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced';

const ONBOARDING_DATA = [
    {
        id: 'welcome',
        title: 'Welcome to\nEnglish Tales',
        description: 'Learn English naturally through engaging stories tailored to your level.',
        buttonLabel: 'Get Started',
    },
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
        buttonLabel: 'Next',
    },
    {
        id: 'interests',
        title: 'What Do You\nLove Reading?',
        description: 'Select your favorite genres to personalize your story recommendations.',
        buttonLabel: 'Next',
    },
    {
        id: 'goal',
        title: 'Set Your\nDaily Goal',
        description: 'Build a consistent reading habit with a daily goal that fits your schedule.',
        buttonLabel: 'Next',
    },
    {
        id: 'level',
        title: 'What\'s Your\nEnglish Level?',
        description: 'Help us personalize your reading experience by selecting your proficiency.',
        buttonLabel: 'Almost Done',
    },
    {
        id: 'notifications',
        title: 'Stay on Track',
        description: 'Get helpful reminders to maintain your streak and never miss new stories.',
        buttonLabel: 'Continue',
    },
];

export default function OnboardingScreen() {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const router = useRouter();
    const flatListRef = useRef<FlatList>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedLevel, setSelectedLevel] = useState<ProficiencyLevel>('intermediate');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [dailyGoal, setDailyGoal] = useState(15);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showPaywall, setShowPaywall] = useState(false);
    const settingsActions = useSettingsStore((s) => s.actions);

    // Log onboarding step
    const logStep = useCallback((step: number, stepName: string) => {
        analyticsService.logOnboardingStep(step, stepName);
    }, []);

    const handleNext = useCallback(async () => {
        const currentSlide = ONBOARDING_DATA[currentIndex];

        // Validation for interests slide
        if (currentSlide.id === 'interests' && selectedCategories.length < 2) {
            haptics.error();
            return;
        }

        // Log step completion
        logStep(currentIndex + 1, currentSlide.id);

        if (currentIndex < ONBOARDING_DATA.length - 1) {
            flatListRef.current?.scrollToIndex({
                index: currentIndex + 1,
                animated: true,
            });
        } else {
            // On last slide, show paywall
            setShowPaywall(true);
        }
    }, [currentIndex, selectedCategories.length, logStep]);

    const handleNotificationPermissionGranted = useCallback(() => {
        setNotificationsEnabled(true);
        haptics.success();
        setShowPaywall(true);
    }, []);

    const handleNotificationSkip = useCallback(() => {
        setNotificationsEnabled(false);
        setShowPaywall(true);
    }, []);

    const completeOnboarding = async () => {
        setIsLoading(true);
        try {
            // Save all preferences
            await settingsActions.updateSettings({
                proficiencyLevel: selectedLevel,
                dailyGoalMinutes: dailyGoal,
                notificationsEnabled,
            });

            // Log completion
            await analyticsService.logOnboardingComplete({
                selectedLevel,
                selectedCategories,
                dailyGoal,
                notificationsEnabled,
            });

            // Sign in as guest
            await signInAnonymously();
            // Mark onboarding as completed
            await secureStorage.setOnboardingComplete();
            router.replace('/(tabs)');
        } catch (error) {
            console.error('Onboarding completion error:', error);
            // Still navigate even if anonymous sign-in fails
            await secureStorage.setOnboardingComplete();
            router.replace('/(tabs)');
        } finally {
            setIsLoading(false);
        }
    };

    const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const slideSize = event.nativeEvent.layoutMeasurement.width;
        const index = event.nativeEvent.contentOffset.x / slideSize;
        const roundIndex = Math.round(index);
        if (roundIndex !== currentIndex) {
            setCurrentIndex(roundIndex);
        }
    }, [currentIndex]);

    const renderSlideContent = (slideId: string) => {
        switch (slideId) {
            case 'welcome':
                return <OnboardingWelcomeVisual />;
            case 'track':
                return <OnboardingTrackVisual />;
            case 'connect':
                return <OnboardingConnectVisual />;
            case 'interests':
                return (
                    <OnboardingInterestsSelection
                        selectedCategories={selectedCategories}
                        onSelectCategory={setSelectedCategories}
                    />
                );
            case 'goal':
                return (
                    <OnboardingGoalSetting
                        selectedGoal={dailyGoal}
                        onSelectGoal={setDailyGoal}
                    />
                );
            case 'level':
                return (
                    <OnboardingLevelSelection
                        selectedLevel={selectedLevel}
                        onSelectLevel={setSelectedLevel}
                    />
                );
            case 'notifications':
                return (
                    <OnboardingNotificationPermission
                        onPermissionGranted={handleNotificationPermissionGranted}
                        onSkip={handleNotificationSkip}
                    />
                );
            default:
                return null;
        }
    };

    const renderSlide = ({ item, index }: { item: typeof ONBOARDING_DATA[0], index: number }) => {
        const isLastSlide = index === ONBOARDING_DATA.length - 1;
        const isNotificationSlide = item.id === 'notifications';

        // For notification slide, don't show the standard button
        if (isNotificationSlide) {
            return (
                <OnboardingSlide
                    title={item.title}
                    description={item.description}
                    buttonLabel=""
                    currentIndex={currentIndex}
                    totalSlides={ONBOARDING_DATA.length}
                    onNext={() => { }}
                    isLoading={false}
                >
                    {renderSlideContent(item.id)}
                </OnboardingSlide>
            );
        }

        return (
            <OnboardingSlide
                title={item.title}
                description={item.description}
                buttonLabel={item.buttonLabel}
                currentIndex={currentIndex}
                totalSlides={ONBOARDING_DATA.length}
                onNext={handleNext}
                isLoading={isLastSlide && isLoading}
                showLoginLink={isLastSlide}
                onLoginPress={() => router.push('/(auth)/login')}
            >
                {renderSlideContent(item.id)}
            </OnboardingSlide>
        );
    };

    const handleSkip = useCallback(() => {
        haptics.selection();
        analyticsService.logOnboardingSkip(currentIndex);
        // Skip to level selection (second to last non-notification slide)
        const levelIndex = ONBOARDING_DATA.findIndex(s => s.id === 'level');
        flatListRef.current?.scrollToIndex({
            index: levelIndex,
            animated: true,
        });
    }, [currentIndex]);

    return (
        <View style={styles.container}>
            {showPaywall ? (
                <OnboardingPaywall
                    onClose={completeOnboarding}
                    onSuccess={completeOnboarding}
                />
            ) : (
                <>
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
                    {/* Skip Button - Only on first few slides */}
                    {currentIndex < 3 && (
                        <TouchableOpacity
                            style={styles.skipButton}
                            onPress={handleSkip}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.skipText}>Skip</Text>
                        </TouchableOpacity>
                    )}
                </>
            )}
        </View>
    );
}

function createStyles(theme: Theme) {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
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
    });
}
