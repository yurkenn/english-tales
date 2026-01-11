import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme, Theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

interface DiscoverHeaderProps {
    onNotificationPress?: () => void;
}

export const DiscoverHeader: React.FC<DiscoverHeaderProps> = ({
    onNotificationPress,
}) => {
    const { theme } = useTheme();
    const { containerPadding } = useResponsiveLayout();
    const styles = createStyles(theme, containerPadding);
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.header, { paddingTop: insets.top + theme.spacing.sm }]}>
            <Text style={styles.title}>{t('tabs.discover', 'Discover')}</Text>
            <TouchableOpacity
                style={styles.actionButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                onPress={onNotificationPress}
                activeOpacity={0.7}
            >
                <Ionicons
                    name="notifications-outline"
                    size={22}
                    color={theme.colors.text}
                />
            </TouchableOpacity>
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
    },
    title: {
        fontSize: theme.typography.size.xxxl,
        fontWeight: 'bold',
        color: theme.colors.text,
        letterSpacing: -0.5,
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
});
