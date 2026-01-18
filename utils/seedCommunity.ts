import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    query,
    serverTimestamp,
    limit,
    deleteDoc,
} from '@react-native-firebase/firestore';

const db = getFirestore();

/**
 * Rich community seed data with realistic posts about REAL stories in the app
 * Creates an engaging social experience with story-specific discussions
 */

// Seed users with realistic avatars
const SEED_USERS = {
    emma: {
        id: 'user_emma_01',
        name: 'Emma Richardson',
        photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80',
    },
    james: {
        id: 'user_james_02',
        name: 'James Cooper',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
    },
    sophia: {
        id: 'user_sophia_03',
        name: 'Sophia Martinez',
        photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80',
    },
    alex: {
        id: 'user_alex_04',
        name: 'Alex Thompson',
        photo: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=100&q=80',
    },
    mia: {
        id: 'user_mia_05',
        name: 'Mia Johnson',
        photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
    },
    oliver: {
        id: 'user_oliver_06',
        name: 'Oliver Bennett',
        photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80',
    },
    sarah: {
        id: 'user_sarah_07',
        name: 'Sarah Kim',
        photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
    },
    david: {
        id: 'user_david_08',
        name: 'David Park',
        photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80',
    },
    lisa: {
        id: 'user_lisa_09',
        name: 'Lisa Anderson',
        photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=100&q=80',
    },
    chris: {
        id: 'user_chris_10',
        name: 'Chris Williams',
        photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80',
    },
    anna: {
        id: 'user_anna_11',
        name: 'Anna Schmidt',
        photo: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=100&q=80',
    },
    mike: {
        id: 'user_mike_12',
        name: 'Michael Brown',
        photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=100&q=80',
    },
    nina: {
        id: 'user_nina_13',
        name: 'Nina Patel',
        photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&q=80',
    },
    tom: {
        id: 'user_tom_14',
        name: 'Thomas Lee',
        photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=100&q=80',
    },
    emily: {
        id: 'user_emily_15',
        name: 'Emily Chen',
        photo: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=100&q=80',
    },
    ryan: {
        id: 'user_ryan_16',
        name: 'Ryan Mitchell',
        photo: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=100&q=80',
    },
};

// Posts with their associated replies
interface SeedPost {
    user: typeof SEED_USERS.emma;
    content: string;
    type: 'share' | 'achievement' | 'thought';
    metadata?: Record<string, unknown>;
    likes: number;
    replies: SeedReply[];
}

interface SeedReply {
    user: typeof SEED_USERS.emma;
    content: string;
    likes: number;
    nestedReplies?: NestedReply[];
}

interface NestedReply {
    user: typeof SEED_USERS.emma;
    content: string;
    likes: number;
}

