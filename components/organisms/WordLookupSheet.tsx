import React, { forwardRef, useMemo } from 'react';
import { View, Text, ActivityIndicator, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { DictionaryEntry } from '@/services/dictionary';
import { useVocabularyStore } from '@/store/vocabularyStore';
import { haptics } from '@/utils/haptics';

interface WordLookupSheetProps {
    word: string;
    dictionaryData: DictionaryEntry | null;
    isLoading: boolean;
    storyId?: string;
    storyTitle?: string;
}

export const WordLookupSheet = forwardRef<BottomSheetModal, WordLookupSheetProps>(
    ({ word, dictionaryData, isLoading, storyId, storyTitle }, ref) => {
        const { theme } = useUnistyles();
        const snapPoints = useMemo(() => ['40%', '60%'], []);

        const { actions: vocabActions } = useVocabularyStore();
        const isSaved = useVocabularyStore((s) => s.actions.isWordSaved(word));

        const handleSaveToggle = () => {
            haptics.medium();
            if (isSaved) {
                vocabActions.removeWord(word);
            } else if (dictionaryData) {
                // Take the first definition as primary
                const firstMeaning = dictionaryData.meanings[0];
                const firstDef = firstMeaning.definitions[0];

                vocabActions.saveWord({
                    id: word.toLowerCase(),
                    word: dictionaryData.word,
                    definition: firstDef.definition,
                    example: firstDef.example,
                    partOfSpeech: firstMeaning.partOfSpeech,
                    addedAt: Date.now(),
                    storyId,
                    storyTitle,
                });
            }
        };

        const renderBackdrop = (props: any) => (
            <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
        );

        return (
            <BottomSheetModal
                ref={ref}
                snapPoints={snapPoints}
                index={0}
                backdropComponent={renderBackdrop}
                backgroundStyle={{ backgroundColor: theme.colors.surface }}
                handleIndicatorStyle={{ backgroundColor: theme.colors.border }}
            >
                <BottomSheetView style={styles.container}>
                    {isLoading ? (
                        <View style={styles.center}>
                            <ActivityIndicator size="large" color={theme.colors.primary} />
                        </View>
                    ) : dictionaryData ? (
                        <View style={styles.content}>
                            <View style={styles.header}>
                                <View>
                                    <Text style={styles.wordTitle}>{dictionaryData.word}</Text>
                                    {dictionaryData.phonetic && (
                                        <Text style={styles.phonetic}>{dictionaryData.phonetic}</Text>
                                    )}
                                </View>
                                <Pressable
                                    onPress={handleSaveToggle}
                                    style={[
                                        styles.saveButton,
                                        isSaved && { backgroundColor: theme.colors.primary + '20' }
                                    ]}
                                >
                                    <Ionicons
                                        name={isSaved ? "bookmark" : "bookmark-outline"}
                                        size={24}
                                        color={isSaved ? theme.colors.primary : theme.colors.textSecondary}
                                    />
                                </Pressable>
                            </View>

                            <View style={styles.scrollContainer}>
                                {dictionaryData.meanings.map((meaning, index) => (
                                    <View key={index} style={styles.meaningSection}>
                                        <Text style={styles.partOfSpeech}>{meaning.partOfSpeech}</Text>
                                        {meaning.definitions.slice(0, 2).map((def, defIndex) => (
                                            <View key={defIndex} style={styles.definitionItem}>
                                                <Text style={styles.definitionText}>
                                                    • {def.definition}
                                                </Text>
                                                {def.example && (
                                                    <Text style={styles.exampleText}>
                                                        "{def.example}"
                                                    </Text>
                                                )}
                                            </View>
                                        ))}
                                    </View>
                                ))}
                            </View>
                        </View>
                    ) : (
                        <View style={styles.center}>
                            <Ionicons name="alert-circle-outline" size={48} color={theme.colors.textSecondary} />
                            <Text style={styles.errorText}>Definition not found for "{word}"</Text>
                        </View>
                    )}
                </BottomSheetView>
            </BottomSheetModal>
        );
    }
);

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        padding: theme.spacing.xl,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 40,
    },
    content: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    wordTitle: {
        fontSize: theme.typography.size.display,
        fontWeight: 'bold',
        color: theme.colors.text,
        textTransform: 'capitalize',
    },
    phonetic: {
        fontSize: theme.typography.size.md,
        color: theme.colors.primary,
        marginTop: 2,
    },
    saveButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: theme.colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    scrollContainer: {
        flex: 1,
    },
    meaningSection: {
        marginBottom: theme.spacing.lg,
    },
    partOfSpeech: {
        fontSize: theme.typography.size.sm,
        fontWeight: 'bold',
        color: theme.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: theme.spacing.xs,
    },
    definitionItem: {
        marginBottom: theme.spacing.md,
    },
    definitionText: {
        fontSize: theme.typography.size.md,
        color: theme.colors.text,
        lineHeight: 24,
    },
    exampleText: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textSecondary,
        fontStyle: 'italic',
        marginTop: 4,
        paddingLeft: theme.spacing.md,
    },
    errorText: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.md,
        textAlign: 'center',
    },
}));
