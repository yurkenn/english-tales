import React, { forwardRef, useCallback, useMemo, useState, useEffect, useRef } from 'react'
import {
    View,
    Pressable,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Image,
    ImageSourcePropType,
    TextInput as RNTextInput
} from 'react-native'
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Typography } from '../atoms'
import { CommentThread } from '../molecules/CommentThread'
import { CommunityPost, CommunityReply } from '@/types'
import { useAuthStore } from '@/store/authStore'
import { communityService } from '@/services/communityService'
import { useToastStore } from '@/store/toastStore'
import { haptics } from '@/utils/haptics'
import { formatRelativeTime } from '@/utils/dateUtils'
import { useTranslation } from 'react-i18next'
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withSequence, withSpring } from 'react-native-reanimated'

const DEFAULT_AVATAR = require('@/assets/defaultavatar.png')

interface PostDetailSheetProps {
    post: CommunityPost | null
    onClose: () => void
    onLike: (postId: string) => void
    currentUserId?: string
}

// Comment Component
const CommentItem = ({
    reply,
    currentUserId,
    onReply,
    index
}: {
    reply: CommunityReply
    currentUserId?: string
    onReply: (userName: string) => void
    index: number
}) => {
    const { theme } = useUnistyles()
    const router = useRouter()
    const avatarSource: ImageSourcePropType = reply.userPhoto ? { uri: reply.userPhoto } : DEFAULT_AVATAR

    return (
        <Animated.View
            entering={FadeInDown.delay(index * 50).duration(300)}
            style={styles.commentItem}
        >
            <Pressable
                style={styles.commentAvatar}
                onPress={() => router.push(`/user/${reply.userId}`)}
            >
                <Image source={avatarSource} style={styles.commentAvatarImage} />
            </Pressable>
            <View style={styles.commentContent}>
                <View style={styles.commentHeader}>
                    <Pressable onPress={() => router.push(`/user/${reply.userId}`)}>
                        <Typography style={styles.commentUserName}>{reply.userName}</Typography>
                    </Pressable>
                    <Typography style={styles.commentTime}>
                        {formatRelativeTime(reply.timestamp)}
                    </Typography>
                </View>
                <Typography style={styles.commentText}>{reply.content}</Typography>
                <View style={styles.commentActions}>
                    <Pressable
                        style={styles.commentAction}
                        onPress={() => { haptics.selection(); onReply(reply.userName) }}
                    >
                        <Ionicons name="chatbubble-outline" size={14} color={theme.colors.textMuted} />
                        <Typography style={styles.commentActionText}>Reply</Typography>
                    </Pressable>
                </View>
            </View>
        </Animated.View>
    )
}

