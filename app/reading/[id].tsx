import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ProgressBar } from '@/components';
import { useStory } from '@/hooks/useQueries';
import { PortableTextBlock } from '@portabletext/types';

export default function ReadingScreen() {
    const { theme } = useUnistyles();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [fontSize, setFontSize] = useState(18);
    const [progress, setProgress] = useState(0);

    const { data: storyDoc, isLoading } = useStory(id || '');

    const content = useMemo(() => {
        if (!storyDoc?.content) return 'No content available.';

        // Simple plain text extractor for Portable Text
        return (storyDoc.content as PortableTextBlock[])
            .map(block => {
                if (block._type !== 'block' || !block.children) return '';
                return (block.children as any[]).map(child => child.text).join('');
            })
            .join('\n\n');
    }, [storyDoc]);

    if (isLoading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (!storyDoc) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }, styles.center]}>
                <Text style={styles.errorText}>Story not found</Text>
                <Pressable onPress={() => router.back()} style={{ marginTop: 20 }}>
                    <Text style={{ color: theme.colors.primary }}>Go Back</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable
                    style={styles.headerButton}
                    onPress={() => router.back()}
                >
                    <Ionicons
                        name="close"
                        size={24}
                        color={theme.colors.text}
                    />
                </Pressable>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {storyDoc.title}
                    </Text>
                    <Text style={styles.headerSubtitle}>Chapter 1</Text>
                </View>
                <Pressable style={styles.headerButton}>
                    <Ionicons
                        name="ellipsis-vertical"
                        size={24}
                        color={theme.colors.text}
                    />
                </Pressable>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                <ProgressBar progress={progress} height={4} />
                <Text style={styles.progressText}>{progress}% complete</Text>
            </View>

            {/* Content */}
            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.contentContainer}
                onScroll={(event) => {
                    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
                    const newProgress = Math.min(
                        100,
                        Math.round((contentOffset.y / (contentSize.height - layoutMeasurement.height)) * 100)
                    );
                    if (newProgress > 0) setProgress(newProgress);
                }}
                scrollEventThrottle={16}
            >
                <Text style={[styles.storyText, { fontSize }]}>
                    {content}
                </Text>
            </ScrollView>

            {/* Bottom Controls */}
            <View style={[styles.controls, { paddingBottom: insets.bottom + 8 }]}>
                <View style={styles.controlRow}>
                    {/* Font Size */}
                    <View style={styles.fontControls}>
                        <Pressable
                            style={styles.controlButton}
                            onPress={() => setFontSize(Math.max(14, fontSize - 2))}
                        >
                            <Text style={styles.fontButtonText}>A-</Text>
                        </Pressable>
                        <Text style={styles.fontSizeText}>{fontSize}pt</Text>
                        <Pressable
                            style={styles.controlButton}
                            onPress={() => setFontSize(Math.min(28, fontSize + 2))}
                        >
                            <Text style={styles.fontButtonText}>A+</Text>
                        </Pressable>
                    </View>

                    {/* Theme Toggle */}
                    <Pressable style={styles.controlButton}>
                        <Ionicons
                            name="moon-outline"
                            size={20}
                            color={theme.colors.text}
                        />
                    </Pressable>

                    {/* Bookmark */}
                    <Pressable style={styles.controlButton}>
                        <Ionicons
                            name="bookmark-outline"
                            size={20}
                            color={theme.colors.text}
                        />
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    errorText: {
        fontSize: theme.typography.size.lg,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginTop: theme.spacing.xxxl,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: theme.radius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
        gap: 2,
    },
    headerTitle: {
        fontSize: theme.typography.size.lg,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.text,
    },
    headerSubtitle: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textSecondary,
    },
    progressContainer: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
        gap: theme.spacing.xs,
    },
    progressText: {
        fontSize: theme.typography.size.xs,
        color: theme.colors.textMuted,
        textAlign: 'right',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.lg,
        paddingBottom: theme.spacing.xxxxl,
    },
    storyText: {
        color: theme.colors.text,
        lineHeight: 32,
        letterSpacing: 0.3,
    },
    controls: {
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
    },
    controlRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    fontControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
    },
    controlButton: {
        width: 40,
        height: 40,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.backgroundSecondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fontButtonText: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    fontSizeText: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textSecondary,
    },
    center: {
        alignItems: 'center',
        justifyContent: 'center',
    },
}));
