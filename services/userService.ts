import { db } from './firebase/config';
import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp,
    collection,
    query,
    where,
    getDocs,
    limit,
    orderBy,
    Timestamp,
} from 'firebase/firestore';
import { User as AppUser, UserProfile, LibraryItem, Story } from '@/types';
import { Result } from '@/types/api';

class UserService {
    private COLLECTION = 'users';

    /**
     * Syncs the current user's profile to Firestore to make it searchable
     */
    async syncProfile(user: AppUser): Promise<Result<void>> {
        try {
            const userRef = doc(db, this.COLLECTION, user.id);

            const profile: UserProfile = {
                id: user.id,
                displayName: user.displayName,
                photoURL: user.photoURL,
                emailSearchField: user.email ? user.email.toLowerCase() : null,
                displayNameSearchField: user.displayName ? user.displayName.toLowerCase() : null,
                lastSeenAt: serverTimestamp(),
                isAnonymous: user.isAnonymous,
            };

            await setDoc(userRef, profile, { merge: true });
            return { success: true, data: undefined };
        } catch (error) {
            console.error('Error syncing user profile:', error);
            return { success: false, error: 'Failed to sync profile' };
        }
    }

    /**
     * Search for users by display name or email
     */
    async searchUsers(searchTerm: string, limitCount = 10): Promise<Result<UserProfile[]>> {
        try {
            const term = searchTerm.toLowerCase().trim();
            if (!term) return { success: true, data: [] };

            // Search by display name start (prefix search)
            const q = query(
                collection(db, this.COLLECTION),
                where('displayNameSearchField', '>=', term),
                where('displayNameSearchField', '<=', term + '\uf8ff'),
                limit(limitCount)
            );

            const snapshot = await getDocs(q);
            const results = snapshot.docs.map(doc => doc.data() as UserProfile);

            // If not enough results, try searching by email
            if (results.length < limitCount) {
                const eq = query(
                    collection(db, this.COLLECTION),
                    where('emailSearchField', '==', term),
                    limit(limitCount - results.length)
                );
                const eSnapshot = await getDocs(eq);
                eSnapshot.docs.forEach(doc => {
                    const data = doc.data() as UserProfile;
                    if (!results.find(r => r.id === data.id)) {
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

    /**
     * Get a user profile by ID
     */
    async getUserProfile(userId: string): Promise<Result<UserProfile>> {
        try {
            const docRef = doc(db, this.COLLECTION, userId);
            const docSnap = await getDoc(docRef);

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
            const libraryRef = collection(db, this.COLLECTION, userId, 'library');
            const q = query(libraryRef, orderBy('addedAt', 'desc'), limit(10));
            const snapshot = await getDocs(q);

            const items: LibraryItem[] = snapshot.docs.map(docSnap => {
                const data = docSnap.data();
                return {
                    storyId: data.storyId,
                    userId: data.userId,
                    addedAt: data.addedAt instanceof Timestamp
                        ? data.addedAt.toDate()
                        : new Date(data.addedAt),
                    story: data.story as Story,
                    progress: data.progress,
                } as LibraryItem;
            });

            return { success: true, data: items };
        } catch (error) {
            console.error('Error getting user library:', error);
            return { success: false, error: 'Failed' };
        }
    }
}

export const userService = new UserService();
