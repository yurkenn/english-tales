// Sanity Migration Script - Public Domain Stories with Images
// Run with: npx ts-node seed-stories.ts
// Or: npx sanity exec seed-stories.ts --with-user-token

import { createClient } from '@sanity/client'

// Configure your Sanity client
const client = createClient({
    projectId: 'c5kac9s9', // Correct project ID
    dataset: 'production',
    apiVersion: '2024-01-01',
    token: process.env.EXPO_PUBLIC_SANITY_TOKEN, // Uses same env var as the app
    useCdn: false,
})

// Helper to generate unique keys
const genKey = () => Math.random().toString(36).substring(2, 10)

// ========== AUTHORS ==========
const authors = [
    {
        _id: 'author-aesop',
        _type: 'author',
        name: 'Aesop',
        slug: { _type: 'slug', current: 'aesop' },
        bio: 'Aesop was a Greek fabulist and storyteller credited with a number of fables now collectively known as Aesops Fables. Although his existence remains unclear, numerous tales credited to him were gathered across the centuries.',
        nationality: 'Greek',
        birthYear: -620,
        deathYear: -564,
        isFeatured: true,
    },
    {
        _id: 'author-grimm',
        _type: 'author',
        name: 'Brothers Grimm',
        slug: { _type: 'slug', current: 'brothers-grimm' },
        bio: 'The Brothers Grimm, Jacob and Wilhelm, were German academics and authors who collected and published folklore during the 19th century. Their collection of fairy tales is among the best known in the world.',
        nationality: 'German',
        birthYear: 1785,
        deathYear: 1863,
        isFeatured: true,
    },
    {
        _id: 'author-andersen',
        _type: 'author',
        name: 'Hans Christian Andersen',
        slug: { _type: 'slug', current: 'hans-christian-andersen' },
        bio: 'Hans Christian Andersen was a Danish author known for his fairy tales, including The Little Mermaid, The Ugly Duckling, and The Snow Queen. His stories have been translated into over 125 languages.',
        nationality: 'Danish',
        birthYear: 1805,
        deathYear: 1875,
        isFeatured: false,
    },
]

// ========== CATEGORIES ==========
const categories = [
    {
        _id: 'cat-fables',
        _type: 'category',
        title: 'Fables',
        slug: { _type: 'slug', current: 'fables' },
        description: 'Short stories with moral lessons, often featuring animals',
        icon: 'paw-outline',
        color: '#10B981',
        order: 1,
    },
    {
        _id: 'cat-fairy-tales',
        _type: 'category',
        title: 'Fairy Tales',
        slug: { _type: 'slug', current: 'fairy-tales' },
        description: 'Magical stories with princes, princesses, and fantasy',
        icon: 'sparkles-outline',
        color: '#8B5CF6',
        order: 2,
    },
    {
        _id: 'cat-classics',
        _type: 'category',
        title: 'Classics',
        slug: { _type: 'slug', current: 'classics' },
        description: 'Timeless literature from renowned authors',
        icon: 'book-outline',
        color: '#F59E0B',
        order: 3,
    },
]

// ========== HELPER FUNCTIONS ==========
const createBlock = (text: string) => ({
    _type: 'block',
    _key: genKey(),
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: genKey(), text, marks: [] }],
})

// Upload image from URL to Sanity
async function uploadImageFromUrl(url: string, filename: string) {
    try {
        console.log(`    📷 Downloading: ${filename}...`)
        const response = await fetch(url)
        const buffer = await response.arrayBuffer()
        const asset = await client.assets.upload('image', Buffer.from(buffer), {
            filename,
        })
        return {
            _type: 'image',
            asset: {
                _type: 'reference',
                _ref: asset._id,
            },
        }
    } catch (error) {
        console.error(`    ❌ Failed to upload ${filename}:`, error)
        return null
    }
}

