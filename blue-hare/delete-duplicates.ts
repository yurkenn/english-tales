// Find and delete duplicate stories from Sanity
import { createClient } from '@sanity/client'

const client = createClient({
    projectId: 'c5kac9s9',
    dataset: 'production',
    apiVersion: '2024-01-01',
    token: process.env.EXPO_PUBLIC_SANITY_TOKEN,
    useCdn: false,
})

async function deleteDuplicateStories() {
    console.log('🔍 Finding duplicate stories...\n')

    // Get all stories grouped by slug
    const stories = await client.fetch(`*[_type == "story"]{
        _id,
        title,
        "slug": slug.current,
        _createdAt
    } | order(_createdAt asc)`)

    // Group by slug
    const storyMap = new Map<string, Array<{ _id: string, title: string, slug: string, _createdAt: string }>>()

    for (const story of stories) {
        if (!story.slug) continue
        if (!storyMap.has(story.slug)) {
            storyMap.set(story.slug, [])
        }
        storyMap.get(story.slug)!.push(story)
    }

    // Find duplicates
    let duplicateCount = 0
    let deletedCount = 0

    console.log('📊 Stories with duplicates:\n')

    for (const [slug, storyList] of storyMap.entries()) {
        if (storyList.length > 1) {
            duplicateCount++
            console.log(`  📖 ${storyList[0].title} (${storyList.length} copies)`)

            // Keep the first one (oldest), delete the rest
            const toKeep = storyList[0]
            const toDelete = storyList.slice(1)

            for (const story of toDelete) {
                try {
                    await client.delete(story._id)
                    console.log(`    ✅ Deleted duplicate: ${story._id}`)
                    deletedCount++
                } catch (error: any) {
                    console.error(`    ❌ Failed to delete ${story._id}:`, error.message)
                }
            }
        }
    }

    console.log(`\n✅ Cleanup complete!`)
    console.log(`   Found ${duplicateCount} stories with duplicates`)
    console.log(`   Deleted ${deletedCount} duplicate copies`)
}

deleteDuplicateStories().catch(console.error)
