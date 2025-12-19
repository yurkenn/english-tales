import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';

interface DiscoverHeaderProps {
    onNotificationPress?: () => void;
}

export const DiscoverHeader: React.FC<DiscoverHeaderProps> = ({
    onNotificationPress,
}) => {
    const { theme } = useUnistyles();

    return (
        <View style={styles.header}>
            <Text style={styles.title}>Discover</Text>
            <Pressable
                style={styles.notificationButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                onPress={onNotificationPress}
            >
                <Ionicons
                    name="notifications-outline"
                    size={theme.iconSize.md}
                    color={theme.colors.text}
                />
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.lg,
    },
    title: {
        fontSize: theme.typography.size.xxxl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
        letterSpacing: -0.5,
    },
    notificationButton: {
        width: theme.avatarSize.md,
        height: theme.avatarSize.md,
        borderRadius: theme.radius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
}));
