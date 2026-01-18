/**
 * Analytics Service - Native Firebase Modular API
 */
import { getAnalytics, logEvent, setUserId, setUserProperties } from '@react-native-firebase/analytics'
import { analyticsLogger as logger } from '@/utils/logger'

const analytics = getAnalytics()

class AnalyticsService {
    async logScreenView(screenName: string, screenClass?: string) {
        logger.log(`logScreenView: ${screenName}`)
        try {
            // Using logEvent with screen_view as per Firebase v22 migration
            // Type assertion needed as screen_view is a valid Firebase event
            await logEvent(analytics, 'screen_view' as any, {
                screen_name: screenName,
                screen_class: screenClass || screenName,
            })
        } catch (error) {
            logger.error('logScreenView failed', error)
        }
    }

    async logEvent(name: string, params: Record<string, any> = {}) {
        logger.log(`logEvent: ${name}`, params)
        try {
            await logEvent(analytics, name, params)
        } catch (error) {
            logger.error(`logEvent "${name}" failed`, error)
        }
    }

    async setUserId(userId: string | null) {
        logger.log(`setUserId: ${userId}`)
        try {
            await setUserId(analytics, userId)
        } catch (error) {
            logger.error('setUserId failed', error)
        }
    }

    async setUserProperties(properties: Record<string, string | null>) {
        logger.log('setUserProperties', properties)
        try {
            await setUserProperties(analytics, properties)
        } catch (error) {
            logger.error('setUserProperties failed', error)
        }
    }

    // ========== Onboarding Funnel ==========
    async logOnboardingStep(step: number, stepName: string) {
        await this.logEvent('onboarding_step', { step, step_name: stepName })
    }

    async logOnboardingComplete(params: {
        selectedLevel: string;
        selectedCategories: string[];
        dailyGoal: number;
        notificationsEnabled: boolean;
    }) {
        await this.logEvent('onboarding_complete', {
            selected_level: params.selectedLevel,
            selected_categories: params.selectedCategories.join(','),
            daily_goal: params.dailyGoal,
            notifications_enabled: params.notificationsEnabled,
        })
    }

    async logOnboardingSkip(lastStep: number) {
        await this.logEvent('onboarding_skip', { last_step: lastStep })
    }

    // ========== Subscription Funnel ==========
    async logPaywallViewed(source: string, variant?: string) {
        await this.logEvent('paywall_viewed', { source, variant: variant || 'default' })
    }

    async logSubscriptionStarted(plan: string) {
        await this.logEvent('subscription_started', { plan })
    }

    async logSubscriptionCompleted(plan: string, price?: number, currency?: string) {
        await this.logEvent('subscription_completed', { plan, price, currency })
    }

    async logSubscriptionCancelled(reason?: string) {
        await this.logEvent('subscription_cancelled', { reason: reason || 'unknown' })
    }

    async logSubscriptionRestored() {
        await this.logEvent('subscription_restored', {})
    }

    // ========== Reading Events ==========
    async logFirstStoryStarted(storyId: string, storyTitle?: string) {
        await this.logEvent('first_story_started', { story_id: storyId, story_title: storyTitle })
    }

    async logFirstStoryCompleted(storyId: string, storyTitle?: string) {
        await this.logEvent('first_story_completed', { story_id: storyId, story_title: storyTitle })
    }

    async logStoryStarted(storyId: string, params?: { title?: string; difficulty?: string; isUserStory?: boolean }) {
        await this.logEvent('story_started', {
            story_id: storyId,
            story_title: params?.title,
            difficulty: params?.difficulty,
            is_user_story: params?.isUserStory,
        })
    }

    async logStoryCompleted(storyId: string, params?: { title?: string; difficulty?: string; isUserStory?: boolean }) {
        await this.logEvent('story_completed', {
            story_id: storyId,
            story_title: params?.title,
            difficulty: params?.difficulty,
            is_user_story: params?.isUserStory,
        })
    }

    async logReadingSessionEnd(params: {
        storyId: string;
        durationSeconds: number;
        pagesRead: number;
        completionPercentage: number;
    }) {
        await this.logEvent('reading_session_end', {
            story_id: params.storyId,
            duration_seconds: params.durationSeconds,
            pages_read: params.pagesRead,
            completion_percentage: params.completionPercentage,
        })
    }

    async logWordLookup(word: string, storyId?: string) {
        await this.logEvent('word_lookup', { word, story_id: storyId })
    }

    // ========== Engagement Events ==========
    async logDailyGoalReached(minutes: number) {
        await this.logEvent('daily_goal_reached', { minutes })
    }

    async logStreakMilestone(days: number) {
        await this.logEvent('streak_milestone', { days })
    }

    async logAchievementUnlocked(achievementId: string, achievementName: string) {
        await this.logEvent('achievement_unlocked', { achievement_id: achievementId, achievement_name: achievementName })
    }

    async logShareContent(contentType: 'story' | 'achievement' | 'progress' | 'referral', contentId?: string) {
        await this.logEvent('share_content', { content_type: contentType, content_id: contentId })
    }

    // ========== Referral Events ==========
    async logReferralLinkCreated(userId: string) {
        await this.logEvent('referral_link_created', { user_id: userId })
    }

    async logReferralLinkShared(platform?: string) {
        await this.logEvent('referral_link_shared', { platform })
    }

    async logReferralCodeEntered(code: string) {
        await this.logEvent('referral_code_entered', { code })
    }

    async logReferralJoined(referrerCode: string) {
        await this.logEvent('referral_joined', { referrer_code: referrerCode })
    }

    async logReferralRewardEarned(rewardType: string, referredUserId: string) {
        await this.logEvent('referral_reward_earned', { reward_type: rewardType, referred_user_id: referredUserId })
    }

    // ========== Notification Events ==========
    async logNotificationReceived(type: string) {
        await this.logEvent('notification_received', { notification_type: type })
    }

    async logNotificationOpened(type: string, action?: string) {
        await this.logEvent('notification_opened', { notification_type: type, action })
    }

    // ========== Social Events ==========
    async logPostCreated(postId: string) {
        await this.logEvent('post_created', { post_id: postId })
    }

    async logCommentAdded(postId: string) {
        await this.logEvent('comment_added', { post_id: postId })
    }

    async logFollowAuthor(authorId: string) {
        await this.logEvent('follow_author', { author_id: authorId })
    }

    // ========== User Story Events ==========
    async logUserStoryCreated(storyId: string) {
        await this.logEvent('user_story_created', { story_id: storyId })
    }

    async logUserStoryPublished(storyId: string) {
        await this.logEvent('user_story_published', { story_id: storyId })
    }
}

export const analyticsService = new AnalyticsService()
