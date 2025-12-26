import React, { useState, useCallback } from 'react'
import { View, Pressable, Image, ImageSourcePropType } from 'react-native'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { Typography } from '../atoms'
import { CommunityReply } from '@/types'
import { haptics } from '@/utils/haptics'
import { formatRelativeTime } from '@/utils/dateUtils'
import { useTranslation } from 'react-i18next'

const DEFAULT_AVATAR = require('@/assets/defaultavatar.png')
const MAX_DEPTH = 2 // Maximum nesting level

interface CommentThreadProps {
    comments: CommunityReply[]
    currentUserId?: string
    onReply: (commentId: string, userName: string) => void
    onLike?: (commentId: string) => void
}

// Build nested comment tree
interface CommentNode extends CommunityReply {
    children: CommentNode[]
}

const buildCommentTree = (comments: CommunityReply[]): CommentNode[] => {
    const commentMap = new Map<string, CommentNode>()
    const roots: CommentNode[] = []

    // First pass: create nodes
    comments.forEach(comment => {
        commentMap.set(comment.id, { ...comment, children: [] })
    })

    // Second pass: build tree
    comments.forEach(comment => {
        const node = commentMap.get(comment.id)!
        if (comment.parentId && commentMap.has(comment.parentId)) {
            commentMap.get(comment.parentId)!.children.push(node)
        } else {
            roots.push(node)
        }
    })

    return roots
}

// Single Comment Item
const CommentItem = ({
    comment,
    currentUserId,
    onReply,
    onLike,
    depth,
    index
}: {
    comment: CommentNode
    currentUserId?: string
    onReply: (commentId: string, userName: string) => void
    onLike?: (commentId: string) => void
    depth: number
    index: number
}) => {
    const { theme } = useUnistyles()
    const { t } = useTranslation()
    const router = useRouter()
    const [collapsed, setCollapsed] = useState(false)

    const avatarSource: ImageSourcePropType = comment.userPhoto
        ? { uri: comment.userPhoto }
        : DEFAULT_AVATAR

    const hasReplies = comment.children.length > 0
    const canReply = depth < MAX_DEPTH

    const handleReply = useCallback(() => {
        haptics.selection()
        onReply(comment.id, comment.userName)
    }, [comment.id, comment.userName, onReply])

    const handleToggleCollapse = useCallback(() => {
        haptics.selection()
        setCollapsed(prev => !prev)
    }, [])

    return (
        <Animated.View
            entering={FadeInDown.delay(index * 30).duration(200)}
            style={[styles.commentContainer, { marginLeft: depth * 16 }]}
        >
            {/* Thread line for nested comments */}
            {depth > 0 && (
                <View style={[styles.threadLine, { backgroundColor: theme.colors.borderLight }]} />
            )}

            <View style={styles.commentItem}>
                {/* Avatar */}
                <Pressable onPress={() => router.push(`/user/${comment.userId}`)}>
                    <Image source={avatarSource} style={styles.avatar} />
                </Pressable>

                {/* Content */}
                <View style={styles.contentWrapper}>
                    {/* Header */}
                    <View style={styles.commentHeader}>
                        <Pressable onPress={() => router.push(`/user/${comment.userId}`)}>
                            <Typography style={styles.userName}>{comment.userName}</Typography>
                        </Pressable>
                        <Typography style={styles.time}>{formatRelativeTime(comment.timestamp)}</Typography>
                    </View>

                    {/* Text */}
                    <Typography style={styles.commentText}>{comment.content}</Typography>

                    {/* Actions */}
                    <View style={styles.actions}>
                        {onLike && (
                            <Pressable
                                style={styles.actionBtn}
                                onPress={() => { haptics.selection(); onLike(comment.id) }}
                            >
                                <Ionicons name="heart-outline" size={14} color={theme.colors.textMuted} />
                                {(comment.likes ?? 0) > 0 && (
                                    <Typography style={styles.actionText}>{comment.likes}</Typography>
                                )}
                            </Pressable>
                        )}
                        {canReply && (
                            <Pressable style={styles.actionBtn} onPress={handleReply}>
                                <Ionicons name="chatbubble-outline" size={14} color={theme.colors.textMuted} />
                                <Typography style={styles.actionText}>{t('community.reply', 'Reply')}</Typography>
                            </Pressable>
                        )}
                        {hasReplies && (
                            <Pressable style={styles.actionBtn} onPress={handleToggleCollapse}>
                                <Ionicons
                                    name={collapsed ? 'chevron-down' : 'chevron-up'}
                                    size={14}
                                    color={theme.colors.textMuted}
                                />
                                <Typography style={styles.actionText}>
                                    {collapsed
                                        ? t('community.showReplies', 'Show {{count}}', { count: comment.children.length })
                                        : t('community.hideReplies', 'Hide')
                                    }
                                </Typography>
                            </Pressable>
                        )}
                    </View>
                </View>
            </View>

            {/* Nested replies */}
            {hasReplies && !collapsed && (
                <View style={styles.repliesContainer}>
                    {comment.children.map((child, childIndex) => (
                        <CommentItem
                            key={child.id}
                            comment={child}
                            currentUserId={currentUserId}
                            onReply={onReply}
                            onLike={onLike}
                            depth={depth + 1}
                            index={childIndex}
                        />
                    ))}
                </View>
            )}
        </Animated.View>
    )
}

export const CommentThread: React.FC<CommentThreadProps> = ({
    comments,
    currentUserId,
    onReply,
    onLike
}) => {
    const commentTree = buildCommentTree(comments)

    if (commentTree.length === 0) {
        return null
    }

    return (
        <View style={styles.container}>
            {commentTree.map((comment, index) => (
                <CommentItem
                    key={comment.id}
                    comment={comment}
                    currentUserId={currentUserId}
                    onReply={onReply}
                    onLike={onLike}
                    depth={0}
                    index={index}
                />
            ))}
        </View>
    )
}

const styles = StyleSheet.create((theme) => ({
    container: {
        gap: 4,
    },
    commentContainer: {
        position: 'relative',
    },
    threadLine: {
        position: 'absolute',
        left: 6,
        top: 0,
        bottom: 0,
        width: 2,
        borderRadius: 1,
    },
    commentItem: {
        flexDirection: 'row',
        gap: 10,
        paddingVertical: 8,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.borderLight,
    },
    contentWrapper: {
        flex: 1,
    },
    commentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    userName: {
        fontSize: theme.typography.size.sm,
        fontWeight: '600',
        color: theme.colors.text,
    },
    time: {
        fontSize: theme.typography.size.xs,
        color: theme.colors.textMuted,
    },
    commentText: {
        fontSize: theme.typography.size.md,
        color: theme.colors.text,
        lineHeight: 20,
        marginTop: 4,
    },
    actions: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 8,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    actionText: {
        fontSize: theme.typography.size.xs,
        color: theme.colors.textMuted,
    },
    repliesContainer: {
        marginTop: 4,
    },
}))
