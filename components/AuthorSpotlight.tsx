import React from 'react';
import { View, Text, Pressable, ImageBackground } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface AuthorSpotlightProps {
    id: string;
    name: string;
    bio: string;
    imageUrl: string;
    onPress: () => void;
}

export const AuthorSpotlight: React.FC<AuthorSpotlightProps> = ({
    id,
    name,
    bio,
    imageUrl,
    onPress,
}) => {
    const { theme } = useUnistyles();

    return (
        <Pressable style={styles.card} onPress={onPress}>
            <ImageBackground
                source={{ uri: imageUrl || 'https://via.placeholder.com/400x300' }}
                style={styles.image}
                resizeMode="cover"
            >
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.9)']}
                    style={styles.gradient}
                />
                <View style={styles.content}>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>Featured</Text>
                    </View>
                    <Text style={styles.name}>{name}</Text>
                    <Text style={styles.bio} numberOfLines={2}>
                        {bio}
                    </Text>
                    <View style={styles.button}>
                        <Text style={styles.buttonText}>View Author</Text>
                        <Ionicons
                            name="arrow-forward"
                            size={14}
                            color={theme.colors.text}
                        />
                    </View>
                </View>
            </ImageBackground>
        </Pressable>
    );
};

const styles = StyleSheet.create((theme) => ({
    card: {
        borderRadius: theme.radius.xl,
        overflow: 'hidden',
        ...theme.shadows.md,
    },
    image: {
        height: 200,
        justifyContent: 'flex-end',
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
    },
    content: {
        padding: theme.spacing.lg,
        gap: theme.spacing.xs,
    },
    badge: {
        alignSelf: 'flex-start',
        backgroundColor: theme.colors.primary,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xxs,
        borderRadius: theme.radius.sm,
        marginBottom: theme.spacing.xs,
    },
    badgeText: {
        fontSize: theme.typography.size.xs,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.textInverse,
        textTransform: 'uppercase',
    },
    name: {
        fontSize: theme.typography.size.xxl,
        fontWeight: theme.typography.weight.bold,
        color: '#FFFFFF',
    },
    bio: {
        fontSize: theme.typography.size.md,
        color: 'rgba(255,255,255,0.8)',
        lineHeight: 22,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
        marginTop: theme.spacing.sm,
        backgroundColor: 'rgba(255,255,255,0.9)',
        alignSelf: 'flex-start',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.radius.full,
    },
    buttonText: {
        fontSize: theme.typography.size.sm,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.text,
    },
}));
