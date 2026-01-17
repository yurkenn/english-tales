import { FC, memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme, Theme } from '@/theme';

import { StoryGridCard } from '@/components/molecules/StoryGridCard';
import { EmptyState } from '@/components/molecules/EmptyState';
import type { LibraryItem } from '@/types';

interface ProfileSavedTabProps {
    libraryItems: LibraryItem[];
}

export const ProfileSavedTab: FC<ProfileSavedTabProps> = memo(({
    libraryItems,
}) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const router = useRouter();
    const styles = createStyles(theme);

    if (libraryItems.length === 0) {
        return (
            <EmptyState
                icon="bookmark-outline"
                title={t('profile.emptyLibrary', 'Nothing saved yet')}
                message={t('profile.emptyLibraryMessage', 'Save stories to easily find them here!')}
                actionLabel={t('profile.exploreStories', 'Explore Stories')}
                onAction={() => router.push('/')}
            />
        );
    }

    return (
        <View style={styles.savedGrid}>
            {libraryItems.map((item) => (
                <StoryGridCard
                    key={item.storyId}
                    story={item.story}
                    isInLibrary
                    onPress={() => router.push(`/story/${item.storyId}`)}
                />
            ))}
        </View>
    );
});

ProfileSavedTab.displayName = 'ProfileSavedTab';

function createStyles(theme: Theme) {
    return StyleSheet.create({
        savedGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            padding: theme.spacing.lg,
            gap: theme.spacing.md,
        },
    });
}
