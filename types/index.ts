// Re-export all types
export * from './api';
export * from './sanity';

// User types
export interface User {
    id: string;
    email: string; // empty string for anonymous users
    displayName: string | null;
    photoURL: string | null;
    createdAt: Date;
    isAnonymous: boolean;
}

export interface UserProfile {
    id: string;
    displayName: string | null;
    photoURL: string | null;
    emailSearchField?: string | null; // Lowercase email for search
    displayNameSearchField?: string | null; // Lowercase name for search
    lastSeenAt?: any;
    isAnonymous: boolean;
    location?: string;
    bio?: string;
    streak?: number;
    followersCount?: number;
    followingCount?: number;
    socialLinks?: {
        instagram?: string;
        twitter?: string;
        website?: string;
        github?: string;
    };
}

// Story types
export interface Story {
    id: string;
    title: string;
    description: string;
    content: string;
    coverImage: string;
    coverImageLqip?: string;
    author: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedReadTime: number; // in minutes
    wordCount: number;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}

// Reading progress types
export interface ReadingProgress {
    storyId: string;
    userId: string;
    currentPosition: number; // character index
    percentage: number;
    lastReadAt: Date;
    isCompleted: boolean;
    quizScore?: number;
    quizTotal?: number;
    readingTimeMs?: number;
}

// Library item (saved story)
export interface LibraryItem {
    storyId: string;
    userId: string;
    addedAt: Date;
    story: Story;
    progress?: ReadingProgress;
}

// Settings types
export interface Settings {
    theme: 'light' | 'dark' | 'system';
    fontSize: 'small' | 'medium' | 'large';
    notificationsEnabled: boolean;
    dailyGoalMinutes: number;
    language: 'en' | 'tr' | 'es' | 'de' | 'fr';
    proficiencyLevel?: 'beginner' | 'intermediate' | 'advanced';
}

// Community types
export type ActivityType = 'share' | 'achievement' | 'milestone' | 'thought' | 'follow' | 'story_review' | 'story_completed' | 'started_reading';

export interface CommunityPost {
    id: string;
    userId: string;
    userName: string;
    userPhoto: string | null;
    content: string;
    timestamp: any; // Firestore timestamp
    likes: number;
    likedBy: string[]; // Array of user IDs
    replyCount?: number;
    type: ActivityType;
    metadata?: {
        storyId?: string;
        storyTitle?: string;
        rating?: number;
        achievementId?: string;
        achievementTitle?: string;
        achievementType?: string;
        streakCount?: number;
    };
}

export interface CommunityReply {
    id: string;
    postId: string;
    userId: string;
    userName: string;
    userPhoto: string | null;
    content: string;
    timestamp: any;
    likes?: number;
    likedBy?: string[];
}

export interface SocialNotification {
    id: string;
    type: 'like' | 'reply' | 'follow' | 'achievement';
    senderId: string;
    senderName: string;
    senderPhoto: string | null;
    postId?: string; // Optional: link to post
    content?: string; // Short preview text
    timestamp: any;
    isRead: boolean;
}

export interface StoryReview {
    id: string;
    storyId: string;
    userId: string;
    userName: string;
    userPhoto: string | null;
    storyTitle?: string;
    rating: number; // 1-5
    comment: string;
    timestamp: any;
    likes: number;
    likedBy: string[];
}

export interface UserFavorite {
    id: string; // userId_storyId
    userId: string;
    storyId: string;
    storyTitle: string;
    storyCover: string;
    addedAt: any;
}
