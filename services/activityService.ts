/**
 * Activity Service - Native Firebase Firestore Modular API
 */
import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
} from '@react-native-firebase/firestore';
import { communityService } from './communityService';
import { Result } from '@/types/api';
import { ActivityType } from '@/types';

const db = getFirestore();

export interface Achievement {
    id: string;
    type: ActivityType;
    title: string;
    description: string;
    threshold: number;
    metadata?: any;
}

const MILESTONES: Achievement[] = [
    { id: 'stories_5', type: 'achievement', title: 'Avid Reader', description: 'Read 5 stories!', threshold: 5 },
    { id: 'stories_10', type: 'achievement', title: 'Literature Enthusiast', description: 'Read 10 stories!', threshold: 10 },
    { id: 'streak_3', type: 'milestone', title: 'Consistent Learner', description: 'Reached a 3-day reading streak!', threshold: 3 },
    { id: 'streak_7', type: 'milestone', title: 'Unstoppable', description: 'Reached a 7-day reading streak!', threshold: 7 },
    { id: 'first_review', type: 'share', title: 'Social Critic', description: 'Shared your first story review!', threshold: 1 },
];

class ActivityService {
    private ACHIEVEMENTS_COLLECTION = 'user_achievements';

    async checkAndPostMilestones(
        userId: string,
        userName: string,
        userPhoto: string | null,
        stats: { completedStories: number; streak: number; reviewsCount: number }
    ): Promise<Result<string[]>> {
        try {
            const docSnap = await getDoc(doc(db, this.ACHIEVEMENTS_COLLECTION, userId));
            const docData = docSnap.data();
            const earnedIds: string[] = docData?.earnedIds || [];

            const newlyEarned: string[] = [];

            for (const milestone of MILESTONES) {
                if (earnedIds.includes(milestone.id)) continue;

                let isEarned = false;
                if (milestone.id.startsWith('stories_')) {
                    isEarned = stats.completedStories >= milestone.threshold;
                } else if (milestone.id.startsWith('streak_')) {
                    isEarned = stats.streak >= milestone.threshold;
                } else if (milestone.id === 'first_review') {
                    isEarned = stats.reviewsCount >= milestone.threshold;
                }

                if (isEarned) {
                    newlyEarned.push(milestone.id);
                    await communityService.createPost(
                        userId,
                        userName,
                        userPhoto,
                        milestone.description,
                        milestone.type,
                        {
                            achievementId: milestone.id,
                            achievementTitle: milestone.title,
                            achievementType: milestone.type
                        }
                    );
                }
            }

            if (newlyEarned.length > 0) {
                await setDoc(doc(db, this.ACHIEVEMENTS_COLLECTION, userId), {
                    earnedIds: [...earnedIds, ...newlyEarned],
                    lastUpdateAt: serverTimestamp(),
                }, { merge: true });
            }

            return { success: true, data: newlyEarned };
        } catch (error) {
            console.error('Check milestones failed:', error);
            return { success: false, error: 'Failed to check milestones' };
        }
    }

    async postStoryActivity(
        userId: string,
        userName: string,
        userPhoto: string | null,
        storyId: string,
        storyTitle: string,
        type: 'started_reading' | 'story_completed',
        metadata?: { rating?: number; readingTime?: number; wordCount?: number }
    ): Promise<Result<void>> {
        try {
            const activityId = `${userId}_${storyId}_${type}`;
            const logRef = doc(db, 'user_activity_log', activityId);
            const logSnap = await getDoc(logRef);

            if (logSnap.exists()) {
                return { success: true, data: undefined };
            }

            const content = type === 'started_reading'
                ? `Started reading "${storyTitle}"`
                : `Just finished reading "${storyTitle}"! 🏆`;

            await communityService.createPost(
                userId,
                userName,
                userPhoto,
                content,
                type,
                { storyId, storyTitle, ...metadata }
            );

            await setDoc(logRef, {
                userId,
                storyId,
                type,
                timestamp: serverTimestamp(),
            });

            return { success: true, data: undefined };
        } catch (error) {
            console.error('Post story activity failed:', error);
            return { success: false, error: 'Failed to post activity' };
        }
    }
}

export const activityService = new ActivityService();
