import React, { useState } from 'react';
import {
    View,
    ScrollView,
    Pressable,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    TextInput,
    RefreshControl,
} from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '@/components/atoms/Typography';
import { CommunityPostCard, CommunityReplyCard } from '@/components/molecules';
import { useCommunityPost } from '@/hooks/useCommunityPost';
import { useAuthStore } from '@/store/authStore';
import { haptics } from '@/utils/haptics';

export default function CommunityPostDetail() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { theme } = useUnistyles();
    const router = useRouter();
    const insets = useSafeAreaInsets();
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
                <Pressable onPress={() => router.back()} style={{ marginTop: 20 }}>
                    <Typography color={theme.colors.primary}>Go Back</Typography>
                </Pressable>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color={theme.colors.text} />
                </Pressable>
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

            <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                <TextInput
                    style={styles.input}
                    placeholder="Write a reply..."
                    placeholderTextColor={theme.colors.textMuted}
                    value={replyText}
                    onChangeText={setReplyText}
                    multiline
                />
                <Pressable
                    onPress={onSubmitReply}
                    disabled={!replyText.trim() || submitting}
                    style={[styles.sendButton, !replyText.trim() && { opacity: 0.5 }]}
                >
                    {submitting ? (
                        <ActivityIndicator size="small" color={theme.colors.textInverse} />
                    ) : (
                        <Ionicons name="send" size={20} color={theme.colors.textInverse} />
                    )}
                </Pressable>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create((theme) => ({
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
        fontSize: 18,
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
        fontSize: 16,
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
        fontSize: 16,
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
}));
