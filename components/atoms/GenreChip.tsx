import { Pressable, Text, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
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
    count,
    onPress,
}) => {
    const { theme } = useUnistyles();
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
        >
            <Text
                style={[
                    styles.label,
                    isSelected ? styles.labelSelected : styles.labelDefault,
                ]}
            >
                {label}
            </Text>
            {count !== undefined && count > 0 && (
                <View style={[
                    styles.countBadge,
                    isSelected && styles.countBadgeSelected,
                ]}>
                    <Text style={[
                        styles.countText,
                        { color: isSelected ? theme.colors.textInverse : theme.colors.textSecondary }
                    ]}>
                        {count > 99 ? '99+' : count}
                    </Text>
                </View>
            )}
        </AnimatedPressable>
    );
};

const styles = StyleSheet.create((theme) => ({
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
    countBadge: {
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.xs,
    },
    countBadgeSelected: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    countText: {
        fontSize: theme.typography.size.xs,
        fontWeight: theme.typography.weight.semibold,
    },
}));
