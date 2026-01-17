import { useState, useCallback, useEffect, useMemo, FC } from 'react';
import {
    View,
    ScrollView,
    TextInput,
    Pressable,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
    Image,
} from 'react-native';
import { useTheme, Theme } from '@/theme';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { Typography } from '@/components/atoms/Typography';
import { useAuthStore } from '@/store/authStore';
import { useUserStoryStore, UserStory } from '@/store/userStoryStore';
import { useCategories } from '@/hooks/useQueries';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { haptics } from '@/utils/haptics';
import { createUserStory, updateUserStory, uploadImageAsset } from '@/services/sanity/mutations';
// import * as ImagePicker from 'expo-image-picker';

type Step = 'details' | 'content' | 'review';

const DIFFICULTY_OPTIONS = [
    { value: 'beginner', label: '🟢 Beginner', color: '#10B981' },
    { value: 'intermediate', label: '🟡 Intermediate', color: '#F59E0B' },
    { value: 'advanced', label: '🔴 Advanced', color: '#EF4444' },
] as const;

interface StoryEditorProps {
    initialStory?: UserStory;
    mode: 'create' | 'edit';
}

export const StoryEditor: FC<StoryEditorProps> = ({ initialStory, mode }) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { containerPadding } = useResponsiveLayout();
    const { user } = useAuthStore();
    const { draft, updateDraft, clearDraft, addStory, updateStory } = useUserStoryStore();

    // State
    const [currentStep, setCurrentStep] = useState<Step>('details');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Cover Image State
    // If edit mode and has cover image, show it
    const initialCoverImage = initialStory?.coverImage?.asset?._ref
        ? `https://cdn.sanity.io/images/qsk1btio/production/${initialStory.coverImage.asset._ref.replace('image-', '').replace('-jpg', '.jpg')}`
        : null;

    const [coverImageUri, setCoverImageUri] = useState<string | null>(initialCoverImage);
    const [isImagePickerLoading, setIsImagePickerLoading] = useState(false);

    // Form state
    const [title, setTitle] = useState(initialStory?.title || (mode === 'create' ? draft.title : ''));
    const [description, setDescription] = useState(initialStory?.description || (mode === 'create' ? draft.description : ''));

    // Content extraction from portable text
    const initialContent = useMemo(() => {
        if (initialStory?.content && Array.isArray(initialStory.content)) {
            return initialStory.content[0]?.children?.[0]?.text || '';
        }
        if (mode === 'create' && draft.content.length > 0) {
            return draft.content[0]?.children?.[0]?.text || '';
        }
        return '';
    }, [initialStory, draft, mode]);

    const [content, setContent] = useState(initialContent);
    const [difficulty, setDifficulty] = useState<UserStory['difficulty'] | null>(
        initialStory?.difficulty || (mode === 'create' ? draft.difficulty : null)
    );
    const [selectedCategories, setSelectedCategories] = useState<string[]>(
        initialStory?.categories?.map(c => c._id) || (mode === 'create' ? draft.categoryIds : [])
    );

    // Fetch categories
    const { data: categories = [] } = useCategories();

    // Word count
    const wordCount = useMemo(() => {
        return content.trim().split(/\s+/).filter(Boolean).length;
    }, [content]);

    // Validation
    const isDetailsValid = title.trim().length >= 5 && description.trim().length >= 20;
    const isContentValid = wordCount >= 50;
    const isReviewValid = difficulty !== null && selectedCategories.length >= 1;

    const canProceed = useMemo(() => {
        switch (currentStep) {
            case 'details': return isDetailsValid;
            case 'content': return isContentValid;
            case 'review': return isReviewValid;
            default: return false;
        }
    }, [currentStep, isDetailsValid, isContentValid, isReviewValid]);

    // Auto-save to DRAFT store ONLY in create mode
    useEffect(() => {
        if (mode !== 'create') return;
        const timer = setTimeout(() => {
            updateDraft({
                title,
                description,
                content: content ? [{
                    _type: 'block',
                    children: [{ _type: 'span', text: content }],
                    markDefs: [],
                    style: 'normal',
                }] : [],
                difficulty: difficulty || undefined,
                categoryIds: selectedCategories,
                coverImageUri: coverImageUri && !coverImageUri.startsWith('http') ? coverImageUri : undefined,
            });
        }, 1000);
        return () => clearTimeout(timer);
    }, [title, description, content, difficulty, selectedCategories, coverImageUri, mode]);

    // Handlers
    const handleBack = useCallback(() => {
        haptics.selection();
        if (currentStep === 'details') {
            if (mode === 'create' && (title || content)) {
                Alert.alert(
                    t('write.editor.discardTitle', 'Discard Draft?'),
                    t('write.editor.discardMessage', 'Your progress will be lost.'),
                    [
                        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
                        {
                            text: t('common.delete', 'Discard'),
                            style: 'destructive',
                            onPress: () => {
                                clearDraft();
                                router.back();
                            },
                        },
                    ]
                );
            } else {
                router.back();
            }
        } else if (currentStep === 'content') {
            setCurrentStep('details');
        } else if (currentStep === 'review') {
            setCurrentStep('content');
        }
    }, [currentStep, clearDraft, router, t, mode, title, content]);

    const handleNext = useCallback(() => {
        haptics.selection();
        if (currentStep === 'details') {
            setCurrentStep('content');
        } else if (currentStep === 'content') {
            setCurrentStep('review');
        }
    }, [currentStep]);

    const handlePickImage = useCallback(async () => {
        haptics.selection();
        setIsImagePickerLoading(true);
        try {
            // Dynamic require to prevent crash if native module is missing
            const ImagePicker = require('expo-image-picker');

            if (!ImagePicker?.requestMediaLibraryPermissionsAsync) {
                throw new Error('ImagePicker native module not found');
            }

            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(t('common.error', 'Error'), t('write.editor.permissionDenied', 'Permission to access photos is required.'));
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [3, 4],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setCoverImageUri(result.assets[0].uri);
            }
        } catch (error) {
            console.warn('ImagePicker error:', error);
            Alert.alert(
                t('common.error', 'Error'),
                t('write.editor.nativeModuleError', 'Image picker is not available. Please rebuild your app.')
            );
        } finally {
            setIsImagePickerLoading(false);
        }
    }, [t]);

    const handleCategoryToggle = useCallback((categoryId: string) => {
        haptics.selection();
        setSelectedCategories(prev => {
            if (prev.includes(categoryId)) {
                return prev.filter(id => id !== categoryId);
            }
            if (prev.length >= 3) return prev;
            return [...prev, categoryId];
        });
    }, []);

    const handleSave = useCallback(async (status?: 'draft' | 'pending') => {
        if (!user) return;
        haptics.medium();
        setIsSubmitting(true);

        try {
            let coverImageAssetId: string | undefined;
            // Only upload if it's a local URI (starts with file:// or contains /cache/)
            if (coverImageUri && !coverImageUri.startsWith('http')) {
                try {
                    coverImageAssetId = await uploadImageAsset(coverImageUri, `cover-${Date.now()}.jpg`);
                } catch (imgError) {
                    console.warn('Cover image upload failed:', imgError);
                }
            }

            const storyData = {
                title,
                description,
                content: [{
                    _type: 'block',
                    _key: `block-${Date.now()}`,
                    children: [{ _type: 'span', _key: `span-${Date.now()}`, text: content }],
                    markDefs: [],
                    style: 'normal',
                }],
                difficulty: difficulty || 'beginner',
                categoryIds: selectedCategories,
                coverImageAssetId,
                status: status || (initialStory?.status || 'draft'),
            };

            if (mode === 'edit' && initialStory) {
                const updatedStory = await updateUserStory(initialStory._id, storyData);
                updateStory(updatedStory);
                Alert.alert(t('common.success', 'Success'), t('write.editor.savedTitle', 'Story Updated!'), [{ text: 'OK', onPress: () => router.back() }]);
            } else {
                const newStory = await createUserStory(user.id, user.displayName || 'Anonymous', user.photoURL || undefined, storyData);
                addStory(newStory);
                clearDraft();
                const successMsg = status === 'pending' ? t('write.editor.submittedMessage', 'Your story has been submitted for review.') : t('write.editor.savedMessage', 'Your story has been saved as a draft.');
                Alert.alert(t('common.success', 'Success'), successMsg, [{ text: 'OK', onPress: () => router.back() }]);
            }
        } catch (error) {
            console.error('Failed to save story:', error);
            Alert.alert(t('common.error', 'Error'), t('write.editor.saveError', 'Failed to save your story. Please try again.'));
        } finally {
            setIsSubmitting(false);
        }
    }, [user, mode, initialStory, title, description, content, difficulty, selectedCategories, coverImageUri, addStory, updateStory, clearDraft, router, t]);

    const steps: Step[] = ['details', 'content', 'review'];
    const currentStepIndex = steps.indexOf(currentStep);

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 8, paddingHorizontal: containerPadding }]}>
                <Pressable onPress={handleBack} style={styles.headerButton}>
                    <Feather name={currentStep === 'details' ? 'x' : 'chevron-left'} size={24} color={theme.colors.text} />
                </Pressable>
                <View style={styles.headerCenter}>
                    <Typography variant="body" style={styles.headerTitle}>
                        {mode === 'edit' ? t('common.edit', 'Edit Story') : t('write.newStory', 'New Story')}
                    </Typography>
                    <View style={styles.stepIndicator}>
                        {steps.map((step, index) => (
                            <View key={step} style={[styles.stepDot, index <= currentStepIndex && styles.stepDotActive]} />
                        ))}
                    </View>
                </View>
                <Pressable
                    onPress={canProceed && currentStep === 'review' ? () => handleSave() : handleNext}
                    disabled={!canProceed || isSubmitting}
                    style={styles.headerButton}
                >
                    {isSubmitting ? (
                        <ActivityIndicator size="small" color={theme.colors.primary} />
                    ) : (
                        <Typography variant="body" color={canProceed ? theme.colors.primary : theme.colors.textMuted} style={{ fontWeight: '600' }}>
                            {currentStep === 'review' ? t('common.save', 'Save') : t('common.next', 'Next')}
                        </Typography>
                    )}
                </Pressable>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={[styles.scrollContent, { paddingHorizontal: containerPadding }]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Step 1: Details */}
                {currentStep === 'details' && (
                    <View style={styles.stepContent}>
                        <Typography variant="h3" style={styles.stepTitle}>{t('write.editor.detailsTitle', 'Story Details')}</Typography>
                        <Pressable style={styles.coverPicker} onPress={handlePickImage} disabled={isImagePickerLoading}>
                            {coverImageUri ? (
                                <View style={styles.coverPreview}>
                                    <Image source={{ uri: coverImageUri }} style={styles.coverImage} resizeMode="cover" />
                                    <View style={styles.coverOverlay}><Feather name="camera" size={20} color="#FFF" /></View>
                                </View>
                            ) : (
                                <View style={styles.coverPlaceholder}>
                                    {isImagePickerLoading ? <ActivityIndicator color={theme.colors.textMuted} /> : (
                                        <>
                                            <Feather name="image" size={32} color={theme.colors.textMuted} />
                                            <Typography variant="caption" style={{ marginTop: 8 }}>{t('write.editor.uploadCover', 'Add Cover')}</Typography>
                                        </>
                                    )}
                                </View>
                            )}
                        </Pressable>

                        <View style={styles.inputGroup}>
                            <Typography variant="label" style={styles.inputLabel}>{t('write.editor.titleLabel', 'Title')}</Typography>
                            <TextInput
                                style={styles.textInput}
                                value={title}
                                onChangeText={setTitle}
                                placeholder={t('write.editor.titlePlaceholder', 'Story Title')}
                                placeholderTextColor={theme.colors.textMuted}
                                maxLength={100}
                            />
                            <Typography variant="caption" style={styles.charCount}>{title.length}/100</Typography>
                        </View>

                        <View style={styles.inputGroup}>
                            <Typography variant="label" style={styles.inputLabel}>{t('write.editor.descriptionLabel', 'Description')}</Typography>
                            <TextInput
                                style={[styles.textInput, styles.textArea]}
                                value={description}
                                onChangeText={setDescription}
                                placeholder={t('write.editor.descriptionPlaceholder', 'Write a short description...')}
                                placeholderTextColor={theme.colors.textMuted}
                                multiline
                                maxLength={300}
                                textAlignVertical="top"
                            />
                            <Typography variant="caption" style={styles.charCount}>{description.length}/300</Typography>
                        </View>
                    </View>
                )}

                {/* Step 2: Content */}
                {currentStep === 'content' && (
                    <View style={styles.stepContent}>
                        <View style={styles.contentHeader}>
                            <Typography variant="h3" style={styles.stepTitle}>{t('write.editor.contentTitle', 'Write Your Story')}</Typography>
                            <View style={styles.wordCountBadge}>
                                <Feather name="file-text" size={14} color={theme.colors.primary} />
                                <Typography variant="label" color={theme.colors.primary}>{wordCount} {t('common.words', 'words')}</Typography>
                            </View>
                        </View>
                        <TextInput
                            style={[styles.textInput, styles.contentEditor]}
                            value={content}
                            onChangeText={setContent}
                            placeholder={t('write.editor.contentPlaceholder', 'Once upon a time...')}
                            placeholderTextColor={theme.colors.textMuted}
                            multiline
                            textAlignVertical="top"
                        />
                        <Typography variant="caption" style={styles.hint}>{t('write.editor.minWords', 'Minimum 50 words required')}</Typography>
                    </View>
                )}

                {/* Step 3: Review */}
                {currentStep === 'review' && (
                    <View style={styles.stepContent}>
                        <Typography variant="h3" style={styles.stepTitle}>{t('write.editor.reviewTitle', 'Final Details')}</Typography>
                        <View style={styles.inputGroup}>
                            <Typography variant="label" style={styles.inputLabel}>{t('write.editor.selectDifficulty', 'Difficulty Level')}</Typography>
                            <View style={styles.optionGroup}>
                                {DIFFICULTY_OPTIONS.map(option => (
                                    <Pressable
                                        key={option.value}
                                        style={[styles.optionButton, difficulty === option.value && styles.optionButtonActive, difficulty === option.value && { borderColor: option.color }]}
                                        onPress={() => { haptics.selection(); setDifficulty(option.value); }}
                                    >
                                        <Typography variant="body" style={[styles.optionText, difficulty === option.value && { color: option.color }]}>{option.label}</Typography>
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Typography variant="label" style={styles.inputLabel}>{t('write.editor.selectCategory', 'Categories')} ({selectedCategories.length}/3)</Typography>
                            <View style={styles.categoryGrid}>
                                {categories.map((category: any) => (
                                    <Pressable
                                        key={category._id}
                                        style={[styles.categoryChip, selectedCategories.includes(category._id) && styles.categoryChipActive, selectedCategories.includes(category._id) && { backgroundColor: (category.color || theme.colors.primary) + '20', borderColor: category.color || theme.colors.primary }]}
                                        onPress={() => handleCategoryToggle(category._id)}
                                    >
                                        <Typography variant="caption" style={[styles.categoryChipText, selectedCategories.includes(category._id) && { color: category.color || theme.colors.primary }]}>{category.title}</Typography>
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                        <View style={styles.summary}>
                            <Typography variant="label" style={styles.inputLabel}>{t('write.editor.summary', 'Summary')}</Typography>
                            <View style={styles.summaryCard}>
                                <View style={styles.summaryRow}>
                                    <Feather name="type" size={16} color={theme.colors.textMuted} />
                                    <Typography variant="body" style={styles.summaryText}>{title || t('write.untitled', 'Untitled')}</Typography>
                                </View>
                                <View style={styles.summaryRow}>
                                    <Feather name="file-text" size={16} color={theme.colors.textMuted} />
                                    <Typography variant="body" style={styles.summaryText}>{wordCount} {t('common.words', 'words')}</Typography>
                                </View>
                            </View>
                        </View>
                    </View>
                )}
            </ScrollView>

            <View style={[styles.bottomAction, { paddingBottom: insets.bottom + 16, paddingHorizontal: containerPadding }]}>
                {currentStep === 'review' ? (
                    <View style={styles.bottomButtons}>
                        <Pressable style={[styles.primaryButton, !canProceed && styles.buttonDisabled]} onPress={() => handleSave(initialStory?.status === 'pending' ? 'pending' : 'draft')} disabled={!canProceed || isSubmitting}>
                            {isSubmitting ? <ActivityIndicator color="#FFF" /> : (
                                <>
                                    <Feather name="save" size={20} color="#FFF" />
                                    <Typography variant="body" style={styles.primaryButtonText}>
                                        {mode === 'edit' ? t('common.save', 'Save Changes') : t('write.editor.saveDraft', 'Save Draft')}
                                    </Typography>
                                </>
                            )}
                        </Pressable>
                        {mode === 'create' && (
                            <Pressable style={[styles.secondaryButton, !canProceed && styles.buttonDisabled, { marginTop: 12 }]} onPress={() => handleSave('pending')} disabled={!canProceed || isSubmitting}>
                                {isSubmitting ? <ActivityIndicator color={theme.colors.primary} /> : (
                                    <>
                                        <Feather name="send" size={20} color={theme.colors.primary} />
                                        <Typography variant="body" style={styles.secondaryButtonText}>{t('write.editor.submitReview', 'Submit for Review')}</Typography>
                                    </>
                                )}
                            </Pressable>
                        )}
                        {mode === 'edit' && initialStory?.status === 'draft' && (
                            <Pressable style={[styles.secondaryButton, !canProceed && styles.buttonDisabled, { marginTop: 12 }]} onPress={() => handleSave('pending')} disabled={!canProceed || isSubmitting}>
                                {isSubmitting ? <ActivityIndicator color={theme.colors.primary} /> : (
                                    <>
                                        <Feather name="send" size={20} color={theme.colors.primary} />
                                        <Typography variant="body" style={styles.secondaryButtonText}>{t('write.editor.submitReview', 'Submit for Review')}</Typography>
                                    </>
                                )}
                            </Pressable>
                        )}
                    </View>
                ) : (
                    <Pressable style={[styles.primaryButton, !canProceed && styles.buttonDisabled]} onPress={handleNext} disabled={!canProceed}>
                        <Typography variant="body" style={styles.primaryButtonText}>{t('common.next', 'Continue')}</Typography>
                        <Feather name="arrow-right" size={20} color="#FFF" />
                    </Pressable>
                )}
            </View>
        </KeyboardAvoidingView>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight },
    headerButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerTitle: { fontWeight: '600', color: theme.colors.text },
    stepIndicator: { flexDirection: 'row', gap: theme.spacing.xs, marginTop: theme.spacing.xs },
    stepDot: { width: 8, height: 8, borderRadius: theme.radius.full, backgroundColor: theme.colors.borderLight },
    stepDotActive: { backgroundColor: theme.colors.primary },
    content: { flex: 1 },
    scrollContent: { paddingVertical: theme.spacing.xl },
    stepContent: { gap: theme.spacing.lg },
    stepTitle: { color: theme.colors.text, marginBottom: theme.spacing.sm },
    coverPicker: { alignSelf: 'center', marginBottom: theme.spacing.lg },
    coverPlaceholder: { width: 120, height: 160, borderRadius: theme.radius.lg, borderWidth: 2, borderStyle: 'dashed', borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surfaceElevated },
    coverPreview: { width: 120, height: 160, borderRadius: theme.radius.lg, overflow: 'hidden' },
    coverImage: { width: '100%', height: '100%' },
    coverOverlay: { position: 'absolute', bottom: theme.spacing.sm, right: theme.spacing.sm, width: 32, height: 32, borderRadius: theme.radius.full, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
    inputGroup: { gap: theme.spacing.sm },
    inputLabel: { color: theme.colors.textMuted, fontWeight: '600' },
    textInput: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: theme.spacing.md, fontSize: 16, color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.borderLight },
    textArea: { minHeight: 100 },
    charCount: { textAlign: 'right', color: theme.colors.textMuted },
    contentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    wordCountBadge: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs, backgroundColor: theme.colors.primary + '15', paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.xxs, borderRadius: theme.radius.full },
    contentEditor: { minHeight: 300, textAlignVertical: 'top' },
    hint: { color: theme.colors.textMuted, fontStyle: 'italic' },
    optionGroup: { gap: theme.spacing.sm },
    optionButton: { padding: theme.spacing.md, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.borderLight, backgroundColor: theme.colors.surface },
    optionButtonActive: { borderWidth: 2, backgroundColor: theme.colors.surfaceElevated },
    optionText: { textAlign: 'center', fontWeight: '500' },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
    categoryChip: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, borderRadius: theme.radius.full, borderWidth: 1, borderColor: theme.colors.borderLight, backgroundColor: theme.colors.surface },
    categoryChipActive: { borderWidth: 2 },
    categoryChipText: { fontWeight: '500', color: theme.colors.text },
    summary: { marginTop: theme.spacing.md },
    summaryCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: theme.spacing.lg, gap: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.borderLight },
    summaryRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
    summaryText: { color: theme.colors.text },
    bottomAction: { padding: theme.spacing.lg, borderTopWidth: 1, borderTopColor: theme.colors.borderLight, backgroundColor: theme.colors.background },
    bottomButtons: { width: '100%' },
    primaryButton: { flexDirection: 'row', height: 56, backgroundColor: theme.colors.primary, borderRadius: theme.radius.xl, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.sm, ...theme.shadows.md },
    primaryButtonText: { color: '#FFF', fontWeight: '600', fontSize: 16 },
    secondaryButton: { flexDirection: 'row', height: 56, backgroundColor: theme.colors.surface, borderRadius: theme.radius.xl, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.sm, borderWidth: 1, borderColor: theme.colors.primary },
    secondaryButtonText: { color: theme.colors.primary, fontWeight: '600', fontSize: 16 },
    buttonDisabled: { opacity: 0.5 },
});
