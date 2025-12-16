// Delete short stories from Sanity
import { createClient } from '@sanity/client'

const client = createClient({
    projectId: 'c5kac9s9',
    dataset: 'production',
    apiVersion: '2024-01-01',
    token: process.env.EXPO_PUBLIC_SANITY_TOKEN,
    useCdn: false,
})

// Stories to delete (short ones under 300 words)
const storiesToDelete = [
    'story-the-tortoise-and-the-hare',
    'story-the-fox-and-the-grapes',
    'story-the-lion-and-the-mouse',
    'story-the-boy-who-cried-wolf',
    'story-the-ant-and-the-grasshopper',
    'story-the-crow-and-the-pitcher',
    'story-the-dog-and-his-shadow',
    'story-the-town-mouse-and-the-country-mouse',
]

async function deleteShortStories() {
    console.log('🗑️  Deleting short stories from Sanity...\n')

    for (const storyId of storiesToDelete) {
        try {
            // Check if story exists
            const exists = await client.getDocument(storyId)
            if (exists) {
                await client.delete(storyId)
                console.log(`  ✅ Deleted: ${storyId}`)
            } else {
                console.log(`  ⚠️ Not found: ${storyId}`)
            }
        } catch (error: any) {
            console.error(`  ❌ Failed to delete ${storyId}:`, error.message)
        }
    }

    console.log('\n✅ Cleanup complete!')
}

deleteShortStories().catch(console.error)
