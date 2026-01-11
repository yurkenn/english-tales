import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme, Theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useToastStore } from '@/store/toastStore';
import { haptics } from '@/utils/haptics';

interface WriteReviewModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (rating: number, text: string) => Promise<void>;
    storyTitle: string;
}

export const WriteReviewModal: React.FC<WriteReviewModalProps> = ({
    visible,
    onClose,
    onSubmit,
    storyTitle,
}) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const [rating, setRating] = useState(0);
    const [text, setText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const toastActions = useToastStore((state) => state.actions);

    const handleRatingPress = (value: number) => {
        haptics.selection();
        setRating(value);
    };

    const handleSubmit = async () => {
        if (rating === 0) {
            haptics.error();
            toastActions.error('Please select a rating before submitting.');
            return;
        }
        if (text.trim().length < 10) {
            haptics.error();
            toastActions.error('Please write at least 10 characters for your review.');
            return;
        }
        setIsSubmitting(true);
        try {
            await onSubmit(rating, text.trim());
            haptics.success();
            toastActions.success('Your review has been submitted and is pending approval.');
            setRating(0);
            setText('');
            onClose();
        } catch (error) {
            console.error('Review submission error:', error);
            haptics.error();
            toastActions.error('Could not submit your review. Please check your connection and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setRating(0);
        setText('');
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Write a Review</Text>
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton} activeOpacity={0.7}>
                            <Ionicons name="close" size={24} color={theme.colors.text} />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.storyTitle}>{storyTitle}</Text>

                    {/* Star Rating */}
                    <View style={styles.ratingSection}>
                        <Text style={styles.ratingLabel}>Tap to rate:</Text>
                        <View style={styles.stars}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <TouchableOpacity
                                    key={star}
                                    onPress={() => handleRatingPress(star)}
                                    style={styles.starButton}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name={star <= rating ? 'star' : 'star-outline'}
                                        size={36}
                                        color={star <= rating ? theme.colors.warning : theme.colors.textMuted}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Review Text */}
                    <TextInput
                        style={styles.textInput}
                        placeholder="Share your thoughts about this story..."
                        placeholderTextColor={theme.colors.textMuted}
                        multiline
                        numberOfLines={5}
                        value={text}
                        onChangeText={setText}
                        textAlignVertical="top"
                    />

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            rating === 0 && styles.submitButtonDisabled,
                        ]}
                        onPress={handleSubmit}
                        disabled={rating === 0 || isSubmitting}
                        activeOpacity={0.8}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color={theme.colors.textInverse} />
                        ) : (
                            <Text style={styles.submitButtonText}>Submit Review</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: theme.colors.surface,
        borderTopLeftRadius: theme.radius.xxl,
        borderTopRightRadius: theme.radius.xxl,
        padding: theme.spacing.xl,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    title: {
        fontSize: theme.typography.size.xl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    closeButton: {
        padding: theme.spacing.xs,
    },
    storyTitle: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.lg,
    },
    ratingSection: {
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
    },
    ratingLabel: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.sm,
    },
    stars: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    starButton: {
        padding: theme.spacing.xs,
    },
    textInput: {
        backgroundColor: theme.colors.backgroundSecondary,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        fontSize: theme.typography.size.md,
        color: theme.colors.text,
        minHeight: 120,
        marginBottom: theme.spacing.lg,
    },
    submitButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.radius.full,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    submitButtonText: {
        fontSize: theme.typography.size.lg,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.textInverse,
    },
});
