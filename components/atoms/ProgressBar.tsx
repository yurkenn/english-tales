import React from 'react';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

interface ProgressBarProps {
    progress: number; // 0-100
    height?: number;
    showBackground?: boolean;
    trackColor?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
    progress,
    height = 8,
    showBackground = true,
    trackColor,
}) => {
    const { theme } = useUnistyles();
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
};

const styles = StyleSheet.create((theme) => ({
    container: {
        width: '100%',
        borderRadius: theme.radius.full,
        overflow: 'hidden',
    },
    fill: {
        height: '100%',
        borderRadius: theme.radius.full,
    },
}));
