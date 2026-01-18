import { memo, useCallback, useState, useRef, useEffect, FC } from 'react';
import { View, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme, Theme } from '@/theme';
import { Typography } from '@/components/atoms/Typography';
import { Button } from '@/components/atoms/Button';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { haptics } from '@/utils/haptics';

interface WriteUserStoryReviewModalProps {
    visible: boolean;
    storyTitle: string;
    initialRating?: number;
    initialContent?: string;
    isEditing?: boolean;
    isSubmitting?: boolean;
    onClose: () => void;
    onSubmit: (rating: number, content: string) => Promise<boolean>;
}

const StarRating: FC<{ rating: number; onRatingChange: (rating: number) => void; size?: number }> = memo(
    ({ rating, onRatingChange, size = 32 }) => {
        const { theme } = useTheme();

        return (
            <View style={{ flexDirection: 'row', gap: 8 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <Pressable
                        key={star}
                        onPress={() => {
                            haptics.selection();
                            onRatingChange(star);
                        }}
                    >
                        <Feather
                            name={star <= rating ? 'star' : 'star'}
                            size={size}
                            color={star <= rating ? '#FFB800' : theme.colors.border}
                            style={{ opacity: star <= rating ? 1 : 0.5 }}
                        />
                    </Pressable>
                ))}
            </View>
        );
    }
);

export const WriteUserStoryReviewModal: FC<WriteUserStoryReviewModalProps> = memo(
    ({ visible, storyTitle, initialRating = 0, initialContent = '', isEditing = false, isSubmitting = false, onClose, onSubmit }) => {
        const { theme } = useTheme();
        const styles = createStyles(theme);
        const inputRef = useRef<TextInput>(null);

        const [rating, setRating] = useState(initialRating);
        const [content, setContent] = useState(initialContent);

        useEffect(() => {
            if (visible) {
                setRating(initialRating);
                setContent(initialContent);
            }
        }, [visible, initialRating, initialContent]);

        const handleSubmit = useCallback(async () => {
            if (rating === 0) {
                haptics.error();
                return;
            }

            const success = await onSubmit(rating, content.trim());
            if (success) {
                haptics.success();
                onClose();
            }
        }, [rating, content, onSubmit, onClose]);

        const handleClose = useCallback(() => {
            haptics.selection();
            onClose();
        }, [onClose]);

        if (!visible) return null;

        return (
            <View style={styles.overlay}>
                <Animated.View
                    entering={FadeIn.duration(200)}
                    exiting={FadeOut.duration(200)}
                    style={styles.backdrop}
                >
                    <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
                </Animated.View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <Animated.View
                        entering={SlideInDown.springify().damping(15)}
                        exiting={SlideOutDown.duration(200)}
                        style={styles.modal}
                    >
                        <View style={styles.header}>
                            <Typography variant="h3">{isEditing ? 'Edit Review' : 'Write a Review'}</Typography>
                            <Pressable onPress={handleClose} style={styles.closeButton}>
                                <Feather name="x" size={24} color={theme.colors.text} />
                            </Pressable>
                        </View>

                        <Typography variant="caption" color={theme.colors.textMuted} style={{ marginBottom: 20 }}>
                            {storyTitle}
                        </Typography>

                        <View style={styles.ratingSection}>
                            <Typography variant="body" weight="medium" style={{ marginBottom: 12 }}>
                                Your Rating
                            </Typography>
                            <StarRating rating={rating} onRatingChange={setRating} />
                        </View>

                        <View style={styles.inputSection}>
                            <Typography variant="body" weight="medium" style={{ marginBottom: 8 }}>
                                Your Review (optional)
                            </Typography>
                            <TextInput
                                ref={inputRef}
                                style={styles.textInput}
                                placeholder="Share your thoughts about this story..."
                                placeholderTextColor={theme.colors.textMuted}
                                multiline
                                numberOfLines={4}
                                maxLength={500}
                                value={content}
                                onChangeText={setContent}
                                textAlignVertical="top"
                            />
                            <Typography variant="caption" color={theme.colors.textMuted} style={{ alignSelf: 'flex-end', marginTop: 4 }}>
                                {content.length}/500
                            </Typography>
                        </View>

                        <View style={styles.actions}>
                            <Button
                                title={isEditing ? 'Update Review' : 'Submit Review'}
                                onPress={handleSubmit}
                                fullWidth
                                disabled={rating === 0 || isSubmitting}
                                loading={isSubmitting}
                            />
                        </View>
                    </Animated.View>
                </KeyboardAvoidingView>
            </View>
        );
    }
);

function createStyles(theme: Theme) {
    return StyleSheet.create({
        overlay: {
            ...StyleSheet.absoluteFillObject,
            justifyContent: 'flex-end',
            zIndex: 1000,
        },
        backdrop: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'rgba(0,0,0,0.5)',
        },
        keyboardView: {
            justifyContent: 'flex-end',
        },
        modal: {
            backgroundColor: theme.colors.background,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
            paddingBottom: 40,
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
        ratingSection: {
            alignItems: 'center',
            marginBottom: 24,
            paddingVertical: 16,
            backgroundColor: theme.colors.surface,
            borderRadius: 16,
        },
        inputSection: {
            marginBottom: 24,
        },
        textInput: {
            backgroundColor: theme.colors.surface,
            borderRadius: 12,
            padding: 16,
            fontSize: 16,
            color: theme.colors.text,
            minHeight: 120,
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        actions: {
            gap: 12,
        },
    });
}