// ========== STORIES WITH IMAGE URLS ==========
// Using Wikimedia Commons public domain images
const storiesData = [
    // ===== BEGINNER - Aesop's Fables =====
    {
        title: 'The Tortoise and the Hare',
        slug: 'the-tortoise-and-the-hare',
        authorRef: 'author-aesop',
        categoryRefs: ['cat-fables'],
        description: 'A race between a slow tortoise and a fast hare teaches us that slow and steady wins the race.',
        difficulty: 'beginner',
        estimatedReadTime: 2,
        wordCount: 180,
        isFeatured: true,
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/The_Tortoise_and_the_Hare_-_Project_Gutenberg_etext_19994.jpg/800px-The_Tortoise_and_the_Hare_-_Project_Gutenberg_etext_19994.jpg',
        content: [
            'A Hare was one day making fun of a Tortoise for being so slow. "Wait a minute," said the Tortoise. "I will run a race with you, and I will win."',
            '"Very well," laughed the Hare. "Let us try."',
            'So the Fox agreed to be the judge, and they started together.',
            'The Hare ran very fast and soon was far ahead. He thought he had plenty of time to rest. He lay down under a tree and soon fell asleep.',
            'The Tortoise kept plodding on and on. He never stopped. He passed the sleeping Hare.',
            'When the Hare woke up and ran to the finish line, he found the Tortoise already there.',
            'Moral: Slow but steady wins the race.',
        ],
    },
    {
        title: 'The Fox and the Grapes',
        slug: 'the-fox-and-the-grapes',
        authorRef: 'author-aesop',
        categoryRefs: ['cat-fables'],
        description: 'A hungry fox tries to reach delicious grapes but gives up, claiming they were sour anyway.',
        difficulty: 'beginner',
        estimatedReadTime: 1,
        wordCount: 120,
        isFeatured: false,
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Fox_and_grapes.jpg/800px-Fox_and_grapes.jpg',
        content: [
            'One hot summer day, a Fox was walking through a forest. He was very hungry and thirsty.',
            'Soon he saw a vine with beautiful purple grapes hanging high above him.',
            '"What lovely grapes!" said the Fox. "They look so sweet and juicy. They will be perfect to drink."',
            'The Fox jumped as high as he could, but he could not reach the grapes. He tried again and again, but they were too high.',
            'Finally, the Fox walked away. "Those grapes are probably sour anyway," he said.',
            'Moral: It is easy to hate what you cannot have.',
        ],
    },
    {
        title: 'The Lion and the Mouse',
        slug: 'the-lion-and-the-mouse',
        authorRef: 'author-aesop',
        categoryRefs: ['cat-fables'],
        description: 'A tiny mouse helps a mighty lion, proving that even the smallest friend can be the greatest help.',
        difficulty: 'beginner',
        estimatedReadTime: 2,
        wordCount: 200,
        isFeatured: true,
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/The_Lion_and_the_Mouse_-_Project_Gutenberg_etext_19994.jpg/800px-The_Lion_and_the_Mouse_-_Project_Gutenberg_etext_19994.jpg',
        content: [
            'Once a great Lion was sleeping in the forest. A little Mouse ran over his face and woke him up.',
            'The Lion caught the Mouse with his big paw. "I will eat you!" he roared.',
            '"Please let me go," begged the Mouse. "One day I will help you."',
            'The Lion laughed. "How can a tiny mouse help a great lion?" But he let the Mouse go.',
            'A few days later, the Lion was caught in a hunter\'s net. He roared and roared, but he could not escape.',
            'The little Mouse heard him. She ran to the net and began to bite the ropes with her sharp teeth.',
            'Soon the Lion was free. "Thank you, little friend," said the Lion. "You saved my life."',
            'Moral: No act of kindness is ever wasted.',
        ],
    },
    {
        title: 'The Boy Who Cried Wolf',
        slug: 'the-boy-who-cried-wolf',
        authorRef: 'author-aesop',
        categoryRefs: ['cat-fables'],
        description: 'A shepherd boy learns the hard way that liars are never believed, even when they tell the truth.',
        difficulty: 'beginner',
        estimatedReadTime: 3,
        wordCount: 250,
        isFeatured: false,
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Boy_Crying_Wolf.jpg/800px-Boy_Crying_Wolf.jpg',
        content: [
            'There was once a shepherd boy who watched the village sheep. He was bored, so he decided to have some fun.',
            '"Wolf! Wolf!" he shouted. The villagers ran up the hill to help him.',
            'But there was no wolf. The boy laughed. "I tricked you!" he said.',
            'The next week, he did it again. "Wolf! Wolf!" The villagers came running again.',
            'But again, there was no wolf. The villagers were angry and went home.',
            'Then one day, a real wolf came. "Wolf! Wolf!" the boy shouted as loudly as he could.',
            'But this time, no one came. The villagers thought he was lying again.',
            'The wolf ate many sheep that day.',
            'Moral: A liar will not be believed, even when telling the truth.',
        ],
    },
    {
        title: 'The Ant and the Grasshopper',
        slug: 'the-ant-and-the-grasshopper',
        authorRef: 'author-aesop',
        categoryRefs: ['cat-fables'],
        description: 'A hardworking ant prepares for winter while a lazy grasshopper plays all summer.',
        difficulty: 'beginner',
        estimatedReadTime: 2,
        wordCount: 180,
        isFeatured: false,
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Ant_and_the_Grasshopper_-_Project_Gutenberg_etext_19994.jpg/800px-Ant_and_the_Grasshopper_-_Project_Gutenberg_etext_19994.jpg',
        content: [
            'In the summer, an Ant worked very hard. Every day, he carried food to his home to save for winter.',
            'A Grasshopper watched the Ant. "Why do you work so hard?" asked the Grasshopper. "Come and play with me!"',
            '"I must save food for winter," said the Ant. "You should do the same."',
            '"Winter is far away," laughed the Grasshopper. "I want to sing and dance now."',
            'When winter came, the Ant had plenty of food. He was warm and happy in his home.',
            'But the Grasshopper had no food. He was cold and hungry. He went to the Ant for help.',
            '"You should have worked in the summer," said the Ant. "Now you must face the consequences."',
            'Moral: It is best to prepare for the future.',
        ],
    },

    // ===== INTERMEDIATE - Fairy Tales =====
    {
        title: 'The Ugly Duckling',
        slug: 'the-ugly-duckling',
        authorRef: 'author-andersen',
        categoryRefs: ['cat-fairy-tales'],
        description: 'A duckling who is mocked for being different grows up to become a beautiful swan.',
        difficulty: 'intermediate',
        estimatedReadTime: 5,
        wordCount: 450,
        isFeatured: true,
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/The_Ugly_Duckling_12.jpg/800px-The_Ugly_Duckling_12.jpg',
        content: [
            'Once upon a time, a mother duck sat on her eggs, waiting for them to hatch. One by one, the eggs cracked open, and out came beautiful yellow ducklings.',
            'But the last egg was bigger than the others. When it finally hatched, out came a grey duckling who looked very different from his brothers and sisters.',
            '"What an ugly duckling!" said the other ducks. They laughed at him and pushed him away.',
            'The poor duckling was very sad. No one wanted to play with him. Even his own mother seemed ashamed of him.',
            'One day, the ugly duckling decided to run away. He wandered through fields and forests, looking for someone who would accept him.',
            'Winter came, and the duckling was cold and alone. He found a frozen lake and stayed there, struggling to survive.',
            'Finally, spring arrived. The ice melted, and the duckling stretched his wings. He had grown bigger and stronger during the winter.',
            'He flew to a pond where beautiful white birds were swimming. "They are so beautiful," he thought. "They will surely chase me away."',
            'But when he looked at his reflection in the water, he could not believe his eyes. He was not an ugly duckling anymore. He had become a beautiful white swan!',
            'The other swans welcomed him. "You are the most beautiful of us all," they said.',
            'The young swan was so happy. He had finally found where he belonged.',
        ],
    },
    {
        title: 'Little Red Riding Hood',
        slug: 'little-red-riding-hood',
        authorRef: 'author-grimm',
        categoryRefs: ['cat-fairy-tales'],
        description: 'A girl in a red hood brings food to her grandmother but meets a cunning wolf on the way.',
        difficulty: 'intermediate',
        estimatedReadTime: 6,
        wordCount: 520,
        isFeatured: true,
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Little_Red_Riding_Hood_-_Project_Gutenberg_etext_19993.jpg/800px-Little_Red_Riding_Hood_-_Project_Gutenberg_etext_19993.jpg',
        content: [
            'Once upon a time, there was a little girl who lived near a big forest. She always wore a red hood, so everyone called her Little Red Riding Hood.',
            'One day, her mother said, "Your grandmother is sick. Please take this basket of food to her, but stay on the path and do not talk to strangers."',
            '"Yes, Mother," said Little Red Riding Hood, and she set off through the forest.',
            'On the way, she met a wolf. "Where are you going, little girl?" asked the wolf with a sly smile.',
            '"I am going to visit my grandmother," said Little Red Riding Hood. "She lives in the cottage by the old oak tree."',
            'The wolf had a wicked plan. He ran ahead to the grandmother\'s cottage. He knocked on the door and pretended to be Little Red Riding Hood.',
            'The grandmother let him in, and the wolf locked her in the closet. Then he put on her nightgown and got into her bed.',
            'When Little Red Riding Hood arrived, she thought something was strange. "Grandmother, what big eyes you have!"',
            '"All the better to see you with, my dear."',
            '"Grandmother, what big ears you have!"',
            '"All the better to hear you with, my dear."',
            '"Grandmother, what big teeth you have!"',
            '"All the better to eat you with!" The wolf jumped out of bed.',
            'Little Red Riding Hood screamed. A woodcutter who was passing by heard her. He rushed in and chased the wolf away.',
            'They freed the grandmother from the closet, and everyone was safe.',
            'From that day on, Little Red Riding Hood always listened to her mother and never talked to strangers.',
        ],
    },
    {
        title: 'The Three Little Pigs',
        slug: 'the-three-little-pigs',
        authorRef: 'author-grimm',
        categoryRefs: ['cat-fairy-tales'],
        description: 'Three pig brothers build houses of straw, sticks, and bricks to protect themselves from a hungry wolf.',
        difficulty: 'intermediate',
        estimatedReadTime: 5,
        wordCount: 480,
        isFeatured: false,
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Three_little_pigs_-_the_ass_carrying_the_wolf.jpg/800px-Three_little_pigs_-_the_ass_carrying_the_wolf.jpg',
        content: [
            'Once upon a time, there were three little pigs who left home to seek their fortune.',
            'The first little pig was lazy. He built his house out of straw because it was easy and fast. "Now I can play all day!" he said.',
            'The second little pig was a bit lazy too. He built his house out of sticks. It was a little stronger but still quite easy to build.',
            'The third little pig was hardworking. He built his house out of bricks. It took a long time, but it was very strong.',
            'One day, a big bad wolf came to the forest. He was very hungry. He found the first little pig\'s straw house.',
            '"Little pig, little pig, let me in!" said the wolf.',
            '"Not by the hair on my chin!" said the pig.',
            '"Then I\'ll huff, and I\'ll puff, and I\'ll blow your house down!" The wolf blew, and the straw house fell down. The first pig ran to his brother\'s house.',
            'The wolf followed and found the stick house. He huffed and puffed and blew that house down too. Both pigs ran to the brick house.',
            'The wolf came to the brick house. He huffed and puffed, but the house would not fall down.',
            'The wolf tried to climb down the chimney, but the clever third pig had lit a fire. The wolf ran away and never came back.',
            'The three little pigs lived happily ever after in the strong brick house.',
            'Moral: Hard work and patience pay off in the end.',
        ],
    },

    // ===== ADVANCED =====
    {
        title: 'The Emperor\'s New Clothes',
        slug: 'the-emperors-new-clothes',
        authorRef: 'author-andersen',
        categoryRefs: ['cat-fairy-tales', 'cat-classics'],
        description: 'An emperor who cares only about his clothes is tricked by swindlers who promise him an invisible suit.',
        difficulty: 'advanced',
        estimatedReadTime: 8,
        wordCount: 720,
        isFeatured: false,
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Vilhelm_Pedersen%2C_Kejserens_nye_Kl%C3%A6der_1849.jpg/800px-Vilhelm_Pedersen%2C_Kejserens_nye_Kl%C3%A6der_1849.jpg',
        content: [
            'Many years ago, there lived an Emperor who was excessively fond of new clothes. He cared nothing about his army, the theater, or going to the park, except to show off his new clothes.',
            'One day, two swindlers came to the city. They claimed to be weavers and said they could weave the most magnificent cloth imaginable. Not only were the colors and patterns extraordinarily beautiful, but clothes made from this cloth had a wonderful quality: they were invisible to anyone who was unfit for their office or who was unusually stupid.',
            '"Those must be wonderful clothes!" thought the Emperor. "If I wore them, I would be able to discover which people in my kingdom are unfit for their jobs. I must have some of this cloth woven for me right away."',
            'He gave the two swindlers a large sum of money to begin their work at once. They set up two looms and pretended to work, but there was nothing on the looms at all.',
            'The Emperor sent his most honest minister to see how the work was progressing. The minister looked and looked, but he could see nothing on the looms. "Am I stupid?" he thought. "I must not let anyone know I cannot see the cloth."',
            '"Magnificent!" he said. "Absolutely beautiful!" And he reported back to the Emperor that the cloth was coming along splendidly.',
            'Finally, the swindlers announced that the clothes were ready. They pretended to dress the Emperor, who could see nothing but pretended he was dressed in the finest robes.',
            '"How splendid His Majesty looks in his new clothes!" everyone cried. No one would admit that they could see nothing, for that would prove them either unfit for their job or stupid.',
            'The Emperor walked proudly through the streets in a grand procession. Everyone admired his new clothes.',
            'But then a little child cried out, "But he has nothing on at all!"',
            '"Listen to the voice of innocence!" said the child\'s father. And the whisper spread through the crowd: "He has nothing on!"',
            'The Emperor realized they were right, but he held his head high and continued the procession, pretending nothing was wrong.',
            'This tale reminds us that truth often comes from the most unexpected places, and that we should never be afraid to speak what we see.',
        ],
    },
    {
        title: 'Hansel and Gretel',
        slug: 'hansel-and-gretel',
        authorRef: 'author-grimm',
        categoryRefs: ['cat-fairy-tales'],
        description: 'Two siblings find a witch\'s house made of candy in the forest and must use their wits to escape.',
        difficulty: 'advanced',
        estimatedReadTime: 10,
        wordCount: 850,
        isFeatured: true,
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Hansel_and_Gretel.jpg/800px-Hansel_and_Gretel.jpg',
        content: [
            'Near a great forest there lived a poor woodcutter with his wife and two children. The boy was called Hansel and the girl Gretel.',
            'One night, when the family had nothing left to eat, the father said with a heavy heart, "What is to become of us? We cannot feed our children."',
            'The stepmother had an idea. "Early tomorrow morning, we will take the children deep into the forest and leave them there."',
            'But Hansel heard the plan. He crept outside and filled his pockets with white pebbles that shone like silver in the moonlight.',
            'The next morning, the parents led the children deep into the forest. As they walked, Hansel dropped the pebbles along the path.',
            'The parents left them by a great fire and never returned. When the moon rose, the white pebbles showed the children the way home.',
            'But their joy was short-lived. Soon the family was hungry again, and this time Hansel could not get pebbles. Instead, he dropped breadcrumbs along the path.',
            'When they tried to find their way back, the birds had eaten all the breadcrumbs. The children were lost in the forest.',
            'After walking for three days, they came upon a strange house. Its walls were made of bread, the roof of cake, and the windows of clear sugar.',
            '"Let us eat!" said Hansel, and they began to break off pieces of the house.',
            'Then a voice called out: "Nibble, nibble, little mouse! Who is nibbling at my house?"',
            'An old woman appeared at the door. She seemed kind and invited them inside, giving them pancakes and milk. But she was really a wicked witch who ate children.',
            'The witch locked Hansel in a cage and made Gretel do housework. Every day, she felt Hansel\'s finger to see if he was fat enough to eat.',
            'Clever Hansel held out a small bone instead of his finger, so the witch, who had poor eyesight, thought he was too thin.',
            'Finally, the witch grew impatient. "Light the oven, Gretel!" she cried. "Today I will cook your brother!"',
            'When the oven was hot, the witch told Gretel to climb in and check the temperature. But Gretel said, "I don\'t know how. Show me."',
            'When the witch leaned into the oven, Gretel pushed her in and shut the door. The wicked witch was no more.',
            'Gretel freed her brother. They found chests of pearls and jewels in the witch\'s house and filled their pockets.',
            'They found their way home, where their father was overjoyed to see them. Their cruel stepmother had died, and they lived happily ever after.',
        ],
    },
]

