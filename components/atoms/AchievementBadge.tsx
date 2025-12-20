import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Typography } from './Typography';

interface AchievementBadgeProps {
    title: string;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({ title }) => {
    const { theme } = useUnistyles();

    return (
        <View style={styles.badge}>
            <Ionicons name="trophy" size={10} color="#FFFFFF" />
            <Typography variant="caption" weight="700" style={styles.text}>
                {title}
            </Typography>
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    badge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: theme.colors.warning,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderTopRightRadius: 15,
        borderBottomLeftRadius: 12,
        zIndex: 1,
    },
    text: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        marginLeft: 4,
        fontSize: theme.typography.size.xs,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
}));
