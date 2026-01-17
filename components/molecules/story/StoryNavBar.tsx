import { FC, memo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, Theme } from '@/theme';

interface StoryNavBarProps {
    topInset: number;
    isFavorited: boolean;
    isInLibrary: boolean;
    onBack: () => void;
    onFavorite: () => void;
    onBookmark: () => void;
    onShare: () => void;
}

export const StoryNavBar: FC<StoryNavBarProps> = memo(({
    topInset,
    isFavorited,
    isInLibrary,
    onBack,
    onFavorite,
    onBookmark,
    onShare,
}) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);

    return (
        <View style={[styles.navBar, { top: topInset + 8 }]}>
            <TouchableOpacity
                style={styles.navButton}
                onPress={onBack}
                hitSlop={15}
                activeOpacity={0.7}
            >
                <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>

            <View style={styles.navRight}>
                <TouchableOpacity
                    style={styles.navButton}
                    onPress={onFavorite}
                    hitSlop={15}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name={isFavorited ? 'heart' : 'heart-outline'}
                        size={24}
                        color={isFavorited ? theme.colors.error : theme.colors.text}
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.navButton}
                    onPress={onBookmark}
                    hitSlop={15}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name={isInLibrary ? 'bookmark' : 'bookmark-outline'}
                        size={24}
                        color={isInLibrary ? theme.colors.primary : theme.colors.text}
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.navButton}
                    onPress={onShare}
                    hitSlop={15}
                    activeOpacity={0.7}
                >
                    <Ionicons name="share-social-outline" size={24} color={theme.colors.text} />
                </TouchableOpacity>
            </View>
        </View>
    );
});

StoryNavBar.displayName = 'StoryNavBar';

function createStyles(theme: Theme) {
    return StyleSheet.create({
        navBar: {
            position: 'absolute',
            left: theme.spacing.lg,
            right: theme.spacing.lg,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 1000,
        },
        navRight: {
            flexDirection: 'row',
            gap: theme.spacing.sm,
        },
        navButton: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.colors.surface + 'CC',
            alignItems: 'center',
            justifyContent: 'center',
            ...theme.shadows.sm,
        },
    });
}
