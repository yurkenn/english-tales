import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    FlatList,
    NativeSyntheticEvent,
    NativeScrollEvent,
    Pressable,
    Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';
import { secureStorage } from '@/services/storage';
import { signInAnonymously } from '@/services/auth';
import { useSettingsStore } from '@/store/settingsStore';
import {
    OnboardingSlide,
    OnboardingLevelSelection,
    OnboardingTrackVisual,
    OnboardingConnectVisual,
    OnboardingPaywall
} from '@/components';

type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced';

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
        buttonLabel: 'Next',
    },
    {
        id: 'level',
        title: 'What\'s Your\nEnglish Level?',
        description: 'Help us personalize your reading experience by selecting your proficiency.',
        buttonLabel: 'Start Reading',
    },
];

export default function OnboardingScreen() {
    const router = useRouter();
    const flatListRef = useRef<FlatList>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedLevel, setSelectedLevel] = useState<ProficiencyLevel>('intermediate');
    const [isLoading, setIsLoading] = useState(false);
    const [showPaywall, setShowPaywall] = useState(false);
    const settingsActions = useSettingsStore((s) => s.actions);

    const handleNext = async () => {
        if (currentIndex < ONBOARDING_DATA.length - 1) {
            flatListRef.current?.scrollToIndex({
                index: currentIndex + 1,
                animated: true,
            });
        } else {
            setShowPaywall(true);
        }
    };

    const completeOnboarding = async () => {
        setIsLoading(true);
        try {
            // Save proficiency level
            await settingsActions.updateSettings({ proficiencyLevel: selectedLevel });
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

    const renderSlide = ({ item, index }: { item: typeof ONBOARDING_DATA[0], index: number }) => {
        const isLastSlide = index === ONBOARDING_DATA.length - 1;

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
                {item.id === 'track' && <OnboardingTrackVisual />}
                {item.id === 'connect' && <OnboardingConnectVisual />}
                {item.id === 'level' && (
                    <OnboardingLevelSelection
                        selectedLevel={selectedLevel}
                        onSelectLevel={setSelectedLevel}
                    />
                )}
            </OnboardingSlide>
        );
    };

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
                    {/* Skip Button - Only on first two slides */}
                    {currentIndex < ONBOARDING_DATA.length - 1 && (
                        <Pressable
                            style={styles.skipButton}
                            onPress={() => {
                                flatListRef.current?.scrollToIndex({
                                    index: ONBOARDING_DATA.length - 1,
                                    animated: true,
                                });
                            }}
                        >
                            <Text style={styles.skipText}>Skip</Text>
                        </Pressable>
                    )}
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create((theme) => ({
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
}));

