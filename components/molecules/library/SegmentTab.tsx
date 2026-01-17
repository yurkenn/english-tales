import { FC, memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme, Theme } from '@/theme';
import { haptics } from '@/utils/haptics';

interface SegmentTabProps {
    label: string;
    isActive: boolean;
    badge?: number;
    onPress: () => void;
}

export const SegmentTab: FC<SegmentTabProps> = memo(({ label, isActive, badge, onPress }) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);

    const handlePress = () => {
        haptics.selection();
        onPress();
    };

    return (
        <Pressable
            onPress={handlePress}
            style={[styles.segment, isActive && styles.segmentActive]}
            accessible
            accessibilityRole="tab"
            accessibilityLabel={badge ? `${label}, ${badge} items` : label}
            accessibilityState={{ selected: isActive }}
        >
            <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>{label}</Text>
            {badge !== undefined && badge > 0 && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badge}</Text>
                </View>
            )}
        </Pressable>
    );
});

SegmentTab.displayName = 'SegmentTab';

function createStyles(theme: Theme) {
    return StyleSheet.create({
        segment: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: theme.spacing.sm,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.borderLight,
            ...theme.shadows.sm,
        },
        segmentActive: {
            backgroundColor: theme.colors.primary,
            borderColor: theme.colors.primary,
            ...theme.shadows.md,
        },
        segmentText: {
            fontSize: theme.typography.size.md,
            fontWeight: '600',
            color: theme.colors.textSecondary,
        },
        segmentTextActive: {
            color: theme.colors.textInverse,
        },
        badge: {
            marginLeft: theme.spacing.sm,
            backgroundColor: 'rgba(255,255,255,0.25)',
            paddingHorizontal: theme.spacing.sm,
            paddingVertical: 1,
            borderRadius: theme.radius.sm,
            minWidth: 18,
            alignItems: 'center',
        },
        badgeText: {
            fontSize: theme.typography.size.xs,
            fontWeight: 'bold',
            color: theme.colors.textInverse,
        },
    });
}
