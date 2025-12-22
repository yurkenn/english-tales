/**
 * User Service - Native Firebase Firestore Modular API
 */
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
} from '@react-native-firebase/firestore';
import { User as AppUser, UserProfile, LibraryItem, Story } from '@/types';
import { Result } from '@/types/api';

const db = getFirestore();

class UserService {
    private COLLECTION = 'users';

    async syncProfile(user: AppUser): Promise<Result<void>> {
        try {
            const userDoc = await getDoc(doc(db, this.COLLECTION, user.id));
            const existingData = userDoc.exists() ? userDoc.data() as UserProfile : null;

            const profile: UserProfile = {
                id: user.id,
                displayName: user.displayName,
                photoURL: user.photoURL,
                emailSearchField: user.email ? user.email.toLowerCase() : null,
                displayNameSearchField: user.displayName ? user.displayName.toLowerCase() : null,
                joinedAt: existingData?.joinedAt || serverTimestamp(),
                lastSeenAt: serverTimestamp(),
                isAnonymous: user.isAnonymous,
            };

            await setDoc(doc(db, this.COLLECTION, user.id), profile, { merge: true });
            return { success: true, data: undefined };
        } catch (error) {
            console.error('Error syncing user profile:', error);
            return { success: false, error: 'Failed to sync profile' };
        }
    }

    async searchUsers(searchTerm: string, limitCount = 10): Promise<Result<UserProfile[]>> {
        try {
            const term = searchTerm.toLowerCase().trim();
            if (!term) return { success: true, data: [] };

            const q = query(
                collection(db, this.COLLECTION),
                where('displayNameSearchField', '>=', term),
                where('displayNameSearchField', '<=', term + '\uf8ff'),
                limit(limitCount)
            );

            const snapshot = await getDocs(q);
            const results = snapshot.docs.map((d: any) => d.data() as UserProfile);

            if (results.length < limitCount) {
                const eq = query(
                    collection(db, this.COLLECTION),
                    where('emailSearchField', '==', term),
                    limit(limitCount - results.length)
                );
                const eSnapshot = await getDocs(eq);
                eSnapshot.docs.forEach((d: any) => {
                    const data = d.data() as UserProfile;
                    if (!results.find((r: any) => r.id === data.id)) {
                        results.push(data);
                    }
                });
            }

            return { success: true, data: results };
        } catch (error) {
            console.error('Error searching users:', error);
            return { success: false, error: 'Failed to search users' };
        }
    }

    async getUserProfile(userId: string): Promise<Result<UserProfile>> {
        try {
            const docSnap = await getDoc(doc(db, this.COLLECTION, userId));

            if (docSnap.exists()) {
                return { success: true, data: docSnap.data() as UserProfile };
            } else {
                return { success: false, error: 'User not found' };
            }
        } catch (error) {
            console.error('Error getting user profile:', error);
            return { success: false, error: 'Failed to get user profile' };
        }
    }

    async getUserLibrary(userId: string): Promise<Result<LibraryItem[]>> {
        try {
            const q = query(
                collection(db, this.COLLECTION, userId, 'library'),
                orderBy('addedAt', 'desc'),
                limit(10)
            );
            const snapshot = await getDocs(q);

            const items: LibraryItem[] = snapshot.docs.map((docSnap: any) => {
                const data = docSnap.data();
                return {
                    storyId: data.storyId,
                    userId: data.userId,
                    addedAt: data.addedAt?.toDate?.() || new Date(data.addedAt),
                    story: data.story as Story,
                    progress: data.progress,
                } as LibraryItem;
            });

            return { success: true, data: items };
        } catch (error: any) {
            // Handle permission denied gracefully - usually means library is private
            if (error?.code === 'firestore/permission-denied') {
                return { success: true, data: [] };
            }
            console.error('Error getting user library:', error);
            return { success: false, error: 'Failed' };
        }
    }

    async updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<Result<void>> {
        try {
            await setDoc(doc(db, this.COLLECTION, userId), {
                ...data,
                updatedAt: serverTimestamp(),
            }, { merge: true });
            return { success: true, data: undefined };
        } catch (error) {
            console.error('Error updating user profile:', error);
            return { success: false, error: 'Failed to update profile' };
        }
    }

    /**
     * Delete all user data from Firestore
     * This includes: user profile, library, progress, community posts, and notifications
     * Each step is wrapped in try-catch to continue even if some data doesn't exist
     */
    async deleteUserData(userId: string): Promise<Result<void>> {
        const errors: string[] = [];

        // Delete user document
        try {
            await deleteDoc(doc(db, this.COLLECTION, userId));
        } catch (e) {
            console.warn('Could not delete user document:', e);
            errors.push('user document');
        }

        // Delete library subcollection
        try {
            const libraryRef = collection(db, this.COLLECTION, userId, 'library');
            const librarySnap = await getDocs(libraryRef);
            for (const docSnap of librarySnap.docs) {
                await deleteDoc(docSnap.ref);
            }
        } catch (e) {
            console.warn('Could not delete library data:', e);
            errors.push('library');
        }

        // Delete progress subcollection
        try {
            const progressRef = collection(db, this.COLLECTION, userId, 'progress');
            const progressSnap = await getDocs(progressRef);
            for (const docSnap of progressSnap.docs) {
                await deleteDoc(docSnap.ref);
            }
        } catch (e) {
            console.warn('Could not delete progress data:', e);
            errors.push('progress');
        }

        // Delete user's community posts
        try {
            const postsQuery = query(
                collection(db, 'posts'),
                where('userId', '==', userId)
            );
            const postsSnap = await getDocs(postsQuery);
            for (const docSnap of postsSnap.docs) {
                await deleteDoc(docSnap.ref);
            }
        } catch (e) {
            console.warn('Could not delete posts:', e);
            errors.push('posts');
        }

        // Delete user's notifications (may not exist for all users)
        try {
            const notificationsRef = collection(db, 'notifications', userId, 'items');
            const notificationsSnap = await getDocs(notificationsRef);
            for (const docSnap of notificationsSnap.docs) {
                await deleteDoc(docSnap.ref);
            }
        } catch (e) {
            // This is expected to fail if notifications don't exist
            console.warn('Could not delete notifications (may not exist):', e);
        }

        // Delete social connections (followers/following)
        try {
            const followersQuery = query(
                collection(db, 'social'),
                where('followerId', '==', userId)
            );
            const followersSnap = await getDocs(followersQuery);
            for (const docSnap of followersSnap.docs) {
                await deleteDoc(docSnap.ref);
            }

            const followingQuery = query(
                collection(db, 'social'),
                where('followingId', '==', userId)
            );
            const followingSnap = await getDocs(followingQuery);
            for (const docSnap of followingSnap.docs) {
                await deleteDoc(docSnap.ref);
            }
        } catch (e) {
            console.warn('Could not delete social data:', e);
            errors.push('social connections');
        }

        // Log result
        if (errors.length > 0) {
            console.warn(`Partial deletion for user ${userId}. Failed to delete: ${errors.join(', ')}`);
        } else {
            console.log(`All data for user ${userId} has been deleted`);
        }

        // Always return success - the important thing is deleting the Firebase Auth account
        return { success: true, data: undefined };
    }
}

export const userService = new UserService();
