import { defineType, defineField } from 'sanity'

export const authorSchema = defineType({
    name: 'author',
    title: 'Author',
    type: 'document',
    fields: [
        defineField({
            name: 'name',
            title: 'İsim',
            type: 'string',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: {
                source: 'name',
                maxLength: 96,
            },
        }),
        defineField({
            name: 'image',
            title: 'Fotoğraf',
            type: 'image',
            options: {
                hotspot: true,
            },
        }),
        defineField({
            name: 'bio',
            title: 'Biyografi',
            type: 'text',
            rows: 4,
        }),
        defineField({
            name: 'nationality',
            title: 'Milliyet',
            type: 'string',
        }),
        defineField({
            name: 'birthYear',
            title: 'Doğum Yılı',
            type: 'number',
        }),
        defineField({
            name: 'deathYear',
            title: 'Ölüm Yılı',
            type: 'number',
            description: 'Yaşıyorsa boş bırakın',
        }),
        defineField({
            name: 'isFeatured',
            title: '⭐ Öne Çıkan Yazar',
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
        prepare(selection) {
            const { title, media, nationality, isFeatured } = selection
            const featuredEmoji = isFeatured ? '⭐ ' : ''
            return {
                title: `${featuredEmoji}${title}`,
                subtitle: nationality || '',
                media,
            }
        },
    },
})
