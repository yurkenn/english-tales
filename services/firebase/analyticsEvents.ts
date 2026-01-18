/**
 * Analytics Events - Type-safe event definitions
 * Provides consistent event naming and parameter typing
 */

// Event names as constants
export const AnalyticsEvents = {
    // Onboarding Funnel
    ONBOARDING_STEP: 'onboarding_step',
    ONBOARDING_COMPLETE: 'onboarding_complete',
    ONBOARDING_SKIP: 'onboarding_skip',

    // Subscription Funnel
    PAYWALL_VIEWED: 'paywall_viewed',
    SUBSCRIPTION_STARTED: 'subscription_started',
    SUBSCRIPTION_COMPLETED: 'subscription_completed',
    SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
    SUBSCRIPTION_RESTORED: 'subscription_restored',

    // Reading Events
    FIRST_STORY_STARTED: 'first_story_started',
    FIRST_STORY_COMPLETED: 'first_story_completed',
    STORY_STARTED: 'story_started',
    STORY_COMPLETED: 'story_completed',
    READING_SESSION_END: 'reading_session_end',
    WORD_LOOKUP: 'word_lookup',

    // Engagement Events
    DAILY_GOAL_REACHED: 'daily_goal_reached',
    STREAK_MILESTONE: 'streak_milestone',
    ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
    SHARE_CONTENT: 'share_content',
    NOTIFICATION_RECEIVED: 'notification_received',
    NOTIFICATION_OPENED: 'notification_opened',

    // Referral Events
    REFERRAL_LINK_CREATED: 'referral_link_created',
    REFERRAL_LINK_SHARED: 'referral_link_shared',
    REFERRAL_CODE_ENTERED: 'referral_code_entered',
    REFERRAL_JOINED: 'referral_joined',
    REFERRAL_REWARD_EARNED: 'referral_reward_earned',

    // Rating Events
    RATING_PROMPT_SHOWN: 'rating_prompt_shown',
    RATING_PROMPT_ACCEPTED: 'rating_prompt_accepted',
    RATING_PROMPT_DISMISSED: 'rating_prompt_dismissed',

    // Ad Events
    AD_LOADED: 'ad_loaded',
    AD_SHOWN: 'ad_shown',
    AD_CLICKED: 'ad_clicked',
    AD_REWARDED: 'ad_rewarded',
    AD_FAILED: 'ad_failed',

    // Social Events
    POST_CREATED: 'post_created',
    COMMENT_ADDED: 'comment_added',
    LIKE_ADDED: 'like_added',
    FOLLOW_AUTHOR: 'follow_author',

    // User Story Events
    USER_STORY_CREATED: 'user_story_created',
    USER_STORY_PUBLISHED: 'user_story_published',
    USER_STORY_READ: 'user_story_read',
} as const;

// Parameter interfaces
export interface OnboardingStepParams {
    step: number;
    step_name: string;
}

export interface OnboardingCompleteParams {
    selected_level: string;
    selected_categories: string[];
    daily_goal: number;
    notifications_enabled: boolean;
}

export interface PaywallViewedParams {
    source: 'onboarding' | 'story_unlock' | 'settings' | 'streak_protection' | 'manual';
    variant?: string;
}

export interface SubscriptionParams {
    plan: 'monthly' | 'yearly' | 'lifetime';
    price?: number;
    currency?: string;
}

export interface StoryEventParams {
    story_id: string;
    story_title?: string;
    difficulty?: string;
    category?: string;
    is_user_story?: boolean;
}

export interface ReadingSessionParams {
    story_id: string;
    duration_seconds: number;
    pages_read: number;
    completion_percentage: number;
}

export interface ShareContentParams {
    content_type: 'story' | 'achievement' | 'progress' | 'referral';
    content_id?: string;
    platform?: string;
}

export interface StreakMilestoneParams {
    days: number;
    milestone_type: '3' | '7' | '14' | '30' | '60' | '90' | '365';
}

export interface ReferralParams {
    referral_code?: string;
    referrer_id?: string;
    reward_type?: string;
}

export interface NotificationParams {
    notification_type: 'streak_reminder' | 'daily_bonus' | 'new_story' | 'inactivity' | 'social';
    action?: string;
}

export interface RatingPromptParams {
    trigger: 'story_complete' | 'streak_milestone' | 'achievement' | 'quiz_success';
    stories_completed?: number;
    current_streak?: number;
}

// Type for all event parameters
export type AnalyticsEventParams =
    | OnboardingStepParams
    | OnboardingCompleteParams
    | PaywallViewedParams
    | SubscriptionParams
    | StoryEventParams
    | ReadingSessionParams
    | ShareContentParams
    | StreakMilestoneParams
    | ReferralParams
    | NotificationParams
    | RatingPromptParams
    | Record<string, string | number | boolean | string[]>;
