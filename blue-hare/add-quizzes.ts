import { createClient } from '@sanity/client'
import * as dotenv from 'dotenv'

// Load environment variables from the root .env file if possible
dotenv.config()

const client = createClient({
    projectId: 'c5kac9s9',
    dataset: 'production',
    apiVersion: '2024-01-01',
    token: process.env.EXPO_PUBLIC_SANITY_TOKEN,
    useCdn: false,
})

const genKey = () => Math.random().toString(36).substring(2, 10)

const quizData = [
    {
        slug: 'the-ugly-duckling',
        checkpoints: [
            {
                insertAfter: 'But the last egg was bigger than the others.',
                checkpoint: {
                    _type: 'checkpoint',
                    _key: genKey(),
                    question: 'Why was one egg different from the others?',
                    options: ['It was smaller', 'It was bigger', 'It was a different color'],
                    correctIndex: 1
                }
            }
        ],
        quiz: [
            {
                question: 'Why did the other ducks call the duckling "ugly"?',
                options: [
                    'Because he was too small',
                    'Because he looked different from his siblings',
                    'Because he could not swim',
                    'Because he was loud'
                ],
                correctIndex: 1,
                explanation: 'The duckling was born grey and larger than the other yellow ducklings, which made him stand out.'
            },
            {
                question: 'What did the duckling turn into at the end of the story?',
                options: [
                    'A big duck',
                    'A goose',
                    'A beautiful white swan',
                    'An eagle'
                ],
                correctIndex: 2,
                explanation: 'After a long winter, the duckling realized he was actually a swan when he saw his reflection.'
            },
            {
                question: 'How did the other swans react when they saw him?',
                options: [
                    'They chased him away',
                    'They ignored him',
                    'They welcomed him as the most beautiful swan',
                    'They laughed at him'
                ],
                correctIndex: 2,
                explanation: 'The other swans immediately accepted him and admired his beauty.'
            }
        ]
    },
    {
        slug: 'little-red-riding-hood',
        quiz: [
            {
                question: 'What did Little Red Riding Hood catch the wolf doing?',
                options: [
                    'Eating her grandmother\'s food',
                    'Dressing up in her grandmother\'s nightgown',
                    'Playing in the garden',
                    'Sleeping in the forest'
                ],
                correctIndex: 1,
                explanation: 'The wolf tried to trick Little Red Riding Hood by pretending to be her grandmother.'
            },
            {
                question: 'Who saved Little Red Riding Hood and her grandmother?',
                options: [
                    'Her mother',
                    'A woodcutter',
                    'A group of hunters',
                    'The wolf himself'
                ],
                correctIndex: 1,
                explanation: 'A woodcutter passing by heard the screams and came to help.'
            }
        ]
    },
    {
        slug: 'the-three-little-pigs',
        quiz: [
            {
                question: 'Which material made the strongest house?',
                options: [
                    'Straw',
                    'Sticks',
                    'Bricks',
                    'Mud'
                ],
                correctIndex: 2,
                explanation: 'The third pig\'s brick house was the only one that the wolf could not blow down.'
            },
            {
                question: 'How did the wolf try to enter the third pig\'s house?',
                options: [
                    'Through the window',
                    'By breaking the door',
                    'Down the chimney',
                    'By digging a tunnel'
                ],
                correctIndex: 2,
                explanation: 'After failing to blow the house down, the wolf tried to go down the chimney.'
            }
        ]
    }
]

async function addQuizzes() {
    console.log('🚀 Starting quiz injection...')

    for (const data of quizData) {
        try {
            const story = await client.fetch(`*[_type == "story" && slug.current == $slug][0]`, { slug: data.slug })

            if (!story) {
                console.log(`  ❌ Story not found: ${data.slug}`)
                continue
            }

            const patches: any = {
                quiz: data.quiz
            }

            // Handle checkpoints if they exist
            if (data.checkpoints && story.content) {
                let newContent = [...story.content]
                let offset = 0

                for (const cp of data.checkpoints) {
                    const index = newContent.findIndex((block: any) =>
                        block._type === 'block' &&
                        block.children?.[0]?.text?.includes(cp.insertAfter)
                    )

                    if (index !== -1) {
                        newContent.splice(index + 1 + offset, 0, cp.checkpoint)
                        offset++
                    }
                }
                patches.content = newContent
            }

            await client.patch(story._id).set(patches).commit()
            console.log(`  ✅ Updated: ${story.title} (${data.quiz.length} questions added)`)
        } catch (error: any) {
            console.error(`  ❌ Failed to update ${data.slug}:`, error.message)
        }
    }

    console.log('\n✨ Injection complete!')
}

addQuizzes()
