// Check actual image URLs from Sanity
import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

const client = createClient({
    projectId: 'c5kac9s9',
    dataset: 'production',
    apiVersion: '2024-01-01',
    token: process.env.EXPO_PUBLIC_SANITY_TOKEN,
    useCdn: false,
})

const builder = imageUrlBuilder(client)

async function checkImageUrls() {
    console.log('🔍 Checking image URLs...\n')

    const stories = await client.fetch(`*[_type == "story" && defined(coverImage)][0..5]{
        title,
        coverImage
    }`)

    for (const story of stories) {
        console.log(`📖 ${story.title}`)
        if (story.coverImage) {
            const url = builder.image(story.coverImage).width(300).url()
            console.log(`   URL: ${url}`)
        }
        console.log()
    }
}

checkImageUrls().catch(console.error)
