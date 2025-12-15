import { defineType, defineField } from 'sanity'

export const categorySchema = defineType({
    name: 'category',
    title: 'Category',
    type: 'document',
    fields: [
        defineField({
            name: 'title',
            title: 'Kategori Adı',
            type: 'string',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: {
                source: 'title',
                maxLength: 96,
            },
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'description',
            title: 'Açıklama',
            type: 'text',
            rows: 2,
        }),
        defineField({
            name: 'icon',
            title: 'İkon Adı',
            type: 'string',
            description: 'Ionicons ikon adı (örn: "book-outline", "heart-outline")',
        }),
        defineField({
            name: 'color',
            title: 'Renk',
            type: 'string',
            description: 'Hex renk kodu (örn: "#EA2A33")',
        }),
        defineField({
            name: 'order',
            title: 'Sıralama',
            type: 'number',
            initialValue: 0,
            description: 'Düşük sayı = Önce gösterilir',
        }),
    ],
    orderings: [
        {
            title: 'Sıralama',
            name: 'orderAsc',
            by: [{ field: 'order', direction: 'asc' }],
        },
    ],
    preview: {
        select: {
            title: 'title',
            order: 'order',
            icon: 'icon',
        },
        prepare(selection) {
            const { title, order, icon } = selection
            return {
                title: title,
                subtitle: `Sıra: ${order || 0} • İkon: ${icon || 'Yok'}`,
            }
        },
    },
})
