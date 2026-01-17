import { FC } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, Theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

interface RatingStarsProps {
    rating: number;
    size?: 'sm' | 'md' | 'lg';
    showEmpty?: boolean;
}

export const RatingStars: FC<RatingStarsProps> = ({
    rating,
    size = 'sm',
    showEmpty = false,
}) => {
    const { theme } = useTheme();

    const sizeMap = {
        sm: 12,
        md: 16,
        lg: 20,
    };

    const iconSize = sizeMap[size];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
        <View style={styles.container}>
            {/* Full stars */}
            {Array.from({ length: fullStars }).map((_, i) => (
                <Ionicons
                    key={`full-${i}`}
                    name="star"
                    size={iconSize}
                    color={theme.colors.star}
                />
            ))}
            {/* Half star */}
            {hasHalfStar && (
                <Ionicons
                    name="star-half"
                    size={iconSize}
                    color={theme.colors.star}
                />
            )}
            {/* Empty stars */}
            {showEmpty &&
                Array.from({ length: emptyStars }).map((_, i) => (
                    <Ionicons
                        key={`empty-${i}`}
                        name="star-outline"
                        size={iconSize}
                        color={theme.colors.starEmpty}
                    />
                ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 1,
    },
});