export const PostDetailSheet = forwardRef<BottomSheetModal, PostDetailSheetProps>(
    ({ post, onClose, onLike, currentUserId }, ref) => {
        const { t } = useTranslation()
        const { theme } = useUnistyles()
        const router = useRouter()
        const { user } = useAuthStore()
        const toast = useToastStore(s => s.actions)
        const inputRef = useRef<RNTextInput>(null)

        // State
        const [replies, setReplies] = useState<CommunityReply[]>([])
        const [loading, setLoading] = useState(false)
        const [replyText, setReplyText] = useState('')
        const [submitting, setSubmitting] = useState(false)
        const [replyingTo, setReplyingTo] = useState<{ commentId: string | null; userName: string } | null>(null)

        // Animation values
        const likeScale = useSharedValue(1)
        const likeAnimStyle = useAnimatedStyle(() => ({
            transform: [{ scale: likeScale.value }]
        }))

        // Memoized values - 50% (initial) and 95% (expanded)
        const snapPoints = useMemo(() => ['50%', '95%'], [])

        const sheetProps = useMemo(() => ({
            snapPoints,
            index: 0, // Start at 50%
            enablePanDownToClose: true,
            backgroundStyle: { backgroundColor: theme.colors.background },
            handleIndicatorStyle: { backgroundColor: theme.colors.textMuted, width: 40 },
            onDismiss: onClose,
            keyboardBehavior: 'interactive' as const,
            keyboardBlurBehavior: 'restore' as const,
        }), [snapPoints, theme.colors.background, theme.colors.textMuted, onClose])

        const renderBackdrop = useCallback(
            (props: any) => (
                <BottomSheetBackdrop
                    {...props}
                    disappearsOnIndex={-1}
                    appearsOnIndex={0}
                    opacity={0.6}
                    pressBehavior="close"
                />
            ),
            []
        )

        // Load replies
        useEffect(() => {
            const loadReplies = async () => {
                if (!post) return
                setLoading(true)
                const result = await communityService.getReplies(post.id)
                if (result.success) {
                    setReplies(result.data)
                }
                setLoading(false)
            }
            loadReplies()
        }, [post])

        // Handle reply to comment
        const handleReplyToComment = useCallback((commentId: string, userName: string) => {
            setReplyingTo({ commentId, userName })
            setReplyText(`@${userName} `)
            inputRef.current?.focus()
        }, [])

        const handleSubmitReply = useCallback(async () => {
            if (!post || !user || !replyText.trim()) return

            setSubmitting(true)
            haptics.selection()

            // Determine if replying to a comment or to the post
            const parentId = replyingTo?.commentId || null
            const parentComment = parentId ? replies.find(r => r.id === parentId) : null
            const depth = parentComment ? Math.min((parentComment.depth || 0) + 1, 2) : 0

            const result = await communityService.addReply(
                post.id,
                user.id,
                user.displayName || 'Reader',
                user.photoURL,
                replyText.trim(),
                parentId,
                depth
            )

            if (result.success) {
                // Add to local state
                const newReply: CommunityReply = {
                    id: result.data,
                    postId: post.id,
                    parentId,
                    depth,
                    userId: user.id,
                    userName: user.displayName || 'Reader',
                    userPhoto: user.photoURL,
                    content: replyText.trim(),
                    timestamp: new Date(),
                }
                setReplies(prev => [...prev, newReply])
                setReplyText('')
                setReplyingTo(null)
                haptics.success()
            } else {
                toast.error(t('common.error', 'Something went wrong'))
            }

            setSubmitting(false)
        }, [post, user, replyText, replyingTo, replies, toast, t])

        const handleLikePress = useCallback(() => {
            if (!post) return
            likeScale.value = withSequence(
                withSpring(1.4, { damping: 10, stiffness: 250 }),
                withSpring(1, { damping: 12, stiffness: 200 })
            )
            haptics.selection()
            onLike(post.id)
        }, [post, onLike, likeScale])

        // Loading state
        if (!post) {
            return (
                <BottomSheetModal ref={ref} {...sheetProps} backdropComponent={renderBackdrop}>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                    </View>
                </BottomSheetModal>
            )
        }

        const avatarSource: ImageSourcePropType = post.userPhoto ? { uri: post.userPhoto } : DEFAULT_AVATAR
        const isLiked = post.likedBy?.includes(currentUserId || '')

        return (
            <BottomSheetModal ref={ref} {...sheetProps} backdropComponent={renderBackdrop}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.container}
                    keyboardVerticalOffset={0}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Pressable style={styles.backButton} onPress={onClose}>
                            <Ionicons name="chevron-down" size={24} color={theme.colors.text} />
                        </Pressable>
                        <Typography style={styles.headerTitle}>{t('community.post', 'Post')}</Typography>
                        <View style={styles.headerSpacer} />
                    </View>

                    <BottomSheetScrollView
                        style={{ flex: 1 }}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {/* Post Content */}
                        <View style={styles.postCard}>
                            {/* Author */}
                            <View style={styles.authorRow}>
                                <Pressable
                                    style={styles.authorInfo}
                                    onPress={() => router.push(`/user/${post.userId}`)}
                                >
                                    <Image source={avatarSource} style={styles.avatar} />
                                    <View>
                                        <Typography style={styles.authorName}>{post.userName}</Typography>
                                        <Typography style={styles.postTime}>
                                            {formatRelativeTime(post.timestamp)}
                                        </Typography>
                                    </View>
                                </Pressable>
                            </View>

                            {/* Content */}
                            <Typography style={styles.postContent}>{post.content}</Typography>

                            {/* Story Tag */}
                            {post.metadata?.storyTitle && (
                                <Pressable
                                    style={styles.storyTag}
                                    onPress={() => router.push(`/story/${post.metadata?.storyId}`)}
                                >
                                    <Ionicons name="book-outline" size={14} color={theme.colors.primary} />
                                    <Typography style={[styles.storyTagText, { color: theme.colors.primary }]}>
                                        {post.metadata.storyTitle}
                                    </Typography>
                                </Pressable>
                            )}

                            {/* Actions */}
                            <View style={styles.actionsRow}>
                                <Animated.View style={likeAnimStyle}>
                                    <Pressable style={styles.actionButton} onPress={handleLikePress}>
                                        <Ionicons
                                            name={isLiked ? 'heart' : 'heart-outline'}
                                            size={20}
                                            color={isLiked ? theme.colors.error : theme.colors.textMuted}
                                        />
                                        <Typography style={[
                                            styles.actionCount,
                                            isLiked && { color: theme.colors.error }
                                        ]}>
                                            {post.likes || 0}
                                        </Typography>
                                    </Pressable>
                                </Animated.View>
                                <View style={styles.actionButton}>
                                    <Ionicons name="chatbubble-outline" size={18} color={theme.colors.textMuted} />
                                    <Typography style={styles.actionCount}>{replies.length}</Typography>
                                </View>
                                <Pressable style={styles.actionButton}>
                                    <Ionicons name="share-outline" size={18} color={theme.colors.textMuted} />
                                </Pressable>
                            </View>
                        </View>

                        {/* Comments Section */}
                        <View style={styles.commentsSection}>
                            <Typography style={styles.commentsSectionTitle}>
                                {replies.length} {t('community.comments', 'Comments')}
                            </Typography>

                            {loading ? (
                                <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginTop: 20 }} />
                            ) : replies.length === 0 ? (
                                <View style={styles.emptyComments}>
                                    <Ionicons name="chatbubble-ellipses-outline" size={40} color={theme.colors.borderLight} />
                                    <Typography style={styles.emptyCommentsText}>
                                        {t('community.noComments', 'No comments yet. Be the first!')}
                                    </Typography>
                                </View>
                            ) : (
                                <CommentThread
                                    comments={replies}
                                    currentUserId={currentUserId}
                                    onReply={handleReplyToComment}
                                />
                            )}
                        </View>
                    </BottomSheetScrollView>

                    {/* Reply Input */}
                    <View style={styles.replyInputContainer}>
                        {replyingTo && (
                            <View style={styles.replyingToRow}>
                                <Typography style={styles.replyingToText}>
                                    Replying to @{replyingTo.userName}
                                </Typography>
                                <Pressable onPress={() => { setReplyingTo(null); setReplyText('') }}>
                                    <Ionicons name="close" size={16} color={theme.colors.textMuted} />
                                </Pressable>
                            </View>
                        )}
                        <View style={styles.inputRow}>
                            <Image
                                source={user?.photoURL ? { uri: user.photoURL } : DEFAULT_AVATAR}
                                style={styles.inputAvatar}
                            />
                            <BottomSheetTextInput
                                ref={inputRef as any}
                                style={[styles.textInput, { color: theme.colors.text }]}
                                placeholder={t('community.writeComment', 'Write a comment...')}
                                placeholderTextColor={theme.colors.textMuted}
                                value={replyText}
                                onChangeText={setReplyText}
                                multiline
                                maxLength={500}
                            />
                            <Pressable
                                style={[
                                    styles.sendButton,
                                    { backgroundColor: replyText.trim() ? theme.colors.primary : theme.colors.borderLight }
                                ]}
                                onPress={handleSubmitReply}
                                disabled={!replyText.trim() || submitting}
                            >
                                {submitting ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Ionicons name="send" size={16} color="#FFFFFF" />
                                )}
                            </Pressable>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </BottomSheetModal>
        )
    }
)

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.xxxxl + theme.spacing.xxxxl, // ~80-100
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: theme.typography.size.lg,
        fontWeight: '600',
        color: theme.colors.text,
    },
    headerSpacer: {
        width: 40,
    },
    scrollContent: {
        paddingBottom: theme.spacing.xl,
    },

    // Post Card
    postCard: {
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    authorRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.md,
    },
    authorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.borderLight,
    },
    authorName: {
        fontSize: theme.typography.size.md,
        fontWeight: '600',
        color: theme.colors.text,
    },
    postTime: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textMuted,
        marginTop: theme.spacing.xxs,
    },
    postContent: {
        fontSize: theme.typography.size.lg,
        color: theme.colors.text,
        lineHeight: 26,
    },
    storyTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
        alignSelf: 'flex-start',
        backgroundColor: theme.colors.surfaceElevated,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.radius.sm,
        marginTop: theme.spacing.md,
    },
    storyTagText: {
        fontSize: theme.typography.size.sm,
        fontWeight: '600',
    },
    actionsRow: {
        flexDirection: 'row',
        gap: theme.spacing.xxl,
        marginTop: theme.spacing.lg,
        paddingTop: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
    },
    actionCount: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textMuted,
        fontWeight: '500',
    },

    // Comments
    commentsSection: {
        padding: theme.spacing.lg,
    },
    commentsSectionTitle: {
        fontSize: theme.typography.size.md,
        fontWeight: '700',
        color: theme.colors.text,
        marginBottom: theme.spacing.lg,
    },
    emptyComments: {
        alignItems: 'center',
        paddingVertical: theme.spacing.xxxxl,
        gap: theme.spacing.md,
    },
    emptyCommentsText: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textMuted,
    },
    commentItem: {
        flexDirection: 'row',
        gap: theme.spacing.md,
        marginBottom: theme.spacing.lg,
    },
    commentAvatar: {},
    commentAvatarImage: {
        width: 36,
        height: 36,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.borderLight,
    },
    commentContent: {
        flex: 1,
    },
    commentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    commentUserName: {
        fontSize: theme.typography.size.sm,
        fontWeight: '600',
        color: theme.colors.text,
    },
    commentTime: {
        fontSize: theme.typography.size.xs,
        color: theme.colors.textMuted,
    },
    commentText: {
        fontSize: theme.typography.size.md,
        color: theme.colors.text,
        lineHeight: 20,
        marginTop: theme.spacing.xs,
    },
    commentActions: {
        flexDirection: 'row',
        gap: theme.spacing.lg,
        marginTop: theme.spacing.sm,
    },
    commentAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
    },
    commentActionText: {
        fontSize: theme.typography.size.xs,
        color: theme.colors.textMuted,
    },

    // Reply Input
    replyInputContainer: {
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
        backgroundColor: theme.colors.background,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        paddingBottom: theme.spacing.xxl,
    },
    replyingToRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.sm,
    },
    replyingToText: {
        fontSize: theme.typography.size.xs,
        color: theme.colors.textMuted,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: theme.spacing.md,
    },
    inputAvatar: {
        width: 32,
        height: 32,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.borderLight,
    },
    textInput: {
        flex: 1,
        fontSize: theme.typography.size.md,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xxl,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        maxHeight: 100,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: theme.radius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
}))
