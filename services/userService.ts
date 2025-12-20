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
}

export const userService = new UserService();
