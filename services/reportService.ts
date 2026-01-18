import {
    getFirestore,
    collection,
    query,
    where,
    limit,
    getDocs,
    addDoc,
    serverTimestamp,
} from '@react-native-firebase/firestore';

const COLLECTION_NAME = 'contentReports';

export type ReportReason =
    | 'inappropriate_content'
    | 'spam'
    | 'harassment'
    | 'copyright'
    | 'other';

export interface ContentReport {
    id: string;
    contentType: 'story' | 'review' | 'post' | 'reply';
    contentId: string;
    reporterId: string;
    reason: ReportReason;
    description?: string;
    status: 'pending' | 'reviewed' | 'resolved';
    createdAt: Date;
}

class ReportService {
    private db = getFirestore();

    private getCollectionRef() {
        return collection(this.db, COLLECTION_NAME);
    }

    /**
     * Submit a report
     */
    async submitReport(
        contentType: ContentReport['contentType'],
        contentId: string,
        reporterId: string,
        reason: ReportReason,
        description?: string
    ): Promise<void> {
        try {
            // Check if user already reported this content
            const q = query(
                this.getCollectionRef(),
                where('contentId', '==', contentId),
                where('reporterId', '==', reporterId),
                limit(1)
            );
            const existing = await getDocs(q);

            if (!existing.empty) {
                throw new Error('You have already reported this content');
            }

            await addDoc(this.getCollectionRef(), {
                contentType,
                contentId,
                reporterId,
                reason,
                description: description || '',
                status: 'pending',
                createdAt: serverTimestamp(),
            });
        } catch (error) {
            console.error('Error submitting report:', error);
            throw error;
        }
    }

    /**
     * Check if user has reported content
     */
    async hasReported(contentId: string, userId: string): Promise<boolean> {
        try {
            const q = query(
                this.getCollectionRef(),
                where('contentId', '==', contentId),
                where('reporterId', '==', userId),
                limit(1)
            );
            const snapshot = await getDocs(q);
            return !snapshot.empty;
        } catch (error) {
            console.error('Error checking report status:', error);
            return false;
        }
    }
}

export const reportService = new ReportService();
