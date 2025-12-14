import { defineType, defineField } from 'sanity'

export const reviewSchema = defineType({
    name: 'review',
    title: 'Review',
    type: 'document',
    fields: [
        defineField({
            name: 'story',
            title: 'Story',
            type: 'reference',
            to: [{ type: 'story' }],
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'userId',
            title: 'User ID',
            type: 'string',
            description: 'Firebase user ID',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'userName',
            title: 'User Name',
            type: 'string',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'userAvatar',
            title: 'User Avatar URL',
            type: 'url',
        }),
        defineField({
            name: 'rating',
            title: 'Rating',
            type: 'number',
            validation: (Rule) => Rule.required().min(1).max(5),
        }),
        defineField({
            name: 'text',
            title: 'Review Text',
            type: 'text',
            rows: 4,
            validation: (Rule) => Rule.required().min(10).max(1000),
        }),
        defineField({
            name: 'isApproved',
            title: 'Approved',
            type: 'boolean',
            initialValue: false,
        }),
        defineField({
            name: 'createdAt',
            title: 'Created At',
            type: 'datetime',
            initialValue: () => new Date().toISOString(),
        }),
    ],
    preview: {
        select: {
            title: 'userName',
            subtitle: 'story.title',
            rating: 'rating',
        },
        prepare(selection) {
            const { title, subtitle, rating } = selection
            return {
                title: `${title} - ${'★'.repeat(rating)}`,
                subtitle: subtitle,
            }
        },
    },
})
