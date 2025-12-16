// Add missing authors to Sanity
import { createClient } from '@sanity/client'

const client = createClient({
    projectId: 'c5kac9s9',
    dataset: 'production',
    apiVersion: '2024-01-01',
    token: process.env.EXPO_PUBLIC_SANITY_TOKEN,
    useCdn: false,
})

const missingAuthors = [
    {
        _id: 'author-wilde',
        _type: 'author',
        name: 'Oscar Wilde',
        slug: { _type: 'slug', current: 'oscar-wilde' },
        bio: 'Oscar Wilde was an Irish poet and playwright known for his wit and flamboyant style. His fairy tales, including The Happy Prince and The Selfish Giant, remain beloved for their moral depth and beautiful prose.',
        nationality: 'Irish',
        birthYear: 1854,
        deathYear: 1900,
        isFeatured: true,
    },
    {
        _id: 'author-kipling',
        _type: 'author',
        name: 'Rudyard Kipling',
        slug: { _type: 'slug', current: 'rudyard-kipling' },
        bio: 'Rudyard Kipling was an English journalist, short-story writer, and poet. He is best known for The Jungle Book and Just So Stories. He won the Nobel Prize in Literature in 1907.',
        nationality: 'British',
        birthYear: 1865,
        deathYear: 1936,
        isFeatured: true,
    },
]

async function addMissingAuthors() {
    console.log('👤 Adding missing authors to Sanity...\n')

    for (const author of missingAuthors) {
        try {
            const exists = await client.getDocument(author._id)
            if (exists) {
                console.log(`  ⚠️ ${author.name} already exists`)
            } else {
                await client.create(author)
                console.log(`  ✅ Added: ${author.name}`)
            }
        } catch (error: any) {
            console.error(`  ❌ Failed: ${author.name}`, error.message)
        }
    }

    console.log('\n✅ Authors added!')
}

addMissingAuthors().catch(console.error)
