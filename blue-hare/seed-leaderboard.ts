import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Firebase config (from .env)
const firebaseConfig = {
    apiKey: "AIzaSyDXwmZhOSATF_q245-bi_yKSdSrHTmlcF8",
    authDomain: "english-tales-77d32.firebaseapp.com",
    projectId: "english-tales-77d32",
    storageBucket: "english-tales-77d32.appspot.com",
    messagingSenderId: "28104909219",
    appId: "1:28104909219:web:bef0b79d546676085a7a16"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const DUMMY_USERS = [
    {
        userId: 'dummy_1',
        displayName: 'Sarah Johnson',
        photoURL: 'https://i.pravatar.cc/150?u=sarah',
        totalWordsRead: 125430,
        totalReadingTimeMs: 45000000,
        completedStoriesCount: 22,
        averageQuizScore: 92,
        streak: 15
    },
    {
        userId: 'dummy_2',
        displayName: 'Hans Müller',
        photoURL: 'https://i.pravatar.cc/150?u=hans',
        totalWordsRead: 98200,
        totalReadingTimeMs: 38000000,
        completedStoriesCount: 18,
        averageQuizScore: 88,
        streak: 7
    },
    {
        userId: 'dummy_3',
        displayName: 'Elena Rodriguez',
        photoURL: 'https://i.pravatar.cc/150?u=elena',
        totalWordsRead: 245000,
        totalReadingTimeMs: 82000000,
        completedStoriesCount: 35,
        averageQuizScore: 96,
        streak: 42
    },
    {
        userId: 'dummy_4',
        displayName: 'Yuki Tanaka',
        photoURL: 'https://i.pravatar.cc/150?u=yuki',
        totalWordsRead: 75000,
        totalReadingTimeMs: 28000000,
        completedStoriesCount: 12,
        averageQuizScore: 85,
        streak: 5
    },
    {
        userId: 'dummy_5',
        displayName: 'Marco Rossi',
        photoURL: 'https://i.pravatar.cc/150?u=marco',
        totalWordsRead: 156000,
        totalReadingTimeMs: 55000000,
        completedStoriesCount: 28,
        averageQuizScore: 90,
        streak: 12
    },
    {
        userId: 'dummy_6',
        displayName: 'Aaliyah Khan',
        photoURL: 'https://i.pravatar.cc/150?u=aaliyah',
        totalWordsRead: 312000,
        totalReadingTimeMs: 95000000,
        completedStoriesCount: 45,
        averageQuizScore: 98,
        streak: 60
    }
];

async function seedLeaderboard() {
    console.log('🏆 Seeding leaderboard data...\n');

    for (const user of DUMMY_USERS) {
        try {
            await setDoc(doc(db, 'leaderboard', user.userId), {
                ...user,
                lastSyncAt: serverTimestamp()
            });
            console.log(`  ✅ Added: ${user.displayName}`);
        } catch (error: any) {
            console.error(`  ❌ Failed: ${user.displayName}`, error.message);
        }
    }

    console.log('\n✅ Leaderboard seeding complete!');
}

seedLeaderboard().catch(console.error);
