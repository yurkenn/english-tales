import { defineType, defineField } from 'sanity'

export const storySchema = defineType({
    name: 'story',
    title: 'Story',
    type: 'document',
    groups: [
        { name: 'main', title: 'Ana Bilgiler', default: true },
        { name: 'content', title: 'İçerik' },
        { name: 'meta', title: 'Meta Bilgiler' },
    ],
    fields: [
        defineField({
            name: 'title',
            title: 'Başlık',
            type: 'string',
            group: 'main',
            validation: (Rule) => Rule.required().min(1).max(100),
        }),
        defineField({
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            group: 'main',
            options: {
                source: 'title',
                maxLength: 96,
            },
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'author',
            title: 'Yazar',
            type: 'reference',
            group: 'main',
            to: [{ type: 'author' }],
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'coverImage',
            title: 'Kapak Görseli',
            type: 'image',
            group: 'main',
            options: {
                hotspot: true,
            },
        }),
        defineField({
            name: 'description',
            title: 'Açıklama',
            type: 'text',
            group: 'main',
            rows: 3,
            validation: (Rule) => Rule.required().min(10).max(500),
        }),
        defineField({
            name: 'content',
            title: 'Hikaye İçeriği',
            type: 'array',
            group: 'content',
            of: [
                {
                    type: 'block',
                    styles: [
                        { title: 'Normal', value: 'normal' },
                        { title: 'Başlık 2', value: 'h2' },
                        { title: 'Başlık 3', value: 'h3' },
                        { title: 'Alıntı', value: 'blockquote' },
                    ],
                    marks: {
                        decorators: [
                            { title: 'Kalın', value: 'strong' },
                            { title: 'İtalik', value: 'em' },
                            { title: 'Altı Çizili', value: 'underline' },
                        ],
                    },
                },
                {
                    type: 'image',
                    title: 'Görsel',
                    options: { hotspot: true },
                    fields: [
                        { name: 'caption', title: 'Görsel Açıklaması', type: 'string' },
                        { name: 'alt', title: 'Alt Metin', type: 'string' },
                    ],
                },
                {
                    type: 'object',
                    name: 'checkpoint',
                    title: 'Checkpoint',
                    fields: [
                        { name: 'question', title: 'Soru', type: 'string' },
                        {
                            name: 'options',
                            title: 'Seçenekler',
                            type: 'array',
                            of: [{ type: 'string' }],
                        },
                        { name: 'correctIndex', title: 'Doğru Seçenek Dizini', type: 'number' },
                    ],
                },
            ],
        }),
        defineField({
            name: 'categories',
            title: 'Kategoriler',
            type: 'array',
            group: 'meta',
            of: [{ type: 'reference', to: [{ type: 'category' }] }],
            validation: (Rule) => Rule.required().min(1),
        }),
        defineField({
            name: 'difficulty',
            title: 'Zorluk Seviyesi',
            type: 'string',
            group: 'meta',
            options: {
                list: [
                    { title: '🟢 Başlangıç', value: 'beginner' },
                    { title: '🟡 Orta', value: 'intermediate' },
                    { title: '🔴 İleri', value: 'advanced' },
                ],
                layout: 'radio',
            },
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'estimatedReadTime',
            title: 'Tahmini Okuma Süresi (dakika)',
            type: 'number',
            group: 'meta',
            validation: (Rule) => Rule.required().min(1),
        }),
        defineField({
            name: 'wordCount',
            title: 'Kelime Sayısı',
            type: 'number',
            group: 'meta',
            validation: (Rule) => Rule.required().min(1),
        }),
        defineField({
            name: 'isFeatured',
            title: '⭐ Öne Çıkan Hikaye',
            type: 'boolean',
            group: 'meta',
            initialValue: false,
        }),
        defineField({
            name: 'isPremiumOnly',
            title: '🔒 Sadece Premium Kullanıcılar',
            type: 'boolean',
            group: 'meta',
            initialValue: false,
        }),
        defineField({
            name: 'publishedAt',
            title: 'Yayınlanma Tarihi',
            type: 'datetime',
            group: 'meta',
        }),
        defineField({
            name: 'quiz',
            title: 'Anlama Testi',
            type: 'array',
            group: 'content',
            of: [
                {
                    type: 'object',
                    fields: [
                        { name: 'question', title: 'Soru', type: 'string' },
                        {
                            name: 'options',
                            title: 'Seçenekler',
                            type: 'array',
                            of: [{ type: 'string' }],
                        },
                        { name: 'correctIndex', title: 'Doğru Cevap (0-3)', type: 'number' },
                        { name: 'explanation', title: 'Açıklama', type: 'text' },
                    ],
                },
            ],
        }),
    ],
    preview: {
        select: {
            title: 'title',
            author: 'author.name',
            media: 'coverImage',
            isFeatured: 'isFeatured',
            isPremiumOnly: 'isPremiumOnly',
            difficulty: 'difficulty',
        },
        prepare(selection) {
            const { title, author, media, isFeatured, isPremiumOnly, difficulty } = selection
            const difficultyEmoji = difficulty === 'beginner' ? '🟢' : difficulty === 'intermediate' ? '🟡' : '🔴'
            const featuredEmoji = isFeatured ? '⭐ ' : ''
            const premiumEmoji = isPremiumOnly ? '🔒 ' : ''
            return {
                title: `${featuredEmoji}${premiumEmoji}${title}`,
                subtitle: `${difficultyEmoji} ${author || 'Yazar belirtilmemiş'}`,
                media,
            }
        },
    },
})
