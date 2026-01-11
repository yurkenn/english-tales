import { Pressable, Text, StyleSheet } from 'react-native';
import { useTheme, Theme } from '@/theme';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';
import { haptics } from '@/utils/haptics';

interface GenreChipProps {
    label: string;
    isSelected?: boolean;
    count?: number;
    onPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const GenreChip: React.FC<GenreChipProps> = ({
    label,
    isSelected = false,
    onPress,
}) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    };

    const handlePress = () => {
        haptics.selection();
        onPress?.();
    };

    return (
        <AnimatedPressable
            style={[
                styles.chip,
                animatedStyle,
                isSelected ? styles.chipSelected : styles.chipDefault,
            ]}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handlePress}
            accessible
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected: isSelected }}
        >
            <Text
                style={[
                    styles.label,
                    isSelected ? styles.labelSelected : styles.labelDefault,
                ]}
            >
                {label}
            </Text>
        </AnimatedPressable>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
    chip: {
        height: 36,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.radius.full,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.xs,
    },
    chipSelected: {
        backgroundColor: theme.colors.primary,
        ...theme.shadows.md,
    },
    chipDefault: {
        backgroundColor: theme.colors.chipInactive,
    },
    label: {
        fontSize: theme.typography.size.md,
    },
    labelSelected: {
        color: theme.colors.textInverse,
        fontWeight: theme.typography.weight.semibold,
    },
    labelDefault: {
        color: theme.colors.text,
        fontWeight: theme.typography.weight.medium,
    },
});
