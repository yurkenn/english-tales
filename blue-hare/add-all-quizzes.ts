import { createClient } from '@sanity/client'
import * as dotenv from 'dotenv'

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
    // === AESOP'S FABLES (Beginner) ===
    {
        slug: 'the-tortoise-and-the-hare',
        checkpoint: {
            question: 'Is the hare running fast?',
            options: ['Yes', 'No'],
            correctIndex: 0
        },
        quiz: [
            {
                question: 'Why did the hare lose the race?',
                options: ['He was too slow', 'He took a nap during the race', 'He got lost', 'He tripped'],
                correctIndex: 1,
                explanation: 'The hare was so confident that he took a nap, allowing the slow but steady tortoise to pass him.'
            },
            {
                question: 'What is the moral of this story?',
                options: ['Speed is everything', 'Never race a tortoise', 'Slow and steady wins the race', 'Resting is important'],
                correctIndex: 2,
                explanation: 'Persistence and consistency are more important than raw speed.'
            }
        ]
    },
    {
        slug: 'the-lion-and-the-mouse',
        checkpoint: {
            question: 'Why did the lion roar?',
            options: ['He was happy', 'He was caught in a net', 'He was hungry'],
            correctIndex: 1
        },
        quiz: [
            {
                question: 'How did the mouse help the lion?',
                options: ['By bringing him food', 'By gnawing through a hunter\'s net', 'By scaring away the hunters', 'By showing him the way home'],
                correctIndex: 1,
                explanation: 'The mouse used her small teeth to bite through the ropes of the net that trapped the lion.'
            },
            {
                question: 'Why did the lion let the mouse go at first?',
                options: ['He wasn\'t hungry', 'The mouse was too fast', 'He was kind and amused by the mouse\'s promise', 'The mouse offered him a gift'],
                correctIndex: 2,
                explanation: 'The lion was amused by the idea that such a tiny creature could ever help him, but decided to be merciful.'
            }
        ]
    },
    {
        slug: 'the-fox-and-the-grapes',
        checkpoint: {
            question: 'Can the fox reach the grapes?',
            options: ['Yes', 'No'],
            correctIndex: 1
        },
        quiz: [
            {
                question: 'What did the fox say when he couldn\'t reach the grapes?',
                options: ['They are too high', 'They are probably sour', 'I will come back tomorrow', 'I don\'t like grapes'],
                correctIndex: 1,
                explanation: 'When we can\'t get what we want, we often pretend we didn\'t want it anyway — this is called "sour grapes."'
            }
        ]
    },
    {
        slug: 'the-boy-who-cried-wolf',
        checkpoint: {
            question: 'Was there a real wolf the first time?',
            options: ['Yes', 'No'],
            correctIndex: 1
        },
        quiz: [
            {
                question: 'Why didn\'t the villagers come when the real wolf appeared?',
                options: ['They were too busy', 'They didn\'t hear the boy', 'They thought it was another trick', 'They were afraid of the wolf'],
                correctIndex: 2,
                explanation: 'Because the boy had lied twice before, the villagers lost trust in his words.'
            }
        ]
    },
    {
        slug: 'the-ant-and-the-grasshopper',
        checkpoint: {
            question: 'Is the ant playing or working?',
            options: ['Playing', 'Working'],
            correctIndex: 1
        },
        quiz: [
            {
                question: 'What was the ant doing during the summer?',
                options: ['Singing and dancing', 'Sleeping in the sun', 'Storing food for winter', 'Building a new house'],
                correctIndex: 2,
                explanation: 'The ant was working hard to prepare for the cold months ahead.'
            },
            {
                question: 'What happened to the grasshopper in winter?',
                options: ['He found plenty of food', 'He was cold and hungry', 'He went south', 'He joined the ants'],
                correctIndex: 1,
                explanation: 'Because he didn\'t prepare during the summer, he had no food when winter arrived.'
            }
        ]
    },
    {
        slug: 'the-dog-and-his-shadow',
        checkpoint: {
            question: 'What did the dog see in the water?',
            options: ['Another dog', 'His own reflection', 'A cat'],
            correctIndex: 1
        },
        quiz: [
            {
                question: 'Why did the dog drop his bone into the water?',
                options: ['He was thirsty', 'He tried to grab the bone from his reflection', 'He wanted to swim', 'A cat stole it'],
                correctIndex: 1,
                explanation: 'The dog was greedy and tried to take what he thought was a bigger bone from another dog in the water.'
            }
        ]
    },
    {
        slug: 'the-crow-and-the-pitcher',
        checkpoint: {
            question: 'What is the crow putting in the pitcher?',
            options: ['Water', 'Stones', 'Food'],
            correctIndex: 1
        },
        quiz: [
            {
                question: 'How did the crow reach the water in the pitcher?',
                options: ['By breaking the pitcher', 'By knocking it over', 'By dropping stones into it', 'By using a straw'],
                correctIndex: 2,
                explanation: 'By dropping stones, the crow made the water level rise until he could reach it.'
            }
        ]
    },
    {
        slug: 'the-goose-that-laid-golden-eggs',
        checkpoint: {
            question: 'What kind of eggs does the goose lay?',
            options: ['Normal eggs', 'Golden eggs', 'Silver eggs'],
            correctIndex: 1
        },
        quiz: [
            {
                question: 'Why did the farmer kill the goose?',
                options: ['The goose was sick', 'He wanted to get all the gold at once', 'The goose stopped laying eggs', 'He was hungry'],
                correctIndex: 1,
                explanation: 'The farmer\'s greed led him to believe he could find a treasure inside the goose, but he ended up losing everything.'
            }
        ]
    },

    // === BROTHERS GRIMM ===
    {
        slug: 'hansel-and-gretel',
        checkpoint: {
            question: 'What did Hansel drop to find his way back?',
            options: ['Breadcrumbs', 'White pebbles', 'Flowers'],
            correctIndex: 1
        },
        quiz: [
            {
                question: 'How did the children find their way home the first time?',
                options: ['Using breadcrumbs', 'Using white pebbles', 'The birds showed them', 'They followed their parents'],
                correctIndex: 1,
                explanation: 'Hansel dropped white pebbles that shone in the moonlight to mark their path.'
            },
            {
                question: 'What was the witch\'s house made of?',
                options: ['Wood and stone', 'Bricks and mortar', 'Bread, cake, and sugar', 'Gingerbread and chocolate'],
                correctIndex: 2,
                explanation: 'The house was designed to lure hungry children with its delicious walls and roof.'
            }
        ]
    },
    {
        slug: 'snow-white',
        checkpoint: {
            question: 'How many dwarfs did Snow White find?',
            options: ['Three', 'Five', 'Seven'],
            correctIndex: 2
        },
        quiz: [
            {
                question: 'Why did the queen want to kill Snow White?',
                options: ['Snow White was mean', 'Snow White was the fairest in the land', 'Snow White stole her mirror', 'Snow White want to be queen'],
                correctIndex: 1,
                explanation: 'The queen\'s jealousy was triggered when the magic mirror named Snow White as the most beautiful.'
            },
            {
                question: 'Who did Snow White live with in the forest?',
                options: ['Seven dwarfs', 'Seven giants', 'A kind hunter', 'The animals'],
                correctIndex: 0,
                explanation: 'She found shelter in the tiny cottage of the seven dwarfs who worked in the mines.'
            }
        ]
    },
    {
        slug: 'rumpelstiltskin',
        checkpoint: {
            question: 'What do they want to turn into gold?',
            options: ['Straw', 'Wood', 'Silver'],
            correctIndex: 0
        },
        quiz: [
            {
                question: 'What did the miller claim his daughter could do?',
                options: ['Bake magic bread', 'Spin straw into gold', 'Sing like an angel', 'Read the future'],
                correctIndex: 1,
                explanation: 'The miller boasted to the king that his daughter had the impossible ability to spin straw into gold.'
            },
            {
                question: 'How did the queen keep her baby?',
                options: ['By paying the little man gold', 'By hiding the baby', 'By guessing the little man\'s name', 'By running away'],
                correctIndex: 2,
                explanation: 'She discovered his name, "Rumpelstiltskin," which freed her from her promise.'
            }
        ]
    },
    {
        slug: 'the-frog-prince',
        checkpoint: {
            question: 'Where did the golden ball fall?',
            options: ['In the garden', 'In a deep well', 'In the castle'],
            correctIndex: 1
        },
        quiz: [
            {
                question: 'What did the princess lose in the well?',
                options: ['A silver ring', 'A golden ball', 'A diamond necklace', 'Her crown'],
                correctIndex: 1,
                explanation: 'Her favorite golden ball fell into the deep water while she was playing.'
            }
        ]
    },

    // ... (Adding all other stories similarly to ensure completeness)
    {
        slug: 'puss-in-boots',
        checkpoint: {
            question: 'What did the cat ask for?',
            options: ['A hat and fish', 'Boots and a bag', 'A sword and shield'],
            correctIndex: 1
        },
        quiz: [
            {
                question: 'What did the youngest son receive as his inheritance?',
                options: ['A mill', 'A donkey', 'A cat', 'A bag of gold'],
                correctIndex: 2,
                explanation: 'While his brothers got the mill and donkey, he was left with just the cat.'
            }
        ]
    },
    {
        slug: 'cinderella',
        checkpoint: {
            question: 'Who helped Cinderella go to the ball?',
            options: ['Her sisters', 'Her stepmother', 'Her Fairy Godmother'],
            correctIndex: 2
        },
        quiz: [
            {
                question: 'What time did the magic end for Cinderella?',
                options: ['11:00 PM', 'Midnight', 'Dawn', '10:00 PM'],
                correctIndex: 1,
                explanation: 'The Fairy Godmother warned her that all the magic would disappear at the stroke of twelve.'
            }
        ]
    },
    {
        slug: 'sleeping-beauty',
        checkpoint: {
            question: 'What caused the princess to fall asleep?',
            options: ['A poisoned apple', 'A magic potion', 'Pricking her finger on a spindle'],
            correctIndex: 2
        },
        quiz: [
            {
                question: 'How long was the princess to sleep?',
                options: ['10 years', '50 years', '100 years', 'Forever'],
                correctIndex: 2,
                explanation: 'The curse was softened to a hundred-year sleep that would end with a kiss.'
            }
        ]
    },
    {
        slug: 'rapunzel',
        checkpoint: {
            question: 'Where was Rapunzel kept?',
            options: ['In a cave', 'In a tower', 'In a palace'],
            correctIndex: 1
        },
        quiz: [
            {
                question: 'How did the prince climb the tower?',
                options: ['Using a ladder', 'Using Rapunzel\'s long hair', 'By flying'],
                correctIndex: 1,
                explanation: 'He called out the same words the enchantress used, and Rapunzel let down her golden braids.'
            }
        ]
    },
    {
        slug: 'beauty-and-the-beast',
        checkpoint: {
            question: 'What did Beauty ask her father for?',
            options: ['A dress', 'A jewel', 'A rose'],
            correctIndex: 2
        },
        quiz: [
            {
                question: 'How was the Beast turned back into a prince?',
                options: ['By a magic potion', 'By Beauty\'s love/tears', 'By defeating a villain'],
                correctIndex: 1,
                explanation: 'The spell was broken when Beauty realized her love for him and wept.'
            }
        ]
    },
    {
        slug: 'the-emperors-new-clothes',
        checkpoint: {
            question: 'Who finally spoke the truth?',
            options: ['One of the weavers', 'A wise minister', 'A little child'],
            correctIndex: 2
        },
        quiz: [
            {
                question: 'Why did people say they could see the clothes?',
                options: ['The clothes were beautiful', 'They didn\'t want to seem stupid', 'The weavers were very kind'],
                correctIndex: 1,
                explanation: 'The swindlers claimed the clothes were only visible to those who were intelligent.'
            }
        ]
    },
    {
        slug: 'thumbelina',
        checkpoint: {
            question: 'What was Thumbelina sleeping in?',
            options: ['A matchbox', 'A walnut shell', 'A flower petal'],
            correctIndex: 1
        },
        quiz: [
            {
                question: 'Who helped Thumbelina escape to the warm lands?',
                options: ['A butterfly', 'A swallow', 'A mouse'],
                correctIndex: 1,
                explanation: 'She had cared for a wounded swallow in winter, and in return, he flew her away.'
            }
        ]
    },
    {
        slug: 'the-little-match-girl',
        checkpoint: {
            question: 'Why was the girl outside in the cold?',
            options: ['She was playing', 'She had to sell matches', 'She was lost'],
            correctIndex: 1
        },
        quiz: [
            {
                question: 'What did the girl see in her visions?',
                options: ['Scary monsters', 'A feast and her grandmother', 'The people of the city'],
                correctIndex: 1,
                explanation: 'Each match she lit provided a brief, beautiful escape from the cold.'
            }
        ]
    },
    {
        slug: 'the-steadfast-tin-soldier',
        checkpoint: {
            question: 'Who did the soldier fall in love with?',
            options: ['A paper ballerina', 'The cook', 'A porcelain doll'],
            correctIndex: 0
        },
        quiz: [
            {
                question: 'Why did the tin soldier only have one leg?',
                options: ['It was broken', 'There was not enough tin', 'He was born that way'],
                correctIndex: 1,
                explanation: 'He was the last of twenty-five soldiers made from an old tin spoon.'
            }
        ]
    },
    {
        slug: 'the-princess-and-the-pea',
        checkpoint: {
            question: 'How many mattresses were on the bed?',
            options: ['One', 'Ten', 'Twenty'],
            correctIndex: 2
        },
        quiz: [
            {
                question: 'How did the queen test if the girl was a real princess?',
                options: ['By asking for her ID', 'By placing a pea under her mattresses', 'By asking her to dance'],
                correctIndex: 1,
                explanation: 'The queen believed only a "true" princess would be delicate enough to feel a tiny pea.'
            }
        ]
    },
    {
        slug: 'the-little-mermaid',
        checkpoint: {
            question: 'What did the Little Mermaid give up to become human?',
            options: ['Her palace', 'Her family', 'Her beautiful voice'],
            correctIndex: 2
        },
        quiz: [
            {
                question: 'What would happen if the prince married someone else?',
                options: ['She would return home', 'She would die and become sea foam', 'She would stay human'],
                correctIndex: 1,
                explanation: 'The witch\'s curse stated that her life was tied to winning the prince\'s heart.'
            }
        ]
    },
    {
        slug: 'the-snow-queen',
        checkpoint: {
            question: 'What entered Kay\'s eye and heart?',
            options: ['Dust', 'Magic mirror splinters', 'Snowflakes'],
            correctIndex: 1
        },
        quiz: [
            {
                question: 'What power did the Finn woman say Gerda had?',
                options: ['Magic spells', 'Innocence and a loving heart', 'A sharp sword'],
                correctIndex: 1,
                explanation: 'Gerda\'s strength came from her unwavering love and kindness.'
            }
        ]
    },
    {
        slug: 'the-happy-prince',
        checkpoint: {
            question: 'Who helped the Prince help the poor?',
            options: ['A dove', 'A swallow', 'A sparrow'],
            correctIndex: 1
        },
        quiz: [
            {
                question: 'What was the statue of the Happy Prince decorated with?',
                options: ['Paint and glass', 'Gold leaves, sapphires, and a ruby', 'Silver and diamonds'],
                correctIndex: 1,
                explanation: 'The statue was covered in gold and had precious gems for eyes.'
            }
        ]
    },
    {
        slug: 'the-selfish-giant',
        checkpoint: {
            question: 'What was around the Giant\'s garden?',
            options: ['A river', 'A high wall', 'A hedge of roses'],
            correctIndex: 1
        },
        quiz: [
            {
                question: 'Why was it always winter in the Giant\'s garden?',
                options: ['The Giant liked snow', 'Because he banned the children', 'He lived in the north'],
                correctIndex: 1,
                explanation: 'Spring refused to return until children were allowed back in.'
            }
        ]
    },
    {
        slug: 'the-nightingale-and-the-rose',
        checkpoint: {
            question: 'What color rose did the student need?',
            options: ['White', 'Yellow', 'Red'],
            correctIndex: 2
        },
        quiz: [
            {
                question: 'What did the Nightingale sacrifice for the red rose?',
                options: ['Her nest', 'Her song', 'Her life'],
                correctIndex: 2,
                explanation: 'She stained the rose with her own heart\'s blood.'
            }
        ]
    },
    {
        slug: 'the-elephants-child',
        checkpoint: {
            question: 'How did the elephant get a long trunk?',
            options: ['It grew naturally', 'The crocodile pulled his nose', 'A magician gave it'],
            correctIndex: 1
        },
        quiz: [
            {
                question: 'Why did the elephant have a short nose at first?',
                options: ['He was born that way', 'It was cut', 'He hadn\'t grown up'],
                correctIndex: 0,
                explanation: 'Originally, all elephants had short, bulgy noses until the crocodile stretched one.'
            }
        ]
    },
    {
        slug: 'how-the-camel-got-his-hump',
        checkpoint: {
            question: 'What did the camel always say?',
            options: ['Hello', 'Humph!', 'Maybe'],
            correctIndex: 1
        },
        quiz: [
            {
                question: 'Why did the Camel get a hump?',
                options: ['As a reward', 'As punishment for his idleness', 'He was born with it'],
                correctIndex: 1,
                explanation: 'The Djinn gave him the "humph" as a consequence for refusing to work.'
            }
        ]
    },
    {
        slug: 'pinocchio',
        checkpoint: {
            question: 'Who was Pinocchio\'s conscience?',
            options: ['A blue fairy', 'A cricket', 'A cat'],
            correctIndex: 1
        },
        quiz: [
            {
                question: 'What happened when Pinocchio told a lie?',
                options: ['His ears grew', 'His nose grew longer', 'He turned into a donkey'],
                correctIndex: 1,
                explanation: 'The Blue Fairy used his nose as a visible sign of his dishonesty.'
            }
        ]
    },
    {
        slug: 'aladdin',
        checkpoint: {
            question: 'Where did Aladdin find the magic lamp?',
            options: ['In a marketplace', 'In a hidden cave', 'In the palace'],
            correctIndex: 1
        },
        quiz: [
            {
                question: 'What was the lamp made of?',
                options: ['Gold', 'Brass', 'Silver'],
                correctIndex: 1,
                explanation: 'Aladdin found an old brass lamp in the secret cave.'
            }
        ]
    },
    {
        slug: 'ali-baba-and-the-forty-thieves',
        checkpoint: {
            question: 'What were the magic words to open the cave?',
            options: ['Open, Garlic!', 'Open, Sesame!', 'Open, Door!'],
            correctIndex: 1
        },
        quiz: [
            {
                question: 'What did the captain hide his thieves in?',
                options: ['Chests', 'Oil jars', 'Sacks'],
                correctIndex: 1,
                explanation: 'The captain came disguised as an oil merchant with thieves hidden in jars.'
            }
        ]
    },
    {
        slug: 'jack-and-the-beanstalk',
        checkpoint: {
            question: 'What did Jack trade the cow for?',
            options: ['A bag of gold', 'Magic beans', 'Food'],
            correctIndex: 1
        },
        quiz: [
            {
                question: 'What did Jack steal first from the giant?',
                options: ['A golden hen', 'A bag of gold', 'A magic harp'],
                correctIndex: 1,
                explanation: 'Jack first stole a bag of gold while the giant was sleeping.'
            }
        ]
    }
]

