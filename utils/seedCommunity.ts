import { communityService } from '../services/communityService';

export const seedCommunity = async () => {
    const seedPosts = [
        {
            userId: 'system_1',
            userName: 'Oliver Bennett',
            userPhoto: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=100&q=80',
            content: "Just finished 'The Great Gatsby'! 📖 The vocabulary in the final chapters was challenging but so rewarding. Has anyone else shared this journey?",
            type: 'share' as const,
            metadata: {
                storyId: 'great-gatsby',
                storyTitle: 'The Great Gatsby'
            }
        },
        {
            userId: 'system_2',
            userName: 'Sarah Jenkins',
            userPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
            content: "I just hit a 15-day reading streak! 🎯 consistency really is the key to learning English. Feeling proud today! 🔥",
            type: 'achievement' as const,
            metadata: {
                streakCount: 15
            }
        },
        {
            userId: 'system_3',
            userName: 'Marcus Aurelius',
            userPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
            content: "Found a beautiful word today: 'Ethereal'. It means extremely delicate and light in a way that seems too perfect for this world. ✨",
            type: 'thought' as const,
        },
        {
            userId: 'system_4',
            userName: 'Emma Watson',
            userPhoto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80',
            content: "The Ugly Duckling is still one of the most touching stories ever written. Highly recommend it for intermediate learners to practice descriptive adjectives! 🦆🦢",
            type: 'share' as const,
            metadata: {
                storyId: 's1',
                storyTitle: 'The Ugly Duckling'
            }
        }
    ];

    console.log('Starting community seed...');
    for (const post of seedPosts) {
        await communityService.createPost(
            post.userId,
            post.userName,
            post.userPhoto,
            post.content,
            post.type,
            post.metadata
        );
    }
    console.log('Community seed completed!');
};
