// Sanity Migration Script - User Created Stories
// Run with: npx sanity exec seed-user-stories.ts --with-user-token
// From the blue-hare directory

import { createClient } from '@sanity/client'

// Configure your Sanity client
const client = createClient({
    projectId: 'c5kac9s9',
    dataset: 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_WRITE_TOKEN || process.env.EXPO_PUBLIC_SANITY_TOKEN,
    useCdn: false,
})

// Helper to generate unique keys
const genKey = () => Math.random().toString(36).substring(2, 10)

// Create portable text block
const createBlock = (text: string) => ({
    _type: 'block',
    _key: genKey(),
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: genKey(), text, marks: [] }],
})

// Seed users (same as community seed)
const SEED_AUTHORS = [
    {
        id: 'user_emma_01',
        name: 'Emma Richardson',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80',
    },
    {
        id: 'user_james_02',
        name: 'James Cooper',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
    },
    {
        id: 'user_sophia_03',
        name: 'Sophia Martinez',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80',
    },
    {
        id: 'user_alex_04',
        name: 'Alex Thompson',
        avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=100&q=80',
    },
    {
        id: 'user_oliver_06',
        name: 'Oliver Bennett',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80',
    },
    {
        id: 'user_nina_13',
        name: 'Nina Patel',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&q=80',
    },
]

