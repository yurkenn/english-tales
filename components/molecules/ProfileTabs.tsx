import React from 'react';
import { View, Pressable, Dimensions } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useAnimatedStyle,
    withSpring,
    interpolate
} from 'react-native-reanimated';
import { Typography } from '../atoms';
import { haptics } from '@/utils/haptics';

export type ProfileTabType = 'posts' | 'reviews' | 'library' | 'more';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ProfileTabsProps {
    activeTab: ProfileTabType;
    onTabChange: (tab: ProfileTabType) => void;
    counts?: {
        posts?: number;
        reviews?: number;
        library?: number;
    };
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({
    activeTab,
    onTabChange,
    counts,
}) => {
    const { theme } = useUnistyles();

    const tabs: { id: ProfileTabType; icon: any; label: string; count?: number }[] = [
        { id: 'posts', icon: 'apps-outline', label: 'Posts', count: counts?.posts },
        { id: 'reviews', icon: 'star-outline', label: 'Reviews', count: counts?.reviews },
        { id: 'library', icon: 'book-outline', label: 'Library', count: counts?.library },
        { id: 'more', icon: 'menu-outline', label: 'More' },
    ];

    const tabWidth = SCREEN_WIDTH / tabs.length;
    const activeIndex = tabs.findIndex(t => t.id === activeTab);

    const indicatorStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: withSpring(activeIndex * tabWidth, { damping: 15, stiffness: 100 }) }
            ]
        };
    });

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Animated Indicator */}
            <Animated.View
                style={[
                    styles.indicator,
                    { width: tabWidth, backgroundColor: theme.colors.primary },
                    indicatorStyle
                ]}
            />

            {tabs.map((tab, index) => {
                const isActive = activeTab === tab.id;

                return (
                    <Pressable
                        key={tab.id}
                        style={styles.tab}
                        onPress={() => {
                            if (activeTab !== tab.id) {
                                haptics.selection();
                                onTabChange(tab.id);
                            }
                        }}
                        hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
                    >
                        <Ionicons
                            name={isActive ? tab.icon.replace('-outline', '') : tab.icon}
                            size={22}
                            color={isActive ? theme.colors.primary : theme.colors.textMuted}
                        />
                        <View style={styles.labelWrapper}>
                            <Typography
                                variant="label"
                                color={isActive ? theme.colors.primary : theme.colors.textMuted}
                                style={[styles.tabText, isActive && { fontWeight: '800' }]}
                            >
                                {tab.label}
                            </Typography>
                            {tab.count !== undefined && tab.count > 0 && (
                                <View style={[
                                    styles.countBadge,
                                    { backgroundColor: isActive ? theme.colors.primary + '15' : theme.colors.surfaceElevated }
                                ]}>
                                    <Typography
                                        variant="caption"
                                        style={{ fontSize: theme.typography.size.xs, fontWeight: '700' }}
                                        color={isActive ? theme.colors.primary : theme.colors.textMuted}
                                    >
                                        {tab.count}
                                    </Typography>
                                </View>
                            )}
                        </View>
                    </Pressable>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        height: 60,
        position: 'relative',
    },
    indicator: {
        position: 'absolute',
        bottom: 0,
        height: 3,
        borderTopLeftRadius: 3,
        borderTopRightRadius: 3,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    labelWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    tabText: {
        fontSize: theme.typography.size.sm,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    countBadge: {
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 6,
    },
}));
