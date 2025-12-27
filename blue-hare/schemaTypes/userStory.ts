import { defineType, defineField } from 'sanity'

export const userStorySchema = defineType({
    name: 'userStory',
    title: 'User Story',
    type: 'document',
    icon: () => '👤',
    groups: [
        { name: 'author', title: '👤 Author', default: true },
        { name: 'content', title: '📝 Content' },
        { name: 'moderation', title: '🔍 Moderation' },
    ],
    fields: [
        // === AUTHOR INFO (from Firebase) ===
        defineField({
            name: 'authorId',
            title: 'Author ID (Firebase)',
            type: 'string',
            group: 'author',
            validation: (Rule) => Rule.required(),
            readOnly: true,
        }),
        defineField({
            name: 'authorName',
            title: 'Author Name',
            type: 'string',
            group: 'author',
            validation: (Rule) => Rule.required(),
            readOnly: true,
        }),
        defineField({
            name: 'authorAvatar',
            title: 'Author Avatar',
            type: 'url',
            group: 'author',
            readOnly: true,
        }),

        // === CONTENT ===
        defineField({
            name: 'title',
            title: 'Story Title',
            type: 'string',
            group: 'content',
            validation: (Rule) => Rule.required().min(5).max(100),
        }),
        defineField({
            name: 'description',
            title: 'Short Description',
            type: 'text',
            group: 'content',
            rows: 3,
            validation: (Rule) => Rule.required().min(20).max(300),
        }),
        defineField({
            name: 'coverImage',
            title: 'Cover Image',
            type: 'image',
            group: 'content',
            options: { hotspot: true },
        }),
        defineField({
            name: 'content',
            title: 'Story Content',
            type: 'array',
            group: 'content',
            of: [
                {
                    type: 'block',
                    styles: [{ title: 'Normal', value: 'normal' }],
                    marks: {
                        decorators: [
                            { title: 'Bold', value: 'strong' },
                            { title: 'Italic', value: 'em' },
                        ],
                    },
                },
            ],
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'difficulty',
            title: 'Difficulty',
            type: 'string',
            group: 'content',
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
            name: 'categories',
            title: 'Categories',
            type: 'array',
            group: 'content',
            of: [{ type: 'reference', to: [{ type: 'category' }] }],
            validation: (Rule) => Rule.required().min(1).max(3),
        }),

        // === MODERATION ===
        defineField({
            name: 'status',
            title: 'Status',
            type: 'string',
            group: 'moderation',
            options: {
                list: [
                    { title: '⏳ Pending', value: 'pending' },
                    { title: '✅ Approved', value: 'approved' },
                    { title: '❌ Rejected', value: 'rejected' },
                    { title: '🔄 Revision Requested', value: 'revision_requested' },
                ],
                layout: 'radio',
            },
            initialValue: 'pending',
        }),
        defineField({
            name: 'submittedAt',
            title: 'Submitted At',
            type: 'datetime',
            group: 'moderation',
            readOnly: true,
            initialValue: () => new Date().toISOString(),
        }),
        defineField({
            name: 'reviewedAt',
            title: 'Reviewed At',
            type: 'datetime',
            group: 'moderation',
        }),
        defineField({
            name: 'reviewerNotes',
            title: 'Reviewer Notes',
            type: 'text',
            group: 'moderation',
            rows: 4,
            description: 'Feedback for the author (rejection reason, revision requests)',
        }),
        defineField({
            name: 'isPublished',
            title: '📢 Published',
            type: 'boolean',
            group: 'moderation',
            initialValue: false,
            description: 'Show this story in the app',
        }),
    ],
    orderings: [
        { title: 'Newest First', name: 'submittedAtDesc', by: [{ field: 'submittedAt', direction: 'desc' }] },
        { title: 'Status', name: 'statusAsc', by: [{ field: 'status', direction: 'asc' }] },
    ],
    preview: {
        select: {
            title: 'title',
            authorName: 'authorName',
            status: 'status',
            media: 'coverImage',
            isPublished: 'isPublished',
        },
        prepare({ title, authorName, status, media, isPublished }) {
            const statusEmoji: Record<string, string> = {
                pending: '⏳',
                approved: '✅',
                rejected: '❌',
                revision_requested: '🔄',
            }
            return {
                title: `${statusEmoji[status] || '❓'} ${isPublished ? '📢 ' : ''}${title}`,
                subtitle: `by ${authorName || 'Anonymous'}`,
                media,
            }
        },
    },
})
