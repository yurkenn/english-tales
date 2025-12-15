import { defineType, defineField } from 'sanity'

export const reviewSchema = defineType({
    name: 'review',
    title: 'Review',
    type: 'document',
    fields: [
        defineField({
            name: 'story',
            title: 'Hikaye',
            type: 'reference',
            to: [{ type: 'story' }],
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'userId',
            title: 'Kullanıcı ID',
            type: 'string',
            description: 'Firebase kullanıcı ID',
            validation: (Rule) => Rule.required(),
            readOnly: true,
        }),
        defineField({
            name: 'userName',
            title: 'Kullanıcı Adı',
            type: 'string',
            validation: (Rule) => Rule.required(),
            readOnly: true,
        }),
        defineField({
            name: 'userAvatar',
            title: 'Kullanıcı Avatarı',
            type: 'url',
            readOnly: true,
        }),
        defineField({
            name: 'rating',
            title: 'Puan',
            type: 'number',
            validation: (Rule) => Rule.required().min(1).max(5),
            readOnly: true,
        }),
        defineField({
            name: 'text',
            title: 'Yorum Metni',
            type: 'text',
            rows: 4,
            validation: (Rule) => Rule.required().min(10).max(1000),
            readOnly: true,
        }),
        defineField({
            name: 'isApproved',
            title: '✅ Onaylandı',
            type: 'boolean',
            initialValue: false,
            description: 'Yorumu onaylamak için işaretleyin',
        }),
        defineField({
            name: 'createdAt',
            title: 'Oluşturulma Tarihi',
            type: 'datetime',
            initialValue: () => new Date().toISOString(),
            readOnly: true,
        }),
    ],
    orderings: [
        {
            title: 'En Yeni',
            name: 'createdAtDesc',
            by: [{ field: 'createdAt', direction: 'desc' }],
        },
        {
            title: 'Puana Göre',
            name: 'ratingDesc',
            by: [{ field: 'rating', direction: 'desc' }],
        },
    ],
    preview: {
        select: {
            userName: 'userName',
            storyTitle: 'story.title',
            rating: 'rating',
            isApproved: 'isApproved',
            text: 'text',
        },
        prepare(selection) {
            const { userName, storyTitle, rating, isApproved, text } = selection
            const stars = '★'.repeat(rating || 0) + '☆'.repeat(5 - (rating || 0))
            const status = isApproved ? '✅' : '⏳'
            return {
                title: `${status} ${userName || 'Anonim'} - ${stars}`,
                subtitle: `${storyTitle || 'Hikaye'} • ${text?.substring(0, 50)}...`,
            }
        },
    },
})
