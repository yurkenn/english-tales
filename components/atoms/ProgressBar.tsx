import { FC, memo } from 'react';
import { View , StyleSheet } from 'react-native';
import { useTheme, Theme } from '@/theme';

interface ProgressBarProps {
    progress: number; // 0-100
    height?: number;
    showBackground?: boolean;
    trackColor?: string;
}

export const ProgressBar: FC<ProgressBarProps> = memo(({
    progress,
    height = 8,
    showBackground = true,
    trackColor,
}) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const clampedProgress = Math.min(100, Math.max(0, progress));

    return (
        <View
            style={[
                styles.container,
                {
                    height,
                    backgroundColor: trackColor
                        ? trackColor
                        : showBackground
                            ? theme.colors.borderLight
                            : 'transparent',
                },
            ]}
        >
            <View
                style={[
                    styles.fill,
                    {
                        width: `${clampedProgress}%`,
                        backgroundColor: theme.colors.primary,
                    },
                ]}
            />
        </View>
    );
});

const createStyles = (theme: Theme) => StyleSheet.create({
    container: {
        width: '100%',
        borderRadius: theme.radius.full,
        overflow: 'hidden',
    },
    fill: {
        height: '100%',
        borderRadius: theme.radius.full,
    },
});
