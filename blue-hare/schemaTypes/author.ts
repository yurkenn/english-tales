import { defineType, defineField } from 'sanity'

export const authorSchema = defineType({
    name: 'author',
    title: 'Author',
    type: 'document',
    icon: () => '✍️',
    fields: [
        defineField({
            name: 'name',
            title: 'Name',
            type: 'string',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: { source: 'name', maxLength: 96 },
        }),
        defineField({
            name: 'image',
            title: 'Photo',
            type: 'image',
            options: { hotspot: true },
        }),
        defineField({
            name: 'bio',
            title: 'Biography',
            type: 'text',
            rows: 4,
        }),
        defineField({
            name: 'nationality',
            title: 'Nationality',
            type: 'string',
        }),
        defineField({
            name: 'birthYear',
            title: 'Birth Year',
            type: 'number',
        }),
        defineField({
            name: 'deathYear',
            title: 'Death Year',
            type: 'number',
            description: 'Leave empty if still alive',
        }),
        defineField({
            name: 'isFeatured',
            title: '⭐ Featured Author',
            type: 'boolean',
            initialValue: false,
        }),
    ],
    preview: {
        select: {
            title: 'name',
            media: 'image',
            nationality: 'nationality',
            isFeatured: 'isFeatured',
        },
        prepare({ title, media, nationality, isFeatured }) {
            return {
                title: `${isFeatured ? '⭐ ' : ''}${title}`,
                subtitle: nationality || '',
                media,
            }
        },
    },
})
