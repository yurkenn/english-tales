// Check story images status
import { createClient } from '@sanity/client'

const client = createClient({
    projectId: 'c5kac9s9',
    dataset: 'production',
    apiVersion: '2024-01-01',
    token: process.env.EXPO_PUBLIC_SANITY_TOKEN,
    useCdn: false,
})

async function checkImages() {
    console.log('🔍 Checking story cover images...\n')

    const stories = await client.fetch(`*[_type == "story"]{
        title,
        "slug": slug.current,
        "hasImage": defined(coverImage),
        coverImage
    } | order(title asc)`)

    let withImage = 0
    let withoutImage = 0

    console.log('📊 Stories WITHOUT cover image:\n')
    for (const story of stories) {
        if (story.hasImage) {
            withImage++
        } else {
            withoutImage++
            console.log(`  ❌ ${story.title} (${story.slug})`)
        }
    }

    console.log(`\n✅ Summary:`)
    console.log(`   With image: ${withImage}`)
    console.log(`   Without image: ${withoutImage}`)
}

checkImages().catch(console.error)
