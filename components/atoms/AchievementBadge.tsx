import { FC } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, Theme } from '@/theme';
import { Typography } from './Typography';

interface AchievementBadgeProps {
    title: string;
}

export const AchievementBadge: FC<AchievementBadgeProps> = ({ title }) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);

    return (
        <View style={styles.badge}>
            <Ionicons name="trophy" size={10} color={theme.colors.textInverse} />
            <Typography variant="caption" weight="700" style={styles.text}>
                {title}
            </Typography>
        </View>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
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
        color: theme.colors.textInverse,
        fontWeight: 'bold',
        marginLeft: 4,
        fontSize: theme.typography.size.xs,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});
