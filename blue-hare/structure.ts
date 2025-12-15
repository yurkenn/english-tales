// Custom Sanity Studio Structure
// Organizes content for easier management

import { StructureBuilder } from 'sanity/structure'
import { BookIcon, UsersIcon, TagIcon, StarIcon, CheckmarkCircleIcon, ClockIcon, EditIcon } from '@sanity/icons'

export const structure = (S: StructureBuilder) =>
    S.list()
        .title('İçerik Yönetimi')
        .items([
            // Stories Section
            S.listItem()
                .title('Hikayeler')
                .icon(BookIcon)
                .child(
                    S.list()
                        .title('Hikayeler')
                        .items([
                            S.listItem()
                                .title('Tüm Hikayeler')
                                .icon(BookIcon)
                                .child(
                                    S.documentTypeList('story')
                                        .title('Tüm Hikayeler')
                                ),
                            S.listItem()
                                .title('Öne Çıkan Hikayeler')
                                .icon(StarIcon)
                                .child(
                                    S.documentTypeList('story')
                                        .title('Öne Çıkan Hikayeler')
                                        .filter('isFeatured == true')
                                ),
                            S.listItem()
                                .title('Yeni Hikaye Ekle')
                                .icon(EditIcon)
                                .child(
                                    S.document()
                                        .schemaType('story')
                                        .documentId('new-story')
                                ),
                        ])
                ),

            S.divider(),

            // Authors Section
            S.listItem()
                .title('Yazarlar')
                .icon(UsersIcon)
                .child(
                    S.list()
                        .title('Yazarlar')
                        .items([
                            S.listItem()
                                .title('Tüm Yazarlar')
                                .icon(UsersIcon)
                                .child(
                                    S.documentTypeList('author')
                                        .title('Tüm Yazarlar')
                                ),
                            S.listItem()
                                .title('Öne Çıkan Yazarlar')
                                .icon(StarIcon)
                                .child(
                                    S.documentTypeList('author')
                                        .title('Öne Çıkan Yazarlar')
                                        .filter('isFeatured == true')
                                ),
                        ])
                ),

            // Categories
            S.listItem()
                .title('Kategoriler')
                .icon(TagIcon)
                .child(
                    S.documentTypeList('category')
                        .title('Kategoriler')
                ),

            S.divider(),

            // Reviews Section - Most Important for Moderation
            S.listItem()
                .title('Yorumlar')
                .icon(StarIcon)
                .child(
                    S.list()
                        .title('Yorum Yönetimi')
                        .items([
                            S.listItem()
                                .title('⏳ Onay Bekleyenler')
                                .icon(ClockIcon)
                                .child(
                                    S.documentTypeList('review')
                                        .title('Onay Bekleyen Yorumlar')
                                        .filter('isApproved == false')
                                ),
                            S.listItem()
                                .title('✅ Onaylanmış Yorumlar')
                                .icon(CheckmarkCircleIcon)
                                .child(
                                    S.documentTypeList('review')
                                        .title('Onaylanmış Yorumlar')
                                        .filter('isApproved == true')
                                ),
                            S.listItem()
                                .title('Tüm Yorumlar')
                                .icon(StarIcon)
                                .child(
                                    S.documentTypeList('review')
                                        .title('Tüm Yorumlar')
                                ),
                        ])
                ),
        ])
