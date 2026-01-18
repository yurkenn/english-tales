import { memo, FC, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, Theme } from '@/theme';
import { Typography } from '@/components/atoms/Typography';

// Types
type Difficulty = 'beginner' | 'intermediate' | 'advanced';
type BadgeSize = 'small' | 'medium' | 'large';

interface DifficultyBadgeProps {
    readonly difficulty: Difficulty;
    readonly size?: BadgeSize;
    readonly showIcon?: boolean;
}

// Configuration
const DIFFICULTY_CONFIG: Record<Difficulty, { color: string; label: string; icon: string }> = {
    beginner: { color: '#10B981', label: 'Easy', icon: '🟢' },
    intermediate: { color: '#F59E0B', label: 'Medium', icon: '🟡' },
    advanced: { color: '#EF4444', label: 'Hard', icon: '🔴' },
};

const SIZE_CONFIG: Record<BadgeSize, { paddingH: number; paddingV: number; fontSize: number; borderRadius: number }> = {
    small: { paddingH: 6, paddingV: 2, fontSize: 9, borderRadius: 4 },
    medium: { paddingH: 8, paddingV: 4, fontSize: 11, borderRadius: 6 },
    large: { paddingH: 12, paddingV: 6, fontSize: 13, borderRadius: 8 },
};

/**
 * DifficultyBadge - Displays story difficulty level with color-coded badge
 * 
 * @example
 * <DifficultyBadge difficulty="beginner" size="small" />
 * <DifficultyBadge difficulty="intermediate" />
 * <DifficultyBadge difficulty="advanced" size="large" showIcon />
 */
export const DifficultyBadge: FC<DifficultyBadgeProps> = memo(({
    difficulty,
    size = 'medium',
    showIcon = false,
}) => {
    const { theme } = useTheme();

    const config = useMemo(() => {
        const diffConfig = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.beginner;
        const sizeConfig = SIZE_CONFIG[size];
        return { ...diffConfig, ...sizeConfig };
    }, [difficulty, size]);

    const containerStyle = useMemo(() => ({
        backgroundColor: config.color + '20',
        paddingHorizontal: config.paddingH,
        paddingVertical: config.paddingV,
        borderRadius: config.borderRadius,
    }), [config]);

    const textStyle = useMemo(() => ({
        color: config.color,
        fontSize: config.fontSize,
        fontWeight: '600' as const,
    }), [config]);

    return (
        <View style={[styles.container, containerStyle]}>
            {showIcon && (
                <Typography style={[styles.icon, { fontSize: config.fontSize }]}>
                    {config.icon}
                </Typography>
            )}
            <Typography style={textStyle}>
                {config.label}
            </Typography>
        </View>
    );
});

// Utility exports for use in other components
export const getDifficultyColor = (difficulty: Difficulty): string => {
    return DIFFICULTY_CONFIG[difficulty]?.color || DIFFICULTY_CONFIG.beginner.color;
};

export const getDifficultyLabel = (difficulty: Difficulty): string => {
    return DIFFICULTY_CONFIG[difficulty]?.label || DIFFICULTY_CONFIG.beginner.label;
};

// Styles
const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
    },
    icon: {
        marginRight: 4,
    },
});