const SEED_POSTS: SeedPost[] = [
    // ===== POST 1: The Happy Prince by Oscar Wilde =====
    {
        user: SEED_USERS.emma,
        content: "Just finished 'The Happy Prince' by Oscar Wilde and I'm absolutely crying 😭💔 The swallow sacrificing everything for the prince... and then God choosing the leaden heart and dead bird as the two most precious things in the city. This story taught me so many beautiful words like 'gilded', 'sapphire', and 'seamstress'!",
        type: 'share',
        metadata: { storyId: 'the-happy-prince', storyTitle: 'The Happy Prince' },
        likes: 89,
        replies: [
            {
                user: SEED_USERS.sophia,
                content: "The ending destroyed me 🥹 'In my garden of Paradise this little bird shall sing for evermore' - Oscar Wilde's prose is pure poetry. Did anyone else learn the word 'limpid' from this story?",
                likes: 24,
                nestedReplies: [
                    {
                        user: SEED_USERS.emma,
                        content: "@Sophia Martinez Yes! And 'ephemeral' too! The vocabulary in Wilde's stories is advanced but so beautiful. Worth looking up every single word!",
                        likes: 12,
                    },
                    {
                        user: SEED_USERS.david,
                        content: "@Sophia Martinez The contrast between the beautiful language and the sad story makes it hit even harder 💔",
                        likes: 8,
                    },
                ],
            },
            {
                user: SEED_USERS.james,
                content: "This is labeled 'advanced' but honestly worth the effort even for intermediate learners. The themes of selflessness and true love are universal. I made a vocabulary list of 30+ words!",
                likes: 18,
                nestedReplies: [
                    {
                        user: SEED_USERS.sarah,
                        content: "@James Cooper Can you share that list? I'm preparing to read it next week!",
                        likes: 9,
                    },
                    {
                        user: SEED_USERS.james,
                        content: "@Sarah Kim Sure! Key words: gilded, sapphire, ruby, seamstress, garret, pomegranate, dreamy, marvellous, proclamation, foundry. The religious imagery words too: Paradise, angel, precious.",
                        likes: 21,
                    },
                ],
            },
            {
                user: SEED_USERS.nina,
                content: "The Mayor and Town Councillors represent superficial society so perfectly. 'As he is no longer beautiful he is no longer useful' - such a powerful critique 🎭",
                likes: 15,
            },
        ],
    },

    // ===== POST 2: The Ugly Duckling by Andersen =====
    {
        user: SEED_USERS.alex,
        content: "Started with 'The Ugly Duckling' as my first intermediate story and WOW 🦢 The transformation from being bullied to becoming a beautiful swan... it hit different as an adult learning English. 'He was not an ugly duckling anymore. He had become a beautiful white swan!' 💪",
        type: 'share',
        metadata: { storyId: 'the-ugly-duckling', storyTitle: 'The Ugly Duckling' },
        likes: 67,
        replies: [
            {
                user: SEED_USERS.oliver,
                content: "Perfect first intermediate story! Hans Christian Andersen uses simple but elegant language. Great for practicing past tense - 'wandered', 'stretched', 'welcomed' 📝",
                likes: 19,
                nestedReplies: [
                    {
                        user: SEED_USERS.alex,
                        content: "@Oliver Bennett Exactly! I noticed so many irregular past tense verbs: came, sat, ran, swam. Great practice!",
                        likes: 7,
                    },
                ],
            },
            {
                user: SEED_USERS.mia,
                content: "This story is basically about finding where you belong 🏠 The duckling wasn't ugly - he was just in the wrong family. Such a beautiful metaphor for anyone who's felt different!",
                likes: 28,
                nestedReplies: [
                    {
                        user: SEED_USERS.emily,
                        content: "@Mia Johnson I needed to hear this today 🥹 Sometimes we just need to find our right 'pond'!",
                        likes: 14,
                    },
                ],
            },
            {
                user: SEED_USERS.lisa,
                content: "Tip for beginners: This story has lots of nature vocabulary - pond, feathers, wings, nest, reflection. Make flashcards! 🌿",
                likes: 11,
            },
        ],
    },

    // ===== POST 3: The Selfish Giant by Oscar Wilde =====
    {
        user: SEED_USERS.sarah,
        content: "The Selfish Giant might be my new favorite story ❄️🌸 When the Giant's heart melted and he said 'How selfish I have been!' - I felt that. The ending with the child showing his nail wounds... didn't expect such deep symbolism in a children's story!",
        type: 'share',
        metadata: { storyId: 'the-selfish-giant', storyTitle: 'The Selfish Giant' },
        likes: 78,
        replies: [
            {
                user: SEED_USERS.david,
                content: "The imagery is incredible! 'The Snow covered up the grass with her great white cloak' - Oscar Wilde personifies nature so beautifully. Winter as punishment for selfishness is genius 🌨️",
                likes: 22,
                nestedReplies: [
                    {
                        user: SEED_USERS.sarah,
                        content: "@David Park Yes! And when spring returns with the children - the metaphor is so clear but still touching every time.",
                        likes: 9,
                    },
                ],
            },
            {
                user: SEED_USERS.anna,
                content: "New vocabulary I learned: 'gruff' (the Giant's voice), 'delicate blossoms', 'peach-trees', 'casement' (type of window). Oscar Wilde stories are vocabulary goldmines!",
                likes: 16,
            },
            {
                user: SEED_USERS.mike,
                content: "The religious allegory at the end always gives me chills. 'These are the wounds of Love' - profound! 🙏",
                likes: 24,
                nestedReplies: [
                    {
                        user: SEED_USERS.chris,
                        content: "@Michael Brown Wilde wrote this while going through his own spiritual journey. Makes the symbolism even more meaningful.",
                        likes: 11,
                    },
                ],
            },
        ],
    },

    // ===== POST 4: The Three Little Pigs =====
    {
        user: SEED_USERS.emily,
        content: "Perfect story for beginners: The Three Little Pigs! 🐷🐷🐷 The repetition is SO helpful for learning. 'I'll huff, and I'll puff, and I'll blow your house down!' - I can say this in my sleep now 😂 Great for practicing future tense too!",
        type: 'share',
        metadata: { storyId: 'the-three-little-pigs', storyTitle: 'The Three Little Pigs' },
        likes: 52,
        replies: [
            {
                user: SEED_USERS.ryan,
                content: "The moral is timeless: 'Hard work and patience pay off in the end.' 🧱 Also learned: straw, sticks, bricks, chimney. Building vocabulary while building houses! 🏠",
                likes: 18,
            },
            {
                user: SEED_USERS.james,
                content: "Great for conditionals too! 'If you don't let me in, I'll blow your house down.' Perfect grammar practice disguised as a fun story!",
                likes: 14,
                nestedReplies: [
                    {
                        user: SEED_USERS.emily,
                        content: "@James Cooper I didn't even notice that! Going back to re-read with grammar glasses on 👓",
                        likes: 6,
                    },
                ],
            },
            {
                user: SEED_USERS.tom,
                content: "My 5-year-old nephew and I read this together. He's learning English too and LOVED it. 'Not by the hair on my chin!' is his favorite line 😂",
                likes: 21,
            },
        ],
    },

    // ===== POST 5: Snow White by Brothers Grimm =====
    {
        user: SEED_USERS.mia,
        content: "Finally read the ORIGINAL Snow White by Brothers Grimm! 🍎👸 So different from Disney! The mirror dialogue 'Mirror, mirror on the wall' is perfect for practicing question structures. And seven dwarfs = seven new character descriptions to learn!",
        type: 'share',
        metadata: { storyId: 'snow-white', storyTitle: 'Snow White' },
        likes: 61,
        replies: [
            {
                user: SEED_USERS.sophia,
                content: "The descriptive language is beautiful: 'skin as white as snow, lips as red as blood, hair as black as ebony' - great for learning comparisons with 'as...as' structure! 📝",
                likes: 27,
                nestedReplies: [
                    {
                        user: SEED_USERS.mia,
                        content: "@Sophia Martinez Exactly! I made flashcards just for color descriptions. 'Ebony' was new to me - such a poetic word for black!",
                        likes: 8,
                    },
                ],
            },
            {
                user: SEED_USERS.oliver,
                content: "The cottage scene is my favorite for vocabulary: tiny chairs, little beds, walnut soup... Diminutives everywhere! 🏡",
                likes: 15,
            },
            {
                user: SEED_USERS.nina,
                content: "The jealousy theme is timeless. The Queen asking 'Who is the fairest of them all?' - we still struggle with comparison and envy today. Deep story! 💭",
                likes: 19,
            },
        ],
    },

    // ===== POST 6: 30-Day Streak Achievement =====
    {
        user: SEED_USERS.david,
        content: "🔥 30-DAY READING STREAK! 🔥 Started with 'How the Camel Got His Hump' (beginner) and now finishing 'The Nightingale and the Rose' (advanced)! From 'Humph!' to 'mellifluous' in one month. Progress is REAL! 💪📚",
        type: 'achievement',
        metadata: { streakCount: 30, achievementTitle: '30 Day Streak' },
        likes: 134,
        replies: [
            {
                user: SEED_USERS.alex,
                content: "AMAZING progress! 🎉 What's your reading routine? I want to level up too!",
                likes: 28,
                nestedReplies: [
                    {
                        user: SEED_USERS.david,
                        content: "@Alex Thompson 15 minutes every morning with coffee ☕ I read one story twice: first for flow, second with dictionary. Never skip the vocabulary quiz!",
                        likes: 35,
                    },
                    {
                        user: SEED_USERS.tom,
                        content: "@David Park The 'read twice' method is genius! Stealing this 📝",
                        likes: 12,
                    },
                ],
            },
            {
                user: SEED_USERS.sarah,
                content: "'How the Camel Got His Hump' is such a fun start! Kipling's Just So Stories are perfect for beginners. 'Scruciatingly idle' is still my favorite phrase 😂",
                likes: 19,
            },
            {
                user: SEED_USERS.emma,
                content: "The jump from beginner to advanced in 30 days is inspiring! What intermediate stories did you read in between?",
                likes: 14,
                nestedReplies: [
                    {
                        user: SEED_USERS.david,
                        content: "@Emma Richardson The Ugly Duckling → The Frog Prince → Thumbelina → The Golden Goose. All Grimm and Andersen classics!",
                        likes: 22,
                    },
                ],
            },
        ],
    },

    // ===== POST 7: The Elephant's Child by Kipling =====
    {
        user: SEED_USERS.chris,
        content: "Just discovered 'The Elephant's Child' and it's HILARIOUS 🐘 The 'great grey-green, greasy Limpopo River, all set about with fever-trees' - Kipling's alliteration is chef's kiss! Also learned what 'insatiable curiosity' means 😂",
        type: 'share',
        metadata: { storyId: 'the-elephants-child', storyTitle: "The Elephant's Child" },
        likes: 58,
        replies: [
            {
                user: SEED_USERS.lisa,
                content: "The repeated spanking by family members before the elephant learns to spank back with his new trunk 🤣 Kipling's humor is timeless! Good practice for body parts vocabulary too.",
                likes: 21,
            },
            {
                user: SEED_USERS.ryan,
                content: "'Bi-Coloured-Python-Rock-Snake' - say that five times fast! 🐍 Kipling loves compound words. Great for understanding how English builds descriptive phrases.",
                likes: 17,
                nestedReplies: [
                    {
                        user: SEED_USERS.chris,
                        content: "@Ryan Mitchell I practiced saying it for pronunciation! The hyphenated words are tricky but fun.",
                        likes: 7,
                    },
                ],
            },
            {
                user: SEED_USERS.anna,
                content: "The moral about curiosity is lovely. Sometimes being 'insatiably curious' leads to wonderful discoveries - like how elephants got their trunks! 🌟",
                likes: 14,
            },
        ],
    },

    // ===== POST 8: Little Red Riding Hood =====
    {
        user: SEED_USERS.nina,
        content: "Re-reading 'Little Red Riding Hood' as an adult and noticing things I missed as a kid 🐺 The dialogue between the girl and wolf is PERFECT for practicing reported speech! 'The wolf asked where she was going.' Great grammar hidden in a classic tale!",
        type: 'share',
        metadata: { storyId: 'little-red-riding-hood', storyTitle: 'Little Red Riding Hood' },
        likes: 49,
        replies: [
            {
                user: SEED_USERS.mike,
                content: "The famous dialogue: 'What big eyes you have!' 'All the better to see you with!' - repetition makes it memorable. I use this structure now: 'What a nice car you have!' 😂",
                likes: 23,
                nestedReplies: [
                    {
                        user: SEED_USERS.nina,
                        content: "@Michael Brown Haha! The 'What + adjective + noun' structure is so useful for exclamations! 'What beautiful weather!'",
                        likes: 11,
                    },
                ],
            },
            {
                user: SEED_USERS.sophia,
                content: "The moral about not talking to strangers is relevant forever. Also, 'cunning' is such a good vocabulary word for describing clever-but-sneaky people 🦊",
                likes: 15,
            },
            {
                user: SEED_USERS.oliver,
                content: "Forest vocabulary: path, cottage, basket, woodcutter. Simple but essential words for any nature-related conversation! 🌲",
                likes: 12,
            },
        ],
    },

    // ===== POST 9: Hansel and Gretel =====
    {
        user: SEED_USERS.tom,
        content: "Hansel and Gretel is INTENSE for a fairy tale 😱 The gingerbread house description made me hungry: 'walls of bread, roof of cake, windows of clear sugar.' But the witch in the oven... Brothers Grimm didn't hold back! Labeled 'advanced' for good reason.",
        type: 'share',
        metadata: { storyId: 'hansel-and-gretel', storyTitle: 'Hansel and Gretel' },
        likes: 55,
        replies: [
            {
                user: SEED_USERS.james,
                content: "The clever details! Hansel using pebbles first, then breadcrumbs. And Gretel tricking the witch into the oven 🔥 Great examples of problem-solving vocabulary: 'clever', 'trick', 'escape'.",
                likes: 18,
            },
            {
                user: SEED_USERS.emma,
                content: "The food vocabulary is amazing: pancakes, milk, sugar, cake, bread, pearls. Wait... pearls aren't food 😂 But the treasure at the end adds 'jewels' and 'chests' to the list!",
                likes: 14,
                nestedReplies: [
                    {
                        user: SEED_USERS.tom,
                        content: "@Emma Richardson The ending is so satisfying! They return home rich and the cruel stepmother is gone. Fairy tale justice! ⚖️",
                        likes: 9,
                    },
                ],
            },
            {
                user: SEED_USERS.mia,
                content: "Perfect story for practicing past tense narrative: 'crept', 'filled', 'dropped', 'wandered', 'pushed'. So many irregular verbs! 📖",
                likes: 17,
            },
        ],
    },

    // ===== POST 10: Vocabulary Master Achievement =====
    {
        user: SEED_USERS.lisa,
        content: "🏆 VOCABULARY MASTER BADGE UNLOCKED! 🏆 500 new words learned this month! My secret: I keep a 'beautiful words' notebook from Oscar Wilde stories. 'Mellifluous', 'ephemeral', 'gilded', 'seamstress'... English has such poetic vocabulary! ✍️",
        type: 'achievement',
        metadata: { badgeName: 'Vocabulary Master', wordsLearned: 500 },
        likes: 98,
        replies: [
            {
                user: SEED_USERS.sarah,
                content: "Oscar Wilde is a vocabulary goldmine! From 'The Happy Prince' alone I learned: gilded, sapphire, ruby, garret, pomegranate, proclamation. Which stories did you read?",
                likes: 31,
                nestedReplies: [
                    {
                        user: SEED_USERS.lisa,
                        content: "@Sarah Kim The Happy Prince, The Selfish Giant, and The Nightingale and the Rose! Wilde's fairy tales are advanced but SO worth it for the language 💎",
                        likes: 18,
                    },
                ],
            },
            {
                user: SEED_USERS.alex,
                content: "Do you use flashcards or just the notebook? I'm trying to find the best method for retention 🧠",
                likes: 15,
                nestedReplies: [
                    {
                        user: SEED_USERS.lisa,
                        content: "@Alex Thompson Both! Notebook for collecting, Anki for reviewing. But the REAL secret is using words in sentences. I try to use 3 new words every day in my journal!",
                        likes: 24,
                    },
                ],
            },
            {
                user: SEED_USERS.david,
                content: "'Mellifluous' means sweet-sounding 🎵 The word itself IS mellifluous! That's why I love English - words often sound like what they mean.",
                likes: 20,
            },
        ],
    },

    // ===== POST 11: The Frog Prince =====
    {
        user: SEED_USERS.anna,
        content: "The Frog Prince taught me about keeping promises! 🐸👑 'A promise must be kept' - such an important life lesson wrapped in a fairy tale. Also learned: golden ball, well, pillow, spell. Simple but essential vocabulary!",
        type: 'share',
        metadata: { storyId: 'the-frog-prince', storyTitle: 'The Frog Prince' },
        likes: 44,
        replies: [
            {
                user: SEED_USERS.chris,
                content: "The princess throwing the frog against the wall and THAT breaking the spell 😂 Not exactly a kiss! The Grimm version is surprisingly violent but fun.",
                likes: 16,
                nestedReplies: [
                    {
                        user: SEED_USERS.anna,
                        content: "@Chris Williams Right?! I expected a romantic kiss but got chaos instead. Brothers Grimm keeping it real 😂",
                        likes: 8,
                    },
                ],
            },
            {
                user: SEED_USERS.nina,
                content: "Good for practicing conditionals: 'If you let me eat from your plate, I will get your ball.' Clear cause-and-effect language! 📝",
                likes: 12,
            },
        ],
    },

    // ===== POST 12: Motivation Post =====
    {
        user: SEED_USERS.oliver,
        content: "To everyone just starting: DON'T GIVE UP! 💪 3 months ago I struggled with 'The Three Little Pigs'. Today I finished 'The Nightingale and the Rose' by Oscar Wilde - Wilde's most beautiful AND saddest story. The nightingale dying to create a rose for ungrateful love... 🌹😢 Progress is possible!",
        type: 'thought',
        metadata: {},
        likes: 127,
        replies: [
            {
                user: SEED_USERS.emily,
                content: "This gives me SO much hope! 🥹 I'm still on beginner stories but seeing your progress makes me believe I can get there too!",
                likes: 34,
                nestedReplies: [
                    {
                        user: SEED_USERS.oliver,
                        content: "@Emily Chen You WILL get there! Start with 'How the Camel Got His Hump' - it's funny and short. Perfect gateway to Kipling!",
                        likes: 19,
                    },
                ],
            },
            {
                user: SEED_USERS.ryan,
                content: "The Nightingale and the Rose destroyed me emotionally 💔 'What a silly thing Love is... it is quite unpractical' - the Student's final words are so cynical after the nightingale's sacrifice.",
                likes: 28,
                nestedReplies: [
                    {
                        user: SEED_USERS.oliver,
                        content: "@Ryan Mitchell That contrast between true love (the nightingale) and shallow love (the Student) is what makes Wilde a genius. The bird understood love better than the human! 🐦❤️",
                        likes: 21,
                    },
                ],
            },
            {
                user: SEED_USERS.sophia,
                content: "From huffing and puffing pigs to philosophical nightingales in 3 months! 🎉 This community is the best motivation!",
                likes: 25,
            },
        ],
    },
];

