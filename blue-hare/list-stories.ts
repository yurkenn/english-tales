// List all stories and their IDs to check for duplicates
import { createClient } from '@sanity/client'

const client = createClient({
    projectId: 'c5kac9s9',
    dataset: 'production',
    apiVersion: '2024-01-01',
    token: process.env.EXPO_PUBLIC_SANITY_TOKEN,
    useCdn: false,
})

async function listAllStories() {
    console.log('📋 Listing all stories...\n')

    const stories = await client.fetch(`*[_type == "story"]{
        _id,
        title,
        "slug": slug.current,
        _createdAt
    } | order(title asc)`)

    // Group by slug
    const slugMap = new Map<string, any[]>()

    for (const story of stories) {
        const slug = story.slug || 'no-slug'
        if (!slugMap.has(slug)) {
            slugMap.set(slug, [])
        }
        slugMap.get(slug)!.push(story)
    }

    console.log(`Total stories: ${stories.length}\n`)

    // Show duplicates
    let duplicateCount = 0
    for (const [slug, items] of slugMap.entries()) {
        if (items.length > 1) {
            duplicateCount++
            console.log(`\n🔴 DUPLICATE: ${items[0].title} (${items.length} copies)`)
            for (const item of items) {
                console.log(`   - ID: ${item._id}`)
                console.log(`     Created: ${item._createdAt}`)
            }
        }
    }

    if (duplicateCount === 0) {
        console.log('✅ No duplicates found!')
    } else {
        console.log(`\n⚠️ Found ${duplicateCount} stories with duplicates`)
    }
}

listAllStories().catch(console.error)