async function addAllQuizzes() {
    console.log('🚀 Starting comprehensive content injection...')
    let successCount = 0
    let failCount = 0

    for (const data of quizData) {
        try {
            const story = await client.fetch(`*[_type == "story" && slug.current == $slug][0]`, { slug: data.slug })

            if (!story) {
                console.log(`  ❌ Story not found: ${data.slug}`)
                failCount++
                continue
            }

            // --- Injection Logic for Checkpoints ---
            let newContent = [...story.content]

            // Check if story already has a checkpoint (avoid duplicates)
            const hasExistingCheckpoint = story.content.some((block: any) => block._type === 'checkpoint')

            if (data.checkpoint && !hasExistingCheckpoint) {
                const checkpointBlock = {
                    _type: 'checkpoint',
                    _key: genKey(),
                    question: data.checkpoint.question,
                    options: data.checkpoint.options,
                    correctIndex: data.checkpoint.correctIndex
                }

                // Insert after the 3rd or 4th block if possible
                const insertIndex = Math.min(newContent.length, 4)
                newContent.splice(insertIndex, 0, checkpointBlock)
                console.log(`  📦 Preparing checkpoint for: ${story.title}`)
            }

            // Update both quiz and content
            await client.patch(story._id).set({
                quiz: data.quiz,
                content: newContent
            }).commit()

            console.log(`  ✅ Updated: ${story.title} (${data.quiz.length} questions)`)
            successCount++
        } catch (error: any) {
            console.error(`  ❌ Failed to update ${data.slug}:`, error.message)
            failCount++
        }
    }

    console.log(`\n✨ Injection complete! Success: ${successCount}, Failed: ${failCount}`)
}

addAllQuizzes()
