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

// Story types
export interface Story {
    id: string;
    title: string;
    description: string;
    content: string;
    coverImage: string;
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
}
