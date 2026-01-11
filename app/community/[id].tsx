import React, { useState } from 'react';
import {
    View,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    TextInput,
    RefreshControl, StyleSheet
} from 'react-native';
import { useTheme, Theme } from '@/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { Typography } from '@/components/atoms/Typography';
import { CommunityReplyCard } from '@/components/molecules';
import { CommunityPostCard } from '@/components/organisms';
import { useCommunityPost } from '@/hooks/useCommunityPost';
import { useAuthStore } from '@/store/authStore';
import { haptics } from '@/utils/haptics';

export default function CommunityPostDetail() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { containerPadding } = useResponsiveLayout();
    const { user } = useAuthStore();

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

    const onSubmitReply = async () => {
        if (!replyText.trim() || !user || submitting) return;

        setSubmitting(true);
        const success = await handleAddReply(
            user.id,
            user.displayName || 'Anonymous',
            user.photoURL,
            replyText
        );

        if (success) {
            setReplyText('');
        }
        setSubmitting(false);
    };

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
                <Typography>Post not found</Typography>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }} activeOpacity={0.7}>
                    <Typography color={theme.colors.primary}>Go Back</Typography>
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
            <View style={[styles.header, { paddingTop: insets.top, paddingHorizontal: containerPadding }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
                    <Ionicons name="chevron-back" size={28} color={theme.colors.text} />
                </TouchableOpacity>
                <Typography variant="h3" style={styles.headerTitle}>Post</Typography>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />
                }
            >
                <CommunityPostCard
                    post={post}
                    currentUserId={user?.id}
                    onLike={() => user && handleToggleLike(user.id, user.displayName || 'Anonymous', user.photoURL)}
                    onReply={() => { }} // Could focus input
                />

                <View style={styles.repliesSection}>
                    <Typography variant="subtitle" style={styles.repliesTitle}>
                        Replies ({replies.length})
                    </Typography>

                    {replies.length === 0 ? (
                        <View style={styles.emptyReplies}>
                            <Typography color={theme.colors.textMuted}>No replies yet. Be the first to reply!</Typography>
                        </View>
                    ) : (
                        replies.map(reply => (
                            <CommunityReplyCard
                                key={reply.id}
                                reply={reply}
                                currentUserId={user?.id}
                                onLike={() => {
                                    // Implementation for liking a reply
                                    console.log('Like reply:', reply.id);
                                }}
                            />
                        ))
                    )}
                </View>
            </ScrollView>

            <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 16), paddingHorizontal: containerPadding }]}>
                <TextInput
                    style={styles.input}
                    placeholder="Write a reply..."
                    placeholderTextColor={theme.colors.textMuted}
                    value={replyText}
                    onChangeText={setReplyText}
                    multiline
                />
                <TouchableOpacity
                    onPress={onSubmitReply}
                    disabled={!replyText.trim() || submitting}
                    style={[styles.sendButton, !replyText.trim() && { opacity: 0.5 }]}
                    activeOpacity={0.8}
                >
                    {submitting ? (
                        <ActivityIndicator size="small" color={theme.colors.textInverse} />
                    ) : (
                        <Ionicons name="send" size={20} color={theme.colors.textInverse} />
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const createStyles = (theme: Theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
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
    repliesTitle: {
        fontSize: theme.typography.size.md,
        fontWeight: '700',
        paddingHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.md,
    },
    emptyReplies: {
        padding: 40,
        alignItems: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
        backgroundColor: theme.colors.background,
    },
    input: {
        flex: 1,
        backgroundColor: theme.colors.borderLight + '40',
        borderRadius: 20,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: 10,
        paddingTop: 10,
        fontSize: theme.typography.size.md,
        color: theme.colors.text,
        maxHeight: 100,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: theme.spacing.md,
    },
});
