/**
 * Rating Service - Smart App Rating Prompt
 * Implements intelligent triggers for requesting app ratings
 */
import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { analyticsService } from './firebase/analytics';
import { AnalyticsEvents } from './firebase/analyticsEvents';

const STORAGE_KEY = '@english_tales_rating';

interface RatingState {
    positiveActionCount: number;
    lastPromptDate: string | null;
    hasRated: boolean;
    storiesCompleted: number;
    maxStreak: number;
    achievementsUnlocked: number;
    promptCount: number;
}

const DEFAULT_STATE: RatingState = {
    positiveActionCount: 0,
    lastPromptDate: null,
    hasRated: false,
    storiesCompleted: 0,
    maxStreak: 0,
    achievementsUnlocked: 0,
    promptCount: 0,
};

// Configuration
const CONFIG = {
    MIN_STORIES_FOR_PROMPT: 3,
    MIN_STREAK_FOR_PROMPT: 7,
    MIN_ACHIEVEMENTS_FOR_PROMPT: 2,
    MIN_POSITIVE_ACTIONS: 5,
    DAYS_BETWEEN_PROMPTS: 30,
    MAX_PROMPTS: 3,
};

class RatingService {
    private state: RatingState = DEFAULT_STATE;
    private isInitialized = false;

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                this.state = { ...DEFAULT_STATE, ...JSON.parse(stored) };
            }
            this.isInitialized = true;
        } catch (error) {
            console.warn('[RatingService] Failed to load state:', error);
            this.isInitialized = true;
        }
    }

    private async saveState(): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        } catch (error) {
            console.warn('[RatingService] Failed to save state:', error);
        }
    }

    /**
     * Record a positive user action
     */
    async recordPositiveAction(
        type: 'story_complete' | 'streak_milestone' | 'achievement' | 'quiz_success'
    ): Promise<void> {
        await this.initialize();

        this.state.positiveActionCount += 1;

        switch (type) {
            case 'story_complete':
                this.state.storiesCompleted += 1;
                break;
            case 'achievement':
                this.state.achievementsUnlocked += 1;
                break;
        }

        await this.saveState();

        // Check if we should prompt
        const shouldPrompt = await this.shouldPromptRating();
        if (shouldPrompt) {
            await this.promptRating(type);
        }
    }

    /**
     * Update max streak
     */
    async updateStreak(streak: number): Promise<void> {
        await this.initialize();

        if (streak > this.state.maxStreak) {
            this.state.maxStreak = streak;
            await this.saveState();

            // Check for streak milestone prompt
            if (streak >= CONFIG.MIN_STREAK_FOR_PROMPT) {
                const shouldPrompt = await this.shouldPromptRating();
                if (shouldPrompt) {
                    await this.promptRating('streak_milestone');
                }
            }
        }
    }

    /**
     * Check if we should show rating prompt
     */
    async shouldPromptRating(): Promise<boolean> {
        await this.initialize();

        // Already rated
        if (this.state.hasRated) {
            return false;
        }

        // Max prompts reached
        if (this.state.promptCount >= CONFIG.MAX_PROMPTS) {
            return false;
        }

        // Check time since last prompt
        if (this.state.lastPromptDate) {
            const lastPrompt = new Date(this.state.lastPromptDate);
            const daysSinceLastPrompt = Math.floor(
                (Date.now() - lastPrompt.getTime()) / (1000 * 60 * 60 * 24)
            );
            if (daysSinceLastPrompt < CONFIG.DAYS_BETWEEN_PROMPTS) {
                return false;
            }
        }

        // Check store review availability
        const isAvailable = await StoreReview.isAvailableAsync();
        if (!isAvailable) {
            return false;
        }

        // Check positive action thresholds
        const meetsStoriesThreshold = this.state.storiesCompleted >= CONFIG.MIN_STORIES_FOR_PROMPT;
        const meetsStreakThreshold = this.state.maxStreak >= CONFIG.MIN_STREAK_FOR_PROMPT;
        const meetsAchievementsThreshold = this.state.achievementsUnlocked >= CONFIG.MIN_ACHIEVEMENTS_FOR_PROMPT;
        const meetsActionThreshold = this.state.positiveActionCount >= CONFIG.MIN_POSITIVE_ACTIONS;

        // Need at least one threshold met plus general positive actions
        return meetsActionThreshold && (meetsStoriesThreshold || meetsStreakThreshold || meetsAchievementsThreshold);
    }

    /**
     * Show rating prompt
     */
    async promptRating(
        trigger: 'story_complete' | 'streak_milestone' | 'achievement' | 'quiz_success'
    ): Promise<boolean> {
        await this.initialize();

        try {
            // Log analytics
            await analyticsService.logEvent(AnalyticsEvents.RATING_PROMPT_SHOWN, {
                trigger,
                stories_completed: this.state.storiesCompleted,
                current_streak: this.state.maxStreak,
                prompt_count: this.state.promptCount + 1,
            });

            // Request review
            await StoreReview.requestReview();

            // Update state
            this.state.lastPromptDate = new Date().toISOString();
            this.state.promptCount += 1;
            await this.saveState();

            // Log accepted (we can't know for sure if they rated, but they saw the prompt)
            await analyticsService.logEvent(AnalyticsEvents.RATING_PROMPT_ACCEPTED, { trigger });

            return true;
        } catch (error) {
            console.warn('[RatingService] Failed to request review:', error);
            return false;
        }
    }

    /**
     * Mark as rated (if user confirms they rated)
     */
    async markAsRated(): Promise<void> {
        await this.initialize();
        this.state.hasRated = true;
        await this.saveState();
    }

    /**
     * Get current state for debugging
     */
    async getState(): Promise<RatingState> {
        await this.initialize();
        return { ...this.state };
    }

    /**
     * Reset state (for testing)
     */
    async reset(): Promise<void> {
        this.state = DEFAULT_STATE;
        await AsyncStorage.removeItem(STORAGE_KEY);
    }
}

export const ratingService = new RatingService();
