import { FC } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme, Theme } from '@/theme';
import { Typography } from '@/components/atoms/Typography';
import { useTranslation } from 'react-i18next';
import { StoryStatus } from '@/store/userStoryStore';

interface StatusBadgeProps {
    status: StoryStatus;
    style?: ViewStyle;
}

export const StatusBadge: FC<StatusBadgeProps> = ({ status, style }) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const styles = createStyles(theme, status);

    const getStatusLabel = (status: StoryStatus) => {
        switch (status) {
            case 'draft':
                return t('write.status.draft', 'Draft');
            case 'pending':
                return t('write.status.pending', 'Under Review');
            case 'published':
                return t('write.status.published', 'Published');
            case 'approved':
                return t('write.status.approved', 'Approved');
            case 'rejected':
                return t('write.status.rejected', 'Needs Changes');
            default:
                return status;
        }
    };

    return (
        <View style={[styles.badge, style]}>
            <View style={styles.dot} />
            <Typography variant="label" style={styles.label}>
                {getStatusLabel(status)}
            </Typography>
        </View>
    );
};

const createStyles = (theme: Theme, status: StoryStatus) => {
    let color: string = theme.colors.textMuted;
    let backgroundColor: string = theme.colors.borderLight;

    switch (status) {
        case 'published':
        case 'approved':
            color = '#10B981'; // Green
            backgroundColor = '#10B98115';
            break;
        case 'pending':
            color = '#F59E0B'; // Amber
            backgroundColor = '#F59E0B15';
            break;
        case 'rejected':
        case 'revision_requested':
            color = '#EF4444'; // Red
            backgroundColor = '#EF444415';
            break;
        case 'draft':
            color = theme.colors.textMuted;
            backgroundColor = theme.colors.borderLight + '40';
            break;
    }

    return StyleSheet.create({
        badge: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: theme.radius.sm,
            backgroundColor,
        },
        dot: {
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: color,
            marginRight: 6,
        },
        label: {
            color,
            fontWeight: '600',
            fontSize: 11,
            textTransform: 'uppercase',
        },
    });
};
