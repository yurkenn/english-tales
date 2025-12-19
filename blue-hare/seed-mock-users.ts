import { db, auth } from '../services/firebase/config';
import { doc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

const MOCK_USERS = [
    {
        id: 'mock_user_1',
        displayName: 'Elena Gilbert',
        photoURL: 'https://i.pravatar.cc/150?u=elena',
        bio: 'Avid reader and language enthusiast. Love classic tales!',
        streak: 12,
        socialLinks: { instagram: '@elena_reads', twitter: '@elena_g' }
    },
    {
        id: 'mock_user_2',
        displayName: 'Marcus Aurelius',
        photoURL: 'https://i.pravatar.cc/150?u=marcus',
        bio: 'Learning English through wisdom and stories.',
        streak: 45,
        socialLinks: { website: 'https://philosophy.io' }
    },
    {
        id: 'mock_user_3',
        displayName: 'Sophie Martin',
        photoURL: 'https://i.pravatar.cc/150?u=sophie',
        bio: 'Explorer of fairy tales. Currently reading Grimm brothers.',
        streak: 7,
        socialLinks: { instagram: '@sophie_explorer', github: 'sophiem' }
    },
    {
        id: 'mock_user_4',
        displayName: 'Kenji Sato',
        photoURL: 'https://i.pravatar.cc/150?u=kenji',
        bio: 'Grammar is hard, but stories are fun!',
        streak: 3,
        socialLinks: { twitter: '@kenji_sato' }
    },
    {
        id: 'mock_user_5',
        displayName: 'Aria Stark',
        photoURL: 'https://i.pravatar.cc/150?u=aria',
        bio: 'Finding hidden meanings in every story.',
        streak: 21,
        socialLinks: { instagram: '@not_a_girl' }
    }
];

const MOCK_STORIES = [
    { id: '18d84422-9226-4074-a029-478a87693fc7', title: 'The Little Prince' },
    { id: '463878b4-9273-4235-9831-41f2216447c2', title: 'Moby Dick' },
    { id: '82944d6c-6725-4678-8314-5d5d836412f9', title: 'The Great Gatsby' }
];

async function seedMockUsers() {
    console.log('🌱 Authenticating...');
    try {
        await signInAnonymously(auth);
        console.log('✅ Authenticated anonymously');
    } catch (e) {
        console.warn('⚠️ Authentication failed, proceeding anyway (permissions might fail):', e);
    }

    console.log('🌱 Seeding mock users...');

    for (const user of MOCK_USERS) {
        // Create user profile
        const userRef = doc(db, 'users', user.id);
        await setDoc(userRef, {
            ...user,
            emailSearchField: `${user.id}@example.com`,
            displayNameSearchField: user.displayName.toLowerCase(),
            lastSeenAt: serverTimestamp(),
            isAnonymous: false,
            createdAt: serverTimestamp()
        });

        // Add some mock reading progress
        for (const story of MOCK_STORIES) {
            const progressRef = doc(db, 'users', user.id, 'progress', story.id);
            await setDoc(progressRef, {
                storyId: story.id,
                userId: user.id,
                percentage: Math.floor(Math.random() * 100),
                isCompleted: Math.random() > 0.5,
                lastReadAt: serverTimestamp(),
                readingTimeMs: Math.floor(Math.random() * 3600000)
            });

            // Add some mock reviews
            const reviewRef = doc(db, 'stories', story.id, 'reviews', user.id);
            await setDoc(reviewRef, {
                id: `${user.id}_${story.id}`,
                userId: user.id,
                userName: user.displayName,
                userPhoto: user.photoURL,
                storyId: story.id,
                storyTitle: story.title,
                rating: 4 + Math.floor(Math.random() * 2),
                comment: `Great story! Really helped me with my English.`,
                timestamp: serverTimestamp(),
                likes: Math.floor(Math.random() * 10),
                likedBy: []
            });

            // Add to library
            const libraryRef = doc(db, 'users', user.id, 'library', story.id);
            await setDoc(libraryRef, {
                storyId: story.id,
                userId: user.id,
                addedAt: serverTimestamp(),
                story: {
                    id: story.id,
                    title: story.title,
                    coverImage: 'https://placehold.co/400x600',
                    author: 'Mock Author',
                    difficulty: 'intermediate',
                    estimatedReadTime: 10
                }
            });
        }

        // Add some mock posts
        const postsRef = collection(db, 'posts');
        const postData = {
            userId: user.id,
            userName: user.displayName,
            userPhoto: user.photoURL,
            content: `I just finished another chapter! Learning English is getting easier every day. #learning #english`,
            timestamp: serverTimestamp(),
            likes: Math.floor(Math.random() * 20),
            likedBy: [],
            replyCount: 0,
            type: 'thought',
            metadata: {
                storyTitle: MOCK_STORIES[0].title,
                storyId: MOCK_STORIES[0].id
            }
        };
        await setDoc(doc(postsRef), postData);
    }

    console.log('✅ Mock users seeded successfully!');
}

seedMockUsers().catch(console.error);
