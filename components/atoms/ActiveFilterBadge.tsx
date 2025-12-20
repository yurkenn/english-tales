import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { haptics } from '@/utils/haptics';
import { useTranslation } from 'react-i18next';

interface ActiveFilterBadgeProps {
    filterName: string;
    resultCount?: number;
    onClear: () => void;
}

export const ActiveFilterBadge: React.FC<ActiveFilterBadgeProps> = ({
    filterName,
    resultCount,
    onClear,
}) => {
    const { theme } = useUnistyles();
    const { t } = useTranslation();

    const handleClear = () => {
        haptics.selection();
        onClear();
    };

    return (
        <Animated.View
            entering={FadeInDown.duration(300).springify()}
            exiting={FadeOutUp.duration(200)}
            style={styles.container}
        >
            <View style={styles.badge}>
                <View style={styles.textContainer}>
                    <Text style={styles.label}>{t('home.showing', 'Showing')}: </Text>
                    <Text style={styles.filterName}>{filterName}</Text>
                    {resultCount !== undefined && (
                        <Text style={styles.count}> ({resultCount})</Text>
                    )}
                </View>
                <Pressable
                    style={styles.clearButton}
                    onPress={handleClear}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="close-circle" size={18} color={theme.colors.primary} />
                </Pressable>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.backgroundSecondary,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    textContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    label: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textSecondary,
    },
    filterName: {
        fontSize: theme.typography.size.sm,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.text,
    },
    count: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textMuted,
    },
    clearButton: {
        padding: theme.spacing.xs,
    },
}));
