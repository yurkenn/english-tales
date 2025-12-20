import React, { useState } from 'react';
import {
    View,
    Modal,
    TextInput,
    Pressable,
    KeyboardAvoidingView,
    Platform,
    StyleSheet as RNStyleSheet,
} from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Typography } from '../atoms/Typography';

interface ReplyModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (content: string) => Promise<void>;
    isSubmitting: boolean;
}

export const ReplyModal: React.FC<ReplyModalProps> = ({
    visible,
    onClose,
    onSubmit,
    isSubmitting,
}) => {
    const { t } = useTranslation();
    const { theme } = useUnistyles();
    const [content, setContent] = useState('');

    const handleSubmit = async () => {
        if (!content.trim() || isSubmitting) return;
        await onSubmit(content);
        setContent('');
    };

    const handleClose = () => {
        setContent('');
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.replyCard}
                >
                    <View style={styles.replyHeader}>
                        <Typography variant="bodyBold">{t('social.reply', 'Reply to Post')}</Typography>
                        <Pressable onPress={handleClose}>
                            <Ionicons name="close" size={24} color={theme.colors.text} />
                        </Pressable>
                    </View>

                    <TextInput
                        style={styles.replyInput}
                        multiline
                        placeholder={t('social.writeReply', 'Add your comment...')}
                        placeholderTextColor={theme.colors.textMuted}
                        value={content}
                        onChangeText={setContent}
                        autoFocus
                    />

                    <View style={styles.replyFooter}>
                        <Pressable
                            style={[styles.sendButton, (!content.trim() || isSubmitting) && { opacity: 0.5 }]}
                            onPress={handleSubmit}
                            disabled={!content.trim() || isSubmitting}
                        >
                            <Typography color={theme.colors.textInverse} variant="bodyBold">
                                {isSubmitting ? '...' : t('common.send', 'Send')}
                            </Typography>
                        </Pressable>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create((theme) => ({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    replyCard: {
        backgroundColor: theme.colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: theme.spacing.lg,
        paddingBottom: Platform.OS === 'ios' ? 40 : theme.spacing.lg,
    },
    replyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.md,
    },
    replyInput: {
        fontSize: theme.typography.size.md,
        color: theme.colors.text,
        maxHeight: 150,
        minHeight: 80,
        textAlignVertical: 'top',
        backgroundColor: theme.colors.background,
        borderRadius: 12,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
    },
    replyFooter: {
        alignItems: 'flex-end',
    },
    sendButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 20,
    },
}));
