import React, { forwardRef, useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator, Keyboard } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToastStore } from '@/store/toastStore';
import { haptics } from '@/utils/haptics';

interface WriteReviewSheetProps {
    storyTitle: string;
    onSubmit: (rating: number, text: string) => Promise<void>;
    onClose: () => void;
}

export const WriteReviewSheet = forwardRef<BottomSheet, WriteReviewSheetProps>(
    ({ storyTitle, onSubmit, onClose }, ref) => {
        const { theme } = useUnistyles();
        const insets = useSafeAreaInsets();
        const [rating, setRating] = useState(0);
        const [text, setText] = useState('');
        const [isSubmitting, setIsSubmitting] = useState(false);
        const toastActions = useToastStore((state) => state.actions);

        const snapPoints = useMemo(() => ['75%'], []);

        const renderBackdrop = useCallback(
            (props: any) => (
                <BottomSheetBackdrop
                    {...props}
                    disappearsOnIndex={-1}
                    appearsOnIndex={0}
                    opacity={0.5}
                    pressBehavior="close"
                />
            ),
            []
        );

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
            Keyboard.dismiss();
            setIsSubmitting(true);
            try {
                await onSubmit(rating, text.trim());
                haptics.success();
                setRating(0);
                setText('');
                toastActions.success('Review submitted successfully!');
                onClose();
            } catch (error) {
                haptics.error();
                toastActions.error('Could not submit your review. Please check your connection and try again.');
            } finally {
                setIsSubmitting(false);
            }
        };

        const handleSheetClose = () => {
            Keyboard.dismiss();
            setRating(0);
            setText('');
            onClose();
        };

        return (
            <BottomSheet
                ref={ref}
                index={-1}
                snapPoints={snapPoints}
                enablePanDownToClose
                backdropComponent={renderBackdrop}
                backgroundStyle={{ backgroundColor: theme.colors.surface }}
                handleIndicatorStyle={{ backgroundColor: theme.colors.textMuted, width: 40 }}
                keyboardBehavior="interactive"
                keyboardBlurBehavior="restore"
                onChange={(index) => {
                    if (index === -1) handleSheetClose();
                }}
            >
                <BottomSheetView style={[styles.content, { paddingBottom: insets.bottom + 16 }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>Write a Review</Text>
                            <Text style={styles.storyTitle} numberOfLines={1}>{storyTitle}</Text>
                        </View>
                        <Pressable onPress={handleSheetClose} hitSlop={10}>
                            <Ionicons name="close" size={24} color={theme.colors.textMuted} />
                        </Pressable>
                    </View>

                    {/* Star Rating */}
                    <View style={styles.ratingSection}>
                        <Text style={styles.ratingLabel}>How would you rate this story?</Text>
                        <View style={styles.stars}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Pressable
                                    key={star}
                                    onPress={() => handleRatingPress(star)}
                                    style={styles.starButton}
                                >
                                    <Ionicons
                                        name={star <= rating ? 'star' : 'star-outline'}
                                        size={40}
                                        color={star <= rating ? theme.colors.warning : theme.colors.textMuted}
                                    />
                                </Pressable>
                            ))}
                        </View>
                        {rating > 0 && (
                            <Text style={styles.ratingText}>
                                {rating === 1 ? 'Poor' : rating === 2 ? 'Fair' : rating === 3 ? 'Good' : rating === 4 ? 'Very Good' : 'Excellent'}
                            </Text>
                        )}
                    </View>

                    {/* Review Text */}
                    <View style={styles.inputWrapper}>
                        <BottomSheetTextInput
                            style={styles.textInput}
                            placeholder="Share your thoughts about this story..."
                            placeholderTextColor={theme.colors.textMuted}
                            multiline
                            numberOfLines={4}
                            value={text}
                            onChangeText={setText}
                            textAlignVertical="top"
                        />
                        <Text style={styles.charCount}>{text.length} characters</Text>
                    </View>

                    {/* Submit Button */}
                    <Pressable
                        style={({ pressed }) => [
                            styles.submitButton,
                            (rating === 0 || isSubmitting) && styles.submitButtonDisabled,
                            pressed && { opacity: 0.9 },
                        ]}
                        onPress={handleSubmit}
                        disabled={rating === 0 || isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <>
                                <Ionicons name="send" size={18} color="#FFFFFF" />
                                <Text style={styles.submitButtonText}>Submit Review</Text>
                            </>
                        )}
                    </Pressable>
                </BottomSheetView>
            </BottomSheet>
        );
    }
);

const styles = StyleSheet.create((theme) => ({
    content: {
        flex: 1,
        paddingHorizontal: theme.spacing.xl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: theme.spacing.xl,
    },
    title: {
        fontSize: theme.typography.size.xxl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    storyTitle: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textSecondary,
        marginTop: 4,
        maxWidth: 280,
    },
    ratingSection: {
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
        backgroundColor: theme.colors.backgroundSecondary,
        borderRadius: theme.radius.xl,
        paddingVertical: theme.spacing.lg,
    },
    ratingLabel: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.md,
    },
    stars: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    starButton: {
        padding: theme.spacing.xxs,
    },
    ratingText: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.warning,
        marginTop: theme.spacing.sm,
    },
    inputWrapper: {
        marginBottom: theme.spacing.lg,
    },
    textInput: {
        backgroundColor: theme.colors.backgroundSecondary,
        borderRadius: theme.radius.lg,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        fontSize: theme.typography.size.md,
        color: theme.colors.text,
        minHeight: 100,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    charCount: {
        fontSize: theme.typography.size.xs,
        color: theme.colors.textMuted,
        textAlign: 'right',
        marginTop: theme.spacing.xs,
    },
    submitButton: {
        flexDirection: 'row',
        backgroundColor: theme.colors.primary,
        paddingVertical: theme.spacing.lg,
        borderRadius: theme.radius.full,
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    submitButtonText: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.bold,
        color: '#FFFFFF',
    },
}));
