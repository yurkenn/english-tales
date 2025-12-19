import React, { useState } from 'react';
import {
    View,
    Modal,
    TextInput,
    Pressable,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    StyleSheet as RNStyleSheet,
} from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
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

    const handleSubmit = async () => {
        if (!content.trim() || isSubmitting) return;
        await onSubmit(content, selectedStory);
        setContent('');
    };

    const handleClose = () => {
        setContent('');
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalContent}
                >
                    <View style={styles.modalHeader}>
                        <Pressable style={styles.modalHeaderAction} onPress={handleClose}>
                            <Typography color={theme.colors.error}>{t('common.cancel', 'Cancel')}</Typography>
                        </Pressable>
                        <Typography variant="bodyBold">{t('social.createPost', 'New Post')}</Typography>
                        <Pressable
                            style={[styles.modalHeaderAction, { alignItems: 'flex-end' }]}
                            onPress={handleSubmit}
                            disabled={!content.trim() || isSubmitting}
                        >
                            <Typography
                                color={!content.trim() || isSubmitting ? theme.colors.textMuted : theme.colors.primary}
                                variant="bodyBold"
                            >
                                {isSubmitting ? t('common.sharing', '...') : t('common.share', 'Post')}
                            </Typography>
                        </Pressable>
                    </View>

                    <View style={styles.modalBody}>
                        <View style={styles.userSection}>
                            <OptimizedImage
                                source={{ uri: user?.photoURL || '' }}
                                style={styles.modalAvatar}
                                placeholder="person-circle"
                            />
                            <View style={{ marginLeft: 12 }}>
                                <Typography variant="bodyBold">{user?.displayName || t('common.anonymous', 'Anonymous')}</Typography>
                                <Typography variant="caption" color={theme.colors.textMuted}>{t('social.publicPost', 'Public Post')}</Typography>
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
                        />

                        {selectedStory && (
                            <View style={styles.taggedStory}>
                                <View style={styles.taggedStoryContent}>
                                    <Ionicons name="book" size={16} color={theme.colors.primary} />
                                    <Typography variant="caption" color={theme.colors.primary} style={{ marginLeft: 6 }}>
                                        {selectedStory.title}
                                    </Typography>
                                </View>
                                <Pressable onPress={() => { haptics.selection(); onRemoveStory(); }}>
                                    <Ionicons name="close-circle" size={20} color={theme.colors.textMuted} />
                                </Pressable>
                            </View>
                        )}

                        <View style={styles.modalFooter}>
                            <Pressable
                                style={styles.tagBtn}
                                onPress={() => { haptics.selection(); onOpenStorySelector(); }}
                            >
                                <Ionicons name="pricetag-outline" size={20} color={theme.colors.primary} />
                                <Typography variant="caption" color={theme.colors.primary} style={{ marginLeft: 6 }}>
                                    {t('social.tagStory', 'Tag Story')}
                                </Typography>
                            </Pressable>
                            <Typography variant="caption" color={theme.colors.textMuted}>
                                {content.length} / 500
                            </Typography>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create((theme) => ({
    modalContent: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    modalHeaderAction: {
        minWidth: 60,
    },
    modalBody: {
        flex: 1,
        padding: theme.spacing.lg,
    },
    userSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    modalAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    textInput: {
        fontSize: 18,
        color: theme.colors.text,
        lineHeight: 24,
        flex: 1,
        textAlignVertical: 'top',
    },
    modalFooter: {
        paddingVertical: theme.spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
    },
    taggedStory: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.primary + '10',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
    },
    taggedStoryContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tagBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.borderLight,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
}));
