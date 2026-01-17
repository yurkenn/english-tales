import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme, Theme } from '@/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Typography } from '@/components/atoms/Typography';
import { EmptyState } from '@/components/molecules/EmptyState';
import { useUserStory } from '@/hooks/useQueries';
import { StoryEditor } from '@/components/organisms/StoryEditor';

export default function EditStoryScreen() {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams<{ id: string }>();

    const { data: story, isLoading, error } = useUserStory(id);

    if (isLoading) {
        return (
            <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Typography variant="body" style={{ marginTop: 16 }}>
                    {t('common.loading', 'Loading...')}
                </Typography>
            </View>
        );
    }

    if (error || !story) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <EmptyState
                    icon="alert-circle-outline"
                    title={t('write.storyNotFound', 'Story Not Found')}
                    message={t('write.storyNotFoundMessage', 'This story could not be found.')}
                    actionLabel={t('common.goBack', 'Go Back')}
                    onAction={() => router.back()}
                />
            </View>
        );
    }

    return <StoryEditor initialStory={story} mode="edit" />;
}

function createStyles(theme: Theme) {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        center: {
            alignItems: 'center',
            justifyContent: 'center',
        },
    });
}
