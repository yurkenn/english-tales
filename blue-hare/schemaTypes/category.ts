import { defineType, defineField } from 'sanity'

export const categorySchema = defineType({
    name: 'category',
    title: 'Category',
    type: 'document',
    icon: () => '🏷️',
    fields: [
        defineField({
            name: 'title',
            title: 'Title',
            type: 'string',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: { source: 'title', maxLength: 96 },
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'description',
            title: 'Description',
            type: 'text',
            rows: 2,
        }),
        defineField({
            name: 'icon',
            title: 'Icon Name',
            type: 'string',
            description: 'Ionicons name (e.g., "book-outline", "heart-outline")',
        }),
        defineField({
            name: 'color',
            title: 'Color',
            type: 'string',
            description: 'Hex color (e.g., "#EA2A33")',
        }),
        defineField({
            name: 'order',
            title: 'Sort Order',
            type: 'number',
            initialValue: 0,
            description: 'Lower number = shown first',
        }),
    ],
    orderings: [
        { title: 'Sort Order', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] },
    ],
    preview: {
        select: {
            title: 'title',
            order: 'order',
            icon: 'icon',
        },
        prepare({ title, order, icon }) {
            return {
                title: title,
                subtitle: `Order: ${order || 0} • Icon: ${icon || 'None'}`,
            }
        },
    },
})
