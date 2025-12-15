// Upload cover images to Sanity and attach to stories
import { createClient } from '@sanity/client'
import * as fs from 'fs'
import * as path from 'path'

const client = createClient({
    projectId: 'c5kac9s9',
    dataset: 'production',
    apiVersion: '2024-01-01',
    token: process.env.EXPO_PUBLIC_SANITY_TOKEN,
    useCdn: false,
})

const imageDir = '/Users/oguzyurken/.gemini/antigravity/brain/3f2f2fe3-bdee-44b2-b5b2-adf9c9c99c16'

const storyImageMap: Record<string, string> = {
    'story-the-tortoise-and-the-hare': 'tortoise_hare_cover_1765835040948.png',
    'story-the-fox-and-the-grapes': 'fox_grapes_cover_1765835055633.png',
    'story-the-lion-and-the-mouse': 'lion_mouse_cover_1765835071002.png',
    'story-the-boy-who-cried-wolf': 'boy_wolf_cover_1765835099779.png',
    'story-the-ant-and-the-grasshopper': 'ant_grasshopper_cover_1765835115916.png',
    'story-the-ugly-duckling': 'ugly_duckling_cover_1765835131874.png',
    'story-little-red-riding-hood': 'red_riding_hood_cover_1765835147367.png',
    'story-the-three-little-pigs': 'three_pigs_cover_1765835175077.png',
    'story-the-emperors-new-clothes': 'emperor_clothes_cover_1765835234182.png',
    'story-hansel-and-gretel': 'hansel_gretel_cover_1765835207886.png',
}

async function uploadImages() {
    console.log('📷 Uploading cover images to Sanity...\n')

    for (const [storyId, imageName] of Object.entries(storyImageMap)) {
        const imagePath = path.join(imageDir, imageName)

        if (!fs.existsSync(imagePath)) {
            console.log(`  ⚠️ Image not found: ${imageName}`)
            continue
        }

        try {
            console.log(`  Processing: ${storyId}`)

            // Upload image asset
            const imageBuffer = fs.readFileSync(imagePath)
            const asset = await client.assets.upload('image', imageBuffer, {
                filename: imageName,
            })
            console.log(`    📤 Uploaded: ${imageName}`)

            // Update story with cover image
            await client.patch(storyId)
                .set({
                    coverImage: {
                        _type: 'image',
                        asset: {
                            _type: 'reference',
                            _ref: asset._id,
                        },
                    },
                })
                .commit()

            console.log(`    ✅ Updated story with cover image`)
        } catch (error: any) {
            console.error(`    ❌ Failed: ${error.message}`)
        }
    }

    console.log('\n✅ Image upload complete!')
}

uploadImages().catch(console.error)