// User-created stories data
const USER_STORIES = [
    {
        author: SEED_AUTHORS[0], // Emma Richardson
        title: 'The Lost Key',
        description: 'A young boy discovers a mysterious golden key in his grandmother\'s garden. Where will it lead him? A simple story perfect for English learners.',
        difficulty: 'beginner',
        content: [
            'Tom was playing in his grandmother\'s garden. It was a beautiful sunny day.',
            'Under an old oak tree, he saw something shiny. He bent down and picked it up. It was a small golden key!',
            '"Grandma! Grandma!" Tom ran into the house. "Look what I found!"',
            'His grandmother smiled. "Ah, that is a very special key, Tom."',
            '"What does it open?" asked Tom excitedly.',
            '"Follow me," said Grandma. She walked to an old wooden chest in the attic.',
            'Tom put the key in the lock. Click! The chest opened slowly.',
            'Inside were old photographs, letters, and a beautiful music box. When Grandma opened it, a gentle melody played.',
            '"These are memories of my childhood," Grandma said softly. "Now they are yours to keep."',
            'Tom hugged his grandmother tightly. The old key had opened much more than a box. It had opened a treasure of family stories.',
            'That night, Tom fell asleep listening to Grandma tell stories about each photograph. He dreamed of gardens, adventures, and golden keys.',
        ],
        status: 'approved',
        isPublished: true,
    },
    {
        author: SEED_AUTHORS[1], // James Cooper
        title: 'The Brave Little Ant',
        description: 'An ant named Andy learns that even the smallest creatures can make a big difference. An inspiring fable for intermediate readers.',
        difficulty: 'intermediate',
        content: [
            'In a busy ant colony, there lived a small ant named Andy. He was the smallest ant in the entire colony.',
            'The other ants often teased him. "You are too small to carry food!" they would laugh. "You cannot dig tunnels like us!"',
            'Andy felt sad, but he never gave up trying to help.',
            'One autumn day, dark clouds gathered in the sky. Rain was coming! All the ants hurried to bring food inside.',
            'But there was a problem. A huge leaf had fallen and blocked the entrance to their home. The bigger ants pushed and pushed, but the leaf would not move.',
            '"Let me try!" said Andy. The other ants laughed. "You? You are too small!"',
            'Andy crawled under the leaf and found a tiny stick. He pushed the stick against his shoulder and lifted with all his might.',
            'Slowly, very slowly, the leaf began to move! Andy had found the perfect spot to push it.',
            'The bigger ants helped, and together they moved the leaf just as the rain began to fall.',
            '"Andy saved us!" the Queen Ant announced. "Being small is not a weakness. Andy found a solution that none of us could see."',
            'From that day on, no one teased Andy anymore. He became known as the cleverest ant in the colony.',
            'The moral: Size does not determine strength. Cleverness and courage can overcome any obstacle.',
        ],
        status: 'approved',
        isPublished: true,
    },
    {
        author: SEED_AUTHORS[2], // Sophia Martinez
        title: 'The Starlight Library',
        description: 'A magical library that only appears at midnight holds books that can change lives. A dreamlike story with beautiful vocabulary.',
        difficulty: 'intermediate',
        content: [
            'In the town of Willowbrook, there was a legend about a library that appeared only at midnight.',
            'Maya had heard the stories from her grandfather. "When the clock strikes twelve, go to Moonlight Square. If your heart is true, you will see it."',
            'On her twelfth birthday, Maya decided to find out if the legend was real.',
            'She crept out of her house and walked to the empty square. The clock tower began to chime. One... two... three...',
            'On the twelfth chime, a shimmer appeared in the air. Before her eyes, a magnificent building materialized. It was made of crystal and silver, glowing with starlight.',
            'The doors opened silently. Maya stepped inside and gasped.',
            'The library stretched endlessly upward, shelves spiraling into infinity. Books floated through the air like butterflies.',
            '"Welcome, seeker," said a gentle voice. A woman made of moonlight stood before her. "Each book here contains a dream. Choose wisely."',
            'Maya walked among the shelves, drawn to a small blue book. When she opened it, she saw her future self: a writer, surrounded by children, sharing stories.',
            '"That is your path," the librarian smiled. "Now go and create it."',
            'When Maya awoke the next morning, she held a silver bookmark in her hand. From that day on, she wrote every single day.',
            'Years later, Maya became the most beloved storyteller in Willowbrook. And sometimes, on clear nights, children whispered about a magical library made of starlight.',
        ],
        status: 'approved',
        isPublished: true,
    },
    {
        author: SEED_AUTHORS[3], // Alex Thompson
        title: 'The Last Train Home',
        description: 'A touching story about a businessman who takes the wrong train and discovers what truly matters in life. For advanced readers.',
        difficulty: 'advanced',
        content: [
            'Charles had not visited his hometown in fifteen years. Success had consumed him—meetings, acquisitions, quarterly reports. There was simply no time.',
            'On Christmas Eve, exhausted after another merger, he stumbled onto a train platform. The 10:47 to Millbrook, the sign read. Without thinking, he boarded.',
            'It was only after the train departed that he realized his mistake. Millbrook was his childhood home.',
            '"Perhaps fate has a sense of humor," he muttered, settling into an empty compartment.',
            'An elderly woman sat across from him. She was knitting something blue and humming a familiar tune.',
            '"You look lost," she observed, not looking up from her needles.',
            '"I took the wrong train," Charles admitted.',
            '"Did you?" She smiled mysteriously. "Or did the right train find you?"',
            'The train stopped at Millbrook just as snow began to fall. Charles stepped onto the platform of his childhood. Nothing had changed. Everything had changed.',
            'He walked past the old bakery where his mother used to buy bread. Past the schoolhouse. Past the lane where he had ridden his bicycle.',
            'And then he stood before a small house with a blue door. A light was on inside.',
            'His hand trembled as he knocked. The door opened, and his mother—older, frailer, but smiling—gasped.',
            '"Charles? Is it really you?"',
            'That Christmas, Charles learned that some journeys have no destination. They simply bring us home.',
            'He resigned from his company the following month. Some things, he had discovered, cannot be put in quarterly reports.',
        ],
        status: 'approved',
        isPublished: true,
    },
    {
        author: SEED_AUTHORS[4], // Oliver Bennett
        title: 'The Rainbow Fish\'s Journey',
        description: 'A colorful fish learns about friendship and sharing during an adventure across the ocean. Perfect for beginners with simple vocabulary.',
        difficulty: 'beginner',
        content: [
            'In the deep blue sea, there lived a fish with beautiful rainbow scales. Her name was Ruby.',
            'Ruby was very proud of her colorful scales. They sparkled like jewels.',
            'But Ruby was lonely. The other fish did not want to play with her.',
            '"Why don\'t you share your scales?" asked a wise old octopus. "Give one to each friend."',
            '"But then I won\'t be special!" said Ruby.',
            '"Try it," said the octopus with a gentle smile.',
            'Ruby thought about it all night. The next morning, she gave one scale to a little blue fish.',
            'The blue fish was so happy! He smiled and played with Ruby all day.',
            'Ruby gave another scale to a yellow fish. Then to a green fish. Then to a purple fish.',
            'Soon, Ruby had many friends. They all had one rainbow scale each.',
            '"I have fewer scales now," Ruby said. "But I have so many friends!"',
            'The ocean was more colorful than ever. Rainbow scales sparkled everywhere.',
            'Ruby learned that happiness grows when you share it. And she was never lonely again.',
        ],
        status: 'approved',
        isPublished: true,
    },
    {
        author: SEED_AUTHORS[5], // Nina Patel
        title: 'The Clockmaker\'s Secret',
        description: 'An intricate tale of a mysterious clockmaker whose creations can manipulate time itself. Rich vocabulary for advanced learners.',
        difficulty: 'advanced',
        content: [
            'In the narrow streets of Prague, there stood a shop that few people noticed. Its windows were dusty, its sign barely legible: "Horology by Hoffmann."',
            'The clockmaker, an ancient man named Viktor Hoffmann, had crafted timepieces for three generations. But his greatest creation remained hidden.',
            'Sophie, a young professor of physics, discovered the shop while researching temporal anomalies. The locals whispered that Hoffmann\'s clocks could do impossible things.',
            '"You seek more than ordinary time," Viktor said when she entered. His workshop was a labyrinth of gears, pendulums, and crystalline mechanisms.',
            '"I seek understanding," Sophie replied.',
            'Viktor nodded slowly. "Then you are ready to see."',
            'He led her to a hidden chamber beneath the shop. There, suspended in amber light, was a clock unlike any other. Its hands moved in spirals rather than circles.',
            '"The Möbius Clock," Viktor whispered reverently. "It does not measure time. It weaves it."',
            'Sophie watched, transfixed, as the clock\'s gears turned. In its reflection, she saw moments from her past and glimpses of futures yet unwritten.',
            '"Each choice creates a new thread," Viktor explained. "The clock shows all possible paths."',
            '"Why show this to me?" Sophie asked.',
            '"Because every generation needs a keeper of time\'s secrets." Viktor placed an ancient key in her palm. "My time is ending. Yours is just beginning."',
            'Sophie understood then that some knowledge transcends science. The clock continued its eternal dance, weaving the fabric of moments yet to come.',
            'She visits the shop still, every evening at twilight. And if you look carefully, you might see two shadows in the window—the old clockmaker and his successor, guardians of time itself.',
        ],
        status: 'approved',
        isPublished: true,
    },
]

