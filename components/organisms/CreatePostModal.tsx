import React, { useState, useEffect } from 'react';
import {
    View,
    Modal,
    TextInput,
    Pressable,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
} from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Feather } from '@expo/vector-icons';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    interpolateColor
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { Typography } from '../atoms/Typography';
import { OptimizedImage } from '../atoms/OptimizedImage';
import { haptics } from '@/utils/haptics';
import { Story, User } from '@/types';

interface CreatePostModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (content: string, story: Story | null) => Promise<void>;
    user: User | null;
    isSubmitting: boolean;
    onOpenStorySelector: () => void;
    selectedStory: Story | null;
    onRemoveStory: () => void;
}

const MAX_CHARS = 500;

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
    visible,
    onClose,
    onSubmit,
    user,
    isSubmitting,
    onOpenStorySelector,
    selectedStory,
    onRemoveStory,
}) => {
    const { t } = useTranslation();
    const { theme } = useUnistyles();
    const [content, setContent] = useState('');
    const buttonScale = useSharedValue(1);

    const handleSubmit = async () => {
        if (!content.trim() || isSubmitting) return;
        haptics.success();
        await onSubmit(content, selectedStory);
        setContent('');
    };

    const handleClose = () => {
        haptics.selection();
        setContent('');
        onClose();
    };

    const pressIn = () => {
        buttonScale.value = withSpring(0.95);
    };

    const pressOut = () => {
        buttonScale.value = withSpring(1);
    };

    const animatedButtonStyle = useAnimatedStyle(() => ({
        transform: [{ scale: buttonScale.value }],
    }));

    const progress = Math.min(content.length / MAX_CHARS, 1);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.modalContent}>
                    {/* Header integrated into composer */}
                    <View style={styles.header}>
                        <Pressable onPress={handleClose} style={styles.closeBtn}>
                            <Feather name="x" size={24} color={theme.colors.text} />
                        </Pressable>

                        <Animated.View style={animatedButtonStyle}>
                            <Pressable
                                onPressIn={pressIn}
                                onPressOut={pressOut}
                                onPress={handleSubmit}
                                disabled={!content.trim() || isSubmitting}
                                style={[
                                    styles.postBtn,
                                    (!content.trim() || isSubmitting) && styles.postBtnDisabled
                                ]}
                            >
                                <Typography
                                    color={!content.trim() || isSubmitting ? theme.colors.textMuted : theme.colors.textInverse}
                                    variant="bodyBold"
                                >
                                    {isSubmitting ? t('common.sharing', '...') : t('common.share', 'Post')}
                                </Typography>
                            </Pressable>
                        </Animated.View>
                    </View>

                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.composerContainer}
                    >
                        <View style={styles.scrollContent}>
                            <View style={styles.userRow}>
                                <OptimizedImage
                                    source={{ uri: user?.photoURL || '' }}
                                    style={styles.avatar}
                                    placeholder="person-circle"
                                />
                                <View style={styles.userInfo}>
                                    <Typography variant="bodyBold">{user?.displayName || t('common.anonymous', 'Anonymous')}</Typography>
                                    <View style={styles.publicBadge}>
                                        <Feather name="globe" size={10} color={theme.colors.textMuted} />
                                        <Typography variant="caption" color={theme.colors.textMuted} style={{ marginLeft: 4 }}>
                                            {t('social.publicPost', 'Public Post')}
                                        </Typography>
                                    </View>
                                </View>
                            </View>

                            <TextInput
                                style={styles.textInput}
                                multiline
                                placeholder={t('social.shareSomething', "What's on your mind?")}
                                placeholderTextColor={theme.colors.textMuted}
                                value={content}
                                onChangeText={setContent}
                                autoFocus
                                selectionColor={theme.colors.primary}
                                maxLength={MAX_CHARS}
                            />

                            {selectedStory && (
                                <View style={styles.storyCard}>
                                    <View style={styles.storyCardLeft}>
                                        <View style={styles.storyIconCircle}>
                                            <Feather name="book-open" size={14} color={theme.colors.primary} />
                                        </View>
                                        <View style={{ marginLeft: 12 }}>
                                            <Typography variant="caption" weight="600" color={theme.colors.primary}>
                                                {selectedStory.title}
                                            </Typography>
                                            <Typography variant="label" color={theme.colors.textMuted}>
                                                {t('social.taggedStory', 'Tagged Story')}
                                            </Typography>
                                        </View>
                                    </View>
                                    <Pressable onPress={() => { haptics.selection(); onRemoveStory(); }} style={styles.removeStoryBtn}>
                                        <Feather name="x-circle" size={18} color={theme.colors.textMuted} />
                                    </Pressable>
                                </View>
                            )}
                        </View>

                        <View style={styles.toolbar}>
                            <View style={styles.toolbarActions}>
                                <Pressable
                                    style={styles.toolbarBtn}
                                    onPress={() => { haptics.selection(); onOpenStorySelector(); }}
                                >
                                    <Feather name="link" size={20} color={theme.colors.primary} />
                                    <Typography variant="label" color={theme.colors.primary} style={{ marginLeft: 6 }}>
                                        {t('social.tagStory', 'Tag Story')}
                                    </Typography>
                                </Pressable>
                            </View>

                            <View style={styles.progressContainer}>
                                <View style={styles.progressTrack}>
                                    <View style={[
                                        styles.progressBar,
                                        {
                                            width: `${progress * 100}%`,
                                            backgroundColor: progress > 0.9 ? theme.colors.error : theme.colors.primary
                                        }
                                    ]} />
                                </View>
                                <Typography
                                    variant="label"
                                    color={progress > 0.9 ? theme.colors.error : theme.colors.textMuted}
                                    style={{ marginLeft: 8, width: 30 }}
                                >
                                    {MAX_CHARS - content.length}
                                </Typography>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create((theme) => ({
    modalContent: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingTop: Platform.OS === 'ios' ? theme.spacing.sm : theme.spacing.lg,
        paddingBottom: theme.spacing.sm,
    },
    closeBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    postBtn: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.radius.xxl,
        // Premium shadow
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    postBtnDisabled: {
        backgroundColor: theme.colors.borderLight,
        shadowOpacity: 0,
        elevation: 0,
    },
    composerContainer: {
        flex: 1,
    },
    scrollContent: {
        flex: 1,
        paddingHorizontal: theme.spacing.lg,
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: theme.spacing.sm,
        marginBottom: theme.spacing.xl,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.colors.borderLight,
    },
    userInfo: {
        marginLeft: theme.spacing.md,
    },
    publicBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: theme.spacing.xxs,
    },
    textInput: {
        fontSize: theme.typography.size.xl,
        color: theme.colors.text,
        lineHeight: 28,
        textAlignVertical: 'top',
        minHeight: 150,
    },
    storyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.surfaceElevated,
        padding: theme.spacing.md,
        borderRadius: theme.radius.lg,
        marginTop: theme.spacing.xl,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    storyCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    storyIconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
    },
    removeStoryBtn: {
        padding: 4,
    },
    toolbar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
        backgroundColor: theme.colors.background,
    },
    toolbarActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    toolbarBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        backgroundColor: theme.colors.borderLight,
        borderRadius: theme.radius.xxl,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressTrack: {
        width: 60,
        height: 4,
        backgroundColor: theme.colors.borderLight,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        borderRadius: 2,
    },
}));
