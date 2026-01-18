import { useState, useCallback, useMemo, useRef } from 'react';
import {
    View,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    TextInput,
    RefreshControl,
    StyleSheet,
    Pressable,
} from 'react-native';
import { useTheme, Theme } from '@/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { Typography } from '@/components/atoms/Typography';
import { CommunityReplyCard } from '@/components/molecules';
import { CommunityPostCard } from '@/components/organisms';
import { useCommunityPost } from '@/hooks/useCommunityPost';
import { useAuthStore } from '@/store/authStore';
import { haptics } from '@/utils/haptics';
import { CommunityReply } from '@/types';

interface ReplyingTo {
    replyId: string;
    userName: string;
}

export default function CommunityPostDetail() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const { t } = useTranslation();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { containerPadding } = useResponsiveLayout();
    const { user } = useAuthStore();
    const inputRef = useRef<TextInput>(null);

    const {
        post,
        replies,
        loading,
        refreshing,
        handleRefresh,
        handleToggleLike,
        handleAddReply,
    } = useCommunityPost(id!);

    const [replyText, setReplyText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [replyingTo, setReplyingTo] = useState<ReplyingTo | null>(null);

    // Organize replies into threaded structure
    const threadedReplies = useMemo(() => {
        const topLevel: CommunityReply[] = [];
        const childrenMap = new Map<string, CommunityReply[]>();

        // First pass: separate top-level and nested replies
        replies.forEach((reply) => {
            if (!reply.parentId || reply.depth === 0) {
                topLevel.push(reply);
            } else {
                const existing = childrenMap.get(reply.parentId) || [];
                existing.push(reply);
                childrenMap.set(reply.parentId, existing);
            }
        });

        // Sort by timestamp
        topLevel.sort((a, b) => {
            const aTime = a.timestamp?.toDate?.() || new Date(a.timestamp);
            const bTime = b.timestamp?.toDate?.() || new Date(b.timestamp);
            return aTime.getTime() - bTime.getTime();
        });

        return { topLevel, childrenMap };
    }, [replies]);

    const handleReplyToReply = useCallback((replyId: string, userName: string) => {
        setReplyingTo({ replyId, userName });
        inputRef.current?.focus();
    }, []);

    const cancelReply = useCallback(() => {
        setReplyingTo(null);
        setReplyText('');
    }, []);

    const onSubmitReply = useCallback(async () => {
        if (!replyText.trim() || !user || submitting) return;

        setSubmitting(true);
        haptics.success();

        // Prepend @mention if replying to someone
        const finalContent = replyingTo
            ? `@${replyingTo.userName} ${replyText}`
            : replyText;

        const success = await handleAddReply(
            user.id,
            user.displayName || 'Anonymous',
            user.photoURL,
            finalContent,
            replyingTo?.replyId || null,
            replyingTo ? 1 : 0
        );

        if (success) {
            setReplyText('');
            setReplyingTo(null);
        }
        setSubmitting(false);
    }, [replyText, user, submitting, replyingTo, handleAddReply]);

    if (loading && !post) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (!post) {
        return (
            <View style={styles.center}>
                <Feather name="alert-circle" size={48} color={theme.colors.textMuted} />
                <Typography style={styles.notFoundText}>
                    {t('social.postNotFound', 'Post not found')}
                </Typography>
                <TouchableOpacity onPress={() => router.back()} style={styles.backLink} activeOpacity={0.7}>
                    <Typography color={theme.colors.primary}>{t('common.goBack', 'Go Back')}</Typography>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top, paddingHorizontal: containerPadding }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
                    <Ionicons name="chevron-back" size={28} color={theme.colors.text} />
                </TouchableOpacity>
                <Typography variant="h3" style={styles.headerTitle}>{t('social.post', 'Post')}</Typography>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />
                }
            >
                <CommunityPostCard
                    post={post}
                    currentUserId={user?.id}
                    onLike={() => user && handleToggleLike(user.id, user.displayName || 'Anonymous', user.photoURL)}
                    onReply={() => inputRef.current?.focus()}
                />

                {/* Replies Section */}
                <View style={styles.repliesSection}>
                    <View style={styles.repliesHeader}>
                        <Typography variant="subtitle" style={styles.repliesTitle}>
                            {t('social.comments', 'Comments')} ({replies.length})
                        </Typography>
                    </View>

                    {replies.length === 0 ? (
                        <View style={styles.emptyReplies}>
                            <Feather name="message-circle" size={32} color={theme.colors.textMuted} />
                            <Typography color={theme.colors.textMuted} style={styles.emptyText}>
                                {t('social.noReplies', 'No comments yet. Be the first to comment!')}
                            </Typography>
                        </View>
                    ) : (
                        threadedReplies.topLevel.map((reply) => (
                            <View key={reply.id}>
                                <CommunityReplyCard
                                    reply={reply}
                                    currentUserId={user?.id}
                                    onLike={() => console.log('Like reply:', reply.id)}
                                    onReply={handleReplyToReply}
                                />
                                {/* Nested replies */}
                                {threadedReplies.childrenMap.get(reply.id)?.map((nestedReply) => (
                                    <CommunityReplyCard
                                        key={nestedReply.id}
                                        reply={nestedReply}
                                        currentUserId={user?.id}
                                        onLike={() => console.log('Like nested reply:', nestedReply.id)}
                                        isNested
                                    />
                                ))}
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>

            {/* Reply Input */}
            <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 16), paddingHorizontal: containerPadding }]}>
                {replyingTo && (
                    <View style={styles.replyingToBar}>
                        <Typography variant="caption" color={theme.colors.textMuted}>
                            {t('social.replyingTo', 'Replying to')} <Typography variant="caption" color={theme.colors.primary}>@{replyingTo.userName}</Typography>
                        </Typography>
                        <Pressable onPress={cancelReply} hitSlop={8}>
                            <Ionicons name="close" size={18} color={theme.colors.textMuted} />
                        </Pressable>
                    </View>
                )}
                <View style={styles.inputRow}>
                    <TextInput
                        ref={inputRef}
                        style={styles.input}
                        placeholder={replyingTo
                            ? t('social.writeReply', 'Write a reply...')
                            : t('social.writeComment', 'Write a comment...')
                        }
                        placeholderTextColor={theme.colors.textMuted}
                        value={replyText}
                        onChangeText={setReplyText}
                        multiline
                        maxLength={500}
                    />
                    <TouchableOpacity
                        onPress={onSubmitReply}
                        disabled={!replyText.trim() || submitting}
                        style={[styles.sendButton, !replyText.trim() && styles.sendButtonDisabled]}
                        activeOpacity={0.8}
                    >
                        {submitting ? (
                            <ActivityIndicator size="small" color={theme.colors.textInverse} />
                        ) : (
                            <Ionicons name="send" size={20} color={theme.colors.textInverse} />
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

function createStyles(theme: Theme) {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        center: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme.colors.background,
            gap: theme.spacing.md,
        },
        notFoundText: {
            marginTop: theme.spacing.md,
        },
        backLink: {
            marginTop: theme.spacing.md,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: theme.spacing.md,
            paddingBottom: theme.spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.borderLight,
            backgroundColor: theme.colors.background,
            zIndex: 100,
        },
        backButton: {
            width: 40,
            height: 40,
            borderRadius: theme.radius.full,
            alignItems: 'center',
            justifyContent: 'center',
        },
        headerTitle: {
            fontSize: theme.typography.size.xl,
            fontWeight: '700',
        },
        content: {
            flex: 1,
        },
        scrollContent: {
            paddingBottom: 20,
        },
        repliesSection: {
            marginTop: theme.spacing.md,
        },
        repliesHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: theme.spacing.lg,
            marginBottom: theme.spacing.sm,
        },
        repliesTitle: {
            fontSize: theme.typography.size.md,
            fontWeight: '700',
        },
        emptyReplies: {
            padding: 40,
            alignItems: 'center',
            gap: theme.spacing.md,
        },
        emptyText: {
            textAlign: 'center',
        },
        inputContainer: {
            paddingHorizontal: theme.spacing.lg,
            paddingTop: theme.spacing.sm,
            borderTopWidth: 1,
            borderTopColor: theme.colors.borderLight,
            backgroundColor: theme.colors.background,
        },
        replyingToBar: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: theme.spacing.xs,
            paddingHorizontal: theme.spacing.sm,
            marginBottom: theme.spacing.xs,
            backgroundColor: theme.colors.surfaceElevated,
            borderRadius: theme.radius.md,
        },
        inputRow: {
            flexDirection: 'row',
            alignItems: 'flex-end',
        },
        input: {
            flex: 1,
            backgroundColor: theme.colors.surfaceElevated,
            borderRadius: 20,
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: 10,
            paddingTop: 10,
            fontSize: theme.typography.size.md,
            color: theme.colors.text,
            maxHeight: 100,
            borderWidth: 1,
            borderColor: theme.colors.borderLight,
        },
        sendButton: {
            width: 44,
            height: 44,
            borderRadius: theme.radius.full,
            backgroundColor: theme.colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: theme.spacing.md,
        },
        sendButtonDisabled: {
            opacity: 0.5,
        },
    });
}
