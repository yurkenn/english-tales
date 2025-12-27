// Sanity Studio Structure
// Clean, organized content management

import { StructureBuilder } from 'sanity/structure'

export const structure = (S: StructureBuilder) =>
    S.list()
        .title('Content Manager')
        .items([
            // ===== STORIES =====
            S.listItem()
                .title('📖 Stories')
                .child(
                    S.list()
                        .title('Story Management')
                        .items([
                            S.listItem()
                                .title('🆓 Free Stories')
                                .child(
                                    S.documentTypeList('story')
                                        .title('Free Stories')
                                        .filter('_type == "story" && isPremiumOnly != true')
                                ),
                            S.listItem()
                                .title('🔒 Premium Stories')
                                .child(
                                    S.documentTypeList('story')
                                        .title('Premium Stories')
                                        .filter('_type == "story" && isPremiumOnly == true')
                                ),
                            S.divider(),
                            S.listItem()
                                .title('⭐ Featured Stories')
                                .child(
                                    S.documentTypeList('story')
                                        .title('Featured Stories')
                                        .filter('_type == "story" && isFeatured == true')
                                ),
                            S.listItem()
                                .title('📅 Daily Pick Schedule')
                                .child(
                                    S.documentTypeList('story')
                                        .title('Daily Pick Schedule')
                                        .filter('_type == "story" && defined(dailyPickDate)')
                                        .defaultOrdering([{ field: 'dailyPickDate', direction: 'desc' }])
                                ),
                            S.divider(),
                            S.listItem()
                                .title('📚 All Stories')
                                .child(
                                    S.documentTypeList('story')
                                        .title('All Stories')
                                ),
                            S.listItem()
                                .title('➕ New Story')
                                .child(
                                    S.document()
                                        .schemaType('story')
                                        .documentId('new-story')
                                ),
                        ])
                ),

            S.divider(),

            // ===== COMMUNITY CONTENT =====
            S.listItem()
                .title('👥 Community')
                .child(
                    S.list()
                        .title('Moderation Center')
                        .items([
                            S.listItem()
                                .title('⏳ Pending Review')
                                .child(
                                    S.documentTypeList('userStory')
                                        .title('Pending Stories')
                                        .filter('_type == "userStory" && status == "pending"')
                                        .defaultOrdering([{ field: 'submittedAt', direction: 'asc' }])
                                ),
                            S.listItem()
                                .title('✅ Approved')
                                .child(
                                    S.documentTypeList('userStory')
                                        .title('Approved Stories')
                                        .filter('_type == "userStory" && status == "approved"')
                                ),
                            S.listItem()
                                .title('🔄 Revision Requested')
                                .child(
                                    S.documentTypeList('userStory')
                                        .title('Needs Revision')
                                        .filter('_type == "userStory" && status == "revision_requested"')
                                ),
                            S.listItem()
                                .title('❌ Rejected')
                                .child(
                                    S.documentTypeList('userStory')
                                        .title('Rejected Stories')
                                        .filter('_type == "userStory" && status == "rejected"')
                                ),
                            S.divider(),
                            S.listItem()
                                .title('📢 Published')
                                .child(
                                    S.documentTypeList('userStory')
                                        .title('Published Community Stories')
                                        .filter('_type == "userStory" && isPublished == true')
                                ),
                            S.listItem()
                                .title('📋 All Submissions')
                                .child(
                                    S.documentTypeList('userStory')
                                        .title('All Community Stories')
                                        .filter('_type == "userStory"')
                                ),
                        ])
                ),

            S.divider(),

            // ===== AUTHORS =====
            S.listItem()
                .title('✍️ Authors')
                .child(
                    S.list()
                        .title('Authors')
                        .items([
                            S.listItem()
                                .title('All Authors')
                                .child(
                                    S.documentTypeList('author')
                                        .title('All Authors')
                                        .filter('_type == "author"')
                                ),
                            S.listItem()
                                .title('⭐ Featured Authors')
                                .child(
                                    S.documentTypeList('author')
                                        .title('Featured Authors')
                                        .filter('_type == "author" && isFeatured == true')
                                ),
                        ])
                ),

            // ===== CATEGORIES =====
            S.listItem()
                .title('🏷️ Categories')
                .child(
                    S.documentTypeList('category')
                        .title('Categories')
                        .filter('_type == "category"')
                        .defaultOrdering([{ field: 'order', direction: 'asc' }])
                ),
        ])
