import { FC } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme, Theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { type FilterType } from '../molecules/moleculeTypes';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

interface LibraryHeaderProps {
    filter: FilterType;
    onSearchPress: () => void;
    onFilterPress: () => void;
}

export const LibraryHeader: FC<LibraryHeaderProps> = ({
    filter,
    onSearchPress,
    onFilterPress,
}) => {
    const { theme } = useTheme();
    const { containerPadding } = useResponsiveLayout();
    const styles = createStyles(theme, containerPadding);
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.header, { paddingTop: insets.top + theme.spacing.sm }]}>
            <Text style={styles.title}>{t('tabs.library', 'My Library')}</Text>
            <View style={styles.actions}>
                <TouchableOpacity
                    style={styles.actionButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    onPress={onSearchPress}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name="search-outline"
                        size={22}
                        color={theme.colors.text}
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, filter !== 'all' && styles.filterActive]}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    onPress={onFilterPress}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name="filter-outline"
                        size={22}
                        color={filter !== 'all' ? theme.colors.primary : theme.colors.text}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const createStyles = (theme: Theme, containerPadding: number) => StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: containerPadding,
        paddingBottom: theme.spacing.md,
        backgroundColor: theme.colors.background,
        zIndex: 100,
    },
    title: {
        fontSize: theme.typography.size.xxxl,
        fontWeight: 'bold',
        color: theme.colors.text,
        letterSpacing: -0.5,
    },
    actions: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    actionButton: {
        width: 44,
        height: 44,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.sm,
    },
    filterActive: {
        backgroundColor: theme.colors.primary + '10',
        borderColor: theme.colors.primary + '40',
    },
});