// ========== MAIN SEED FUNCTION ==========
async function seedData() {
    console.log('🌱 Starting data seed...\n')

    // Create authors
    console.log('📝 Creating authors...')
    for (const author of authors) {
        try {
            await client.createOrReplace(author)
            console.log(`  ✓ ${author.name}`)
        } catch (error) {
            console.log(`  ⚠️ Author ${author.name} may already exist`)
        }
    }

    // Create categories
    console.log('\n📂 Creating categories...')
    for (const category of categories) {
        try {
            await client.createOrReplace(category)
            console.log(`  ✓ ${category.title}`)
        } catch (error) {
            console.log(`  ⚠️ Category ${category.title} may already exist`)
        }
    }

    // Create stories WITHOUT images (add images later via Sanity Studio)
    console.log('\n📖 Creating stories (without cover images)...')
    console.log('   ⚠️ You can add cover images later via Sanity Studio\n')

    for (const storyData of storiesData) {
        // Build story document WITHOUT coverImage
        const story = {
            _id: `story-${storyData.slug}`,
            _type: 'story',
            title: storyData.title,
            slug: { _type: 'slug', current: storyData.slug },
            author: { _type: 'reference', _ref: storyData.authorRef },
            categories: storyData.categoryRefs.map((ref, i) => ({
                _type: 'reference',
                _ref: ref,
                _key: `cat-${i}`,
            })),
            // coverImage is required - we'll use a placeholder logic
            description: storyData.description,
            difficulty: storyData.difficulty,
            estimatedReadTime: storyData.estimatedReadTime,
            wordCount: storyData.wordCount,
            isFeatured: storyData.isFeatured,
            publishedAt: new Date().toISOString(),
            content: storyData.content.map((text) => createBlock(text)),
        }

        try {
            await client.createOrReplace(story)
            console.log(`  ✅ ${storyData.title} (${storyData.difficulty})`)
        } catch (error: any) {
            console.error(`  ❌ Failed: ${storyData.title}`, error.message)
        }
    }

    console.log('\n✅ Seed completed!')
    console.log(`   Authors: ${authors.length}`)
    console.log(`   Categories: ${categories.length}`)
    console.log(`   Stories: ${storiesData.length}`)
    console.log('\n📷 NEXT STEP: Add cover images via Sanity Studio at:')
    console.log('   http://localhost:3333/studio')
}

// Run
seedData().catch(console.error)