export const seedCommunity = async (): Promise<void> => {
    console.log('🌱 Starting comprehensive community seed...');

    // Check if already seeded
    const existingQuery = query(collection(db, 'posts'), limit(15));
    const existingSnap = await getDocs(existingQuery);
    if (existingSnap.size >= 10) {
        console.log('✅ Community already seeded with sufficient data');
        return;
    }

    console.log(`📝 Creating ${SEED_POSTS.length} posts with replies...`);

    for (let i = 0; i < SEED_POSTS.length; i++) {
        const postData = SEED_POSTS[i];
        const totalReplies = postData.replies.reduce((acc, r) =>
            acc + 1 + (r.nestedReplies?.length || 0), 0
        );

        try {
            // Create post
            const postRef = await addDoc(collection(db, 'posts'), {
                userId: postData.user.id,
                userName: postData.user.name,
                userPhoto: postData.user.photo,
                content: postData.content,
                type: postData.type,
                metadata: postData.metadata || {},
                timestamp: serverTimestamp(),
                likes: postData.likes,
                likedBy: [],
                replyCount: totalReplies,
            });

            console.log(`✅ Created post ${i + 1}/${SEED_POSTS.length}: ${postData.user.name}`);

            // Create replies for this post (separate try-catch to handle permission issues)
            try {
                for (const reply of postData.replies) {
                    const replyRef = await addDoc(collection(db, 'replies'), {
                        postId: postRef.id,
                        parentId: null,
                        depth: 0,
                        userId: reply.user.id,
                        userName: reply.user.name,
                        userPhoto: reply.user.photo,
                        content: reply.content,
                        timestamp: serverTimestamp(),
                        likes: reply.likes,
                        likedBy: [],
                    });

                    // Create nested replies
                    if (reply.nestedReplies) {
                        for (const nested of reply.nestedReplies) {
                            await addDoc(collection(db, 'replies'), {
                                postId: postRef.id,
                                parentId: replyRef.id,
                                depth: 1,
                                userId: nested.user.id,
                                userName: nested.user.name,
                                userPhoto: nested.user.photo,
                                content: nested.content,
                                timestamp: serverTimestamp(),
                                likes: nested.likes,
                                likedBy: [],
                            });
                        }
                    }
                }
                console.log(`   💬 Added ${totalReplies} replies to post`);
            } catch (replyError) {
                console.warn(`   ⚠️ Could not add replies (permission denied). Posts created OK!`);
            }
        } catch (error) {
            console.error(`❌ Failed to create post ${i + 1}:`, error);
        }
    }

    console.log('🎉 Comprehensive community seed completed!');
};

/**
 * Clear all existing community data and reseed with fresh content
 * WARNING: This will delete all posts and replies!
 */
export const clearAndReseedCommunity = async (): Promise<void> => {
    console.log('🗑️ Clearing existing community data...');

    try {
        // Delete all replies first
        const repliesSnap = await getDocs(collection(db, 'replies'));
        console.log(`Deleting ${repliesSnap.size} replies...`);
        for (const doc of repliesSnap.docs) {
            await deleteDoc(doc.ref);
        }

        // Delete all posts
        const postsSnap = await getDocs(collection(db, 'posts'));
        console.log(`Deleting ${postsSnap.size} posts...`);
        for (const doc of postsSnap.docs) {
            await deleteDoc(doc.ref);
        }

        console.log('✅ All community data cleared!');

        // Now reseed
        await seedCommunity();
    } catch (error) {
        console.error('❌ Error clearing/reseeding:', error);
    }
};
