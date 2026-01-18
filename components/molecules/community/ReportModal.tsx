import { memo, useState, useCallback, FC } from 'react';
import { View, Modal, Pressable, StyleSheet, TextInput, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme, Theme } from '@/theme';
import { Typography } from '@/components/atoms/Typography';
import { Button } from '@/components/atoms/Button';
import { reportService, ReportReason } from '@/services/reportService';
import { useAuthStore } from '@/store/authStore';
import { haptics } from '@/utils/haptics';

interface ReportModalProps {
    visible: boolean;
    onClose: () => void;
    contentType: 'story' | 'review' | 'post' | 'reply';
    contentId: string;
}

const REPORT_REASONS: { key: ReportReason; label: string; icon: keyof typeof Feather.glyphMap }[] = [
    { key: 'inappropriate_content', label: 'Inappropriate Content', icon: 'alert-triangle' },
    { key: 'spam', label: 'Spam', icon: 'trash-2' },
    { key: 'harassment', label: 'Harassment or Bullying', icon: 'user-x' },
    { key: 'copyright', label: 'Copyright Violation', icon: 'file-text' },
    { key: 'other', label: 'Other', icon: 'more-horizontal' },
];

export const ReportModal: FC<ReportModalProps> = memo(({ visible, onClose, contentType, contentId }) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const { user } = useAuthStore();

    const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = useCallback(async () => {
        if (!user) {
            Alert.alert('Sign In Required', 'Please sign in to report content.');
            return;
        }
        if (!selectedReason) {
            Alert.alert('Select Reason', 'Please select a reason for reporting.');
            return;
        }

        setIsSubmitting(true);
        try {
            await reportService.submitReport(contentType, contentId, user.id, selectedReason, description);
            haptics.success();
            Alert.alert('Report Submitted', 'Thank you for helping keep our community safe. We will review this content.');
            onClose();
            setSelectedReason(null);
            setDescription('');
        } catch (error: any) {
            if (error.message === 'You have already reported this content') {
                Alert.alert('Already Reported', 'You have already reported this content.');
            } else {
                Alert.alert('Error', 'Failed to submit report. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    }, [user, selectedReason, description, contentType, contentId, onClose]);

    const handleClose = useCallback(() => {
        setSelectedReason(null);
        setDescription('');
        onClose();
    }, [onClose]);

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Typography variant="h3">Report Content</Typography>
                        <Pressable onPress={handleClose} style={styles.closeButton}>
                            <Feather name="x" size={24} color={theme.colors.text} />
                        </Pressable>
                    </View>

                    <Typography variant="body" color={theme.colors.textMuted} style={styles.subtitle}>
                        Why are you reporting this {contentType}?
                    </Typography>

                    <View style={styles.reasonsContainer}>
                        {REPORT_REASONS.map((reason) => (
                            <Pressable
                                key={reason.key}
                                style={[
                                    styles.reasonItem,
                                    selectedReason === reason.key && { backgroundColor: theme.colors.primary + '15' },
                                ]}
                                onPress={() => {
                                    haptics.selection();
                                    setSelectedReason(reason.key);
                                }}
                            >
                                <Feather
                                    name={reason.icon}
                                    size={20}
                                    color={selectedReason === reason.key ? theme.colors.primary : theme.colors.textMuted}
                                />
                                <Typography
                                    variant="body"
                                    style={{ marginLeft: 12, color: selectedReason === reason.key ? theme.colors.primary : theme.colors.text }}
                                >
                                    {reason.label}
                                </Typography>
                                {selectedReason === reason.key && (
                                    <Feather name="check" size={20} color={theme.colors.primary} style={{ marginLeft: 'auto' }} />
                                )}
                            </Pressable>
                        ))}
                    </View>

                    <TextInput
                        style={styles.descriptionInput}
                        placeholder="Additional details (optional)"
                        placeholderTextColor={theme.colors.textMuted}
                        multiline
                        numberOfLines={3}
                        value={description}
                        onChangeText={setDescription}
                        maxLength={500}
                    />

                    <View style={styles.footer}>
                        <Pressable onPress={handleClose} style={styles.cancelButton}>
                            <Typography variant="body" color={theme.colors.textMuted}>Cancel</Typography>
                        </Pressable>
                        <Button
                            title={isSubmitting ? 'Submitting...' : 'Submit Report'}
                            onPress={handleSubmit}
                            disabled={!selectedReason || isSubmitting}
                            variant="primary"
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );
});

function createStyles(theme: Theme) {
    return StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
        },
        container: {
            backgroundColor: theme.colors.background,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 40,
            maxHeight: '80%',
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
        },
        closeButton: {
            width: 40,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center',
        },
        subtitle: {
            marginBottom: 20,
        },
        reasonsContainer: {
            gap: 8,
            marginBottom: 16,
        },
        reasonItem: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            borderRadius: 12,
            backgroundColor: theme.colors.surface,
        },
        descriptionInput: {
            backgroundColor: theme.colors.surface,
            borderRadius: 12,
            padding: 16,
            fontSize: 16,
            color: theme.colors.text,
            minHeight: 80,
            textAlignVertical: 'top',
            marginBottom: 20,
        },
        footer: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
        },
        cancelButton: {
            paddingVertical: 12,
            paddingHorizontal: 24,
        },
    });
}
