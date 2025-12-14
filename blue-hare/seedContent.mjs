// Seed script to create test content in Sanity
// Run with: node --env-file=../.env seedContent.mjs

import { createClient } from '@sanity/client'

const client = createClient({
    projectId: 'c5kac9s9',
    dataset: 'production',
    token: process.env.EXPO_PUBLIC_SANITY_TOKEN,
    apiVersion: '2024-01-01',
    useCdn: false,
})

async function seedContent() {
    console.log('🌱 Starting to seed content...\n')

    try {
        // ============ CREATE CHARACTERS ============
        console.log('👤 Creating characters...')

        const emma = await client.create({
            _type: 'character',
            name: 'Emma',
            color: '#8B5CF6',
            voiceType: 'female',
            personality: 'Friendly and curious, loves to travel and try new foods',
            role: 'main',
        })
        console.log(`  ✓ Created character: ${emma.name}`)

        const barista = await client.create({
            _type: 'character',
            name: 'Alex',
            color: '#10B981',
            voiceType: 'male',
            personality: 'Cheerful coffee shop barista, always helpful',
            role: 'supporting',
        })
        console.log(`  ✓ Created character: ${barista.name}`)

        // ============ CREATE CATEGORY ============
        console.log('\n📁 Creating category...')

        const category = await client.create({
            _type: 'category',
            title: 'Daily Life',
            description: 'Everyday situations and conversations',
            iconName: 'cafe',
            color: '#F59E0B',
            order: 1,
        })
        console.log(`  ✓ Created category: ${category.title}`)

        // ============ CREATE AUTHOR ============
        console.log('\n✍️ Creating author...')

        const author = await client.create({
            _type: 'author',
            name: 'Sarah Johnson',
            bio: 'English teacher with 10 years of experience teaching ESL students.',
            expertise: ['Conversational English', 'Business English'],
            qualification: 'CELTA',
        })
        console.log(`  ✓ Created author: ${author.name}`)

        // ============ CREATE VOCABULARY WORDS ============
        console.log('\n📚 Creating vocabulary words...')

        const vocabLatte = await client.create({
            _type: 'vocabularyWord',
            word: 'latte',
            pronunciation: 'ˈlɑː.teɪ',
            partOfSpeech: 'noun',
            definition: 'A type of coffee made with espresso and steamed milk',
            definitionSimple: 'Coffee with milk',
            translation: 'sütlü kahve',
            level: 'A2',
            topics: ['food'],
            examples: [
                {
                    _key: 'ex1',
                    sentence: 'I\'d like a latte, please.',
                    highlightedWord: 'latte',
                },
            ],
            collocations: ['order a latte', 'make a latte', 'iced latte'],
        })
        console.log(`  ✓ Created vocabulary: ${vocabLatte.word}`)

        const vocabCroissant = await client.create({
            _type: 'vocabularyWord',
            word: 'croissant',
            pronunciation: 'kwʌˈsɒ̃',
            partOfSpeech: 'noun',
            definition: 'A French crescent-shaped pastry made of flaky dough',
            definitionSimple: 'A French breakfast bread',
            translation: 'kruvasan',
            level: 'A2',
            topics: ['food'],
            examples: [
                {
                    _key: 'ex1',
                    sentence: 'The croissant was warm and buttery.',
                    highlightedWord: 'croissant',
                },
            ],
        })
        console.log(`  ✓ Created vocabulary: ${vocabCroissant.word}`)

        const vocabDelicious = await client.create({
            _type: 'vocabularyWord',
            word: 'delicious',
            pronunciation: 'dɪˈlɪʃ.əs',
            partOfSpeech: 'adjective',
            definition: 'Having a very pleasant taste or smell',
            definitionSimple: 'Very tasty',
            translation: 'lezzetli',
            level: 'A1',
            topics: ['food'],
            examples: [
                {
                    _key: 'ex1',
                    sentence: 'This coffee is absolutely delicious!',
                    highlightedWord: 'delicious',
                },
            ],
            synonyms: ['tasty', 'yummy', 'scrumptious'],
            antonyms: ['disgusting', 'unpleasant'],
            collocations: ['absolutely delicious', 'looks delicious', 'smells delicious'],
        })
        console.log(`  ✓ Created vocabulary: ${vocabDelicious.word}`)

        // ============ CREATE GRAMMAR RULE ============
        console.log('\n📐 Creating grammar rule...')

        const grammarWouldLike = await client.create({
            _type: 'grammarRule',
            title: 'Using "Would Like" for Polite Requests',
            category: 'modals',
            level: 'A2',
            shortExplanation: 'Use "would like" instead of "want" to sound more polite when ordering or requesting something.',
            formula: 'Subject + would like + noun/to + verb',
            whenToUse: [
                'Ordering food or drinks',
                'Making requests',
                'Expressing preferences politely',
            ],
            examples: [
                {
                    _key: 'ex1',
                    correct: 'I would like a coffee, please.',
                    incorrect: 'I want a coffee.',
                    explanation: '"Would like" sounds more polite than "want"',
                },
                {
                    _key: 'ex2',
                    correct: 'Would you like some sugar?',
                    incorrect: 'Do you want sugar?',
                    explanation: 'Use "Would you like" for polite offers',
                },
            ],
            commonMistakes: [
                {
                    _key: 'm1',
                    mistake: 'I would like to a coffee.',
                    correction: 'I would like a coffee.',
                    tip: 'Don\'t use "to" before a noun, only before verbs',
                },
            ],
            signalWords: ['please', 'may I', 'could I'],
        })
        console.log(`  ✓ Created grammar rule: ${grammarWouldLike.title}`)

        // ============ CREATE LESSON ============
        console.log('\n📖 Creating lesson...')

        const lesson = await client.create({
            _type: 'lesson',
            title: 'At the Coffee Shop',
            slug: { current: 'at-the-coffee-shop' },
            description: 'Learn how to order food and drinks politely at a café.',
            level: 'A2',
            difficulty: 'easy',
            estimatedMinutes: 8,
            xpReward: 15,
            learningObjectives: [
                'Order food and drinks in English',
                'Use polite expressions with "would like"',
                'Learn common café vocabulary',
            ],
            category: { _type: 'reference', _ref: category._id },
            author: { _type: 'reference', _ref: author._id },
            vocabulary: [
                { _type: 'reference', _ref: vocabLatte._id, _key: 'v1' },
                { _type: 'reference', _ref: vocabCroissant._id, _key: 'v2' },
                { _type: 'reference', _ref: vocabDelicious._id, _key: 'v3' },
            ],
            isFeatured: true,
            publishedAt: new Date().toISOString(),
            segments: [
                // Segment 1: Vocabulary Introduction
                {
                    _type: 'vocabularySegment',
                    _key: 'seg1',
                    title: 'New Words',
                    introduction: "Let's learn some useful words for ordering at a café!",
                    words: [
                        { _type: 'reference', _ref: vocabLatte._id, _key: 'w1' },
                        { _type: 'reference', _ref: vocabCroissant._id, _key: 'w2' },
                        { _type: 'reference', _ref: vocabDelicious._id, _key: 'w3' },
                    ],
                    presentationStyle: 'flashcards',
                    showTranslation: true,
                    showExamples: true,
                },
                // Segment 2: Scene Description
                {
                    _type: 'storySegment',
                    _key: 'seg2',
                    segmentType: 'scene',
                    content: [
                        {
                            _type: 'block',
                            _key: 'b1',
                            style: 'normal',
                            children: [
                                {
                                    _type: 'span',
                                    _key: 's1',
                                    text: 'Emma walks into a cozy coffee shop. The smell of fresh coffee fills the air. She looks at the menu and decides what to order.',
                                    marks: [],
                                },
                            ],
                            markDefs: [],
                        },
                    ],
                    illustrationPosition: 'above',
                },
                // Segment 3: Dialogue
                {
                    _type: 'dialogueSegment',
                    _key: 'seg3',
                    sceneDescription: 'Emma approaches the counter',
                    lines: [
                        {
                            _key: 'l1',
                            character: { _type: 'reference', _ref: barista._id },
                            text: 'Hi! Welcome to Blue Bean Coffee. What can I get for you today?',
                            emotion: 'happy',
                        },
                        {
                            _key: 'l2',
                            character: { _type: 'reference', _ref: emma._id },
                            text: "Hello! I'd like a latte, please.",
                            emotion: 'happy',
                        },
                        {
                            _key: 'l3',
                            character: { _type: 'reference', _ref: barista._id },
                            text: 'Sure! Would you like anything else? We have fresh croissants.',
                            emotion: 'neutral',
                        },
                        {
                            _key: 'l4',
                            character: { _type: 'reference', _ref: emma._id },
                            text: "Oh, that sounds delicious! Yes, I'd like a croissant too, please.",
                            emotion: 'excited',
                        },
                    ],
                    showTranslation: false,
                },
                // Segment 4: Comprehension Exercise
                {
                    _type: 'exerciseSegment',
                    _key: 'seg4',
                    exerciseType: 'multipleChoice',
                    instruction: 'Answer the question',
                    question: 'What does Emma order?',
                    options: [
                        { _key: 'o1', text: 'A latte and a croissant', isCorrect: true, feedback: 'Correct! She orders both.' },
                        { _key: 'o2', text: 'Just a latte', isCorrect: false, feedback: 'Not quite - she also orders something to eat.' },
                        { _key: 'o3', text: 'A cappuccino', isCorrect: false, feedback: 'No, she orders a latte, not a cappuccino.' },
                        { _key: 'o4', text: 'Tea and a muffin', isCorrect: false, feedback: 'No, read the dialogue again.' },
                    ],
                    correctFeedback: 'Excellent! 🎉',
                    incorrectFeedback: 'Try again!',
                    explanation: 'Emma says "I\'d like a latte" and then "I\'d like a croissant too".',
                    xpValue: 5,
                },
                // Segment 5: Grammar Lesson
                {
                    _type: 'grammarSegment',
                    _key: 'seg5',
                    rule: { _type: 'reference', _ref: grammarWouldLike._id },
                    contextIntro: 'Notice how Emma says "I\'d like" instead of "I want". This is more polite!',
                    highlightedExample: "I'd like a latte, please.",
                    showStyle: 'tip',
                    showExamples: true,
                    showCommonMistakes: false,
                },
                // Segment 6: Fill in the Blank Exercise
                {
                    _type: 'exerciseSegment',
                    _key: 'seg6',
                    exerciseType: 'fillBlank',
                    instruction: 'Complete the polite request',
                    question: null,
                    sentenceWithBlank: 'I ___ a croissant, please.',
                    correctAnswer: "would like",
                    acceptableAnswers: ["'d like", "would like"],
                    wordBank: ["would like", "want", "need", "have"],
                    correctFeedback: 'Perfect! "Would like" is the polite way to order.',
                    incorrectFeedback: 'Remember to use the polite form!',
                    explanation: 'We use "would like" for polite requests, especially when ordering.',
                    xpValue: 5,
                },
                // Segment 7: Word Order Exercise
                {
                    _type: 'exerciseSegment',
                    _key: 'seg7',
                    exerciseType: 'wordOrder',
                    instruction: 'Put the words in the correct order',
                    question: 'Make a polite question:',
                    scrambledWords: ['Would', 'you', 'like', 'some', 'sugar', '?'],
                    correctSentence: 'Would you like some sugar?',
                    extraWords: ['Do', 'want'],
                    correctFeedback: 'Great job! 🌟',
                    incorrectFeedback: 'Not quite. Start with "Would".',
                    xpValue: 5,
                },
                // Segment 8: More Dialogue
                {
                    _type: 'dialogueSegment',
                    _key: 'seg8',
                    sceneDescription: 'The barista prepares the order',
                    lines: [
                        {
                            _key: 'l1',
                            character: { _type: 'reference', _ref: barista._id },
                            text: "That'll be $7.50. Would you like the receipt?",
                            emotion: 'neutral',
                        },
                        {
                            _key: 'l2',
                            character: { _type: 'reference', _ref: emma._id },
                            text: 'Yes, please. Thank you!',
                            emotion: 'happy',
                        },
                        {
                            _key: 'l3',
                            character: { _type: 'reference', _ref: barista._id },
                            text: "Here you go. Enjoy your latte and croissant!",
                            emotion: 'happy',
                        },
                        {
                            _key: 'l4',
                            character: { _type: 'reference', _ref: emma._id },
                            text: 'Thanks! This croissant looks delicious!',
                            emotion: 'excited',
                        },
                    ],
                    showTranslation: false,
                },
                // Segment 9: Matching Exercise
                {
                    _type: 'exerciseSegment',
                    _key: 'seg9',
                    exerciseType: 'matching',
                    instruction: 'Match the words with their meanings',
                    question: null,
                    matchingPairs: [
                        { _key: 'p1', left: 'latte', right: 'coffee with milk' },
                        { _key: 'p2', left: 'croissant', right: 'French pastry' },
                        { _key: 'p3', left: 'delicious', right: 'very tasty' },
                    ],
                    correctFeedback: 'Excellent vocabulary! 📚',
                    incorrectFeedback: 'Try matching again!',
                    xpValue: 5,
                },
            ],
        })
        console.log(`  ✓ Created lesson: ${lesson.title}`)

        console.log('\n✅ Content seeding complete!')
        console.log('\n📊 Summary:')
        console.log(`  - 2 Characters created`)
        console.log(`  - 1 Category created`)
        console.log(`  - 1 Author created`)
        console.log(`  - 3 Vocabulary words created`)
        console.log(`  - 1 Grammar rule created`)
        console.log(`  - 1 Lesson with 9 segments created`)
        console.log('\n🚀 Open Sanity Studio to see your content!')

    } catch (error) {
        console.error('❌ Error seeding content:', error.message)
        throw error
    }
}

seedContent()
