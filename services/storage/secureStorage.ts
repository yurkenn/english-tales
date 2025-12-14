import * as SecureStore from 'expo-secure-store';

const KEYS = {
    AUTH_TOKEN: 'auth_token',
    USER_ID: 'user_id',
    REFRESH_TOKEN: 'refresh_token',
    READING_PROGRESS: 'reading_progress',
} as const;

// Secure storage for sensitive data
export const secureStorage = {
    // Auth token
    async setAuthToken(token: string): Promise<void> {
        await SecureStore.setItemAsync(KEYS.AUTH_TOKEN, token);
    },

    async getAuthToken(): Promise<string | null> {
        return SecureStore.getItemAsync(KEYS.AUTH_TOKEN);
    },

    async removeAuthToken(): Promise<void> {
        await SecureStore.deleteItemAsync(KEYS.AUTH_TOKEN);
    },

    // User ID
    async setUserId(userId: string): Promise<void> {
        await SecureStore.setItemAsync(KEYS.USER_ID, userId);
    },

    async getUserId(): Promise<string | null> {
        return SecureStore.getItemAsync(KEYS.USER_ID);
    },

    async removeUserId(): Promise<void> {
        await SecureStore.deleteItemAsync(KEYS.USER_ID);
    },

    // Refresh Token
    async setRefreshToken(token: string): Promise<void> {
        await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, token);
    },

    async getRefreshToken(): Promise<string | null> {
        return SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
    },

    async removeRefreshToken(): Promise<void> {
        await SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN);
    },

    // Reading Progress (JSON stored)
    async setReadingProgress(progress: Record<string, number>): Promise<void> {
        await SecureStore.setItemAsync(KEYS.READING_PROGRESS, JSON.stringify(progress));
    },

    async getReadingProgress(): Promise<Record<string, number>> {
        const data = await SecureStore.getItemAsync(KEYS.READING_PROGRESS);
        return data ? JSON.parse(data) : {};
    },

    // Clear all
    async clearAll(): Promise<void> {
        await Promise.all([
            SecureStore.deleteItemAsync(KEYS.AUTH_TOKEN),
            SecureStore.deleteItemAsync(KEYS.USER_ID),
            SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN),
            SecureStore.deleteItemAsync(KEYS.READING_PROGRESS),
        ]);
    },
};