// Get existing category IDs
async function getCategoryRefs() {
    const categories = await client.fetch(`*[_type == "category"]{ _id, slug }`)
    return categories.reduce((map: any, cat: any) => {
        map[cat.slug?.current || 'default'] = cat._id
        return map
    }, {} as Record<string, string>)
}

async function seedUserStories() {
    console.log('🌱 Starting User Stories Seed...\n')

    // Check if already seeded
    const existing = await client.fetch(`count(*[_type == "userStory"])`)
    if (existing > 3) {
        console.log('✅ User stories already seeded!')
        return
    }

    // Get category references
    const categoryMap = await getCategoryRefs()
    console.log('📁 Found categories:', Object.keys(categoryMap))

    // Default category (use aesops-fables or first available)
    const defaultCategory = categoryMap['classic-tales'] || categoryMap['aesops-fables'] || Object.values(categoryMap)[0]

    console.log(`\n📖 Creating ${USER_STORIES.length} user stories...\n`)

    for (const storyData of USER_STORIES) {
        try {
            const userStory = {
                _type: 'userStory',
                authorId: storyData.author.id,
                authorName: storyData.author.name,
                authorAvatar: storyData.author.avatar,
                title: storyData.title,
                description: storyData.description,
                difficulty: storyData.difficulty,
                content: storyData.content.map(createBlock),
                categories: [{ _type: 'reference', _ref: defaultCategory, _key: genKey() }],
                status: storyData.status,
                isPublished: storyData.isPublished,
                submittedAt: new Date().toISOString(),
                reviewedAt: new Date().toISOString(),
            }

            await client.create(userStory)
            console.log(`  ✅ "${storyData.title}" by ${storyData.author.name} (${storyData.difficulty})`)
        } catch (error: any) {
            console.error(`  ❌ Failed: ${storyData.title}`, error.message)
        }
    }

    console.log('\n🎉 User Stories Seed Completed!')
    console.log(`   Created: ${USER_STORIES.length} stories`)
    console.log('\n📷 Add cover images via Sanity Studio at:')
    console.log('   http://localhost:3333/studio')
}

// Run
seedUserStories().catch(console.error)
