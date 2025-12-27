import { defineType, defineField } from 'sanity'

export const storySchema = defineType({
    name: 'story',
    title: 'Story',
    type: 'document',
    icon: () => '📖',
    groups: [
        { name: 'main', title: '📝 Main Info', default: true },
        { name: 'content', title: '📄 Content' },
        { name: 'settings', title: '⚙️ Settings' },
    ],
    fields: [
        // === MAIN INFO ===
        defineField({
            name: 'title',
            title: 'Title',
            type: 'string',
            group: 'main',
            validation: (Rule) => Rule.required().min(1).max(100),
        }),
        defineField({
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            group: 'main',
            options: { source: 'title', maxLength: 96 },
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'description',
            title: 'Description',
            type: 'text',
            group: 'main',
            rows: 3,
            validation: (Rule) => Rule.required().min(10).max(300),
        }),
        defineField({
            name: 'coverImage',
            title: 'Cover Image',
            type: 'image',
            group: 'main',
            options: { hotspot: true },
        }),
        defineField({
            name: 'author',
            title: 'Author',
            type: 'reference',
            group: 'main',
            to: [{ type: 'author' }],
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'categories',
            title: 'Categories',
            type: 'array',
            group: 'main',
            of: [{ type: 'reference', to: [{ type: 'category' }] }],
            validation: (Rule) => Rule.required().min(1),
        }),

        // === CONTENT ===
        defineField({
            name: 'content',
            title: 'Story Content',
            type: 'array',
            group: 'content',
            of: [
                {
                    type: 'block',
                    styles: [
                        { title: 'Normal', value: 'normal' },
                        { title: 'Heading 2', value: 'h2' },
                        { title: 'Heading 3', value: 'h3' },
                        { title: 'Quote', value: 'blockquote' },
                    ],
                    marks: {
                        decorators: [
                            { title: 'Bold', value: 'strong' },
                            { title: 'Italic', value: 'em' },
                        ],
                    },
                },
                {
                    type: 'image',
                    title: 'Image',
                    options: { hotspot: true },
                },
                {
                    type: 'object',
                    name: 'checkpoint',
                    title: '❓ Checkpoint Quiz',
                    icon: () => '❓',
                    fields: [
                        { name: 'question', title: 'Question', type: 'string', validation: (Rule: any) => Rule.required() },
                        { name: 'options', title: 'Options', type: 'array', of: [{ type: 'string' }], validation: (Rule: any) => Rule.required().min(2).max(4) },
                        { name: 'correctIndex', title: 'Correct Answer (0-3)', type: 'number', validation: (Rule: any) => Rule.required().min(0).max(3) },
                    ],
                    preview: {
                        select: { question: 'question' },
                        prepare: ({ question }: { question: string }) => ({ title: `❓ ${question}` }),
                    },
                },
            ],
        }),
        defineField({
            name: 'quiz',
            title: 'End Quiz',
            type: 'array',
            group: 'content',
            of: [
                {
                    type: 'object',
                    fields: [
                        { name: 'question', title: 'Question', type: 'string' },
                        { name: 'options', title: 'Options', type: 'array', of: [{ type: 'string' }] },
                        { name: 'correctIndex', title: 'Correct Answer (0-3)', type: 'number' },
                        { name: 'explanation', title: 'Explanation', type: 'text' },
                    ],
                },
            ],
        }),

        // === SETTINGS ===
        defineField({
            name: 'difficulty',
            title: 'Difficulty',
            type: 'string',
            group: 'settings',
            options: {
                list: [
                    { title: '🟢 Beginner', value: 'beginner' },
                    { title: '🟡 Intermediate', value: 'intermediate' },
                    { title: '🔴 Advanced', value: 'advanced' },
                ],
                layout: 'radio',
            },
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'estimatedReadTime',
            title: 'Read Time (minutes)',
            type: 'number',
            group: 'settings',
            validation: (Rule) => Rule.required().min(1),
        }),
        defineField({
            name: 'wordCount',
            title: 'Word Count',
            type: 'number',
            group: 'settings',
            validation: (Rule) => Rule.required().min(1),
        }),
        defineField({
            name: 'isPremiumOnly',
            title: '🔒 Premium Only',
            type: 'boolean',
            group: 'settings',
            initialValue: false,
            description: 'Only Premium subscribers can read this story',
        }),
        defineField({
            name: 'isFeatured',
            title: '⭐ Featured',
            type: 'boolean',
            group: 'settings',
            initialValue: false,
        }),
        defineField({
            name: 'dailyPickDate',
            title: '📅 Daily Pick Date',
            type: 'date',
            group: 'settings',
            description: 'Story will be shown as Daily Pick on this date',
        }),
        defineField({
            name: 'publishedAt',
            title: 'Published At',
            type: 'datetime',
            group: 'settings',
            initialValue: () => new Date().toISOString(),
        }),
    ],
    orderings: [
        { title: 'Newest', name: 'publishedAtDesc', by: [{ field: 'publishedAt', direction: 'desc' }] },
        { title: 'Title A-Z', name: 'titleAsc', by: [{ field: 'title', direction: 'asc' }] },
    ],
    preview: {
        select: {
            title: 'title',
            author: 'author.name',
            media: 'coverImage',
            isPremium: 'isPremiumOnly',
            isFeatured: 'isFeatured',
            difficulty: 'difficulty',
        },
        prepare({ title, author, media, isPremium, isFeatured, difficulty }) {
            const badges = [
                isPremium ? '🔒' : '🆓',
                isFeatured ? '⭐' : '',
                difficulty === 'beginner' ? '🟢' : difficulty === 'intermediate' ? '🟡' : '🔴',
            ].filter(Boolean).join(' ')
            return {
                title: `${badges} ${title}`,
                subtitle: author || 'No author',
                media,
            }
        },
    },
})
