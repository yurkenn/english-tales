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

const imageDir = './story-covers'

// Map story slug to image filename
const storyImageMap: Record<string, string> = {
    // Original Grimm/Andersen stories (newly added)
    'the-ugly-duckling': 'ugly_duckling_cover_1765913930465.png',
    'little-red-riding-hood': 'red_riding_hood_cover_1765913948898.png',
    'the-three-little-pigs': 'three_little_pigs_cover.jpg',
    'the-emperors-new-clothes': 'emperors_new_clothes_cover.jpg',
    'hansel-and-gretel': 'hansel_gretel_cover.jpg',
    // Oscar Wilde stories
    'the-happy-prince': 'happy_prince_cover_1765849694087.png',
    'the-selfish-giant': 'selfish_giant_cover_1765849709431.png',
    'the-nightingale-and-the-rose': 'nightingale_rose_cover_1765849727875.png',
    // Kipling stories
    'the-elephants-child': 'elephants_child_cover_1765849746530.png',
    'how-the-camel-got-his-hump': 'camel_hump_cover_1765849762191.png',
    // Grimm stories
    'snow-white': 'snow_white_cover_1765910308390.png',
    'rumpelstiltskin': 'rumpelstiltskin_cover_1765910342688.png',
    'the-golden-goose': 'golden_goose_cover_1765910373570.png',
    'the-frog-prince': 'frog_prince_cover_1765910388901.png',
    'beauty-and-the-beast': 'beauty_beast_cover_1765910747288.png',
    'puss-in-boots': 'puss_boots_cover_1765910764372.png',
    'rapunzel': 'rapunzel_cover_1765910810270.png',
    'sleeping-beauty': 'sleeping_beauty_cover_1765911581922.png',
    'cinderella': 'cinderella_cover_1765911603064.png',
    // Andersen stories
    'thumbelina': 'thumbelina_cover_1765910326398.png',
    'the-little-match-girl': 'little_match_girl_cover_1765910406163.png',
    'the-steadfast-tin-soldier': 'tin_soldier_cover_1765910439860.png',
    'the-princess-and-the-pea': 'princess_pea_cover_1765910779687.png',
    'the-little-mermaid': 'little_mermaid_cover_1765910826711.png',
    'the-snow-queen': 'snow_queen_cover_1765911655225.png',
    // English Folk Tales
    'jack-and-the-beanstalk': 'jack_beanstalk_cover_1765911622564.png',
    // Collodi
    'pinocchio': 'pinocchio_cover_1765911673945.png',
    // Arabian Nights
    'aladdin': 'aladdin_cover_1765911695585.png',
    'ali-baba-and-the-forty-thieves': 'ali_baba_cover_1765911729834.png',
}

async function uploadImages() {
    console.log('📷 Uploading cover images to Sanity...\n')

    for (const [storySlug, imageName] of Object.entries(storyImageMap)) {
        const imagePath = path.join(imageDir, imageName)

        if (!fs.existsSync(imagePath)) {
            console.log(`  ⚠️ Image not found: ${imageName}`)
            continue
        }

        try {
            // Find story by slug
            const story = await client.fetch(
                `*[_type == "story" && slug.current == $slug][0]{_id, title}`,
                { slug: storySlug }
            )

            if (!story) {
                console.log(`  ⚠️ Story not found: ${storySlug}`)
                continue
            }

            console.log(`  Processing: ${story.title}`)

            // Upload image asset
            const imageBuffer = fs.readFileSync(imagePath)
            const asset = await client.assets.upload('image', imageBuffer, {
                filename: imageName,
            })
            console.log(`    📤 Uploaded: ${imageName}`)

            // Update story with cover image
            await client.patch(story._id)
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

