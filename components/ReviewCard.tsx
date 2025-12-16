import React from 'react';
import { View, Text } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { RatingStars } from './RatingStars';
import { OptimizedImage } from './OptimizedImage';

interface ReviewCardProps {
    userName: string;
    userAvatar?: string | null;
    rating: number;
    text: string;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
    userName,
    userAvatar,
    rating,
    text,
}) => {
    const avatarUri = userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || 'User')}`;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <OptimizedImage source={{ uri: avatarUri }} style={styles.avatar} />
                <View style={styles.info}>
                    <Text style={styles.name}>{userName}</Text>
                    <RatingStars rating={rating} size="sm" />
                </View>
            </View>
            <Text style={styles.text} numberOfLines={3}>{text}</Text>
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.lg,
        borderRadius: theme.radius.xl,
        gap: theme.spacing.md,
        ...theme.shadows.sm,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.borderLight,
    },
    info: {
        gap: 2,
    },
    name: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.text,
    },
    text: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textSecondary,
        lineHeight: 22,
    },
}));
