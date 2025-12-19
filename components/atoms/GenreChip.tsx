import { Pressable, Text } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { haptics } from '@/utils/haptics';

interface GenreChipProps {
    label: string;
    isSelected?: boolean;
    onPress?: () => void;
}

export const GenreChip: React.FC<GenreChipProps> = ({
    label,
    isSelected = false,
    onPress,
}) => {
    const { theme } = useUnistyles();

    return (
        <Pressable
            style={[
                styles.chip,
                isSelected ? styles.chipSelected : styles.chipDefault,
            ]}
            onPress={() => {
                haptics.selection();
                onPress?.();
            }}
        >
            <Text
                style={[
                    styles.label,
                    isSelected ? styles.labelSelected : styles.labelDefault,
                ]}
            >
                {label}
            </Text>
        </Pressable>
    );
};

const styles = StyleSheet.create((theme) => ({
    chip: {
        height: 36,
        paddingHorizontal: theme.spacing.xl,
        borderRadius: theme.radius.full,
        alignItems: 'center',
        justifyContent: 'center',
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
        fontWeight: theme.typography.weight.medium,
    },
    labelSelected: {
        color: theme.colors.textInverse,
        fontWeight: theme.typography.weight.semibold,
    },
    labelDefault: {
        color: theme.colors.text,
    },
}));
