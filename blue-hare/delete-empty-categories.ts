// Delete old categories and empty categories from Sanity
import { createClient } from '@sanity/client'

const client = createClient({
    projectId: 'c5kac9s9',
    dataset: 'production',
    apiVersion: '2024-01-01',
    token: process.env.EXPO_PUBLIC_SANITY_TOKEN,
    useCdn: false,
})

async function deleteEmptyCategories() {
    console.log('🗑️  Checking and deleting empty categories from Sanity...\n')

    // Get all categories
    const categories = await client.fetch(`*[_type == "category"]{
        _id,
        title,
        "storyCount": count(*[_type == "story" && references(^._id)])
    }`)

    console.log('📊 Current categories:')
    for (const cat of categories) {
        console.log(`  - ${cat.title}: ${cat.storyCount} stories`)
    }

    console.log('\n🗑️  Deleting categories with 0 stories...\n')

    for (const cat of categories) {
        if (cat.storyCount === 0) {
            try {
                await client.delete(cat._id)
                console.log(`  ✅ Deleted: ${cat.title}`)
            } catch (error: any) {
                console.error(`  ❌ Failed to delete ${cat.title}:`, error.message)
            }
        }
    }

    console.log('\n✅ Category cleanup complete!')
}

deleteEmptyCategories().catch(console.error)
